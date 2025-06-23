'use client';

import {
  Box,
  Button,
  Checkbox,
  CircularProgress,
  Divider,
  FormControlLabel,
  IconButton,
  InputAdornment,
  Paper,
  Stack,
  TextField,
  Typography,
  Alert,
  Link as MuiLink,
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  Email,
  Lock,
  GitHub,
} from '@mui/icons-material';
import { useState } from 'react';
import Link from 'next/link';
import { signIn as nextAuthSignIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function SignInForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const email = form.get('email') as string;
    const password = form.get('password') as string;

    setIsLoading(true);
    setError('');

    const res = await nextAuthSignIn('credentials', {
      email,
      password,
      redirect: false,
    });

    if (res?.ok) {
      router.push('/dashboard');
    } else {
      setError('Invalid email or password');
    }

    setIsLoading(false);
  };

  const handleOAuthSignIn = async (provider: string) => {
    setIsLoading(true);
    setError('');
    try {
      await nextAuthSignIn(provider, { callbackUrl: '/dashboard' });
    } catch (err) {
      setError(`Failed to sign in with ${provider}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#0A0A0A]">
      <Paper elevation={4} sx={{ p: 4, maxWidth: 400, width: '100%' }}>
        <Typography variant="h5" fontWeight={700} align="center" gutterBottom>
          Welcome Back
        </Typography>
        <Typography variant="body2" align="center" color="text.secondary" sx={{ mb: 2 }}>
          Sign in to your account to continue
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Stack spacing={2}>
          <Button
            variant="outlined"
            onClick={() => handleOAuthSignIn('google')}
            startIcon={<img src="/google-icon.svg" alt="Google" width={20} />}
            disabled={isLoading}
            type="button"
          >
            Continue with Google
          </Button>

          <Button
            variant="outlined"
            onClick={() => handleOAuthSignIn('github')}
            startIcon={<GitHub />}
            disabled={isLoading}
            type="button"
          >
            Continue with GitHub
          </Button>
        </Stack>

        <Divider sx={{ my: 3 }}>or</Divider>

        <Box component="form" onSubmit={handleSubmit}>
          <Stack spacing={2}>
            <TextField
              label="Email"
              name="email"
              type="email"
              required
              autoComplete="email"
              disabled={isLoading}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Email fontSize="small" />
                  </InputAdornment>
                ),
              }}
            />

            <TextField
              label="Password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              required
              autoComplete="current-password"
              disabled={isLoading}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Lock fontSize="small" />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowPassword(!showPassword)}
                      edge="end"
                      aria-label="toggle password visibility"
                      disabled={isLoading}
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <FormControlLabel
                control={
                  <Checkbox
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    disabled={isLoading}
                  />
                }
                label="Remember me"
              />
              <MuiLink component={Link} href="/forgot-password" underline="hover">
                Forgot password?
              </MuiLink>
            </Stack>

            <Button
              type="submit"
              variant="contained"
              fullWidth
              size="large"
              disabled={isLoading}
            >
              {isLoading ? <CircularProgress size={20} color="inherit" /> : 'Sign In'}
            </Button>

            <Typography variant="body2" align="center">
              Don't have an account?{' '}
              <MuiLink component={Link} href="/signup" underline="hover">
                Sign up
              </MuiLink>
            </Typography>
          </Stack>
        </Box>
      </Paper>
    </Box>
  );
}
