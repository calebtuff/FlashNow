import { ZodError } from 'zod';
import { syncUserSchema } from 'shared';
import prisma from '../lib/prisma.js';

async function uniqueUsername(base) {
  let username = base.slice(0, 24) || 'user';
  username = username.replace(/[^a-zA-Z0-9_]/g, '') || 'user';
  if (!(await prisma.user.findUnique({ where: { username } }))) {
    return username;
  }
  for (let i = 0; i < 8; i += 1) {
    const candidate = `${username}${Math.floor(Math.random() * 9999)}`.slice(0, 24);
    if (!(await prisma.user.findUnique({ where: { username: candidate } }))) {
      return candidate;
    }
  }
  throw new Error('Could not generate unique username');
}

function normalizeOptionalString(value) {
  if (value === undefined) return undefined;
  const trimmed = String(value).trim();
  return trimmed === '' ? null : trimmed;
}

export const syncUser = async (req, res) => {
  try {
    const userId = req.user.id;
    const email = req.user.email;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Account email is required' });
    }

    const profile = syncUserSchema.parse(req.body ?? {});
    const requestedUsername = profile.username?.trim();
    const requestedDisplayName = normalizeOptionalString(profile.displayName);
    const requestedPhone = normalizeOptionalString(profile.phone);

    let user = await prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
      if (!requestedPhone) {
        return res.status(400).json({ success: false, message: 'Phone number is required' });
      }

      const username = requestedUsername
        ? await uniqueUsername(requestedUsername)
        : await uniqueUsername(email.split('@')[0]);

      user = await prisma.user.create({
        data: {
          id: userId,
          email,
          username,
          displayName: requestedDisplayName,
          phone: requestedPhone,
        },
      });
    } else {
      const data = { email };

      if (requestedUsername && requestedUsername !== user.username) {
        data.username = await uniqueUsername(requestedUsername);
      }
      if (requestedDisplayName !== undefined) {
        data.displayName = requestedDisplayName;
      }
      if (requestedPhone !== undefined) {
        data.phone = requestedPhone;
      }

      user = await prisma.user.update({
        where: { id: userId },
        data,
      });
    }

    await prisma.wallet.upsert({
      where: { userId },
      update: {},
      create: { userId, balance: 0, heldBalance: 0 },
    });

    return res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        displayName: user.displayName,
        avatarUrl: user.avatarUrl,
        phone: user.phone,
      },
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({
        success: false,
        message: error.errors[0]?.message || 'Invalid profile data',
      });
    }
    console.error('syncUser error:', error);
    return res.status(500).json({ success: false, message: 'Failed to sync user' });
  }
};
