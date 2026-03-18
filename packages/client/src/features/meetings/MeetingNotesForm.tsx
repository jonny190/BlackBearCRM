import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, FormControl, InputLabel, Select, MenuItem, Chip, Box, IconButton } from '@mui/material';
import { Add, Close } from '@mui/icons-material';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createMeetingNoteSchema } from '@blackpear/shared';
import { useState } from 'react';
import type { Contact } from '@blackpear/shared';

interface Props {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  defaultValues?: any;
  contacts: Contact[];
  isLoading?: boolean;
}

export function MeetingNotesForm({ open, onClose, onSubmit, defaultValues, contacts, isLoading }: Props) {
  const [participantName, setParticipantName] = useState('');
  const { control, handleSubmit, formState: { errors }, setValue, watch } = useForm({
    resolver: zodResolver(createMeetingNoteSchema),
    defaultValues: defaultValues ?? {
      title: '',
      raw_notes: '',
      meeting_date: new Date().toISOString().slice(0, 16),
      contact_id: null,
      participants: [],
    },
  });

  const participants = watch('participants') ?? [];

  const addParticipant = () => {
    if (participantName.trim()) {
      setValue('participants', [...participants, { name: participantName.trim() }]);
      setParticipantName('');
    }
  };

  const removeParticipant = (index: number) => {
    setValue('participants', participants.filter((_: unknown, i: number) => i !== index));
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <form onSubmit={handleSubmit(onSubmit)}>
        <DialogTitle>{defaultValues ? 'Edit Meeting Note' : 'New Meeting Note'}</DialogTitle>
        <DialogContent>
          <Controller name="title" control={control} render={({ field }) =>
            <TextField {...field} fullWidth label="Title" margin="normal" error={!!errors.title}
              helperText={errors.title?.message as string} />} />
          <Controller name="meeting_date" control={control} render={({ field }) =>
            <TextField {...field} fullWidth label="Meeting Date" type="datetime-local" margin="normal"
              InputLabelProps={{ shrink: true }} error={!!errors.meeting_date} />} />
          <Controller name="contact_id" control={control} render={({ field }) =>
            <FormControl fullWidth margin="normal">
              <InputLabel>Primary Contact</InputLabel>
              <Select {...field} value={field.value ?? ''} label="Primary Contact"
                onChange={(e) => field.onChange(e.target.value || null)}>
                <MenuItem value="">None</MenuItem>
                {contacts.map((c) => (
                  <MenuItem key={c.id} value={c.id}>{c.first_name} {c.last_name}</MenuItem>
                ))}
              </Select>
            </FormControl>} />

          <Box mt={1} mb={1}>
            <Box display="flex" gap={1} alignItems="center">
              <TextField size="small" label="Add Participant" value={participantName}
                onChange={(e) => setParticipantName(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addParticipant(); } }} />
              <IconButton size="small" onClick={addParticipant}><Add /></IconButton>
            </Box>
            <Box display="flex" flexWrap="wrap" gap={0.5} mt={0.5}>
              {participants.map((p: { name: string }, i: number) => (
                <Chip key={i} label={p.name} size="small" onDelete={() => removeParticipant(i)}
                  deleteIcon={<Close fontSize="small" />} />
              ))}
            </Box>
          </Box>

          <Controller name="raw_notes" control={control} render={({ field }) =>
            <TextField {...field} fullWidth label="Meeting Notes" margin="normal" multiline rows={8}
              error={!!errors.raw_notes} helperText={errors.raw_notes?.message as string}
              placeholder="Enter your meeting notes here. AI will automatically extract insights, action items, and follow-ups." />} />
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="contained" disabled={isLoading}>Save</Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
