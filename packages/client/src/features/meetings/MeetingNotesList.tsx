import { useState } from 'react';
import { List, ListItem, ListItemText, ListItemSecondaryAction, IconButton, Chip, Button, Box, Collapse } from '@mui/material';
import { Edit, Delete, Add, Refresh, ExpandMore, ExpandLess } from '@mui/icons-material';
import { ProcessedInsights } from './ProcessedInsights';
import type { MeetingNote, MeetingNoteStatus } from '@blackpear/shared';

const STATUS_CONFIG: Record<MeetingNoteStatus, { label: string; color: 'default' | 'info' | 'success' | 'error' }> = {
  draft: { label: 'Draft', color: 'default' },
  processing: { label: 'Processing', color: 'info' },
  processed: { label: 'Processed', color: 'success' },
  failed: { label: 'Failed', color: 'error' },
};

interface Props {
  notes: MeetingNote[];
  onAdd: () => void;
  onEdit: (note: MeetingNote) => void;
  onDelete: (id: string) => void;
  onReprocess: (id: string) => void;
}

export function MeetingNotesList({ notes, onAdd, onEdit, onDelete, onReprocess }: Props) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <>
      <Box display="flex" justifyContent="flex-end" mb={1}>
        <Button startIcon={<Add />} variant="outlined" size="small" onClick={onAdd}>Add Meeting Note</Button>
      </Box>
      <List>
        {notes.map((note) => {
          const statusConfig = STATUS_CONFIG[note.status];
          const isExpanded = expandedId === note.id;
          return (
            <Box key={note.id}>
              <ListItem divider sx={{ cursor: 'pointer', pr: 16 }} onClick={() => toggleExpand(note.id)}>
                <ListItemText
                  primary={note.title}
                  secondary={new Date(note.meeting_date).toLocaleDateString(undefined, {
                    year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
                  })}
                />
                <Chip label={statusConfig.label} color={statusConfig.color} size="small" sx={{ mr: 6 }} />
                <ListItemSecondaryAction>
                  {(note.status === 'failed' || note.status === 'processing') && (
                    <IconButton size="small" onClick={(e) => { e.stopPropagation(); onReprocess(note.id); }} title="Retry processing">
                      <Refresh fontSize="small" />
                    </IconButton>
                  )}
                  {note.status === 'processed' && (
                    <IconButton size="small" onClick={(e) => { e.stopPropagation(); toggleExpand(note.id); }}>
                      {isExpanded ? <ExpandLess fontSize="small" /> : <ExpandMore fontSize="small" />}
                    </IconButton>
                  )}
                  <IconButton size="small" onClick={(e) => { e.stopPropagation(); onEdit(note); }}>
                    <Edit fontSize="small" />
                  </IconButton>
                  <IconButton size="small" onClick={(e) => { e.stopPropagation(); onDelete(note.id); }}>
                    <Delete fontSize="small" />
                  </IconButton>
                </ListItemSecondaryAction>
              </ListItem>
              <Collapse in={isExpanded}>
                <Box px={2} pb={1}>
                  <ProcessedInsights meetingNoteId={note.id} status={note.status} />
                </Box>
              </Collapse>
            </Box>
          );
        })}
      </List>
    </>
  );
}
