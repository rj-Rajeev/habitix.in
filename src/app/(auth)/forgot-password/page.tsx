'use client';

import {
  Box,
  Button,
  Paper,
  Stack,
  Typography,
  Link as MuiLink,
  Alert,
} from '@mui/material';
import Link from 'next/link';

export default function ForgotPassword() {
  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'background.default',
        px: 2,
      }}
    >
      <Paper elevation={3} sx={{ maxWidth: 420, width: '100%', p: 4 }}>
        <Typography variant="h5" fontWeight={700} align="center" gutterBottom>
          Password reset is coming soon
        </Typography>

        <Alert severity="info" sx={{ mb: 2 }}>
          This feature is not available in V1 yet.
        </Alert>

        <Typography variant="body2" color="text.secondary" align="center" sx={{ mb: 3 }}>
          Password reset will be available in a future update.
        </Typography>

        <Stack spacing={2}>
          <Button component={Link} href="/signin" variant="contained" size="large">
            Back to sign in
          </Button>
        </Stack>
      </Paper>
    </Box>
  );
}
