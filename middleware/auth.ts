import { Request, Response, NextFunction } from 'express';
import { verifyToken, TokenPayload } from '../utils/jwt.ts';
import { User, IUser } from '../models/User.ts';
import { AuditLog } from '../models/AuditLog.ts';

export interface AuthenticatedRequest extends Request {
  user?: IUser & {
    isImpersonating?: boolean;
    originalAdminId?: string;
  };
  tokenPayload?: TokenPayload;
}

export async function authenticateJWT(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        message: 'Authentication token missing or invalid format',
      });
      return;
    }

    const token = authHeader.split(' ')[1];
    const payload = verifyToken(token);
    req.tokenPayload = payload;

    const user = await User.findById(payload.userId);
    if (!user || user.status !== 'active') {
      res.status(401).json({
        success: false,
        message: 'Account not found or inactive',
      });
      return;
    }

    const userObj = user.toObject() as any;
    if (payload.isImpersonating) {
      userObj.isImpersonating = true;
      userObj.originalAdminId = payload.originalAdminId;
      // If impersonating, user role in payload is customer
      userObj.role = payload.role;
      userObj.customerId = payload.customerId;
    }

    req.user = userObj;
    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      message: 'Invalid or expired session token',
    });
  }
}

export function requireAdmin(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  if (!req.user || req.user.role !== 'admin' || req.user.isImpersonating) {
    res.status(403).json({
      success: false,
      message: 'Access denied: Admin privileges required',
    });
    return;
  }
  next();
}

export function requireCustomer(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  if (!req.user || req.user.role !== 'customer') {
    res.status(403).json({
      success: false,
      message: 'Access denied: Customer portal privileges required',
    });
    return;
  }
  next();
}

export async function logAudit(
  req: AuthenticatedRequest,
  action: string,
  description: string,
  targetId: string = ''
): Promise<void> {
  try {
    const ipAddress = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';
    await AuditLog.create({
      userId: req.user?._id ? (req.user._id as any) : undefined,
      userName: req.user?.name || 'Anonymous',
      userRole: req.user?.role || 'system',
      action,
      description,
      targetId,
      ipAddress: Array.isArray(ipAddress) ? ipAddress[0] : ipAddress.split(',')[0].trim(),
    });
  } catch (err) {
    console.error('Failed to record audit log:', err);
  }
}
