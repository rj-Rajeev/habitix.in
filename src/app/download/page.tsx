"use client";

import { useEffect, useState } from "react";
import { Box, Button, Typography, Container } from "@mui/material";
import DownloadIcon from "@mui/icons-material/Download";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

export default function InstallPWA() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isPWAInstallable, setIsPWAInstallable] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setIsPWAInstallable(true);
    };

    window.addEventListener("beforeinstallprompt", handler);

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      console.log("PWA installed");
    }
    setDeferredPrompt(null);
    setIsPWAInstallable(false);
  };

  return (
    <Box className="min-h-screen flex items-center justify-center bg-gradient-to-br from-white to-green-50">
      <Container maxWidth="sm" className="text-center">
        <Typography variant="h3" className="font-bold mb-4 text-green-700">
          Install Habitix
        </Typography>
        <Typography variant="body1" className="mb-6 text-gray-600">
          Install Habitix as a Progressive Web App for a convenient app-like experience on your device.
        </Typography>

        {isPWAInstallable ? (
          <Button
            variant="contained"
            startIcon={<DownloadIcon />}
            onClick={handleInstallClick}
            color="success"
          >
            Install Habitix
          </Button>
        ) : (
          <Typography variant="body2" className="text-gray-500">
            App is already installed or not available for install on this device.
          </Typography>
        )}
      </Container>
    </Box>
  );
}
