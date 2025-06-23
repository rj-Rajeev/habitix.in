'use client';

import {
  Box,
  Button,
  Paper,
  Stack,
  TextField,
  Typography,
  Link as MuiLink,
} from '@mui/material';
import Link from 'next/link';
import { useState } from 'react';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [isSending, setIsSending] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSending(true);

    // Simulate sending email
    setTimeout(() => {
      setIsSending(false);
      alert(`Reset link sent to ${email}`);
    }, 1500);
  };

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
      <Paper elevation={3} sx={{ maxWidth: 400, width: '100%', p: 4 }}>
        <Typography variant="h5" fontWeight={700} align="center" gutterBottom>
          Reset your password
        </Typography>
        <Typography
          variant="body2"
          color="text.secondary"
          align="center"
          sx={{ mb: 3 }}
        >
          Enter your email address and we'll send you a link to reset your password.
        </Typography>

        <Box component="form" onSubmit={handleSubmit}>
          <Stack spacing={2}>
            <TextField
              label="Email address"
              type="email"
              name="email"
              fullWidth
              required
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <Button
              type="submit"
              variant="contained"
              fullWidth
              disabled={isSending}
              size="large"
            >
              {isSending ? 'Sending...' : 'Send reset link'}
            </Button>
            <Typography variant="body2" align="center">
              <MuiLink component={Link} href="/signin" underline="hover">
                Back to sign in
              </MuiLink>
            </Typography>
          </Stack>
        </Box>
      </Paper>
    </Box>
  );
}
