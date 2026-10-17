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
import {
  getNavigationItem,
  getNavigationItems,
  getNavigationLabel,
} from "@/config/navigation";
import { useAppShellNavigation } from "@/components/app/AppNavigationContext";

export default function Navbar() {
  const theme = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const { data: session } = useSession();
  const {
    isAppShellRoute,
    open: appNavigationOpen,
    openDrawer: openAppNavigation,
    triggerRef: appNavigationTriggerRef,
  } = useAppShellNavigation();
  const isMobile = useMediaQuery(
    isAppShellRoute ? "(max-width: 767px)" : theme.breakpoints.down("md")
  );
  const navItems = getNavigationItems("publicNavbar");
  const homeItem = getNavigationItem("home");
  const signInItem = getNavigationItem("sign-in");
  const getStartedItem = getNavigationItem("get-started");

  // Profile dropdown
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleProfileClick = (e: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(e.currentTarget);
  };

  const handleClose = () => setAnchorEl(null);

  return (
    <>
      <AppBar
        position="fixed"
        data-public-navbar
        sx={{
          bgcolor: "var(--background)",
          boxShadow: "0 1px 0 var(--border)",
        }}
      >
        <Container maxWidth="lg">
          <Toolbar sx={{ justifyContent: "space-between", minHeight: 70 }}>

            {/* 🔷 Logo */}
            <Link href={homeItem.href} style={{ textDecoration: "none" }} aria-label="Habitix home">
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
                    key={item.id}
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
                    {getNavigationLabel(item, "publicNavbar")}
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
                      href={signInItem.href}
                      sx={{ textTransform: "none", color: "var(--text-secondary)" }}
                    >
                      {getNavigationLabel(signInItem, "publicAuth")}
                    </Button>
                    <Button
                      component={Link}
                      href={getStartedItem.href}
                      sx={{
                        bgcolor: "var(--brand-primary)",
                        color: "white",
                        borderRadius: "10px",
                        px: 2.5,
                        textTransform: "none",
                        "&:hover": { bgcolor: "var(--brand-primary-hover)" },
                      }}
                    >
                      {getNavigationLabel(getStartedItem, "publicAuth")}
                    </Button>
                  </Box>
                )}
              </Box>
            )}

            {/* 🔷 Mobile */}
            {isMobile && (
              <IconButton
                ref={isAppShellRoute ? appNavigationTriggerRef : undefined}
                aria-label={isAppShellRoute ? "Open navigation menu" : "Open public navigation"}
                aria-haspopup="dialog"
                aria-expanded={isAppShellRoute ? appNavigationOpen : mobileMenuOpen}
                onClick={() => isAppShellRoute ? openAppNavigation() : setMobileMenuOpen(true)}
              >
                <MenuIcon />
              </IconButton>
            )}
          </Toolbar>
        </Container>
      </AppBar>

      {/* 🔷 Mobile Drawer */}
      <Drawer
        anchor="right"
        open={!isAppShellRoute && mobileMenuOpen}
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
              <IconButton aria-label="Close public navigation" onClick={() => setMobileMenuOpen(false)}>
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
                <ListItem key={item.id} disablePadding>
                  <ListItemButton
                    component={Link}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <ListItemText primary={getNavigationLabel(item, "publicNavbar")} />
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
              <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                <Button
                  fullWidth
                  component={Link}
                  href={signInItem.href}
                  variant="contained"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {getNavigationLabel(signInItem, "publicAuth")}
                </Button>
                <Button
                  fullWidth
                  component={Link}
                  href={getStartedItem.href}
                  variant="outlined"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {getNavigationLabel(getStartedItem, "publicAuth")}
                </Button>
              </Box>
            )}
          </Box>

        </Box>
      </Drawer>
    </>
  );
}
