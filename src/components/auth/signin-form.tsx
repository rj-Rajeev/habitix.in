// Redesigned Sign-In Page with Custom SVG Theme and Enhanced UX
"use client";

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
} from "@mui/material";
import {
  Visibility,
  VisibilityOff,
  Email,
  Lock,
  GitHub,
  Google,
} from "@mui/icons-material";
import { useState } from "react";
import Link from "next/link";
import { signIn as nextAuthSignIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function SignInForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const email = form.get("email") as string;
    const password = form.get("password") as string;

    setIsLoading(true);
    setError("");

    const res = await nextAuthSignIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (res?.ok) {
      router.push("/dashboard");
    } else {
      setError("Invalid email or password");
    }

    setIsLoading(false);
  };

  const handleOAuthSignIn = async (provider: string) => {
    setIsLoading(true);
    setError("");
    try {
      await nextAuthSignIn(provider, { callbackUrl: "/dashboard" });
    } catch (err) {
      setError(`Failed to sign in with ${provider}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#fdf4ff] to-[#f0f4ff] dark:from-[#0a0a0a] dark:to-[#111111] relative overflow-hidden">
      {/* Decorative SVG Blob */}
      <Box className="absolute inset-0 w-full h-full -z-10">
        <img
          src="/your-theme-blob.svg"
          alt="background blob"
          className="w-full h-full object-cover opacity-20 dark:opacity-10"
        />
      </Box>

      <Paper
        elevation={3}
        className="backdrop-blur-md bg-white/80 dark:bg-[#1a1a1a]/80 rounded-2xl p-6 sm:p-10 w-full max-w-md shadow-xl"
      >
        <Typography variant="h4" fontWeight={700} align="center" gutterBottom>
          🚀 Welcome Back
        </Typography>
        <Typography
          variant="body1"
          align="center"
          color="text.secondary"
          className="mb-4"
        >
          Sign in to continue your journey
        </Typography>

        {error && (
          <Alert severity="error" className="mb-3">
            {error}
          </Alert>
        )}

        <Stack spacing={2}>
          <Button
            variant="outlined"
            onClick={() => handleOAuthSignIn("google")}
            startIcon={<Google />}
            disabled={isLoading}
            className="rounded-xl text-sm"
          >
            Continue with Google
          </Button>

          <Button
            variant="outlined"
            onClick={() => handleOAuthSignIn("github")}
            startIcon={<GitHub />}
            disabled={isLoading}
            className="rounded-xl text-sm"
          >
            Continue with GitHub
          </Button>
        </Stack>

        <Divider className="my-6 text-gray-400 text-xs">
          or sign in with email
        </Divider>

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
              type={showPassword ? "text" : "password"}
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
                      disabled={isLoading}
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            <Stack
              direction="row"
              justifyContent="space-between"
              alignItems="center"
            >
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
              <MuiLink
                component={Link}
                href="/forgot-password"
                underline="hover"
              >
                Forgot password?
              </MuiLink>
            </Stack>

            <Button
              type="submit"
              variant="contained"
              size="large"
              fullWidth
              disabled={isLoading}
              className="rounded-xl"
            >
              {isLoading ? (
                <CircularProgress size={20} color="inherit" />
              ) : (
                "Sign In"
              )}
            </Button>

            <Typography variant="body2" align="center">
              Don’t have an account?{" "}
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
