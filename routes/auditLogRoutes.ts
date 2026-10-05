import { Router, Response } from 'express';
import { AuditLog } from '../models/AuditLog.ts';
import { authenticateJWT, requireAdmin, AuthenticatedRequest } from '../middleware/auth.ts';

const router = Router();

// GET /api/audit-logs
// Admin only: View system and administrative audit trail
router.get(
  '/',
  authenticateJWT,
  requireAdmin,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { search, action, page = 1, limit = 50 } = req.query;

      const query: any = {};
      if (action && action !== 'all') {
        query.action = action;
      }
      if (search && typeof search === 'string' && search.trim() !== '') {
        const regex = new RegExp(search.trim(), 'i');
        query.$or = [{ description: regex }, { userName: regex }, { targetId: regex }, { action: regex }];
      }

      const skip = (Number(page) - 1) * Number(limit);
      const [logs, total, actions] = await Promise.all([
        AuditLog.find(query).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)).lean(),
        AuditLog.countDocuments(query),
        AuditLog.distinct('action'),
      ]);

      res.json({
        success: true,
        data: {
          logs,
          actions,
          pagination: {
            total,
            page: Number(page),
            limit: Number(limit),
            pages: Math.ceil(total / Number(limit)),
          },
        },
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
);

export default router;
