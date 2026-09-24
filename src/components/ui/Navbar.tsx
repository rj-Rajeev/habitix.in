"use client";

import { useState } from "react";
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const { data: session } = useSession();

  // Profile dropdown
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleProfileClick = (e: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(e.currentTarget);
  };

  const handleClose = () => setAnchorEl(null);

  const navItems = [
    { label: "Product", href: "/features" },
    { label: "Courses", href: "/courses" },
    { label: "How it works", href: "/roadmap" },
  ];

  return (
    <>
      <AppBar
        position="fixed"
        sx={{
          bgcolor: "var(--background)",
          boxShadow: "0 1px 0 var(--border)",
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
                    bgcolor: "var(--brand-primary)",
                    borderRadius: 2,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Check sx={{ color: "white" }} />
                </Box>
                <Typography
                  sx={{ fontWeight: 700, fontSize: "1.4rem", color: "var(--text-primary)", letterSpacing: "0.04em" }}
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
                      color: "var(--text-secondary)",
                      fontWeight: 500,
                      "&:hover": {
                        color: "var(--brand-primary)",
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
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Button
                      component={Link}
                      href="/signin"
                      sx={{ textTransform: "none", color: "var(--text-secondary)" }}
                    >
                      Sign in
                    </Button>
                    <Button
                      component={Link}
                      href="/signup"
                      sx={{
                        bgcolor: "var(--brand-primary)",
                        color: "white",
                        borderRadius: "10px",
                        px: 2.5,
                        textTransform: "none",
                        "&:hover": { bgcolor: "var(--brand-primary-hover)" },
                      }}
                    >
                      Get Started
                    </Button>
                  </Box>
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