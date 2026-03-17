import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import type ms from 'ms';
import { config } from '../../core/config.js';
import { UnauthorizedError } from '../../core/helpers/errors.js';
import { findUserByEmail, findUserById } from './auth.queries.js';
import type { AuthPayload } from '../../core/middleware/auth.js';

export async function login(email: string, password: string) {
  const user = await findUserByEmail(email);
  if (!user) throw new UnauthorizedError('Invalid email or password');

  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) throw new UnauthorizedError('Invalid email or password');

  const payload: AuthPayload = { userId: user.id, email: user.email, role: user.role };
  const accessToken = jwt.sign(payload, config.JWT_SECRET, { expiresIn: config.JWT_EXPIRY as ms.StringValue });
  const refreshToken = jwt.sign(payload, config.JWT_SECRET, { expiresIn: config.JWT_REFRESH_EXPIRY as ms.StringValue });

  return {
    accessToken,
    refreshToken,
    user: {
      id: user.id,
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      role: user.role,
    },
  };
}

export async function refreshAccessToken(refreshToken: string) {
  try {
    const payload = jwt.verify(refreshToken, config.JWT_SECRET) as AuthPayload;
    const user = await findUserById(payload.userId);
    if (!user) throw new UnauthorizedError();

    const newPayload: AuthPayload = { userId: user.id, email: user.email, role: user.role };
    const accessToken = jwt.sign(newPayload, config.JWT_SECRET, { expiresIn: config.JWT_EXPIRY as ms.StringValue });
    return { accessToken };
  } catch {
    throw new UnauthorizedError('Invalid refresh token');
  }
}

export async function getMe(userId: string) {
  const user = await findUserById(userId);
  if (!user) throw new UnauthorizedError();
  const { password_hash, ...publicUser } = user;
  return publicUser;
}
