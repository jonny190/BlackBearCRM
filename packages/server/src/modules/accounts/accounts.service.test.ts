import { getAccount, deleteAccount } from './accounts.service';
import * as queries from './accounts.queries';
import { NotFoundError, ForbiddenError } from '../../core/helpers/errors';

jest.mock('../../core/database/connection', () => ({ db: {} }));

jest.mock('./accounts.queries');

const mockAccount = {
  id: 'account-123',
  name: 'Acme Corp',
  industry: 'Technology',
  tier: 'enterprise' as const,
  website: null,
  status: 'active' as const,
  owner_id: 'user-abc',
  metadata: {},
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
};

describe('accounts.service', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('getAccount', () => {
    it('returns the account for admin regardless of ownership', async () => {
      (queries.getAccountById as jest.Mock).mockResolvedValue(mockAccount);
      const result = await getAccount('account-123', 'other-user', 'admin');
      expect(result).toEqual(mockAccount);
    });

    it('returns the account for team_lead regardless of ownership', async () => {
      (queries.getAccountById as jest.Mock).mockResolvedValue(mockAccount);
      const result = await getAccount('account-123', 'other-user', 'team_lead');
      expect(result).toEqual(mockAccount);
    });

    it('returns the account for manager who owns it', async () => {
      (queries.getAccountById as jest.Mock).mockResolvedValue(mockAccount);
      const result = await getAccount('account-123', 'user-abc', 'manager');
      expect(result).toEqual(mockAccount);
    });

    it('throws ForbiddenError for manager who does not own the account', async () => {
      (queries.getAccountById as jest.Mock).mockResolvedValue(mockAccount);
      await expect(getAccount('account-123', 'other-user', 'manager')).rejects.toThrow(
        ForbiddenError,
      );
    });

    it('throws NotFoundError when account does not exist', async () => {
      (queries.getAccountById as jest.Mock).mockResolvedValue(undefined);
      await expect(getAccount('missing-id', 'user-abc', 'admin')).rejects.toThrow(NotFoundError);
    });
  });

  describe('deleteAccount', () => {
    it('deletes account when called by admin', async () => {
      (queries.getAccountById as jest.Mock).mockResolvedValue(mockAccount);
      (queries.deleteAccount as jest.Mock).mockResolvedValue(1);
      await expect(deleteAccount('account-123', 'admin')).resolves.toBeUndefined();
      expect(queries.deleteAccount).toHaveBeenCalledWith('account-123');
    });

    it('throws ForbiddenError when called by manager', async () => {
      await expect(deleteAccount('account-123', 'manager')).rejects.toThrow(ForbiddenError);
      expect(queries.deleteAccount).not.toHaveBeenCalled();
    });

    it('throws ForbiddenError when called by team_lead', async () => {
      await expect(deleteAccount('account-123', 'team_lead')).rejects.toThrow(ForbiddenError);
      expect(queries.deleteAccount).not.toHaveBeenCalled();
    });

    it('throws NotFoundError when account does not exist', async () => {
      (queries.getAccountById as jest.Mock).mockResolvedValue(undefined);
      await expect(deleteAccount('missing-id', 'admin')).rejects.toThrow(NotFoundError);
    });
  });
});
