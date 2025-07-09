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

export default function SignUp() {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');    

    // Extract form data.
    const form = e.currentTarget;
    const formData = new FormData(form);
    const fullname = formData.get('name') as string;
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    
    try {
      // Call the registration API endpoint.
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ fullname, email, password }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Registration failed');
      } else {
        // Registration was successful.
        console.log('User registered successfully');
        // Optionally, you may redirect to another page (e.g., sign-in page).
      }
    } catch (err: any) {
      console.error('Error during registration:', err);
      setError(err.message || 'An unexpected error occurred.');
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
          <Typography variant="body2" color="error" align="center">
            {error}
          </Typography>
        )}

        <Box component="form" onSubmit={handleSubmit}>
          <Stack spacing={2}>
            <TextField
              id="name"
              name="name"
              label="Full Name"
              required
              placeholder="Enter your full name"
              fullWidth
            />
            <TextField
              id="email"
              name="email"
              label="Email"
              type="email"
              required
              placeholder="Enter your email"
              fullWidth
            />
            <TextField
              id="password"
              name="password"
              label="Password"
              type="password"
              required
              placeholder="Create a password"
              fullWidth
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
