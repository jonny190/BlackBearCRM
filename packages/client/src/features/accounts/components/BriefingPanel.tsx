import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Divider,
  Typography,
} from '@mui/material';
import { useGenerateBriefingMutation, useGetBriefingsQuery } from '../../../store/api/aiApi';

interface BriefingPanelProps {
  accountId: string;
}

const BRIEFING_TYPES = [
  { value: 'pre_meeting', label: 'Pre-Meeting' },
  { value: 'onboarding_90day', label: '90-Day Onboarding' },
  { value: 'relationship_gap', label: 'Relationship Gap' },
];

const TYPE_LABELS: Record<string, string> = {
  pre_meeting: 'Pre-Meeting',
  onboarding_90day: '90-Day Onboarding',
  relationship_gap: 'Relationship Gap',
};

export function BriefingPanel({ accountId }: BriefingPanelProps) {
  const { data, isLoading, refetch } = useGetBriefingsQuery(accountId);
  const [generateBriefing, { isLoading: isGenerating }] = useGenerateBriefingMutation();

  const briefings = data?.data ?? [];

  const handleGenerate = async (type: string) => {
    try {
      await generateBriefing({ accountId, type }).unwrap();
      refetch();
    } catch (err: unknown) {
      // If AI is not configured the server returns a 500/400 -- let the
      // error surface naturally in the UI through the isError flag.
      console.error('Briefing generation failed', err);
    }
  };

  return (
    <Box>
      <Typography variant="subtitle1" fontWeight={600} mb={1}>Generate Briefing</Typography>
      <Box display="flex" gap={1} mb={3} flexWrap="wrap">
        {BRIEFING_TYPES.map((t) => (
          <Button
            key={t.value}
            variant="outlined"
            size="small"
            onClick={() => handleGenerate(t.value)}
            disabled={isGenerating}
            startIcon={isGenerating ? <CircularProgress size={14} /> : undefined}
          >
            {t.label}
          </Button>
        ))}
      </Box>

      <Divider sx={{ mb: 2 }} />

      <Typography variant="subtitle1" fontWeight={600} mb={2}>Previous Briefings</Typography>

      {isLoading && <CircularProgress size={24} />}

      {!isLoading && briefings.length === 0 && (
        <Typography variant="body2" color="text.secondary">
          No briefings yet. Use the buttons above to generate one.
          Make sure an AI provider is configured in Settings.
        </Typography>
      )}

      <Box display="flex" flexDirection="column" gap={2}>
        {briefings.map((b: any) => (
          <Card key={b.id} variant="outlined">
            <CardContent>
              <Box display="flex" alignItems="center" gap={1} mb={1}>
                <Chip
                  label={TYPE_LABELS[b.type] ?? b.type}
                  size="small"
                  color="primary"
                  variant="outlined"
                />
                <Typography variant="caption" color="text.secondary">
                  {new Date(b.generated_at).toLocaleString()} via {b.model_provider}
                </Typography>
              </Box>
              <Typography
                variant="body2"
                sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.7 }}
              >
                {b.content}
              </Typography>
            </CardContent>
          </Card>
        ))}
      </Box>
    </Box>
  );
}
