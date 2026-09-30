"use client";
import {
  Box,
  Container,
  Grid,
  Typography,
  Button,
} from "@mui/material";
import { Check } from "@mui/icons-material";
import Link from "next/link";

export default function Footer() {
  const footerSections = [
    {
      title: "Product",
      links: [
        { label: "Features", href: "/features" },
        { label: "Download", href: "/download" },
      ],
    },
    {
      title: "Support",
      links: [
        { label: "Privacy Policy", href: "/privacy-policy" },
      ],
    },
  ];

  return (
    <Box
      component="footer"
      sx={{
        bgcolor: "#1f2937",
        color: "white",
        py: 12,
        mt: 8,
      }}
    >
      <Container maxWidth="lg">
        <Grid container spacing={8}>
          {/* Brand Section */}
          <Grid size={{ xs: 12, md: 4 }}>
            <Box
              sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 4 }}
            >
              <Box
                sx={{
                  width: "40px",
                  height: "40px",
                  bgcolor: "#10b981",
                  borderRadius: "8px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Check sx={{ color: "white", fontSize: "24px" }} />
              </Box>
              <Typography
                variant="h5"
                component="div"
                sx={{
                  fontWeight: "700",
                  fontFamily: "system-ui, -apple-system, sans-serif",
                  fontSize: "1.5rem",
                }}
              >
                HABITIX
              </Typography>
            </Box>
            <Typography
              sx={{
                color: "#9ca3af",
                fontSize: "16px",
                lineHeight: 1.6,
                maxWidth: "300px",
                mb: 4,
              }}
            >
              Build better habits and achieve your goals with the most intuitive
              habit tracking app available today.
            </Typography>

          </Grid>

          {/* Footer Links */}
          {footerSections.map((section, index) => (
            <Grid size={{ xs: 6, sm: 6, md: 2 }} key={index}>
              <Typography
                variant="h6"
                sx={{
                  fontWeight: "700",
                  mb: 4,
                  fontSize: "18px",
                  color: "white",
                }}
              >
                {section.title}
              </Typography>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                {section.links.map((link,id) => (
                  <Button
                    {...(link.href ? { component: Link, href: link.href } : {})}
                    key={id}
                    sx={{
                      color: "#9ca3af",
                      justifyContent: "flex-start",
                      textTransform: "none",
                      p: 0,
                      fontSize: "15px",
                      transition: "color 0.2s ease",
                      "&:hover": {
                        color: "#10b981",
                        bgcolor: "transparent",
                      },
                    }}
                  >
                    {link.label}
                  </Button>
                ))}
              </Box>
            </Grid>
          ))}

        </Grid>

        {/* Bottom Section */}
        <Box
          sx={{
            borderTop: "1px solid #374151",
            mt: 12,
            pt: 8,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexDirection: { xs: "column", md: "row" },
            gap: 4,
          }}
        >
          <Typography sx={{ color: "#9ca3af", fontSize: "16px" }}>
            © 2025 HABITIX. All rights reserved.
          </Typography>
        </Box>
      </Container>
    </Box>
  );
}
