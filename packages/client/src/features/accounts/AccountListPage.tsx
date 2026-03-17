import { useState } from 'react';
import { Typography } from '@mui/material';
import { useGetAccountsQuery, useCreateAccountMutation } from '../../store/api/accountsApi';
import { AccountTable } from './components/AccountTable';
import { AccountFilters } from './components/AccountFilters';
import { AccountForm } from './components/AccountForm';
import { LoadingState } from '../../components/common/LoadingState';

export function AccountListPage() {
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [formOpen, setFormOpen] = useState(false);

  const queryParams = { ...filters, page, limit: pageSize };
  const { data, isLoading } = useGetAccountsQuery(queryParams);
  const [createAccount, { isLoading: isCreating }] = useCreateAccountMutation();

  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev) => value ? { ...prev, [key]: value } : (() => { const n = { ...prev }; delete n[key]; return n; })());
    setPage(1);
  };

  const handleCreate = async (formData: any) => {
    await createAccount(formData).unwrap();
    setFormOpen(false);
  };

  return (
    <>
      <Typography variant="h5" mb={2}>Accounts</Typography>
      <AccountFilters filters={filters} onFilterChange={handleFilterChange} onCreateClick={() => setFormOpen(true)} />
      {isLoading ? <LoadingState /> :
        <AccountTable accounts={data?.data ?? []} loading={isLoading} total={data?.meta?.total ?? 0}
          page={page} pageSize={pageSize} onPageChange={setPage} onPageSizeChange={setPageSize} />}
      <AccountForm open={formOpen} onClose={() => setFormOpen(false)} onSubmit={handleCreate} isLoading={isCreating} />
    </>
  );
}
