import { Box, Typography } from '@mui/material';

export function EmptyState({ message = 'No data found' }: { message?: string }) {
  return (
    <Box display="flex" justifyContent="center" alignItems="center" py={4}>
      <Typography color="text.secondary">{message}</Typography>
    </Box>
  );
}
