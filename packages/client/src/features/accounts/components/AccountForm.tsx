import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createAccountSchema } from '@blackbear/shared';

interface Props {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  defaultValues?: any;
  isLoading?: boolean;
}

export function AccountForm({ open, onClose, onSubmit, defaultValues, isLoading }: Props) {
  const { control, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(createAccountSchema),
    defaultValues: defaultValues ?? { name: '', industry: '', tier: 'smb', website: '', status: 'active' },
  });

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <form onSubmit={handleSubmit(onSubmit)}>
        <DialogTitle>{defaultValues ? 'Edit Account' : 'New Account'}</DialogTitle>
        <DialogContent>
          <Controller name="name" control={control} render={({ field }) =>
            <TextField {...field} fullWidth label="Account Name" margin="normal" error={!!errors.name} helperText={errors.name?.message as string} />} />
          <Controller name="industry" control={control} render={({ field }) =>
            <TextField {...field} fullWidth label="Industry" margin="normal" error={!!errors.industry} />} />
          <Controller name="tier" control={control} render={({ field }) =>
            <FormControl fullWidth margin="normal"><InputLabel>Tier</InputLabel>
              <Select {...field} label="Tier"><MenuItem value="enterprise">Enterprise</MenuItem>
                <MenuItem value="mid_market">Mid Market</MenuItem><MenuItem value="smb">SMB</MenuItem></Select>
            </FormControl>} />
          <Controller name="website" control={control} render={({ field }) =>
            <TextField {...field} fullWidth label="Website" margin="normal" />} />
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="contained" disabled={isLoading}>{isLoading ? 'Saving...' : 'Save'}</Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
