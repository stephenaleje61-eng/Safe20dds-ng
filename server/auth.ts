import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import { db, User } from './db';

const JWT_SECRET = process.env.JWT_SECRET || 'sure-odd-secret-super-crypto-key-2026';

export interface AuthTokenPayload {
  userId: string;
  role: 'admin' | 'user';
  phone: string;
}

export interface AuthenticatedRequest extends Request {
  user?: User;
}

// Password hashing
export async function hashPassword(plain: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(plain, salt);
}

export async function comparePassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

// Phone normalization and validation
export function normalizePhone(rawPhone: string): string {
  // strip formatting
  let clean = rawPhone.trim().replace(/[\s\-\(\)\.]/g, '');
  if (!clean.startsWith('+')) {
    if (clean.startsWith('0')) {
      // Default to Nigeria code +234 if local Nigerian format, or preserve
      clean = '+234' + clean.slice(1);
    } else {
      clean = '+' + clean;
    }
  }
  return clean;
}

export function isValidPhone(phone: string): boolean {
  const normalized = normalizePhone(phone);
  // Must match E.164 format roughly: + followed by 7 to 15 digits
  return /^\+[1-9]\d{6,14}$/.test(normalized);
}

// Token creation
export function signAuthToken(user: User): string {
  const payload: AuthTokenPayload = {
    userId: user.id,
    role: user.role,
    phone: user.phone,
  };
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

// Middleware: Authenticate JWT
export function authenticateToken(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err || !decoded) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }

    const payload = decoded as AuthTokenPayload;
    const user = db.findUserById(payload.userId);

    if (!user) {
      return res.status(404).json({ error: 'User account not found' });
    }

    if (user.isBanned) {
      return res.status(403).json({ error: 'This account has been suspended for policy violations.' });
    }

    req.user = user;
    next();
  });
}

// Optional Auth (for public feeds that customize VIP or liked status)
export function optionalAuth(req: AuthenticatedRequest, _res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return next();
  }

  jwt.verify(token, JWT_SECRET, (_err, decoded) => {
    if (decoded) {
      const payload = decoded as AuthTokenPayload;
      const user = db.findUserById(payload.userId);
      if (user && !user.isBanned) {
        req.user = user;
      }
    }
    next();
  });
}

// Middleware: Require Admin
export function requireAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Access denied: Admin privileges required.' });
  }
  next();
}

// Rate Limiting
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

export function rateLimit(maxRequests = 60, windowMs = 60 * 1000) {
  return (req: Request, res: Response, next: NextFunction) => {
    const ip = req.ip || req.socket.remoteAddress || 'unknown-client';
    const key = `${req.path}:${ip}`;
    const now = Date.now();

    const record = rateLimitMap.get(key);
    if (!record || now > record.resetTime) {
      rateLimitMap.set(key, { count: 1, resetTime: now + windowMs });
      return next();
    }

    if (record.count >= maxRequests) {
      return res.status(429).json({ error: 'Too many requests. Please slow down and try again later.' });
    }

    record.count++;
    next();
  };
}

// Profanity & abuse detection
const PROFANITY_WORDS = [
  'scam',
  'fraud',
  'fixed match',
  '100% sure win',
  'guaranteed money',
  'ponzi',
  'hacker',
  'pay me',
  'rigged',
  'whore',
  'bitch',
  'bastard',
  'fuck',
  'shit',
  'asshole',
];

export function containsProhibitedContent(text: string): boolean {
  const lower = text.toLowerCase();
  return PROFANITY_WORDS.some((word) => lower.includes(word));
}

// Mask phone number for public display (e.g., +234 800 *** 123)
export function maskPhone(phone: string): string {
  if (phone.length < 8) return '***';
  return phone.slice(0, 7) + '***' + phone.slice(-3);
}
