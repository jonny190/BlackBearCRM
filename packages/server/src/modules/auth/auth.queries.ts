import { db } from '../../core/database/connection.js';

export function findUserByEmail(email: string) {
  return db('users').where({ email, is_active: true }).first();
}

export function findUserById(id: string) {
  return db('users').where({ id, is_active: true }).first();
}
