import { useState, useEffect } from 'react';
import {
  Box,
  Button,
  CircularProgress,
  FormControl,
  FormControlLabel,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Switch,
  TextField,
  Typography,
  Alert,
} from '@mui/material';
import { useGetAiSettingsQuery, useUpdateAiSettingsMutation, useTestAiConnectionMutation } from '../../store/api/aiApi';

const PROVIDER_LABELS: Record<string, string> = {
  none: 'None (disabled)',
  openai: 'OpenAI',
  anthropic: 'Anthropic',
  ollama: 'Ollama (local)',
};

const DEFAULT_MODELS: Record<string, string> = {
  openai: 'gpt-4o-mini',
  anthropic: 'claude-sonnet-4-20250514',
};

export function AiSettingsTab() {
  const { data, isLoading } = useGetAiSettingsQuery();
  const [updateSettings, { isLoading: isSaving }] = useUpdateAiSettingsMutation();
  const [testConnection, { isLoading: isTesting }] = useTestAiConnectionMutation();

  const [provider, setProvider] = useState('none');
  const [apiKey, setApiKey] = useState('');
  const [modelId, setModelId] = useState('');
  const [ollamaUrl, setOllamaUrl] = useState('');
  const [ollamaModel, setOllamaModel] = useState('');
  const [isEnabled, setIsEnabled] = useState(false);
  const [saveAlert, setSaveAlert] = useState<{ severity: 'success' | 'error'; message: string } | null>(null);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  useEffect(() => {
    if (data?.data) {
      const s = data.data;
      setProvider(s.provider || 'none');
      setApiKey(s.api_key || '');
      setModelId(s.model_id || '');
      setOllamaUrl(s.ollama_url || '');
      setOllamaModel(s.ollama_model || '');
      setIsEnabled(Boolean(s.is_enabled));
    }
  }, [data]);

  const handleSave = async () => {
    setSaveAlert(null);
    try {
      await updateSettings({
        provider,
        api_key: apiKey,
        model_id: modelId || undefined,
        ollama_url: ollamaUrl || undefined,
        ollama_model: ollamaModel || undefined,
        is_enabled: isEnabled,
      }).unwrap();
      setSaveAlert({ severity: 'success', message: 'Settings saved.' });
    } catch {
      setSaveAlert({ severity: 'error', message: 'Failed to save settings.' });
    }
  };

  const handleTest = async () => {
    setTestResult(null);
    try {
      const res = await testConnection().unwrap();
      setTestResult(res.data);
    } catch {
      setTestResult({ success: false, message: 'Request failed. Check network or provider configuration.' });
    }
  };

  if (isLoading) return <CircularProgress />;

  const showApiKey = provider === 'openai' || provider === 'anthropic';
  const showOllama = provider === 'ollama';

  return (
    <Paper variant="outlined" sx={{ p: 3, maxWidth: 600 }}>
      <Typography variant="h6" mb={2}>AI Provider Configuration</Typography>
      <Typography variant="body2" color="text.secondary" mb={3}>
        Configure the AI provider used for briefing generation and sentiment analysis.
        API keys are stored securely and masked after saving.
      </Typography>

      <Box display="flex" flexDirection="column" gap={3}>
        <FormControl fullWidth>
          <InputLabel>Provider</InputLabel>
          <Select
            value={provider}
            label="Provider"
            onChange={(e) => {
              setProvider(e.target.value);
              setModelId('');
            }}
          >
            {Object.entries(PROVIDER_LABELS).map(([val, label]) => (
              <MenuItem key={val} value={val}>{label}</MenuItem>
            ))}
          </Select>
        </FormControl>

        {showApiKey && (
          <>
            <TextField
              label="API Key"
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Enter API key"
              helperText="Leave unchanged to keep the existing key."
              fullWidth
            />
            <TextField
              label="Model ID"
              value={modelId}
              onChange={(e) => setModelId(e.target.value)}
              placeholder={DEFAULT_MODELS[provider] || ''}
              helperText={`Defaults to ${DEFAULT_MODELS[provider] || 'provider default'} if left blank.`}
              fullWidth
            />
          </>
        )}

        {showOllama && (
          <>
            <TextField
              label="Server URL"
              value={ollamaUrl}
              onChange={(e) => setOllamaUrl(e.target.value)}
              placeholder="http://localhost:11434"
              fullWidth
            />
            <TextField
              label="Model Name"
              value={ollamaModel}
              onChange={(e) => setOllamaModel(e.target.value)}
              placeholder="llama3"
              helperText="Defaults to llama3 if left blank."
              fullWidth
            />
          </>
        )}

        {provider !== 'none' && (
          <FormControlLabel
            control={
              <Switch
                checked={isEnabled}
                onChange={(e) => setIsEnabled(e.target.checked)}
              />
            }
            label="Enable AI features"
          />
        )}

        {saveAlert && (
          <Alert severity={saveAlert.severity} onClose={() => setSaveAlert(null)}>
            {saveAlert.message}
          </Alert>
        )}

        {testResult && (
          <Alert severity={testResult.success ? 'success' : 'error'} onClose={() => setTestResult(null)}>
            {testResult.message}
          </Alert>
        )}

        <Box display="flex" gap={2}>
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={isSaving}
            startIcon={isSaving ? <CircularProgress size={16} /> : undefined}
          >
            Save Settings
          </Button>
          <Button
            variant="outlined"
            onClick={handleTest}
            disabled={isTesting || provider === 'none'}
            startIcon={isTesting ? <CircularProgress size={16} /> : undefined}
          >
            Test Connection
          </Button>
        </Box>
      </Box>
    </Paper>
  );
}
