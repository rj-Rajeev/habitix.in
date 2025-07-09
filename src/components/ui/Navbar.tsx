"use client";
import { useState, useEffect } from "react";
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Container,
  Box,
  IconButton,
  useMediaQuery,
  useTheme,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
} from "@mui/material";
import { Check, Menu as MenuIcon, Close } from "@mui/icons-material";
import Link from "next/link";

export default function Navbar() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const [scrollY, setScrollY] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleMobileMenuToggle = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const navItems = [
    { label: "Features", href: "/features" },
    { label: "About", href: "/" },
    { label: "Contact", href: "/" },
  ];

  return (
    <>
      <AppBar
        position="fixed"
        sx={{
          bgcolor: scrollY > 50 ? "rgba(255,255,255,0.95)" : "transparent",
          boxShadow: scrollY > 50 ? "0 2px 20px rgba(0,0,0,0.08)" : "none",
          backdropFilter: scrollY > 50 ? "blur(20px)" : "none",
          transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
          zIndex: 1000,
        }}
      >
        <Container maxWidth="lg">
          <Toolbar
            sx={{ justifyContent: "space-between", py: 2, minHeight: "80px" }}
          >
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1.5,
                cursor: "pointer",
                transition: "transform 0.2s ease",
                "&:hover": {
                  transform: "scale(1.02)",
                },
              }}
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
                  transition: "all 0.3s ease",
                  "&:hover": {
                    bgcolor: "#059669",
                    transform: "rotate(5deg)",
                  },
                }}
              >
                <Check sx={{ color: "white", fontSize: "24px" }} />
              </Box>
              <Typography
                variant="h5"
                component="div"
                sx={{
                  fontWeight: "700",
                  color: "#1f2937",
                  fontFamily: "system-ui, -apple-system, sans-serif",
                  fontSize: "1.5rem",
                }}
              >
                HABITIX
              </Typography>
            </Box>

            {!isMobile && (
              <Box sx={{ display: "flex", gap: 6, alignItems: "center" }}>
                {navItems.map((item, id) => (
                  <Button
                    href={item.href}
                    key={id}
                    sx={{
                      color: "#374151",
                      textTransform: "none",
                      fontSize: "16px",
                      fontWeight: 500,
                      py: 1,
                      px: 2,
                      borderRadius: "8px",
                      position: "relative",
                      transition: "all 0.2s ease",
                      "&:hover": {
                        color: "#10b981",
                        bgcolor: "rgba(16, 185, 129, 0.1)",
                        "&::after": {
                          width: "100%",
                        },
                      },
                      "&::after": {
                        content: '""',
                        position: "absolute",
                        bottom: 0,
                        left: "50%",
                        transform: "translateX(-50%)",
                        width: 0,
                        height: "2px",
                        bgcolor: "#10b981",
                        transition: "width 0.3s ease",
                      },
                    }}
                  >
                    {item.label}
                  </Button>
                ))}
                <Button
                  sx={{
                    bgcolor: "#8b7cf6",
                    color: "white",
                    minWidth: "120px",
                    height: "44px",
                    borderRadius: "22px",
                    textTransform: "none",
                    fontWeight: 600,
                    fontSize: "16px",
                    transition: "all 0.2s ease",
                    "&:hover": {
                      bgcolor: "#7c3aed",
                      transform: "translateY(-1px)",
                      boxShadow: "0 8px 25px rgba(139, 124, 246, 0.3)",
                    },
                  }}
                >
                  <Link href={"/pricing"}>Get Started</Link>
                </Button>
              </Box>
            )}

            {isMobile && (
              <IconButton
                onClick={handleMobileMenuToggle}
                sx={{
                  color: "#374151",
                  transition: "transform 0.2s ease",
                  "&:hover": {
                    transform: "scale(1.1)",
                  },
                }}
              >
                <MenuIcon />
              </IconButton>
            )}
          </Toolbar>
        </Container>
      </AppBar>

      {/* Mobile Drawer */}
      <Drawer
        anchor="right"
        open={mobileMenuOpen}
        onClose={handleMobileMenuToggle}
        sx={{
          "& .MuiDrawer-paper": {
            width: 280,
            bgcolor: "white",
            p: 2,
          },
        }}
      >
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 4,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <Box
              sx={{
                width: "32px",
                height: "32px",
                bgcolor: "#10b981",
                borderRadius: "6px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Check sx={{ color: "white", fontSize: "20px" }} />
            </Box>
            <Typography
              variant="h6"
              sx={{
                fontWeight: "700",
                color: "#1f2937",
                fontFamily: "system-ui, -apple-system, sans-serif",
              }}
            >
              HABITIX
            </Typography>
          </Box>
          <IconButton onClick={handleMobileMenuToggle}>
            <Close />
          </IconButton>
        </Box>

        <List>
          {navItems.map((item, id) => (
            <ListItem key={id} disablePadding>
              <ListItemButton
                component={Link}
                href={item.href}
                sx={{
                  borderRadius: "8px",
                  mb: 1,
                  "&:hover": {
                    bgcolor: "rgba(16, 185, 129, 0.1)",
                  },
                }}
              >
                <ListItemText
                  primary={item.label}
                  sx={{
                    "& .MuiListItemText-primary": {
                      fontSize: "16px",
                      fontWeight: 500,
                      color: "#374151",
                    },
                  }}
                />
              </ListItemButton>
            </ListItem>
          ))}
        </List>

        <Button
          fullWidth
          sx={{
            bgcolor: "#8b7cf6",
            color: "white",
            py: 2,
            mt: 4,
            borderRadius: "12px",
            textTransform: "none",
            fontWeight: 600,
            fontSize: "16px",
            "&:hover": {
              bgcolor: "#7c3aed",
            },
          }}
        >
          <Link href={"/pricing"}>Get Started</Link>
        </Button>
      </Drawer>
    </>
  );
}
