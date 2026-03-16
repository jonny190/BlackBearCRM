import { UserRole } from '../constants/enums.js';

export interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: UserRole;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export type UserPublic = Omit<User, 'created_at' | 'updated_at'> & {
  created_at: string;
};
