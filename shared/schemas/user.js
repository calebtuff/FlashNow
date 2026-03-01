import { z } from 'zod';

export const userSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  username: z.string().min(3).max(30),
  avatarUrl: z.string().url().nullable().optional(),
  phone: z.string().nullable().optional(),
  createdAt: z.coerce.date(),
});

export const createUserSchema = z.object({
  email: z.string().email(),
  username: z.string().min(3).max(30),
  avatarUrl: z.string().url().optional(),
  phone: z.string().optional(),
});

export const updateUserSchema = z.object({
  username: z.string().min(3).max(30).optional(),
  avatarUrl: z.string().url().nullable().optional(),
  phone: z.string().nullable().optional(),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  username: z.string().min(3).max(30),
});
