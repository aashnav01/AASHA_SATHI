import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { Types } from 'mongoose';

const JWT_SECRET = process.env.JWT_SECRET;

export interface AuthPayload {
  ashaId: string;
  role: 'asha' | 'supervisor' | 'admin';
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      ashaId?: Types.ObjectId;
      role?: AuthPayload['role'];
    }
  }
}

export function signToken(payload: AuthPayload): string {
  if (!JWT_SECRET) throw new Error('JWT_SECRET is not set');
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '90d' });
}

// ASHA workers in the field may go weeks without connectivity; a long-lived
// token lets a session that logged in once keep working entirely offline.
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  const token = header?.startsWith('Bearer ') ? header.slice(7) : undefined;

  if (!token || !JWT_SECRET) {
    return res.status(401).json({ error: 'Missing or invalid authorization token' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AuthPayload;
    req.ashaId = new Types.ObjectId(decoded.ashaId);
    req.role = decoded.role;
    return next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

export function requireRole(...roles: AuthPayload['role'][]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.role || !roles.includes(req.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    return next();
  };
}
