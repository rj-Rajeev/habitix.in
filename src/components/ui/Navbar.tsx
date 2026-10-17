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
import { ChevronDown, LayoutDashboard, LogOut, UserRound } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import {
  getNavigationItem,
  getNavigationItems,
  getNavigationLabel,
  isNavigationItemActive,
} from "@/config/navigation";
import { useAppShellNavigation } from "@/components/app/AppNavigationContext";

export default function Navbar() {
  const theme = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const { data: session } = useSession();
  const {
    isAppShellRoute,
    open: appNavigationOpen,
    toggleDrawer: toggleAppNavigation,
    triggerRef: appNavigationTriggerRef,
  } = useAppShellNavigation();
  const isMobile = useMediaQuery(
    isAppShellRoute ? "(max-width: 767px)" : theme.breakpoints.down("md")
  );
  const navItems = getNavigationItems("publicNavbar");
  const homeItem = getNavigationItem("home");
  const signInItem = getNavigationItem("sign-in");
  const getStartedItem = getNavigationItem("get-started");
  const dashboardItem = getNavigationItem("dashboard");
  const profileItem = getNavigationItem("profile");
  const pathname = usePathname();
  const displayName = session?.user?.name?.trim() || session?.user?.email?.split("@")[0] || "Account";
  const initials = session?.user?.name?.trim()
    ? session.user.name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase()
    : session?.user?.email?.[0]?.toUpperCase() || "A";

  // Profile dropdown
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleProfileClick = (e: React.MouseEvent<HTMLElement>) => {
    const target = e.currentTarget;
    setAnchorEl((current) => current ? null : target);
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
          <Toolbar sx={{ display: "grid", gridTemplateColumns: isMobile ? "1fr auto" : "1fr auto 1fr", gap: { xs: 1, md: 3 }, minHeight: 70, px: { xs: 0, sm: 1 } }}>

            {/* 🔷 Logo */}
            <Link href={homeItem.href} style={{ textDecoration: "none" }} aria-label="Habitix home" inert={isAppShellRoute && appNavigationOpen}>
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
              <Box component="nav" aria-label="Main" sx={{ display: "flex", alignItems: "center", justifySelf: "center", gap: { md: 0.5, lg: 1 } }}>

                {/* Nav Links */}
                {navItems.map((item) => {
                  const active = isNavigationItemActive(pathname, item.id, "publicNavbar");
                  return (
                  <Button
                    key={item.id}
                    component={Link}
                    href={item.href}
                    sx={{
                      textTransform: "none",
                      color: active ? "var(--brand-primary-hover)" : "var(--text-secondary)",
                      fontWeight: 500,
                      borderRadius: "10px",
                      px: { md: 1, lg: 1.5 },
                      bgcolor: active ? "var(--brand-primary-soft)" : "transparent",
                      "&:hover": {
                        color: "var(--brand-primary)",
                        bgcolor: "var(--brand-primary-soft)",
                      },
                    }}
                    aria-current={active ? "page" : undefined}
                  >
                    {getNavigationLabel(item, "publicNavbar")}
                  </Button>
                  );
                })}
              </Box>
            )}

            {!isMobile && (
              <Box sx={{ display: "flex", alignItems: "center", justifySelf: "end", gap: 1 }}>
                {/* 🔷 Profile */}
                {session?.user ? (
                  <>
                    <Button
                      onClick={handleProfileClick}
                      aria-label={`Open account menu for ${displayName}`}
                      aria-haspopup="menu"
                      aria-expanded={open}
                      aria-controls={open ? "habitix-account-menu" : undefined}
                      sx={{
                        minWidth: 0,
                        display: "flex",
                        alignItems: "center",
                        gap: 1,
                        borderRadius: "999px",
                        p: 0.5,
                        color: "var(--text-secondary)",
                        textTransform: "none",
                        "&:hover": { bgcolor: "var(--surface-subtle)" },
                        "&:focus-visible": { outline: "3px solid rgb(15 118 110 / 0.35)", outlineOffset: 2 },
                      }}
                    >
                      <Avatar src={session.user.image || undefined} alt={displayName} sx={{ width: 36, height: 36, bgcolor: "var(--brand-primary)", fontSize: 14, fontWeight: 700 }}>
                        {initials}
                      </Avatar>
                      <ChevronDown aria-hidden="true" className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`} />
                    </Button>

                    <Menu
                      anchorEl={anchorEl}
                      open={open}
                      onClose={handleClose}
                      id="habitix-account-menu"
                      MenuListProps={{ "aria-label": "Account menu" }}
                      anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
                      transformOrigin={{ vertical: "top", horizontal: "right" }}
                      slotProps={{ paper: { sx: { mt: 1, width: 280, maxWidth: "calc(100vw - 16px)", overflow: "hidden", border: "1px solid var(--border)", borderRadius: "16px", boxShadow: "var(--shadow-md)" } } }}
                    >
                      <MenuItem component={Link} href={dashboardItem.href} onClick={handleClose} selected={isNavigationItemActive(pathname, dashboardItem.id, "publicNavbar")} sx={{ minHeight: 48, gap: 1.5, px: 2 }}>
                        <LayoutDashboard aria-hidden="true" className="h-4 w-4" />
                        <ListItemText primary="Dashboard" />
                      </MenuItem>
                      <MenuItem component={Link} href={profileItem.href} onClick={handleClose} selected={isNavigationItemActive(pathname, profileItem.id, "publicNavbar")} sx={{ minHeight: 48, gap: 1.5, px: 2 }}>
                        <UserRound aria-hidden="true" className="h-4 w-4" />
                        <ListItemText primary="Profile" />
                      </MenuItem>
                      {!isAppShellRoute && (
                        <>
                          <Divider component="li" sx={{ my: 1 }} />
                          <MenuItem onClick={() => { handleClose(); void signOut(); }} sx={{ minHeight: 48, gap: 1.5, px: 2 }}>
                            <LogOut aria-hidden="true" className="h-4 w-4" />
                            <ListItemText primary="Logout" />
                          </MenuItem>
                        </>
                      )}
                      <MenuItem disabled sx={{ display: "flex", alignItems: "center", gap: 1.5, mt: 1, borderTop: "1px solid var(--border)", px: 2, py: 1.75, "&.Mui-disabled": { color: "var(--text-primary)", opacity: 1, cursor: "default" } }}>
                        <Avatar src={session.user.image || undefined} alt={displayName} sx={{ width: 38, height: 38, bgcolor: "var(--brand-primary)", fontSize: 14, fontWeight: 700 }}>
                          {initials}
                        </Avatar>
                        <Box sx={{ minWidth: 0, flex: 1 }}>
                          <Typography noWrap sx={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)" }}>{displayName}</Typography>
                          <Typography noWrap sx={{ mt: 0.25, fontSize: 12, color: "var(--text-muted)" }}>{session.user.email}</Typography>
                        </Box>
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
                aria-label={isAppShellRoute ? (appNavigationOpen ? "Close navigation menu" : "Open navigation menu") : "Open public navigation"}
                aria-haspopup="dialog"
                aria-controls={isAppShellRoute ? "mobile-app-navigation" : undefined}
                aria-expanded={isAppShellRoute ? appNavigationOpen : mobileMenuOpen}
                onClick={() => isAppShellRoute ? toggleAppNavigation() : setMobileMenuOpen(true)}
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
