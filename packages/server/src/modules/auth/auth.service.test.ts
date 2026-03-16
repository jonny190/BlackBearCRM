import bcrypt from 'bcryptjs';
import { login } from './auth.service';
import * as queries from './auth.queries';

jest.mock('./auth.queries');
jest.mock('../../core/config', () => ({
  config: {
    JWT_SECRET: 'test-secret-at-least-16-chars',
    JWT_EXPIRY: '15m',
    JWT_REFRESH_EXPIRY: '7d',
  },
}));

const mockUser = {
  id: '123',
  email: 'test@test.com',
  password_hash: bcrypt.hashSync('password123', 10),
  first_name: 'Test',
  last_name: 'User',
  role: 'manager',
  is_active: true,
};

describe('auth.service', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('login', () => {
    it('returns tokens and user for valid credentials', async () => {
      (queries.findUserByEmail as jest.Mock).mockResolvedValue(mockUser);
      const result = await login('test@test.com', 'password123');
      expect(result.accessToken).toBeDefined();
      expect(result.refreshToken).toBeDefined();
      expect(result.user.email).toBe('test@test.com');
    });

    it('throws for invalid email', async () => {
      (queries.findUserByEmail as jest.Mock).mockResolvedValue(null);
      await expect(login('bad@test.com', 'password123')).rejects.toThrow('Invalid email or password');
    });

    it('throws for invalid password', async () => {
      (queries.findUserByEmail as jest.Mock).mockResolvedValue(mockUser);
      await expect(login('test@test.com', 'wrong')).rejects.toThrow('Invalid email or password');
    });
  });
});
