"use client";

import { useEffect, useState } from "react";
import { Box, Button, Typography, Container } from "@mui/material";
import DownloadIcon from "@mui/icons-material/Download";

export default function InstallPWA() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isPWAInstallable, setIsPWAInstallable] = useState(false);

  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
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
          Download and install our Progressive Web App to stay productive, even offline!
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
