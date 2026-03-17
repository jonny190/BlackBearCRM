import { List, ListItem, ListItemText, ListItemSecondaryAction, IconButton, Chip, Button, Box } from '@mui/material';
import { Edit, Delete, Add } from '@mui/icons-material';
import type { Contact } from '@blackbear/shared';

interface Props {
  contacts: Contact[];
  onEdit: (contact: Contact) => void;
  onDelete: (id: string) => void;
  onAdd: () => void;
}

export function ContactList({ contacts, onEdit, onDelete, onAdd }: Props) {
  return (
    <>
      <Box display="flex" justifyContent="flex-end" mb={1}>
        <Button startIcon={<Add />} variant="outlined" size="small" onClick={onAdd}>Add Contact</Button>
      </Box>
      <List>
        {contacts.map((c) => (
          <ListItem key={c.id} divider>
            <ListItemText
              primary={`${c.first_name} ${c.last_name}`}
              secondary={`${c.title} | ${c.email ?? 'No email'}`}
            />
            <Chip label={c.role_level} size="small" sx={{ mr: 1 }} />
            {c.is_primary && <Chip label="Primary" color="primary" size="small" sx={{ mr: 1 }} />}
            <ListItemSecondaryAction>
              <IconButton size="small" onClick={() => onEdit(c)}><Edit fontSize="small" /></IconButton>
              <IconButton size="small" onClick={() => onDelete(c.id)}><Delete fontSize="small" /></IconButton>
            </ListItemSecondaryAction>
          </ListItem>
        ))}
      </List>
    </>
  );
}
