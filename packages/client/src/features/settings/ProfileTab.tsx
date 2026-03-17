import { useState, useEffect } from 'react';
import { Box, TextField, Button, Alert, Typography } from '@mui/material';
import { useGetProfileQuery, useUpdateProfileMutation } from '../../store/api/usersApi';
import { LoadingState } from '../../components/common/LoadingState';

export function ProfileTab() {
  const { data, isLoading } = useGetProfileQuery();
  const [updateProfile, { isLoading: isSaving }] = useUpdateProfileMutation();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (data?.data) {
      setFirstName(data.data.first_name ?? '');
      setLastName(data.data.last_name ?? '');
    }
  }, [data]);

  if (isLoading) return <LoadingState />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    try {
      await updateProfile({ first_name: firstName, last_name: lastName }).unwrap();
      setSuccess(true);
    } catch (err: any) {
      setError(err?.data?.error?.message ?? 'Failed to update profile');
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ maxWidth: 480 }}>
      <Typography variant="h6" mb={2}>Profile Information</Typography>
      {success && <Alert severity="success" sx={{ mb: 2 }}>Profile updated successfully.</Alert>}
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      <TextField
        fullWidth
        label="First Name"
        value={firstName}
        onChange={(e) => setFirstName(e.target.value)}
        margin="normal"
        required
      />
      <TextField
        fullWidth
        label="Last Name"
        value={lastName}
        onChange={(e) => setLastName(e.target.value)}
        margin="normal"
        required
      />
      <TextField
        fullWidth
        label="Email"
        value={data?.data?.email ?? ''}
        margin="normal"
        disabled
        helperText="Email cannot be changed."
      />
      <Button
        type="submit"
        variant="contained"
        disabled={isSaving}
        sx={{ mt: 2 }}
      >
        {isSaving ? 'Saving...' : 'Save Changes'}
      </Button>
    </Box>
  );
}
