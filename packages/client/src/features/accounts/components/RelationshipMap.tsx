import { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Chip,
  LinearProgress,
  IconButton,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Slider,
  Stack,
  Divider,
  Alert,
  Tooltip,
} from '@mui/material';
import { Add, DeleteOutline, SwapHoriz } from '@mui/icons-material';
import {
  useGetRelationshipsQuery,
  useCreateRelationshipMutation,
  useDeleteRelationshipMutation,
} from '../../../store/api/relationshipsApi';
import { useGetAccountContactsQuery } from '../../../store/api/contactsApi';
import { LoadingState } from '../../../components/common/LoadingState';

const RELATIONSHIP_TYPES = [
  { value: 'works_with', label: 'Works With' },
  { value: 'reports_to', label: 'Reports To' },
  { value: 'manages', label: 'Manages' },
  { value: 'influences', label: 'Influences' },
  { value: 'blocks', label: 'Blocks' },
  { value: 'champion', label: 'Champion' },
  { value: 'detractor', label: 'Detractor' },
];

const ROLE_LEVEL_COLORS: Record<string, 'error' | 'warning' | 'info' | 'default'> = {
  executive: 'error',
  vp: 'warning',
  director: 'info',
  manager: 'default',
  individual: 'default',
};

interface AddRelationshipDialogProps {
  open: boolean;
  onClose: () => void;
  accountId: string;
  contacts: any[];
}

function AddRelationshipDialog({ open, onClose, accountId, contacts }: AddRelationshipDialogProps) {
  const [createRelationship, { isLoading }] = useCreateRelationshipMutation();
  const [contactId, setContactId] = useState('');
  const [relatedContactId, setRelatedContactId] = useState('');
  const [relationshipType, setRelationshipType] = useState('works_with');
  const [strength, setStrength] = useState<number>(50);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!contactId || !relatedContactId) {
      setError('Please select both contacts.');
      return;
    }
    if (contactId === relatedContactId) {
      setError('Please select two different contacts.');
      return;
    }
    try {
      await createRelationship({
        accountId,
        data: { contact_id: contactId, related_contact_id: relatedContactId, relationship_type: relationshipType, strength },
      }).unwrap();
      setContactId('');
      setRelatedContactId('');
      setRelationshipType('works_with');
      setStrength(50);
      setError('');
      onClose();
    } catch {
      setError('Failed to create relationship. Please try again.');
    }
  };

  const handleClose = () => {
    setContactId('');
    setRelatedContactId('');
    setRelationshipType('works_with');
    setStrength(50);
    setError('');
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Add Relationship</DialogTitle>
      <DialogContent>
        <Stack spacing={3} mt={1}>
          {error && <Alert severity="error">{error}</Alert>}
          <FormControl fullWidth>
            <InputLabel>Contact</InputLabel>
            <Select label="Contact" value={contactId} onChange={(e) => setContactId(e.target.value)}>
              {contacts.map((c: any) => (
                <MenuItem key={c.id} value={c.id}>
                  {c.first_name} {c.last_name} {c.title ? `- ${c.title}` : ''}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth>
            <InputLabel>Relationship Type</InputLabel>
            <Select label="Relationship Type" value={relationshipType} onChange={(e) => setRelationshipType(e.target.value)}>
              {RELATIONSHIP_TYPES.map((t) => (
                <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth>
            <InputLabel>Related Contact</InputLabel>
            <Select label="Related Contact" value={relatedContactId} onChange={(e) => setRelatedContactId(e.target.value)}>
              {contacts.map((c: any) => (
                <MenuItem key={c.id} value={c.id}>
                  {c.first_name} {c.last_name} {c.title ? `- ${c.title}` : ''}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <Box>
            <Typography gutterBottom variant="body2">
              Relationship Strength: {strength}%
            </Typography>
            <Slider
              value={strength}
              onChange={(_e, v) => setStrength(v as number)}
              min={0}
              max={100}
              step={5}
              marks={[{ value: 0, label: 'Weak' }, { value: 50, label: 'Medium' }, { value: 100, label: 'Strong' }]}
            />
          </Box>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Cancel</Button>
        <Button onClick={handleSubmit} variant="contained" disabled={isLoading}>
          {isLoading ? 'Adding...' : 'Add Relationship'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

interface RelationshipMapProps {
  accountId: string;
}

export function RelationshipMap({ accountId }: RelationshipMapProps) {
  const { data: relData, isLoading: relLoading } = useGetRelationshipsQuery(accountId);
  const { data: contactsData, isLoading: contactsLoading } = useGetAccountContactsQuery({ accountId });
  const [deleteRelationship] = useDeleteRelationshipMutation();
  const [dialogOpen, setDialogOpen] = useState(false);

  if (relLoading || contactsLoading) return <LoadingState />;

  const relationships: any[] = relData?.data ?? [];
  const contacts: any[] = contactsData?.data ?? [];

  const getRelationshipLabel = (type: string) =>
    RELATIONSHIP_TYPES.find((t) => t.value === type)?.label ?? type;

  const getStrengthColor = (strength: number): 'success' | 'warning' | 'error' => {
    if (strength >= 70) return 'success';
    if (strength >= 40) return 'warning';
    return 'error';
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h6">Contact Relationships</Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => setDialogOpen(true)}
          disabled={contacts.length < 2}
        >
          Add Relationship
        </Button>
      </Box>

      {contacts.length < 2 && (
        <Alert severity="info" sx={{ mb: 2 }}>
          At least two contacts are needed to create a relationship.
        </Alert>
      )}

      {relationships.length === 0 ? (
        <Card>
          <CardContent>
            <Box display="flex" justifyContent="center" py={4}>
              <Typography color="text.secondary">
                No relationships defined yet. Add contacts and map how they relate to each other.
              </Typography>
            </Box>
          </CardContent>
        </Card>
      ) : (
        <Stack spacing={2}>
          {relationships.map((rel: any) => (
            <Card key={rel.id} variant="outlined">
              <CardContent sx={{ py: 2, '&:last-child': { pb: 2 } }}>
                <Grid container spacing={2} alignItems="center">
                  <Grid item xs={12} sm={4}>
                    <Box>
                      <Typography variant="subtitle2">
                        {rel.contact_first_name} {rel.contact_last_name}
                      </Typography>
                      {rel.contact_title && (
                        <Typography variant="caption" color="text.secondary">
                          {rel.contact_title}
                        </Typography>
                      )}
                      {rel.contact_role_level && (
                        <Box mt={0.5}>
                          <Chip
                            label={rel.contact_role_level}
                            size="small"
                            color={ROLE_LEVEL_COLORS[rel.contact_role_level] ?? 'default'}
                            variant="outlined"
                          />
                        </Box>
                      )}
                    </Box>
                  </Grid>

                  <Grid item xs={12} sm={3}>
                    <Box display="flex" flexDirection="column" alignItems="center" gap={1}>
                      <Chip
                        icon={<SwapHoriz />}
                        label={getRelationshipLabel(rel.relationship_type)}
                        size="small"
                        color="primary"
                        variant="outlined"
                      />
                      <Box width="100%">
                        <Typography variant="caption" color="text.secondary" display="block" textAlign="center">
                          Strength: {rel.strength}%
                        </Typography>
                        <LinearProgress
                          variant="determinate"
                          value={rel.strength}
                          color={getStrengthColor(rel.strength)}
                          sx={{ height: 6, borderRadius: 3 }}
                        />
                      </Box>
                    </Box>
                  </Grid>

                  <Grid item xs={12} sm={4}>
                    <Box>
                      <Typography variant="subtitle2">
                        {rel.related_first_name} {rel.related_last_name}
                      </Typography>
                      {rel.related_title && (
                        <Typography variant="caption" color="text.secondary">
                          {rel.related_title}
                        </Typography>
                      )}
                      {rel.related_role_level && (
                        <Box mt={0.5}>
                          <Chip
                            label={rel.related_role_level}
                            size="small"
                            color={ROLE_LEVEL_COLORS[rel.related_role_level] ?? 'default'}
                            variant="outlined"
                          />
                        </Box>
                      )}
                    </Box>
                  </Grid>

                  <Grid item xs={12} sm={1}>
                    <Box display="flex" justifyContent="flex-end">
                      <Tooltip title="Delete relationship">
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => deleteRelationship(rel.id)}
                        >
                          <DeleteOutline fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </Grid>
                </Grid>
              </CardContent>
              <Divider />
            </Card>
          ))}
        </Stack>
      )}

      <AddRelationshipDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        accountId={accountId}
        contacts={contacts}
      />
    </Box>
  );
}
