import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { useNavigate } from 'react-router-dom';
import { HealthBadge } from './HealthBadge';
import { Chip } from '@mui/material';

const columns: GridColDef[] = [
  { field: 'name', headerName: 'Account', flex: 1, minWidth: 200 },
  { field: 'industry', headerName: 'Industry', flex: 0.5 },
  { field: 'tier', headerName: 'Tier', width: 120, renderCell: (p) => <Chip label={p.value} size="small" variant="outlined" /> },
  { field: 'status', headerName: 'Status', width: 100 },
  { field: 'health', headerName: 'Health', width: 100, renderCell: (p) =>
    <HealthBadge score={p.row.healthScore} color={p.row.healthColor} trend={p.row.healthTrend} /> },
];

interface Props {
  accounts: any[];
  loading: boolean;
  total: number;
  page: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
}

export function AccountTable({ accounts, loading, total, page, pageSize, onPageChange, onPageSizeChange }: Props) {
  const navigate = useNavigate();

  return (
    <DataGrid
      rows={accounts}
      columns={columns}
      loading={loading}
      rowCount={total}
      paginationMode="server"
      paginationModel={{ page: page - 1, pageSize }}
      onPaginationModelChange={(m) => { onPageChange(m.page + 1); onPageSizeChange(m.pageSize); }}
      onRowClick={(p) => navigate(`/accounts/${p.id}`)}
      pageSizeOptions={[10, 25, 50]}
      disableRowSelectionOnClick
      autoHeight
      sx={{ cursor: 'pointer' }}
    />
  );
}
