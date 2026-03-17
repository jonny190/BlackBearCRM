import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Typography, Tabs, Tab, Box, Paper } from '@mui/material';
import { useGetAccountQuery } from '../../store/api/accountsApi';
import { useGetAccountHealthQuery } from '../../store/api/healthApi';
import { useGetAccountContactsQuery } from '../../store/api/contactsApi';
import { useGetTimelineQuery } from '../../store/api/accountsApi';
import { HealthBadge } from './components/HealthBadge';
import { BriefingPanel } from './components/BriefingPanel';
import { RelationshipMap } from './components/RelationshipMap';
import { LoadingState } from '../../components/common/LoadingState';

function TabPanel({ children, value, index }: { children: React.ReactNode; value: number; index: number }) {
  return value === index ? <Box py={2}>{children}</Box> : null;
}

export function AccountDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [tab, setTab] = useState(0);
  const { data: accountData, isLoading } = useGetAccountQuery(id!);
  const { data: healthData } = useGetAccountHealthQuery(id!);
  const { data: contactsData } = useGetAccountContactsQuery({ accountId: id! });
  const { data: timelineData } = useGetTimelineQuery(id!);

  if (isLoading) return <LoadingState />;
  const account = accountData?.data;
  const health = healthData?.data;

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
          <Tab label={`Contacts (${contactsData?.data?.length ?? 0})`} />
          <Tab label="Timeline" />
          <Tab label="Health" />
          <Tab label="Briefings" />
          <Tab label="Relationships" />
        </Tabs>

        <Box p={2}>
          <TabPanel value={tab} index={0}>
            <Typography variant="body1">Account overview with key metrics. Website: {account?.website ?? 'N/A'}</Typography>
          </TabPanel>

          <TabPanel value={tab} index={1}>
            {/* ContactList component will be rendered here */}
            <Typography>Contacts: {contactsData?.data?.length ?? 0}</Typography>
          </TabPanel>

          <TabPanel value={tab} index={2}>
            {/* ActivityTimeline component will be rendered here */}
            <Typography>Activities: {timelineData?.data?.length ?? 0}</Typography>
          </TabPanel>

          <TabPanel value={tab} index={3}>
            {/* HealthScoreCard + HealthTrendChart will be rendered here */}
            <Typography>Health Score: {health?.overall_score ?? 'N/A'}</Typography>
          </TabPanel>

          <TabPanel value={tab} index={4}>
            {id && <BriefingPanel accountId={id} />}
          </TabPanel>

          <TabPanel value={tab} index={5}>
            {id && <RelationshipMap accountId={id} />}
          </TabPanel>
        </Box>
      </Paper>
    </>
  );
}
