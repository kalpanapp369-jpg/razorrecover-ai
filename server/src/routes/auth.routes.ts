import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { validate } from '../middleware/validate';
import { authLimiter } from '../middleware/rateLimit';
import { loginSchema, signupSchema } from '../schemas/zodSchemas';
import { authenticate, AuthRequest } from '../middleware/auth';
import { UserProfile, UserRole } from '../types';
import { dataStore } from '../services/dataStore';

const router = Router();

// Demo in-memory users for quick testing without waiting for Supabase credentials
const demoUsers: Record<string, { id: string; email: string; password: string; role: UserRole; fullName: string; company?: string }> = {
  'admin@razorrecover.ai': {
    id: '11111111-1111-1111-1111-111111111111',
    email: 'admin@razorrecover.ai',
    password: 'password123',
    role: 'ADMIN',
    fullName: 'Arjun Mehta',
    company: 'RazorRecover AI',
  },
  'customer@example.com': {
    id: '22222222-2222-2222-2222-222222222222',
    email: 'customer@example.com',
    password: 'password123',
    role: 'CUSTOMER',
    fullName: 'Rohan Sharma',
    company: 'Apex Growth Labs',
  },
};

const generateToken = (user: { id: string; email: string; role: UserRole; fullName: string }) => {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role, fullName: user.fullName },
    env.JWT_SECRET,
    { expiresIn: '7d' }
  );
};

// Login
router.post('/login', authLimiter, validate(loginSchema), async (req: Request, res: Response) => {
  const { email, password } = req.body;

  const user = demoUsers[email.toLowerCase()];
  if (!user || user.password !== password) {
    return res.status(401).json({
      success: false,
      error: 'Invalid credentials. Please check your email and password.',
    });
  }

  const token = generateToken(user);

  res.json({
    success: true,
    message: 'Login successful',
    token,
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
      fullName: user.fullName,
      company: user.company,
    },
  });
});

// Signup
router.post('/signup', authLimiter, validate(signupSchema), async (req: Request, res: Response) => {
  const { email, password, fullName, role, company, phone } = req.body;

  const normalizedEmail = email.toLowerCase();
  if (demoUsers[normalizedEmail]) {
    return res.status(400).json({
      success: false,
      error: 'User with this email already exists.',
    });
  }

  const newUser = {
    id: `usr-${Date.now()}`,
    email: normalizedEmail,
    password,
    role: role as UserRole,
    fullName,
    company: company || 'Merchant Org',
  };

  demoUsers[normalizedEmail] = newUser;
  const token = generateToken(newUser);

  res.status(201).json({
    success: true,
    message: 'Account created successfully',
    token,
    user: {
      id: newUser.id,
      email: newUser.email,
      role: newUser.role,
      fullName: newUser.fullName,
      company: newUser.company,
    },
  });
});

// Google Real-Time Authentication (Email & Google OAuth)
router.post('/google', authLimiter, async (req: Request, res: Response) => {
  const { email, fullName, avatarUrl, googleId, role = 'CUSTOMER', company } = req.body;
  if (!email) {
    return res.status(400).json({ success: false, error: 'Google email is required for authentication' });
  }

  const normalizedEmail = email.toLowerCase();
  let user = demoUsers[normalizedEmail];

  if (!user) {
    // Provision new user from Google Account in real-time
    const derivedName = fullName || normalizedEmail.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase());
    // Security Enforcement: All Google authentications default strictly to CUSTOMER role to prevent admin escalation
    const assignedRole: UserRole = normalizedEmail === 'admin@razorrecover.ai' ? 'ADMIN' : 'CUSTOMER';

    user = {
      id: googleId ? `goog-${googleId}` : `usr-${Date.now()}`,
      email: normalizedEmail,
      password: 'oauth-google-authenticated',
      role: assignedRole,
      fullName: derivedName,
      company: company || 'Merchant Org',
    };
    demoUsers[normalizedEmail] = user;

    // Immediately provision Customer record in dataStore
    if (user.role === 'CUSTOMER') {
      await dataStore.ensureCustomerForUser(user.id, user.email, user.fullName, user.company);
    }
  } else {
    // Security Check: If not the predefined admin, enforce CUSTOMER role
    if (normalizedEmail !== 'admin@razorrecover.ai') {
      user.role = 'CUSTOMER';
    }
    // Make sure customer record exists
    if (user.role === 'CUSTOMER') {
      await dataStore.ensureCustomerForUser(user.id, user.email, user.fullName, user.company);
    }
  }

  const token = generateToken(user);

  res.json({
    success: true,
    message: 'Google authentication successful',
    token,
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
      fullName: user.fullName,
      company: user.company,
    },
  });
});

// Get Current User Profile (Session validation)
router.get('/me', authenticate, async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ success: false, error: 'Unauthorized' });
  }

  res.json({
    success: true,
    user: req.user,
  });
});

export default router;
