import { useState } from 'react';
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Alert,
  Tooltip,
} from '@mui/material';
import { PersonAdd, ToggleOn, ToggleOff } from '@mui/icons-material';
import type { User } from '@blackpear/shared';
import { useGetUsersQuery, useUpdateUserMutation, useCreateUserMutation } from '../../store/api/usersApi';
import { LoadingState } from '../../components/common/LoadingState';

interface CreateUserForm {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  role: 'admin' | 'manager' | 'team_lead';
}

const EMPTY_FORM: CreateUserForm = {
  email: '',
  password: '',
  first_name: '',
  last_name: '',
  role: 'manager',
};

export function UserManagementTab() {
  const { data, isLoading } = useGetUsersQuery({});
  const [updateUser] = useUpdateUserMutation();
  const [createUser, { isLoading: isCreating }] = useCreateUserMutation();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState<CreateUserForm>(EMPTY_FORM);
  const [formError, setFormError] = useState('');

  if (isLoading) return <LoadingState />;

  const users: User[] = data?.data ?? [];

  const handleToggleActive = async (user: User) => {
    try {
      await updateUser({ id: user.id, data: { is_active: !user.is_active } }).unwrap();
    } catch {
      // ignore
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    try {
      await createUser(form).unwrap();
      setDialogOpen(false);
      setForm(EMPTY_FORM);
    } catch (err: any) {
      setFormError(err?.data?.error?.message ?? 'Failed to create user');
    }
  };

  return (
    <>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h6">User Management</Typography>
        <Button
          variant="contained"
          startIcon={<PersonAdd />}
          onClick={() => { setDialogOpen(true); setForm(EMPTY_FORM); setFormError(''); }}
        >
          New User
        </Button>
      </Box>

      <TableContainer component={Paper} variant="outlined">
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Role</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell>{user.first_name} {user.last_name}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>
                  <Chip label={user.role} size="small" variant="outlined" />
                </TableCell>
                <TableCell>
                  <Chip
                    label={user.is_active ? 'Active' : 'Inactive'}
                    color={user.is_active ? 'success' : 'default'}
                    size="small"
                  />
                </TableCell>
                <TableCell align="right">
                  <Tooltip title={user.is_active ? 'Deactivate' : 'Activate'}>
                    <IconButton size="small" onClick={() => handleToggleActive(user)}>
                      {user.is_active ? <ToggleOn color="success" /> : <ToggleOff />}
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
            {users.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} align="center">
                  <Typography color="text.secondary" py={2}>No users found.</Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <form onSubmit={handleCreate}>
          <DialogTitle>Create New User</DialogTitle>
          <DialogContent>
            {formError && <Alert severity="error" sx={{ mb: 2 }}>{formError}</Alert>}
            <TextField
              fullWidth label="First Name" value={form.first_name}
              onChange={(e) => setForm({ ...form, first_name: e.target.value })}
              margin="normal" required
            />
            <TextField
              fullWidth label="Last Name" value={form.last_name}
              onChange={(e) => setForm({ ...form, last_name: e.target.value })}
              margin="normal" required
            />
            <TextField
              fullWidth label="Email" type="email" value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              margin="normal" required
            />
            <TextField
              fullWidth label="Password" type="password" value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              margin="normal" required
              helperText="Minimum 8 characters."
            />
            <FormControl fullWidth margin="normal">
              <InputLabel>Role</InputLabel>
              <Select
                label="Role"
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value as CreateUserForm['role'] })}
              >
                <MenuItem value="admin">Admin</MenuItem>
                <MenuItem value="manager">Manager</MenuItem>
                <MenuItem value="team_lead">Team Lead</MenuItem>
              </Select>
            </FormControl>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={isCreating}>
              {isCreating ? 'Creating...' : 'Create User'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </>
  );
}
