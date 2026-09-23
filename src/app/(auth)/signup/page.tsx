'use client';

import {
  Box,
  Button,
  Paper,
  Stack,
  TextField,
  Typography,
  Link as MuiLink,
  Alert,
} from '@mui/material';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function SignUp() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const form = e.currentTarget;
    const formData = new FormData(form);
    const fullname = String(formData.get('fullname') ?? '').trim();
    const email = String(formData.get('email') ?? '').trim().toLowerCase();
    const password = String(formData.get('password') ?? '');

    if (!fullname || !email || !password) {
      setError('Please enter your full name, email, and password.');
      setSuccess('');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      setSuccess('');
      return;
    }

    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ fullname, email, password }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data?.error || 'Registration failed. Please try again.');
        return;
      }

      setSuccess('Account created successfully. Redirecting to sign in...');
      window.setTimeout(() => {
        router.push('/signin');
      }, 900);
    } catch {
      setError('Unable to create your account right now. Please try again.');
    } finally {
      setIsLoading(false);
    }
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
          Create an account
        </Typography>
        <Typography
          variant="body2"
          color="text.secondary"
          align="center"
          sx={{ mb: 3 }}
        >
          Enter your information to get started
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {success}
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit} noValidate>
          <Stack spacing={2}>
            <TextField
              id="fullname"
              name="fullname"
              label="Full Name"
              required
              placeholder="Enter your full name"
              autoComplete="name"
              fullWidth
              disabled={isLoading}
            />
            <TextField
              id="email"
              name="email"
              label="Email"
              type="email"
              required
              placeholder="Enter your email"
              autoComplete="email"
              fullWidth
              disabled={isLoading}
            />
            <TextField
              id="password"
              name="password"
              label="Password"
              type="password"
              required
              placeholder="Create a password"
              autoComplete="new-password"
              fullWidth
              disabled={isLoading}
            />
            <Button
              type="submit"
              variant="contained"
              fullWidth
              size="large"
              disabled={isLoading}
            >
              {isLoading ? 'Creating account...' : 'Create Account'}
            </Button>
            <Typography variant="body2" align="center">
              Already have an account?{' '}
              <MuiLink component={Link} href="/signin" underline="hover">
                Sign in
              </MuiLink>
            </Typography>
          </Stack>
        </Box>
      </Paper>
    </Box>
  );
}
