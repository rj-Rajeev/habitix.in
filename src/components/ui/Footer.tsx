"use client";
import type React from "react";
import {
  Box,
  Container,
  Grid,
  Typography,
  Button,
  IconButton,
  TextField,
  InputAdornment,
} from "@mui/material";
import {
  Check,
  Send,
  Facebook,
  Twitter,
  Instagram,
  LinkedIn,
} from "@mui/icons-material";
import Link from "next/link";

export default function Footer() {
  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle newsletter subscription
    console.log("Newsletter subscription");
  };

  const footerSections = [
    {
      title: "Product",
      links: ["Features", "Download", "Integrations", "API"],
    },
    {
      title: "Company",
      links: ["About", "Blog", "Careers", "Press"],
    },
    {
      title: "Support",
      links: ["Help Center", "Contact", "Privacy Policy", "Terms of Service"],
    },
  ];

  const socialLinks = [
    { icon: <Facebook />, href: "#", label: "Facebook" },
    { icon: <Twitter />, href: "#", label: "Twitter" },
    { icon: <Instagram />, href: "#", label: "Instagram" },
    { icon: <LinkedIn />, href: "#", label: "LinkedIn" },
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

            {/* Newsletter Signup */}
            <Box component="form" onSubmit={handleNewsletterSubmit}>
              <Typography
                variant="h6"
                sx={{
                  fontWeight: "600",
                  mb: 2,
                  fontSize: "16px",
                  color: "white",
                }}
              >
                Stay Updated
              </Typography>
              <TextField
                placeholder="Enter your email"
                variant="outlined"
                size="small"
                fullWidth
                sx={{
                  mb: 2,
                  "& .MuiOutlinedInput-root": {
                    bgcolor: "#374151",
                    borderRadius: "8px",
                    "& fieldset": {
                      borderColor: "#4b5563",
                    },
                    "&:hover fieldset": {
                      borderColor: "#6b7280",
                    },
                    "&.Mui-focused fieldset": {
                      borderColor: "#10b981",
                    },
                    "& input": {
                      color: "white",
                      "&::placeholder": {
                        color: "#9ca3af",
                      },
                    },
                  },
                }}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        type="submit"
                        sx={{
                          color: "#10b981",
                          "&:hover": {
                            bgcolor: "rgba(16, 185, 129, 0.1)",
                          },
                        }}
                      >
                        <Send fontSize="small" />
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
            </Box>
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
                {section.links.map((link) => (
                  <Button
                    key={link}
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
                    {link}
                  </Button>
                ))}
              </Box>
            </Grid>
          ))}

          {/* Social Links */}
          <Grid size={{ xs: 12, md: 2 }}>
            <Typography
              variant="h6"
              sx={{
                fontWeight: "700",
                mb: 4,
                fontSize: "18px",
                color: "white",
              }}
            >
              Follow Us
            </Typography>
            <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
              {socialLinks.map((social, index) => (
                <IconButton
                  key={index}
                  href={social.href}
                  aria-label={social.label}
                  sx={{
                    color: "#9ca3af",
                    bgcolor: "#374151",
                    width: "44px",
                    height: "44px",
                    borderRadius: "8px",
                    transition: "all 0.2s ease",
                    "&:hover": {
                      color: "#10b981",
                      bgcolor: "#4b5563",
                      transform: "translateY(-2px)",
                    },
                  }}
                >
                  {social.icon}
                </IconButton>
              ))}
            </Box>
          </Grid>
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
            © 2024 HABITIX. All rights reserved.
          </Typography>
          <Box sx={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
            <Button
              component={Link}
              href="/privacy-policy"
              sx={{
                color: "#9ca3af",
                textTransform: "none",
                fontSize: "14px",
                p: 0,
                "&:hover": {
                  color: "#10b981",
                  bgcolor: "transparent",
                },
              }}
            >
              Privacy Policy
            </Button>
            <Button
              component={Link}
              href="/privacy-policy"
              sx={{
                color: "#9ca3af",
                textTransform: "none",
                fontSize: "14px",
                p: 0,
                "&:hover": {
                  color: "#10b981",
                  bgcolor: "transparent",
                },
              }}
            >
              Terms of Service
            </Button>
            <Button
              sx={{
                color: "#9ca3af",
                textTransform: "none",
                fontSize: "14px",
                p: 0,
                "&:hover": {
                  color: "#10b981",
                  bgcolor: "transparent",
                },
              }}
            >
              Cookie Policy
            </Button>
          </Box>
        </Box>
      </Container>
    </Box>
  );
}
