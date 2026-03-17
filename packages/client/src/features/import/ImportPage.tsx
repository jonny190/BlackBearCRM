import { useState, useRef } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Stepper,
  Step,
  StepLabel,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Stack,
  Divider,
  CircularProgress,
  Paper,
} from '@mui/material';
import { CloudUpload, Download, CheckCircle } from '@mui/icons-material';
import { useSelector } from 'react-redux';
import type { RootState } from '../../store/store';

const STEPS = ['Select file', 'Validate', 'Confirm import'];

type ImportType = 'accounts' | 'contacts';

interface ValidationResult {
  total: number;
  valid: number;
  invalid: number;
  errors: Array<{ row: number; errors: Record<string, string[]> }>;
  validRows: any[];
}

export function ImportPage() {
  const accessToken = useSelector((state: RootState) => state.auth.accessToken);
  const apiBase = import.meta.env.VITE_API_URL || '/api';

  const [step, setStep] = useState(0);
  const [importType, setImportType] = useState<ImportType>('accounts');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [importedCount, setImportedCount] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setSelectedFile(file);
    setError('');
  };

  const handleValidate = async () => {
    if (!selectedFile) {
      setError('Please select a CSV file to upload.');
      return;
    }
    setIsLoading(true);
    setError('');
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      const response = await fetch(`${apiBase}/import/${importType}/validate`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}` },
        body: formData,
      });
      const json = await response.json();
      if (!response.ok) {
        throw new Error(json?.error?.message ?? 'Validation failed');
      }
      setValidationResult(json.data);
      setStep(2);
    } catch (err: any) {
      setError(err.message ?? 'Validation failed. Please check your file and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirm = async () => {
    if (!validationResult || validationResult.valid === 0) return;
    setIsLoading(true);
    setError('');
    try {
      const response = await fetch(`${apiBase}/import/${importType}/confirm`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ validRows: validationResult.validRows }),
      });
      const json = await response.json();
      if (!response.ok) {
        throw new Error(json?.error?.message ?? 'Import failed');
      }
      setImportedCount(json.data.imported);
      setStep(3);
    } catch (err: any) {
      setError(err.message ?? 'Import failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setStep(0);
    setSelectedFile(null);
    setValidationResult(null);
    setImportedCount(null);
    setError('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDownloadTemplate = (type: ImportType) => {
    const link = document.createElement('a');
    link.href = `${apiBase}/import/template/${type}`;
    link.setAttribute('download', `${type}-template.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5">Import Data</Typography>
        <Stack direction="row" spacing={1}>
          <Button
            size="small"
            variant="outlined"
            startIcon={<Download />}
            onClick={() => handleDownloadTemplate('accounts')}
          >
            Accounts template
          </Button>
          <Button
            size="small"
            variant="outlined"
            startIcon={<Download />}
            onClick={() => handleDownloadTemplate('contacts')}
          >
            Contacts template
          </Button>
        </Stack>
      </Box>

      <Card>
        <CardContent>
          <Stepper activeStep={step < 3 ? step : 2} sx={{ mb: 4 }}>
            {STEPS.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>

          {/* Success state */}
          {step === 3 && (
            <Box display="flex" flexDirection="column" alignItems="center" py={4} gap={2}>
              <CheckCircle color="success" sx={{ fontSize: 64 }} />
              <Typography variant="h6">Import complete</Typography>
              <Typography color="text.secondary">
                Successfully imported {importedCount} {importType}.
              </Typography>
              <Button variant="contained" onClick={handleReset}>
                Import more
              </Button>
            </Box>
          )}

          {/* Step 0: Select type and file */}
          {step === 0 && (
            <Stack spacing={3} maxWidth={480}>
              {error && <Alert severity="error">{error}</Alert>}

              <FormControl fullWidth>
                <InputLabel>Import type</InputLabel>
                <Select
                  label="Import type"
                  value={importType}
                  onChange={(e) => setImportType(e.target.value as ImportType)}
                >
                  <MenuItem value="accounts">Accounts</MenuItem>
                  <MenuItem value="contacts">Contacts</MenuItem>
                </Select>
              </FormControl>

              <Box>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  style={{ display: 'none' }}
                  onChange={handleFileChange}
                  id="csv-file-input"
                />
                <label htmlFor="csv-file-input">
                  <Paper
                    variant="outlined"
                    sx={{
                      p: 4,
                      textAlign: 'center',
                      cursor: 'pointer',
                      borderStyle: 'dashed',
                      borderColor: selectedFile ? 'primary.main' : 'divider',
                      bgcolor: selectedFile ? 'action.selected' : 'background.paper',
                      '&:hover': { bgcolor: 'action.hover' },
                    }}
                  >
                    <CloudUpload sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
                    <Typography variant="body1">
                      {selectedFile ? selectedFile.name : 'Click to select a CSV file'}
                    </Typography>
                    {selectedFile && (
                      <Typography variant="caption" color="text.secondary">
                        {(selectedFile.size / 1024).toFixed(1)} KB
                      </Typography>
                    )}
                  </Paper>
                </label>
              </Box>

              <Box display="flex" gap={2}>
                <Button
                  variant="contained"
                  onClick={() => setStep(1)}
                  disabled={!selectedFile}
                >
                  Next
                </Button>
              </Box>
            </Stack>
          )}

          {/* Step 1: Validate */}
          {step === 1 && (
            <Stack spacing={3} maxWidth={480}>
              {error && <Alert severity="error">{error}</Alert>}

              <Box>
                <Typography variant="body1" gutterBottom>
                  Ready to validate <strong>{selectedFile?.name}</strong> as <strong>{importType}</strong>.
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  The file will be checked for required fields and data format before importing.
                </Typography>
              </Box>

              <Box display="flex" gap={2}>
                <Button variant="outlined" onClick={() => setStep(0)} disabled={isLoading}>
                  Back
                </Button>
                <Button
                  variant="contained"
                  onClick={handleValidate}
                  disabled={isLoading}
                  startIcon={isLoading ? <CircularProgress size={16} /> : undefined}
                >
                  {isLoading ? 'Validating...' : 'Validate file'}
                </Button>
              </Box>
            </Stack>
          )}

          {/* Step 2: Show validation results and confirm */}
          {step === 2 && validationResult && (
            <Stack spacing={3}>
              {error && <Alert severity="error">{error}</Alert>}

              <Stack direction="row" spacing={2} flexWrap="wrap">
                <Chip label={`Total rows: ${validationResult.total}`} variant="outlined" />
                <Chip label={`Valid: ${validationResult.valid}`} color="success" />
                {validationResult.invalid > 0 && (
                  <Chip label={`Invalid: ${validationResult.invalid}`} color="error" />
                )}
              </Stack>

              {validationResult.invalid > 0 && (
                <Box>
                  <Typography variant="subtitle2" gutterBottom color="error">
                    Rows with errors (these will not be imported):
                  </Typography>
                  <TableContainer sx={{ maxHeight: 300 }}>
                    <Table size="small" stickyHeader>
                      <TableHead>
                        <TableRow>
                          <TableCell>Row</TableCell>
                          <TableCell>Errors</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {validationResult.errors.map((e) => (
                          <TableRow key={e.row}>
                            <TableCell>{e.row}</TableCell>
                            <TableCell>
                              {Object.entries(e.errors).map(([field, msgs]) => (
                                <Typography key={field} variant="caption" display="block">
                                  <strong>{field}:</strong> {(msgs as string[]).join(', ')}
                                </Typography>
                              ))}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Box>
              )}

              <Divider />

              {validationResult.valid === 0 ? (
                <Alert severity="error">
                  No valid rows found. Please fix the errors in your file and try again.
                </Alert>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  {validationResult.valid} row{validationResult.valid !== 1 ? 's' : ''} will be imported.
                  {validationResult.invalid > 0 && ` ${validationResult.invalid} invalid row${validationResult.invalid !== 1 ? 's' : ''} will be skipped.`}
                </Typography>
              )}

              <Box display="flex" gap={2}>
                <Button variant="outlined" onClick={handleReset} disabled={isLoading}>
                  Start over
                </Button>
                <Button
                  variant="contained"
                  color="success"
                  onClick={handleConfirm}
                  disabled={isLoading || validationResult.valid === 0}
                  startIcon={isLoading ? <CircularProgress size={16} /> : undefined}
                >
                  {isLoading ? 'Importing...' : `Import ${validationResult.valid} row${validationResult.valid !== 1 ? 's' : ''}`}
                </Button>
              </Box>
            </Stack>
          )}
        </CardContent>
      </Card>
    </>
  );
}
