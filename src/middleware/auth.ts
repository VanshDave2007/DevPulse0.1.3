import { Request, Response, NextFunction } from 'express';
import { adminAuth } from '../lib/firebase-admin.ts';

export interface AuthenticatedUser {
  uid: string;
  email: string;
  name?: string;
  picture?: string;
}

export interface AuthRequest extends Request {
  user?: AuthenticatedUser;
}

// Decode custom local session token if needed (for fallback email/password auth)
function decodeCustomSessionToken(token: string): AuthenticatedUser | null {
  try {
    if (token.startsWith('dp_sess_')) {
      const payload = Buffer.from(token.replace('dp_sess_', ''), 'base64').toString('utf-8');
      const data = JSON.parse(payload);
      if (data && data.uid && data.email && (!data.exp || data.exp > Date.now())) {
        return {
          uid: data.uid,
          email: data.email,
          name: data.displayName || data.name,
          picture: data.photoUrl || data.picture,
        };
      }
    }
  } catch (err) {
    console.warn('Failed to parse custom session token:', err);
  }
  return null;
}

export const requireAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: Missing authentication token' });
  }

  const token = authHeader.split('Bearer ')[1]?.trim();
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized: Empty token' });
  }

  // 1. Check custom token first if prefixed
  if (token.startsWith('dp_sess_')) {
    const customUser = decodeCustomSessionToken(token);
    if (customUser) {
      req.user = customUser;
      return next();
    }
    return res.status(401).json({ error: 'Unauthorized: Expired or invalid session' });
  }

  // 2. Verify with Firebase Admin
  try {
    const decoded = await adminAuth.verifyIdToken(token);
    req.user = {
      uid: decoded.uid,
      email: decoded.email || `${decoded.uid}@devpulse.local`,
      name: decoded.name,
      picture: decoded.picture,
    };
    next();
  } catch (error: any) {
    // Fallback attempt to see if custom token was passed without prefix
    const customUser = decodeCustomSessionToken(`dp_sess_${token}`);
    if (customUser) {
      req.user = customUser;
      return next();
    }

    console.warn('Firebase ID token verification failed:', error?.message);
    return res.status(401).json({ error: 'Unauthorized: Invalid or expired token' });
  }
};

export const optionalAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next();
  }

  const token = authHeader.split('Bearer ')[1]?.trim();
  if (!token) return next();

  if (token.startsWith('dp_sess_')) {
    const customUser = decodeCustomSessionToken(token);
    if (customUser) req.user = customUser;
    return next();
  }

  try {
    const decoded = await adminAuth.verifyIdToken(token);
    req.user = {
      uid: decoded.uid,
      email: decoded.email || `${decoded.uid}@devpulse.local`,
      name: decoded.name,
      picture: decoded.picture,
    };
  } catch (err) {
    // Ignore verification errors for optional auth (acts as guest)
  }
  next();
};
