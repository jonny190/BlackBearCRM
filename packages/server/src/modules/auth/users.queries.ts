import { db } from '../../core/database/connection.js';

export function listUsers() {
  return db('users').select('id', 'email', 'first_name', 'last_name', 'role', 'is_active', 'created_at').orderBy('last_name');
}

export function findUserById(id: string) {
  return db('users').where({ id }).first();
}

export function findUserByEmail(email: string) {
  return db('users').where({ email }).first();
}

export function insertUser(data: Record<string, unknown>) {
  return db('users').insert(data).returning('*');
}

export function updateUser(id: string, data: Record<string, unknown>) {
  return db('users').where({ id }).update({ ...data, updated_at: db.fn.now() }).returning('*');
}
