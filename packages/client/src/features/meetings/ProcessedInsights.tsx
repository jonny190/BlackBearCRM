import { Box, Chip, Typography, CircularProgress, Card, CardContent } from '@mui/material';
import { useGetMeetingNoteInsightsQuery } from '../../store/api/meetingsApi';
import type { MeetingNoteStatus, ProcessedNoteType } from '@blackbear/shared';

const TYPE_CONFIG: Record<ProcessedNoteType, { label: string; color: 'primary' | 'error' | 'success' | 'warning' | 'secondary' }> = {
  action_item: { label: 'Action Item', color: 'primary' },
  concern: { label: 'Concern', color: 'error' },
  insight: { label: 'Insight', color: 'success' },
  follow_up: { label: 'Follow-up', color: 'warning' },
  sentiment: { label: 'Sentiment', color: 'secondary' },
};

interface Props {
  meetingNoteId: string;
  status: MeetingNoteStatus;
}

export function ProcessedInsights({ meetingNoteId, status }: Props) {
  const { data, isLoading } = useGetMeetingNoteInsightsQuery(meetingNoteId, {
    skip: status !== 'processed',
  });

  if (status === 'processing') {
    return (
      <Box display="flex" alignItems="center" gap={1} py={1}>
        <CircularProgress size={16} />
        <Typography variant="body2" color="text.secondary">Processing with AI...</Typography>
      </Box>
    );
  }

  if (status === 'failed') {
    return (
      <Typography variant="body2" color="error" py={1}>
        AI processing failed. Use the retry button to try again.
      </Typography>
    );
  }

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" py={1}>
        <CircularProgress size={16} />
      </Box>
    );
  }

  const insights = data?.data ?? [];
  if (insights.length === 0) return null;

  const grouped = insights.reduce<Record<string, typeof insights>>((acc, note) => {
    (acc[note.note_type] ??= []).push(note);
    return acc;
  }, {});

  return (
    <Box display="flex" flexDirection="column" gap={1} py={1}>
      {Object.entries(grouped).map(([type, notes]) => {
        const config = TYPE_CONFIG[type as ProcessedNoteType];
        return (
          <Card key={type} variant="outlined" sx={{ bgcolor: 'action.hover' }}>
            <CardContent sx={{ py: 1, '&:last-child': { pb: 1 } }}>
              <Chip label={config.label} color={config.color} size="small" sx={{ mb: 0.5 }} />
              {notes.map((n) => (
                <Typography key={n.id} variant="body2" sx={{ mt: 0.5, opacity: 0.7 + n.confidence_score * 0.3 }}>
                  {n.content}
                </Typography>
              ))}
            </CardContent>
          </Card>
        );
      })}
    </Box>
  );
}
