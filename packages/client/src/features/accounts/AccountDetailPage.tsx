import { useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  Typography, Tabs, Tab, Box, Paper, Grid, Card, CardContent,
  Chip, Divider, Link,
} from '@mui/material';
import { useGetAccountQuery, useGetTimelineQuery } from '../../store/api/accountsApi';
import { useGetAccountHealthQuery, useGetHealthHistoryQuery } from '../../store/api/healthApi';
import {
  useGetAccountContactsQuery,
  useCreateContactMutation,
  useUpdateContactMutation,
  useDeleteContactMutation,
} from '../../store/api/contactsApi';
import { useCreateActivityMutation } from '../../store/api/activitiesApi';
import { HealthBadge } from './components/HealthBadge';
import { BriefingPanel } from './components/BriefingPanel';
import { RelationshipMap } from './components/RelationshipMap';
import { ContactList } from '../contacts/components/ContactList';
import { ContactForm } from '../contacts/components/ContactForm';
import { ActivityTimeline } from '../activities/components/ActivityTimeline';
import { ActivityForm } from '../activities/components/ActivityForm';
import { HealthScoreCard } from '../health/components/HealthScoreCard';
import { HealthTrendChart } from '../health/components/HealthTrendChart';
import { LoadingState } from '../../components/common/LoadingState';
import { MeetingNotesList } from '../meetings/MeetingNotesList';
import { MeetingNotesForm } from '../meetings/MeetingNotesForm';
import {
  useGetMeetingNotesQuery,
  useCreateMeetingNoteMutation,
  useUpdateMeetingNoteMutation,
  useDeleteMeetingNoteMutation,
  useProcessMeetingNoteMutation,
} from '../../store/api/meetingsApi';
import type { Contact } from '@blackpear/shared';
import type { MeetingNote } from '@blackpear/shared';

function TabPanel({ children, value, index }: { children: React.ReactNode; value: number; index: number }) {
  return value === index ? <Box py={2}>{children}</Box> : null;
}

const TIER_COLOR: Record<string, 'default' | 'primary' | 'secondary' | 'warning' | 'success' | 'error'> = {
  enterprise: 'error',
  strategic: 'secondary',
  standard: 'primary',
  trial: 'default',
};

const STATUS_COLOR: Record<string, 'default' | 'success' | 'warning' | 'error'> = {
  active: 'success',
  inactive: 'warning',
  churned: 'error',
  prospect: 'default',
};

export function AccountDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [tab, setTab] = useState(0);

  // Contact dialog state
  const [contactFormOpen, setContactFormOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);

  // Activity dialog state
  const [activityFormOpen, setActivityFormOpen] = useState(false);

  // Meeting notes dialog state
  const [meetingFormOpen, setMeetingFormOpen] = useState(false);
  const [editingMeeting, setEditingMeeting] = useState<MeetingNote | null>(null);

  // Data queries
  const { data: accountData, isLoading } = useGetAccountQuery(id!);
  const { data: healthData } = useGetAccountHealthQuery(id!);
  const { data: contactsData } = useGetAccountContactsQuery({ accountId: id! });
  const { data: timelineData } = useGetTimelineQuery(id!);
  const { data: healthHistoryData } = useGetHealthHistoryQuery(id!);
  const { data: meetingNotesData } = useGetMeetingNotesQuery({ accountId: id! });

  // Mutations
  const [createContact, { isLoading: creatingContact }] = useCreateContactMutation();
  const [updateContact, { isLoading: updatingContact }] = useUpdateContactMutation();
  const [deleteContact] = useDeleteContactMutation();
  const [createActivity, { isLoading: creatingActivity }] = useCreateActivityMutation();
  const [createMeetingNote, { isLoading: creatingMeeting }] = useCreateMeetingNoteMutation();
  const [updateMeetingNote, { isLoading: updatingMeeting }] = useUpdateMeetingNoteMutation();
  const [deleteMeetingNote] = useDeleteMeetingNoteMutation();
  const [processMeetingNote] = useProcessMeetingNoteMutation();

  if (isLoading) return <LoadingState />;

  const account = accountData?.data;
  const health = healthData?.data;
  const contacts = contactsData?.data ?? [];
  const activities = timelineData?.data ?? [];
  const meetingNotes = meetingNotesData?.data ?? [];
  const healthHistory = healthHistoryData?.data ?? [];

  // Contact handlers
  const handleAddContact = () => {
    setEditingContact(null);
    setContactFormOpen(true);
  };

  const handleEditContact = (contact: Contact) => {
    setEditingContact(contact);
    setContactFormOpen(true);
  };

  const handleContactSubmit = async (data: any) => {
    if (editingContact) {
      await updateContact({ id: editingContact.id, data });
    } else {
      await createContact({ accountId: id!, data });
    }
    setContactFormOpen(false);
    setEditingContact(null);
  };

  const handleDeleteContact = async (contactId: string) => {
    await deleteContact(contactId);
  };

  // Activity handlers
  const handleActivitySubmit = async (data: any) => {
    await createActivity(data);
    setActivityFormOpen(false);
  };

  // Meeting note handlers
  const handleAddMeeting = () => {
    setEditingMeeting(null);
    setMeetingFormOpen(true);
  };

  const handleEditMeeting = (note: MeetingNote) => {
    setEditingMeeting(note);
    setMeetingFormOpen(true);
  };

  const handleMeetingSubmit = async (data: any) => {
    if (editingMeeting) {
      await updateMeetingNote({ id: editingMeeting.id, data });
    } else {
      await createMeetingNote({ accountId: id!, data });
    }
    setMeetingFormOpen(false);
    setEditingMeeting(null);
  };

  const handleDeleteMeeting = async (meetingId: string) => {
    await deleteMeetingNote(meetingId);
  };

  const handleReprocessMeeting = async (meetingId: string) => {
    await processMeetingNote(meetingId);
  };

  return (
    <>
      <Box display="flex" alignItems="center" gap={2} mb={2}>
        <Typography variant="h5">{account?.name}</Typography>
        {health && <HealthBadge score={health.overall_score} color={health.color} trend={health.trend} />}
      </Box>
      <Typography variant="body2" color="text.secondary" mb={2}>
        {account?.industry} | {account?.tier} | {account?.status}
      </Typography>

      <Paper>
        <Tabs value={tab} onChange={(_e, v) => setTab(v)}>
          <Tab label="Overview" />
          <Tab label={`Contacts (${contacts.length})`} />
          <Tab label="Timeline" />
          <Tab label="Health" />
          <Tab label="Briefings" />
          <Tab label="Relationships" />
          <Tab label={`Meeting Notes (${meetingNotes.length})`} />
        </Tabs>

        <Box p={2}>
          {/* Overview Tab */}
          <TabPanel value={tab} index={0}>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="overline" color="text.secondary">Account Details</Typography>
                    <Divider sx={{ my: 1 }} />
                    <Box display="flex" flexDirection="column" gap={1.5} mt={1}>
                      <Box display="flex" justifyContent="space-between" alignItems="center">
                        <Typography variant="body2" color="text.secondary">Industry</Typography>
                        <Typography variant="body2">{account?.industry ?? 'N/A'}</Typography>
                      </Box>
                      <Box display="flex" justifyContent="space-between" alignItems="center">
                        <Typography variant="body2" color="text.secondary">Tier</Typography>
                        <Chip
                          label={account?.tier ?? 'N/A'}
                          size="small"
                          color={TIER_COLOR[account?.tier ?? ''] ?? 'default'}
                        />
                      </Box>
                      <Box display="flex" justifyContent="space-between" alignItems="center">
                        <Typography variant="body2" color="text.secondary">Status</Typography>
                        <Chip
                          label={account?.status ?? 'N/A'}
                          size="small"
                          color={STATUS_COLOR[account?.status ?? ''] ?? 'default'}
                        />
                      </Box>
                      <Box display="flex" justifyContent="space-between" alignItems="center">
                        <Typography variant="body2" color="text.secondary">Website</Typography>
                        {account?.website ? (
                          <Link href={account.website} target="_blank" rel="noopener" variant="body2">
                            {account.website}
                          </Link>
                        ) : (
                          <Typography variant="body2">N/A</Typography>
                        )}
                      </Box>
                      <Box display="flex" justifyContent="space-between" alignItems="center">
                        <Typography variant="body2" color="text.secondary">Created</Typography>
                        <Typography variant="body2">
                          {account?.created_at ? new Date(account.created_at).toLocaleDateString() : 'N/A'}
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} md={6}>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Card variant="outlined" sx={{ textAlign: 'center' }}>
                      <CardContent>
                        <Typography variant="h3" color="primary">{contacts.length}</Typography>
                        <Typography variant="body2" color="text.secondary">Contacts</Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={6}>
                    <Card variant="outlined" sx={{ textAlign: 'center' }}>
                      <CardContent>
                        <Typography variant="h3" color="secondary">{activities.length}</Typography>
                        <Typography variant="body2" color="text.secondary">Activities</Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  {health && (
                    <Grid item xs={12}>
                      <HealthScoreCard
                        score={health.overall_score}
                        color={health.color}
                        trend={health.trend}
                      />
                    </Grid>
                  )}
                </Grid>
              </Grid>
            </Grid>
          </TabPanel>

          {/* Contacts Tab */}
          <TabPanel value={tab} index={1}>
            <ContactList
              contacts={contacts}
              onAdd={handleAddContact}
              onEdit={handleEditContact}
              onDelete={handleDeleteContact}
            />
            <ContactForm
              open={contactFormOpen}
              onClose={() => { setContactFormOpen(false); setEditingContact(null); }}
              onSubmit={handleContactSubmit}
              defaultValues={editingContact ?? undefined}
              isLoading={creatingContact || updatingContact}
            />
          </TabPanel>

          {/* Timeline Tab */}
          <TabPanel value={tab} index={2}>
            <ActivityTimeline
              activities={[...activities].sort(
                (a, b) => new Date(b.occurred_at).getTime() - new Date(a.occurred_at).getTime()
              )}
              onAdd={() => setActivityFormOpen(true)}
            />
            {id && (
              <ActivityForm
                open={activityFormOpen}
                onClose={() => setActivityFormOpen(false)}
                onSubmit={handleActivitySubmit}
                accountId={id}
                isLoading={creatingActivity}
              />
            )}
          </TabPanel>

          {/* Health Tab */}
          <TabPanel value={tab} index={3}>
            <Grid container spacing={2}>
              {health && (
                <Grid item xs={12} md={4}>
                  <HealthScoreCard
                    score={health.overall_score}
                    color={health.color}
                    trend={health.trend}
                  />
                </Grid>
              )}
              <Grid item xs={12} md={health ? 8 : 12}>
                {healthHistory.length > 0 ? (
                  <HealthTrendChart history={healthHistory} />
                ) : (
                  <Card variant="outlined">
                    <CardContent>
                      <Typography color="text.secondary" textAlign="center">
                        No health history available yet.
                      </Typography>
                    </CardContent>
                  </Card>
                )}
              </Grid>
            </Grid>
          </TabPanel>

          {/* Briefings Tab */}
          <TabPanel value={tab} index={4}>
            {id && <BriefingPanel accountId={id} />}
          </TabPanel>

          {/* Relationships Tab */}
          <TabPanel value={tab} index={5}>
            {id && <RelationshipMap accountId={id} />}
          </TabPanel>

          {/* Meeting Notes Tab */}
          <TabPanel value={tab} index={6}>
            <MeetingNotesList
              notes={meetingNotes}
              onAdd={handleAddMeeting}
              onEdit={handleEditMeeting}
              onDelete={handleDeleteMeeting}
              onReprocess={handleReprocessMeeting}
            />
            <MeetingNotesForm
              open={meetingFormOpen}
              onClose={() => { setMeetingFormOpen(false); setEditingMeeting(null); }}
              onSubmit={handleMeetingSubmit}
              defaultValues={editingMeeting ?? undefined}
              contacts={contacts}
              isLoading={creatingMeeting || updatingMeeting}
            />
          </TabPanel>
        </Box>
      </Paper>
    </>
  );
}
