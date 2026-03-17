import bcrypt from 'bcryptjs';
import { ConflictError, NotFoundError } from '../../core/helpers/errors.js';
import * as queries from './users.queries.js';

export async function listUsers() {
  return queries.listUsers();
}

export async function createUser(data: { email: string; password: string; first_name: string; last_name: string; role: string }) {
  const existing = await queries.findUserByEmail(data.email);
  if (existing) throw new ConflictError('Email already in use');

  const password_hash = await bcrypt.hash(data.password, 12);
  const [user] = await queries.insertUser({
    email: data.email,
    password_hash,
    first_name: data.first_name,
    last_name: data.last_name,
    role: data.role,
  });
  const { password_hash: _, ...publicUser } = user;
  return publicUser;
}

export async function updateUser(id: string, data: Record<string, unknown>) {
  const existing = await queries.findUserById(id);
  if (!existing) throw new NotFoundError('User', id);

  const updateData = { ...data };
  if (typeof data.password === 'string') {
    updateData.password_hash = await bcrypt.hash(data.password, 12);
    delete updateData.password;
  }

  const [user] = await queries.updateUser(id, updateData);
  const { password_hash: _, ...publicUser } = user;
  return publicUser;
}

export async function deactivateUser(id: string) {
  const existing = await queries.findUserById(id);
  if (!existing) throw new NotFoundError('User', id);
  await queries.updateUser(id, { is_active: false });
}
