import { Router, Response } from 'express';
import mongoose from 'mongoose';
import { Notification } from '../models/Notification.ts';
import { Customer } from '../models/Customer.ts';
import { authenticateJWT, requireAdmin, logAudit, AuthenticatedRequest } from '../middleware/auth.ts';

const router = Router();

// GET /api/notifications
// Customers get their own + broadcasts; Admins get all notification history
router.get('/', authenticateJWT, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const isCustomer = req.user?.role === 'customer' || req.user?.isImpersonating;

    if (isCustomer) {
      if (!req.user?.customerId) {
        res.status(400).json({ success: false, message: 'No customer account linked' });
        return;
      }

      const custId = new mongoose.Types.ObjectId(req.user.customerId);
      const notifications = await Notification.find({
        $or: [{ customerId: custId }, { isBroadcast: true }],
      })
        .sort({ createdAt: -1 })
        .limit(50)
        .lean();

      // Determine read status for customer (including broadcast readBy array)
      const mapped = notifications.map((n) => {
        let isReadForCustomer = n.isRead;
        if (n.isBroadcast) {
          isReadForCustomer = (n.readBy || []).some(
            (id: any) => id.toString() === custId.toString()
          );
        }
        return {
          ...n,
          isRead: isReadForCustomer,
        };
      });

      const unreadCount = mapped.filter((n) => !n.isRead).length;

      res.json({
        success: true,
        data: {
          notifications: mapped,
          unreadCount,
        },
      });
    } else {
      // Admin view
      const notifications = await Notification.find({})
        .populate('customerId', 'name customerCode email phone')
        .sort({ createdAt: -1 })
        .limit(100)
        .lean();

      res.json({
        success: true,
        data: {
          notifications,
          unreadCount: notifications.filter((n) => !n.isRead).length,
        },
      });
    }
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/notifications
// Admin only: Send notifications to Individual, Multiple, or All Customers
router.post('/', authenticateJWT, requireAdmin, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { target, customerId, customerIds, type, title, message, priority } = req.body;

    if (!title || !message) {
      res.status(400).json({ success: false, message: 'Notification title and message are required' });
      return;
    }

    const notifType = type || 'General';
    const notifPriority = priority || 'Normal';

    let createdCount = 0;

    if (target === 'all') {
      // Broadcast notification
      const count = await Notification.countDocuments();
      await Notification.create({
        notificationId: `NOTIF-BCAST-${count + 1}`,
        customerId: null,
        isBroadcast: true,
        type: notifType,
        title: title.trim(),
        message: message.trim(),
        priority: notifPriority,
        isRead: false,
        readBy: [],
        createdBy: req.user?._id,
      });
      createdCount = 1;

      await logAudit(
        req,
        'Notification Sent',
        `Broadcast notification sent to ALL customers: "${title}"`,
        'BROADCAST'
      );
    } else if (Array.isArray(customerIds) && customerIds.length > 0) {
      // Multiple customers
      const validCustomers = await Customer.find({ _id: { $in: customerIds } });
      const count = await Notification.countDocuments();

      const notifsToInsert = validCustomers.map((c, idx) => ({
        notificationId: `NOTIF-M-${count + idx + 1}`,
        customerId: c._id,
        isBroadcast: false,
        type: notifType,
        title: title.trim(),
        message: message.trim(),
        priority: notifPriority,
        isRead: false,
        createdBy: req.user?._id,
      }));

      await Notification.insertMany(notifsToInsert);
      createdCount = notifsToInsert.length;

      await logAudit(
        req,
        'Notification Sent',
        `Notification sent to ${createdCount} selected customers: "${title}"`,
        customerIds.join(',')
      );
    } else if (customerId) {
      // Individual customer
      const customer = await Customer.findById(customerId);
      if (!customer) {
        res.status(404).json({ success: false, message: 'Target customer not found' });
        return;
      }

      const count = await Notification.countDocuments();
      await Notification.create({
        notificationId: `NOTIF-IND-${count + 1}`,
        customerId: customer._id,
        isBroadcast: false,
        type: notifType,
        title: title.trim(),
        message: message.trim(),
        priority: notifPriority,
        isRead: false,
        createdBy: req.user?._id,
      });
      createdCount = 1;

      await logAudit(
        req,
        'Notification Sent',
        `Notification sent to ${customer.name} (${customer.customerCode}): "${title}"`,
        (customer._id as any).toString()
      );
    } else {
      res.status(400).json({
        success: false,
        message: 'Must specify target ("all"), customerId, or array of customerIds',
      });
      return;
    }

    res.status(201).json({
      success: true,
      message: `Notification dispatched successfully (${createdCount} record(s))`,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// PUT /api/notifications/:id/read
// Mark individual notification as read
router.put('/:id/read', authenticateJWT, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const notification = await Notification.findById(id);

    if (!notification) {
      res.status(404).json({ success: false, message: 'Notification not found' });
      return;
    }

    if (notification.isBroadcast) {
      if (req.user?.customerId) {
        const custId = new mongoose.Types.ObjectId(req.user.customerId);
        if (!notification.readBy.some((rId) => rId.toString() === custId.toString())) {
          notification.readBy.push(custId);
          await notification.save();
        }
      }
    } else {
      notification.isRead = true;
      await notification.save();
    }

    res.json({ success: true, message: 'Notification marked as read' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// PUT /api/notifications/read-all
// Mark all notifications as read for current customer
router.put('/read-all', authenticateJWT, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user?.customerId) {
      // If admin, mark all non-broadcast notifications as read
      await Notification.updateMany({ isRead: false }, { isRead: true });
      res.json({ success: true, message: 'All notifications marked as read' });
      return;
    }

    const custId = new mongoose.Types.ObjectId(req.user.customerId);

    await Promise.all([
      Notification.updateMany({ customerId: custId, isRead: false }, { isRead: true }),
      Notification.updateMany(
        { isBroadcast: true, readBy: { $ne: custId } },
        { $addToSet: { readBy: custId } }
      ),
    ]);

    res.json({ success: true, message: 'All notifications marked as read' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// DELETE /api/notifications/:id
router.delete('/:id', authenticateJWT, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    await Notification.findByIdAndDelete(id);
    res.json({ success: true, message: 'Notification removed' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
