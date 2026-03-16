import dotenv from 'dotenv';
dotenv.config({ path: '../../.env' });

import bcrypt from 'bcryptjs';
import { db } from '../core/database/connection.js';

async function seedAdmin() {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;

  if (!email || !password) {
    console.error('ADMIN_EMAIL and ADMIN_PASSWORD must be set in .env');
    process.exit(1);
  }

  const existing = await db('users').where({ email }).first();
  if (existing) {
    console.log(`Admin user ${email} already exists`);
    process.exit(0);
  }

  const password_hash = await bcrypt.hash(password, 12);
  await db('users').insert({
    email,
    password_hash,
    first_name: 'Admin',
    last_name: 'User',
    role: 'admin',
    is_active: true,
  });

  console.log(`Admin user ${email} created successfully`);
  process.exit(0);
}

seedAdmin().catch((err) => {
  console.error('Failed to seed admin:', err);
  process.exit(1);
});
