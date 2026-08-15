import { createRemoteJWKSet, jwtVerify } from 'jose';

let jwks;

function getJwks() {
  if (jwks) return jwks;
  const baseUrl = process.env.SUPABASE_URL?.trim().replace(/\/$/, '');
  if (!baseUrl) {
    throw new Error('SUPABASE_URL is not configured');
  }
  jwks = createRemoteJWKSet(new URL(`${baseUrl}/auth/v1/.well-known/jwks.json`));
  return jwks;
}

export async function verifyAccessToken(token) {
  if (!token) {
    throw new Error('Missing token');
  }
  const { payload } = await jwtVerify(token, getJwks());
  if (!payload.sub) {
    throw new Error('Invalid token payload');
  }
  return {
    id: String(payload.sub),
    email: payload.email ? String(payload.email) : null,
  };
}

export async function requireAuth(req, res, next) {
  try {
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }
    req.user = await verifyAccessToken(header.slice(7));
    return next();
  } catch (error) {
    console.error('requireAuth error:', error.message);
    return res.status(401).json({ success: false, message: 'Invalid or expired token' });
  }
}

export async function optionalAuth(req, res, next) {
  try {
    const header = req.headers.authorization;
    if (header?.startsWith('Bearer ')) {
      req.user = await verifyAccessToken(header.slice(7));
    }
  } catch {
    // Public route — ignore invalid tokens
  }
  return next();
}
