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
  Avatar,
  Menu,
  MenuItem,
  Divider,
} from "@mui/material";
import { Check, Menu as MenuIcon, Close } from "@mui/icons-material";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";

export default function Navbar() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const [scrollY, setScrollY] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const { data: session } = useSession();

  // Profile dropdown
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleProfileClick = (e: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(e.currentTarget);
  };

  const handleClose = () => setAnchorEl(null);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navItems = [
    { label: "Dashboard", href: "/dashboard" },
    { label: "Features", href: "/features" },
    { label: "People & Chats", href: "/people" },
    { label: "Pricing", href: "/pricing" },
  ];

  return (
    <>
      <AppBar
        position="fixed"
        sx={{
          bgcolor: scrollY > 20 ? "rgba(255,255,255,0.9)" : "transparent",
          backdropFilter: scrollY > 20 ? "blur(12px)" : "none",
          boxShadow: scrollY > 20 ? "0 2px 10px rgba(0,0,0,0.05)" : "none",
          transition: "all 0.3s ease",
        }}
      >
        <Container maxWidth="lg">
          <Toolbar sx={{ justifyContent: "space-between", minHeight: 70 }}>

            {/* 🔷 Logo */}
            <Link href="/" style={{ textDecoration: "none" }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                <Box
                  sx={{
                    width: 36,
                    height: 36,
                    bgcolor: "#10b981",
                    borderRadius: 2,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Check sx={{ color: "white" }} />
                </Box>
                <Typography
                  sx={{ fontWeight: 700, fontSize: "1.4rem", color: "#111" }}
                >
                  HABITIX
                </Typography>
              </Box>
            </Link>

            {/* 🔷 Desktop */}
            {!isMobile && (
              <Box sx={{ display: "flex", alignItems: "center", gap: 3 }}>

                {/* Nav Links */}
                {navItems.map((item) => (
                  <Button
                    key={item.label}
                    component={Link}
                    href={item.href}
                    sx={{
                      textTransform: "none",
                      color: "#333",
                      fontWeight: 500,
                      "&:hover": {
                        color: "#10b981",
                      },
                    }}
                  >
                    {item.label}
                  </Button>
                ))}

                {/* 🔷 Profile */}
                {session?.user ? (
                  <>
                    <Box
                      onClick={handleProfileClick}
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 1,
                        cursor: "pointer",
                        px: 1.5,
                        py: 0.8,
                        borderRadius: "20px",
                        "&:hover": {
                          bgcolor: "rgba(0,0,0,0.05)",
                        },
                      }}
                    >
                      <Avatar sx={{ width: 30, height: 30 }}>
                        {session.user.email?.charAt(0).toUpperCase()}
                      </Avatar>
                    </Box>

                    <Menu
                      anchorEl={anchorEl}
                      open={open}
                      onClose={handleClose}
                    >
                      <MenuItem disabled>
                        {session.user.email}
                      </MenuItem>
                      <Divider />
                      <MenuItem onClick={() => signOut()}>
                        Logout
                      </MenuItem>
                    </Menu>
                  </>
                ) : (
                  <Button
                    component={Link}
                    href="/login"
                    sx={{
                      bgcolor: "#10b981",
                      color: "white",
                      borderRadius: "20px",
                      px: 3,
                      "&:hover": {
                        bgcolor: "#059669",
                      },
                    }}
                  >
                    Login
                  </Button>
                )}
              </Box>
            )}

            {/* 🔷 Mobile */}
            {isMobile && (
              <IconButton onClick={() => setMobileMenuOpen(true)}>
                <MenuIcon />
              </IconButton>
            )}
          </Toolbar>
        </Container>
      </AppBar>

      {/* 🔷 Mobile Drawer */}
      <Drawer
        anchor="right"
        open={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
      >
        <Box
          sx={{
            width: 280,
            height: "100%",
            display: "flex",
            flexDirection: "column",
            p: 2,
          }}
        >

          {/* 🔷 Top Section */}
          <Box>

            {/* Header */}
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                mb: 2,
              }}
            >
              <Typography fontWeight={700}>Menu</Typography>
              <IconButton onClick={() => setMobileMenuOpen(false)}>
                <Close />
              </IconButton>
            </Box>

            {/* 🔷 User Info */}
            {session?.user && (
              <Box
                sx={{
                  mb: 3,
                  p: 2,
                  borderRadius: 2,
                  bgcolor: "rgba(0,0,0,0.05)",
                  display: "flex",
                  alignItems: "center",
                  gap: 2,
                  overflow: "hidden",
                }}
              >
                <Avatar>
                  {session.user.email?.charAt(0).toUpperCase()}
                </Avatar>

                <Box sx={{ minWidth: 0 }}>
                  {/* Email (TRUNCATED) */}
                  <Typography
                    fontSize={14}
                    fontWeight={600}
                    noWrap
                    sx={{ maxWidth: 160 }}
                  >
                    {session.user.email}
                  </Typography>

                  <Typography fontSize={12} color="gray">
                    Logged in
                  </Typography>
                </Box>
              </Box>
            )}

            {/* 🔷 Nav Items */}
            <List>
              {navItems.map((item) => (
                <ListItem key={item.label} disablePadding>
                  <ListItemButton
                    component={Link}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <ListItemText primary={item.label} />
                  </ListItemButton>
                </ListItem>
              ))}
            </List>
          </Box>

          {/* 🔷 Bottom Section */}
          <Box sx={{ mt: "auto" }}>

            <Divider sx={{ my: 2 }} />

            {/* 🔷 User ID */}
            {session?.user && (
              <Typography
                fontSize={12}
                color="gray"
                sx={{
                  mb: 1,
                  wordBreak: "break-all",
                }}
              >
                ID: {session.user.id}
              </Typography>
            )}

            {/* 🔷 Auth Button */}
            {session?.user ? (
              <Button
                fullWidth
                onClick={() => {
                  setMobileMenuOpen(false);
                  signOut();
                }}
              >
                Logout
              </Button>
            ) : (
              <Button
                fullWidth
                component={Link}
                href="/signin"
                variant="contained"
                onClick={() => setMobileMenuOpen(false)}
              >
                Sign In
              </Button>
            )}
          </Box>

        </Box>
      </Drawer>
    </>
  );
}