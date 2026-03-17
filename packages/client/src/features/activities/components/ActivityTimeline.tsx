import { Timeline, TimelineItem, TimelineSeparator, TimelineConnector, TimelineContent, TimelineDot } from '@mui/lab';
import { Typography, Box, Button } from '@mui/material';
import { Email, Phone, Event, Note, Description, FollowTheSigns, Add } from '@mui/icons-material';

const TYPE_ICONS: Record<string, React.ReactElement> = {
  meeting: <Event />, email: <Email />, call: <Phone />,
  note: <Note />, proposal: <Description />, follow_up: <FollowTheSigns />,
};

interface Props {
  activities: any[];
  onAdd: () => void;
}

export function ActivityTimeline({ activities, onAdd }: Props) {
  return (
    <>
      <Box display="flex" justifyContent="flex-end" mb={1}>
        <Button startIcon={<Add />} variant="outlined" size="small" onClick={onAdd}>Log Activity</Button>
      </Box>
      <Timeline position="right" sx={{ p: 0 }}>
        {activities.map((a) => (
          <TimelineItem key={a.id}>
            <TimelineSeparator>
              <TimelineDot color="primary">{TYPE_ICONS[a.type] ?? <Note />}</TimelineDot>
              <TimelineConnector />
            </TimelineSeparator>
            <TimelineContent>
              <Typography variant="subtitle2">{a.title}</Typography>
              <Typography variant="caption" color="text.secondary">
                {a.type} | {new Date(a.occurred_at).toLocaleDateString()}
              </Typography>
              {a.description && <Typography variant="body2" mt={0.5}>{a.description}</Typography>}
            </TimelineContent>
          </TimelineItem>
        ))}
      </Timeline>
    </>
  );
}
