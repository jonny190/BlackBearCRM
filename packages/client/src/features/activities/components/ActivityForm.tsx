import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createActivitySchema } from '@blackpear/shared';

interface Props {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  accountId: string;
  isLoading?: boolean;
}

export function ActivityForm({ open, onClose, onSubmit, accountId, isLoading }: Props) {
  const { control, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(createActivitySchema),
    defaultValues: { account_id: accountId, type: 'meeting', title: '', description: '', occurred_at: new Date().toISOString().slice(0, 16) },
  });

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <form onSubmit={handleSubmit(onSubmit)}>
        <DialogTitle>Log Activity</DialogTitle>
        <DialogContent>
          <Controller name="type" control={control} render={({ field }) =>
            <FormControl fullWidth margin="normal"><InputLabel>Type</InputLabel>
              <Select {...field} label="Type">
                <MenuItem value="meeting">Meeting</MenuItem><MenuItem value="call">Call</MenuItem>
                <MenuItem value="email">Email</MenuItem><MenuItem value="note">Note</MenuItem>
                <MenuItem value="proposal">Proposal</MenuItem><MenuItem value="follow_up">Follow-up</MenuItem>
              </Select></FormControl>} />
          <Controller name="title" control={control} render={({ field }) =>
            <TextField {...field} fullWidth label="Title" margin="normal" error={!!errors.title} />} />
          <Controller name="description" control={control} render={({ field }) =>
            <TextField {...field} fullWidth label="Description" margin="normal" multiline rows={3} />} />
          <Controller name="occurred_at" control={control} render={({ field }) =>
            <TextField {...field} fullWidth label="Date/Time" type="datetime-local" margin="normal" InputLabelProps={{ shrink: true }} />} />
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="contained" disabled={isLoading}>Save</Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
