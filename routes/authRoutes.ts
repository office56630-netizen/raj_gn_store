import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import { User } from '../models/User.ts';
import { Customer } from '../models/Customer.ts';
import { generateToken } from '../utils/jwt.ts';
import { authenticateJWT, requireAdmin, logAudit, AuthenticatedRequest } from '../middleware/auth.ts';

const router = Router();

// POST /api/auth/login
router.post('/login', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const rawIdentifier = (req.body.identifier || req.body.email || req.body.phone || '').trim();
    const { password } = req.body;

    if (!rawIdentifier || !password) {
      res.status(400).json({
        success: false,
        message: 'मोबाइल नंबर या ईमेल और पासवर्ड आवश्यक है (Mobile or email and password are required)',
      });
      return;
    }

    const cleanEmail = rawIdentifier.toLowerCase();
    const digitsOnly = rawIdentifier.replace(/\D/g, '');

    // Search query matching email, direct phone, or last 10 digits
    const searchConditions: any[] = [
      { email: cleanEmail },
      { phone: rawIdentifier },
    ];

    if (digitsOnly.length >= 7) {
      const last10 = digitsOnly.slice(-10);
      searchConditions.push({ phone: { $regex: last10 } });
    }

    const user = await User.findOne({ $or: searchConditions });

    if (!user) {
      res.status(401).json({
        success: false,
        message: 'अमान्य मोबाइल नंबर / ईमेल या पासवर्ड (Invalid mobile number/email or password)',
      });
      return;
    }

    if (user.status !== 'active') {
      res.status(403).json({
        success: false,
        message: 'Account is deactivated. Please contact administrator.',
      });
      return;
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      res.status(401).json({
        success: false,
        message: 'अमान्य पासवर्ड (Invalid password)',
      });
      return;
    }

    let customerData = null;
    if (user.role === 'customer' && user.customerId) {
      customerData = await Customer.findById(user.customerId);
    }

    const token = generateToken({
      userId: (user._id as any).toString(),
      email: user.email || `${user.phone}@phone.local`,
      name: user.name,
      role: user.role,
      customerId: user.customerId ? (user.customerId as any).toString() : undefined,
    });

    req.user = user.toObject() as any;
    await logAudit(
      req,
      user.role === 'admin' ? 'Admin Login' : 'Customer Login',
      `${user.role === 'admin' ? 'Administrator' : 'Customer'} ${user.name} logged in via ${digitsOnly.length >= 7 ? 'Mobile' : 'Email'}`,
      (user._id as any).toString()
    );

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role,
          customerId: user.customerId,
          status: user.status,
        },
        customer: customerData,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Login failed',
    });
  }
});

// GET /api/auth/me
router.get('/me', authenticateJWT, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    let customerData = null;
    if (user.customerId) {
      customerData = await Customer.findById(user.customerId);
    }

    res.json({
      success: true,
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role,
          customerId: user.customerId,
          isImpersonating: user.isImpersonating || false,
        },
        customer: customerData,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/auth/impersonate/:customerId
// Allows Admin to securely view and operate in customer portal
router.post(
  '/impersonate/:customerId',
  authenticateJWT,
  requireAdmin,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { customerId } = req.params;
      const customer = await Customer.findById(customerId);

      if (!customer) {
        res.status(404).json({
          success: false,
          message: 'Customer not found',
        });
        return;
      }

      // Generate a customer-scoped token marked with impersonation
      const impersonateToken = generateToken({
        userId: (req.user?._id as any).toString(),
        email: customer.email,
        name: customer.name,
        role: 'customer',
        customerId: (customer._id as any).toString(),
        isImpersonating: true,
        originalAdminId: (req.user?._id as any).toString(),
      });

      // Audit log the impersonation
      await logAudit(
        req,
        'Customer Account Accessed',
        `Admin ${req.user?.name} impersonated customer ${customer.name} (${customer.customerCode})`,
        (customer._id as any).toString()
      );

      res.json({
        success: true,
        message: `Now impersonating customer: ${customer.name}`,
        data: {
          token: impersonateToken,
          customer,
          isImpersonating: true,
        },
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
);

// POST /api/auth/change-password
router.post(
  '/change-password',
  authenticateJWT,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { currentPassword, newPassword } = req.body;

      if (!currentPassword || !newPassword) {
        res.status(400).json({
          success: false,
          message: 'Both current password and new password are required',
        });
        return;
      }

      if (newPassword.length < 6) {
        res.status(400).json({
          success: false,
          message: 'New password must be at least 6 characters long',
        });
        return;
      }

      const user = await User.findById(req.user?._id);
      if (!user) {
        res.status(404).json({ success: false, message: 'User not found' });
        return;
      }

      const isMatch = await user.comparePassword(currentPassword);
      if (!isMatch) {
        res.status(400).json({
          success: false,
          message: 'Current password does not match',
        });
        return;
      }

      user.password = await bcrypt.hash(newPassword, 10);
      await user.save();

      await logAudit(
        req,
        'Password Changed',
        `User ${user.name} changed their account password`,
        (user._id as any).toString()
      );

      res.json({
        success: true,
        message: 'Password updated successfully',
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
);

// POST /api/auth/register
router.post('/register', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { name, email, password, phone, role } = req.body;

    const cleanPhone = (phone || '').trim();
    const cleanEmail = (email || '').trim().toLowerCase();

    if (!name || (!cleanPhone && !cleanEmail) || !password) {
      res.status(400).json({
        success: false,
        message: 'नाम, मोबाइल नंबर या ईमेल, और पासवर्ड आवश्यक है (Name, mobile/email, and password are required)',
      });
      return;
    }

    // Check duplicate phone or email
    const duplicateChecks: any[] = [];
    if (cleanPhone) duplicateChecks.push({ phone: cleanPhone });
    if (cleanEmail) duplicateChecks.push({ email: cleanEmail });

    if (duplicateChecks.length > 0) {
      const existing = await User.findOne({ $or: duplicateChecks });
      if (existing) {
        res.status(400).json({
          success: false,
          message: 'इस मोबाइल नंबर या ईमेल से खाता पहले से मौजूद है। कृपया लॉगिन करें।',
        });
        return;
      }
    }

    // SECURITY: Strictly prevent creating Admin accounts via public registration
    if (role === 'admin') {
      res.status(403).json({
        success: false,
        message:
          'दुकानदार / एडमिन खाता पंजीकरण द्वारा नहीं बनाया जा सकता। केवल ग्राहक खाता बनाया जा सकता है। (Shopkeeper Admin accounts cannot be created via public registration. Only customer accounts can be registered.)',
      });
      return;
    }

    const assignedRole = 'customer';

    // Find or create matching customer record
    let linkedCustomerId = null;
    let customerDoc = null;
    if (cleanPhone) {
      customerDoc = await Customer.findOne({
        phone: { $regex: cleanPhone.replace(/\D/g, '').slice(-10) },
      });
    }

    if (!customerDoc) {
      // Create fresh customer account for this user
      const count = await Customer.countDocuments();
      const customerEmail = cleanEmail || `${cleanPhone.replace(/\D/g, '') || Date.now()}@customer.local`;
      customerDoc = await Customer.create({
        name: name.trim(),
        phone: cleanPhone || '0000000000',
        email: customerEmail,
        customerCode: `CUST-${(count + 101).toString()}`,
        status: 'active',
      });
    }
    linkedCustomerId = customerDoc._id;

    const passwordHash = await bcrypt.hash(password, 10);
    const fallbackEmail = cleanEmail || `${cleanPhone.replace(/\D/g, '') || Date.now()}@phone.local`;

    const newUser = await User.create({
      name: name.trim(),
      email: fallbackEmail,
      phone: cleanPhone,
      password: passwordHash,
      role: assignedRole,
      customerId: linkedCustomerId,
      status: 'active',
    });

    const token = generateToken({
      userId: (newUser._id as any).toString(),
      email: newUser.email,
      name: newUser.name,
      role: newUser.role,
      customerId: (linkedCustomerId as any).toString(),
    });

    res.status(201).json({
      success: true,
      message: 'ग्राहक खाता सफलतापूर्वक बनाया गया (Customer account registered successfully)',
      data: {
        token,
        user: {
          id: newUser._id,
          name: newUser.name,
          email: newUser.email,
          phone: newUser.phone,
          role: newUser.role,
          customerId: linkedCustomerId,
          status: newUser.status,
        },
        customer: customerDoc,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Registration failed',
    });
  }
});

// POST /api/auth/logout
router.post('/logout', authenticateJWT, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  await logAudit(
    req,
    'User Logout',
    `${req.user?.name} logged out`,
    (req.user?._id as any)?.toString() || ''
  );
  res.json({
    success: true,
    message: 'Logged out successfully',
  });
});

export default router;
