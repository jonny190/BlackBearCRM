import { Box, TextField, FormControl, InputLabel, Select, MenuItem, Button } from '@mui/material';
import { Add } from '@mui/icons-material';

interface Props {
  filters: Record<string, string>;
  onFilterChange: (key: string, value: string) => void;
  onCreateClick: () => void;
}

export function AccountFilters({ filters, onFilterChange, onCreateClick }: Props) {
  return (
    <Box display="flex" gap={2} mb={2} flexWrap="wrap" alignItems="center">
      <TextField size="small" label="Search" value={filters.q ?? ''} onChange={(e) => onFilterChange('q', e.target.value)} />
      <FormControl size="small" sx={{ minWidth: 120 }}>
        <InputLabel>Tier</InputLabel>
        <Select value={filters.tier ?? ''} label="Tier" onChange={(e) => onFilterChange('tier', e.target.value as string)}>
          <MenuItem value="">All</MenuItem>
          <MenuItem value="enterprise">Enterprise</MenuItem>
          <MenuItem value="mid_market">Mid Market</MenuItem>
          <MenuItem value="smb">SMB</MenuItem>
        </Select>
      </FormControl>
      <FormControl size="small" sx={{ minWidth: 120 }}>
        <InputLabel>Status</InputLabel>
        <Select value={filters.status ?? ''} label="Status" onChange={(e) => onFilterChange('status', e.target.value as string)}>
          <MenuItem value="">All</MenuItem>
          <MenuItem value="active">Active</MenuItem>
          <MenuItem value="inactive">Inactive</MenuItem>
          <MenuItem value="churned">Churned</MenuItem>
          <MenuItem value="prospect">Prospect</MenuItem>
        </Select>
      </FormControl>
      <Box flexGrow={1} />
      <Button variant="contained" startIcon={<Add />} onClick={onCreateClick}>New Account</Button>
    </Box>
  );
}
