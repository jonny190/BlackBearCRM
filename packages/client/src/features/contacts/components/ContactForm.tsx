import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, FormControl, InputLabel, Select, MenuItem, FormControlLabel, Switch } from '@mui/material';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createContactSchema } from '@blackpear/shared';

interface Props {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  defaultValues?: any;
  isLoading?: boolean;
}

export function ContactForm({ open, onClose, onSubmit, defaultValues, isLoading }: Props) {
  const { control, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(createContactSchema),
    defaultValues: defaultValues ?? { first_name: '', last_name: '', email: '', phone: '', title: '', role_level: 'individual', is_primary: false },
  });

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <form onSubmit={handleSubmit(onSubmit)}>
        <DialogTitle>{defaultValues ? 'Edit Contact' : 'New Contact'}</DialogTitle>
        <DialogContent>
          <Controller name="first_name" control={control} render={({ field }) =>
            <TextField {...field} fullWidth label="First Name" margin="normal" error={!!errors.first_name} />} />
          <Controller name="last_name" control={control} render={({ field }) =>
            <TextField {...field} fullWidth label="Last Name" margin="normal" error={!!errors.last_name} />} />
          <Controller name="email" control={control} render={({ field }) =>
            <TextField {...field} fullWidth label="Email" margin="normal" />} />
          <Controller name="title" control={control} render={({ field }) =>
            <TextField {...field} fullWidth label="Job Title" margin="normal" error={!!errors.title} />} />
          <Controller name="role_level" control={control} render={({ field }) =>
            <FormControl fullWidth margin="normal"><InputLabel>Role Level</InputLabel>
              <Select {...field} label="Role Level">
                <MenuItem value="executive">Executive</MenuItem><MenuItem value="director">Director</MenuItem>
                <MenuItem value="manager">Manager</MenuItem><MenuItem value="individual">Individual</MenuItem>
              </Select></FormControl>} />
          <Controller name="is_primary" control={control} render={({ field }) =>
            <FormControlLabel control={<Switch checked={field.value} onChange={field.onChange} />} label="Primary Contact" />} />
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="contained" disabled={isLoading}>Save</Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
