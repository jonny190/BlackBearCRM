import { useState, useEffect } from 'react';
import {
  Box,
  Button,
  CircularProgress,
  Divider,
  FormControlLabel,
  Paper,
  Switch,
  TextField,
  Typography,
  Alert,
  Chip,
} from '@mui/material';
import {
  useGetIntegrationSettingsQuery,
  useUpdateIntegrationSettingsMutation,
  useGetConnectionStatusQuery,
  useConnectM365Mutation,
  useDisconnectM365Mutation,
} from '../../store/api/integrationsApi';
import { useAuth } from '../../hooks/useAuth';

export function IntegrationsTab() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  // Admin config state
  const { data: settingsData, isLoading: settingsLoading } = useGetIntegrationSettingsQuery(undefined, { skip: !isAdmin });
  const [updateSettings, { isLoading: isSaving }] = useUpdateIntegrationSettingsMutation();
  const [clientId, setClientId] = useState('');
  const [clientSecret, setClientSecret] = useState('');
  const [tenantId, setTenantId] = useState('');
  const [redirectUri, setRedirectUri] = useState('');
  const [isEnabled, setIsEnabled] = useState(false);
  const [saveAlert, setSaveAlert] = useState<{ severity: 'success' | 'error'; message: string } | null>(null);

  // User connection state
  const { data: statusData, isLoading: statusLoading } = useGetConnectionStatusQuery();
  const [connectM365, { isLoading: isConnecting }] = useConnectM365Mutation();
  const [disconnectM365, { isLoading: isDisconnecting }] = useDisconnectM365Mutation();
  const [connectError, setConnectError] = useState('');

  useEffect(() => {
    if (settingsData?.data) {
      const s = settingsData.data;
      setClientId(s.client_id || '');
      setClientSecret(s.client_secret || '');
      setTenantId(s.tenant_id || '');
      setRedirectUri(s.redirect_uri || `${window.location.origin}/api/integrations/callback`);
      setIsEnabled(Boolean(s.is_enabled));
    } else if (!settingsData && !settingsLoading) {
      setRedirectUri(`${window.location.origin}/api/integrations/callback`);
    }
  }, [settingsData, settingsLoading]);

  const handleSave = async () => {
    setSaveAlert(null);
    try {
      await updateSettings({
        client_id: clientId,
        client_secret: clientSecret,
        tenant_id: tenantId,
        redirect_uri: redirectUri,
        is_enabled: isEnabled,
      }).unwrap();
      setSaveAlert({ severity: 'success', message: 'Settings saved.' });
    } catch {
      setSaveAlert({ severity: 'error', message: 'Failed to save settings.' });
    }
  };

  const handleConnect = async () => {
    setConnectError('');
    try {
      const result = await connectM365().unwrap();
      window.location.href = result.data.auth_url;
    } catch (err: any) {
      setConnectError(err?.data?.error?.message ?? 'Failed to start connection. Check that Microsoft 365 is configured and enabled.');
    }
  };

  const handleDisconnect = async () => {
    try {
      await disconnectM365().unwrap();
    } catch {
      // Silently ignore disconnect errors
    }
  };

  const connectionStatus = statusData?.data;

  return (
    <Box display="flex" flexDirection="column" gap={3} maxWidth={600}>
      {isAdmin && (
        <Paper variant="outlined" sx={{ p: 3 }}>
          <Typography variant="h6" mb={1}>Microsoft 365 App Configuration</Typography>
          <Typography variant="body2" color="text.secondary" mb={3}>
            Register an app in the Azure Portal and enter the credentials here. All users will
            connect their own accounts using these app credentials.
          </Typography>

          {settingsLoading ? (
            <CircularProgress size={24} />
          ) : (
            <Box display="flex" flexDirection="column" gap={2.5}>
              <TextField
                label="Client ID (Application ID)"
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                fullWidth
              />
              <TextField
                label="Client Secret"
                type="password"
                value={clientSecret}
                onChange={(e) => setClientSecret(e.target.value)}
                placeholder="Enter client secret"
                helperText="Leave unchanged to keep the existing secret."
                fullWidth
              />
              <TextField
                label="Tenant ID"
                value={tenantId}
                onChange={(e) => setTenantId(e.target.value)}
                placeholder="common (or your Azure tenant ID)"
                helperText='Use "common" to allow any Microsoft account, or enter your specific tenant ID.'
                fullWidth
              />
              <TextField
                label="Redirect URI"
                value={redirectUri}
                onChange={(e) => setRedirectUri(e.target.value)}
                helperText="Register this URI in your Azure app registration under Authentication."
                fullWidth
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={isEnabled}
                    onChange={(e) => setIsEnabled(e.target.checked)}
                  />
                }
                label="Enable Microsoft 365 integration"
              />

              {saveAlert && (
                <Alert severity={saveAlert.severity} onClose={() => setSaveAlert(null)}>
                  {saveAlert.message}
                </Alert>
              )}

              <Box>
                <Button
                  variant="contained"
                  onClick={handleSave}
                  disabled={isSaving}
                  startIcon={isSaving ? <CircularProgress size={16} /> : undefined}
                >
                  Save Settings
                </Button>
              </Box>
            </Box>
          )}
        </Paper>
      )}

      <Paper variant="outlined" sx={{ p: 3 }}>
        <Typography variant="h6" mb={1}>Your Microsoft 365 Connection</Typography>
        <Typography variant="body2" color="text.secondary" mb={3}>
          Connect your Microsoft 365 account to sync emails and calendar events with the CRM.
        </Typography>

        {statusLoading ? (
          <CircularProgress size={24} />
        ) : connectionStatus?.connected ? (
          <Box display="flex" flexDirection="column" gap={2}>
            <Box display="flex" alignItems="center" gap={1.5}>
              <Chip label="Connected" color="success" size="small" />
              {connectionStatus.connected_at && (
                <Typography variant="body2" color="text.secondary">
                  Connected on {new Date(connectionStatus.connected_at).toLocaleDateString()}
                </Typography>
              )}
            </Box>

            {connectionStatus.scopes && connectionStatus.scopes.length > 0 && (
              <Box>
                <Typography variant="caption" color="text.secondary" display="block" mb={0.5}>
                  Granted permissions
                </Typography>
                <Box display="flex" flexWrap="wrap" gap={0.5}>
                  {connectionStatus.scopes.map((scope) => (
                    <Chip key={scope} label={scope} size="small" variant="outlined" />
                  ))}
                </Box>
              </Box>
            )}

            <Divider />

            <Box>
              <Button
                variant="outlined"
                color="error"
                onClick={handleDisconnect}
                disabled={isDisconnecting}
                startIcon={isDisconnecting ? <CircularProgress size={16} /> : undefined}
              >
                Disconnect
              </Button>
            </Box>
          </Box>
        ) : (
          <Box display="flex" flexDirection="column" gap={2}>
            <Typography variant="body2">
              You have not connected your Microsoft 365 account yet.
            </Typography>

            {connectError && (
              <Alert severity="error" onClose={() => setConnectError('')}>
                {connectError}
              </Alert>
            )}

            <Box>
              <Button
                variant="contained"
                onClick={handleConnect}
                disabled={isConnecting}
                startIcon={isConnecting ? <CircularProgress size={16} /> : undefined}
              >
                Connect Microsoft 365
              </Button>
            </Box>
          </Box>
        )}
      </Paper>
    </Box>
  );
}
