"use client";
import { useState, useEffect } from "react";
import {
  Typography,
  Button,
  Container,
  Grid,
  Box,
  useMediaQuery,
  useTheme,
  Card,
  CardContent,
} from "@mui/material";
import {
  Check,
  TrendingUp,
  Schedule,
  Psychology,
  ArrowForward,
  PlayArrow,
} from "@mui/icons-material";
import Link from "next/link";
import AutoNotificationPrompt from "@/components/notifications/AutoNotificationPrompt";

export default function HabitixLanding() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const [scrollY, setScrollY] = useState(0);
  const [activeHabit, setActiveHabit] = useState(0);
  const [currentDate, setCurrentDate] = useState(new Date());

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveHabit((prev) => (prev + 1) % 3);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  // Update current date every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDate(new Date());
    }, 60000); // Update every minute
    return () => clearInterval(timer);
  }, []);

  const features = [
    {
      icon: <Schedule sx={{ fontSize: 48, color: "#10b981" }} />,
      title: "Smart Reminders",
      description:
        "Never miss a habit with intelligent notifications that adapt to your schedule and preferences.",
    },
    {
      icon: <TrendingUp sx={{ fontSize: 48, color: "#10b981" }} />,
      title: "Progress Tracking",
      description:
        "Visualize your journey with detailed analytics, charts, and comprehensive progress reports.",
    },
    {
      icon: <Psychology sx={{ fontSize: 48, color: "#10b981" }} />,
      title: "Habit Science",
      description:
        "Built on proven behavioral science principles to maximize your success rate and motivation.",
    },
  ];

  const habits = [
    { name: "Wake up at 6:00 AM", progress: 85, completed: true },
    { name: "Read for 30 minutes", progress: 65, completed: false },
    { name: "Exercise daily", progress: 75, completed: true },
  ];

  // Get current date info
  const today = currentDate.getDate();
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();
  const dayName = currentDate.toLocaleDateString("en-US", { weekday: "long" });
  const monthName = currentDate.toLocaleDateString("en-US", { month: "long" });

  // Generate calendar dates for current week
  const getWeekDates = () => {
    const startOfWeek = new Date(currentDate);
    const day = startOfWeek.getDay();
    startOfWeek.setDate(currentDate.getDate() - day);

    const weekDates = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      weekDates.push(date.getDate());
    }
    return weekDates;
  };

  const weekDates = getWeekDates();

  return (
    <Box
      sx={{
        minHeight: "100vh",
        background:
          "linear-gradient(135deg, #f8f9ff 0%, #e8e5ff 50%, #d4c5ff 100%)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Optimized Background Blobs */}
      <Box
        sx={{
          position: "fixed",
          top: "-10%",
          right: "-10%",
          width: "40vw",
          height: "40vw",
          maxWidth: "400px",
          maxHeight: "400px",
          background: "linear-gradient(135deg, #8b7cf6 0%, #a855f7 100%)",
          borderRadius: "50% 30% 70% 40%",
          opacity: 0.8,
          zIndex: 0,
          transform: `translate3d(0, ${scrollY * 0.05}px, 0)`,
          willChange: "transform",
        }}
      />

      <Box
        sx={{
          position: "fixed",
          bottom: "-15%",
          left: "-15%",
          width: "50vw",
          height: "50vw",
          maxWidth: "500px",
          maxHeight: "500px",
          background: "linear-gradient(135deg, #a855f7 0%, #8b7cf6 100%)",
          borderRadius: "40% 60% 30% 70%",
          opacity: 0.6,
          zIndex: 0,
          transform: `translate3d(0, ${scrollY * -0.03}px, 0)`,
          willChange: "transform",
        }}
      />


      {/* Main Content */}
      <Container maxWidth="lg" sx={{ position: "relative", zIndex: 5, pt: 12 }}>
        {/* Hero Section - Perfectly Symmetric */}
        <Box sx={{ py: { xs: 8, md: 12 } }}>
          <Grid
            container
            spacing={8}
            alignItems="center"
            sx={{ minHeight: "80vh" }}
          >
            {/* Left Content */}
            <Grid size={{ xs: 12, md: 6 }}>
              <Box
                sx={{ pr: { md: 6 }, textAlign: { xs: "center", md: "left" } }}
              >
                <Typography
                  variant="h1"
                  component="h1"
                  sx={{
                    fontWeight: "800",
                    color: "#1f2937",
                    mb: 4,
                    fontSize: { xs: "3.5rem", md: "5rem" },
                    lineHeight: 1.1,
                    fontFamily: "system-ui, -apple-system, sans-serif",
                    letterSpacing: "-0.02em",
                  }}
                >
                  Build
                  <br />
                  better
                  <br />
                  habits
                </Typography>

                <Typography
                  variant="body1"
                  sx={{
                    color: "#4b5563",
                    mb: 6,
                    fontSize: "20px",
                    lineHeight: 1.6,
                    maxWidth: "480px",
                    mx: { xs: "auto", md: 0 },
                  }}
                >
                  Stay on track and achieve your goals with our
                  scientifically-designed habit tracker app.
                </Typography>

                <Box
                  sx={{
                    display: "flex",
                    gap: 3,
                    justifyContent: { xs: "center", md: "flex-start" },
                    flexWrap: "wrap",
                  }}
                >
                  <Button
                    variant="contained"
                    sx={{
                      bgcolor: "#10b981",
                      color: "white",
                      px: 6,
                      py: 2.5,
                      textTransform: "none",
                      fontSize: "18px",
                      fontWeight: 600,
                      borderRadius: "50px",
                      minWidth: "180px",
                      boxShadow: "0 10px 25px rgba(16, 185, 129, 0.25)",
                      transition: "all 0.2s ease",
                      "&:hover": {
                        bgcolor: "#059669",
                        transform: "translateY(-2px)",
                        boxShadow: "0 15px 35px rgba(16, 185, 129, 0.35)",
                      },
                    }}
                    endIcon={<ArrowForward />}
                  >
                    <Link href={"/pricing"}>Get Started</Link>
                  </Button>

                  <Button
                    variant="outlined"
                    sx={{
                      color: "#8b7cf6",
                      borderColor: "#8b7cf6",
                      borderWidth: "2px",
                      px: 6,
                      py: 2.5,
                      textTransform: "none",
                      fontSize: "18px",
                      fontWeight: 600,
                      borderRadius: "50px",
                      minWidth: "180px",
                      transition: "all 0.2s ease",
                      "&:hover": {
                        bgcolor: "#8b7cf6",
                        color: "white",
                        transform: "translateY(-2px)",
                        boxShadow: "0 15px 35px rgba(139, 124, 246, 0.25)",
                        borderColor: "#8b7cf6",
                      },
                    }}
                    startIcon={<PlayArrow />}
                  >
                    Watch Demo
                  </Button>
                </Box>
              </Box>
            </Grid>

            {/* Right Content - Phone Mockup with Real-time Date */}
            <Grid size={{ xs: 12, md: 6 }}>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  position: "relative",
                  height: "600px",
                }}
              >
                {/* Purple Blob Behind Phone */}
                <Box
                  sx={{
                    position: "absolute",
                    width: "380px",
                    height: "520px",
                    background:
                      "linear-gradient(135deg, #8b7cf6 0%, #a855f7 100%)",
                    borderRadius: "30% 70% 70% 30%",
                    zIndex: 1,
                    top: "50%",
                    left: "50%",
                    transform: "translate(-50%, -50%)",
                  }}
                />

                {/* Phone Mockup */}
                <Box
                  sx={{
                    width: "300px",
                    height: "580px",
                    bgcolor: "white",
                    borderRadius: "32px",
                    position: "relative",
                    zIndex: 2,
                    boxShadow: "0 25px 50px rgba(0,0,0,0.12)",
                    p: 4,
                    transition: "transform 0.3s ease",
                    "&:hover": {
                      transform: "translateY(-8px)",
                    },
                  }}
                >
                  {/* Phone Status Bar */}
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      mb: 4,
                      px: 1,
                    }}
                  >
                    <Box sx={{ display: "flex", gap: 1 }}>
                      <Box
                        sx={{
                          width: "4px",
                          height: "4px",
                          bgcolor: "#d1d5db",
                          borderRadius: "50%",
                        }}
                      />
                      <Box
                        sx={{
                          width: "4px",
                          height: "4px",
                          bgcolor: "#d1d5db",
                          borderRadius: "50%",
                        }}
                      />
                      <Box
                        sx={{
                          width: "24px",
                          height: "4px",
                          bgcolor: "#1f2937",
                          borderRadius: "2px",
                        }}
                      />
                    </Box>
                    <Box
                      sx={{
                        fontSize: "12px",
                        color: "#6b7280",
                        fontWeight: 500,
                      }}
                    >
                      {currentDate.toLocaleTimeString("en-US", {
                        hour: "numeric",
                        minute: "2-digit",
                        hour12: false,
                      })}
                    </Box>
                  </Box>

                  {/* App Header */}
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      mb: 4,
                      px: 1,
                    }}
                  >
                    <Box
                      sx={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 0.5,
                      }}
                    >
                      <Box
                        sx={{
                          width: "24px",
                          height: "2px",
                          bgcolor: "#1f2937",
                          borderRadius: "1px",
                        }}
                      />
                      <Box
                        sx={{
                          width: "24px",
                          height: "2px",
                          bgcolor: "#1f2937",
                          borderRadius: "1px",
                        }}
                      />
                      <Box
                        sx={{
                          width: "24px",
                          height: "2px",
                          bgcolor: "#1f2937",
                          borderRadius: "1px",
                        }}
                      />
                    </Box>
                    <Typography
                      sx={{
                        fontWeight: "700",
                        fontSize: "20px",
                        color: "#1f2937",
                      }}
                    >
                      Habitix
                    </Typography>
                    <Box sx={{ width: "24px" }} />
                  </Box>

                  {/* Real-time Today Section */}
                  <Box sx={{ mb: 4 }}>
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        mb: 3,
                        px: 1,
                      }}
                    >
                      <Box>
                        <Typography
                          sx={{
                            fontWeight: "600",
                            fontSize: "18px",
                            color: "#1f2937",
                          }}
                        >
                          {dayName}
                        </Typography>
                        <Typography sx={{ fontSize: "14px", color: "#6b7280" }}>
                          {monthName} {today}, {currentYear}
                        </Typography>
                      </Box>
                    </Box>

                    {/* Real-time Calendar Grid */}
                    <Box
                      sx={{
                        display: "grid",
                        gridTemplateColumns: "repeat(7, 1fr)",
                        gap: 0.4,
                        mb: 4,
                        px: 1,
                      }}
                    >
                      {["S", "M", "T", "W", "T", "F", "S"].map((day, index) => (
                        <Typography
                          key={index}
                          sx={{
                            textAlign: "center",
                            fontSize: "13px",
                            color: "#6b7280",
                            fontWeight: "600",
                            py: 0.5,
                          }}
                        >
                          {day}
                        </Typography>
                      ))}
                      {weekDates.map((date, index) => {
                        const isToday = date === today;
                        return (
                          <Box
                            key={index}
                            sx={{
                              width: "32px",
                              height: "32px",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              borderRadius: "50%",
                              bgcolor: isToday ? "#10b981" : "transparent",
                              color: isToday ? "white" : "#1f2937",
                              fontSize: "14px",
                              fontWeight: "600",
                              mx: "auto",
                              transition: "all 0.2s ease",
                              animation: isToday
                                ? "pulse 2s ease-in-out infinite"
                                : "none",
                              "@keyframes pulse": {
                                "0%, 100%": { transform: "scale(1)" },
                                "50%": { transform: "scale(1.05)" },
                              },
                            }}
                          >
                            {date}
                          </Box>
                        );
                      })}
                    </Box>
                  </Box>

                  {/* Habits List */}
                  <Box sx={{ px: 1 }}>
                    {habits.map((habit, index) => (
                      <Box
                        key={index}
                        sx={{
                          mb: 4,
                          opacity: activeHabit === index ? 1 : 0.8,
                          transition: "opacity 0.3s ease",
                        }}
                      >
                        <Typography
                          sx={{
                            fontSize: "15px",
                            fontWeight: "600",
                            color: "#1f2937",
                            mb: 2,
                          }}
                        >
                          {habit.name}
                        </Typography>
                        <Box
                          sx={{ display: "flex", alignItems: "center", gap: 2 }}
                        >
                          <Box
                            sx={{
                              flex: 1,
                              height: "10px",
                              bgcolor: "#dcfce7",
                              borderRadius: "5px",
                              position: "relative",
                              overflow: "hidden",
                            }}
                          >
                            <Box
                              sx={{
                                width: `${habit.progress}%`,
                                height: "100%",
                                bgcolor: "#10b981",
                                borderRadius: "5px",
                                transition: "width 1s ease",
                              }}
                            />
                          </Box>
                          {habit.completed ? (
                            <Box
                              sx={{
                                width: "24px",
                                height: "24px",
                                bgcolor: "#10b981",
                                borderRadius: "6px",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                              }}
                            >
                              <Check
                                sx={{ color: "white", fontSize: "16px" }}
                              />
                            </Box>
                          ) : (
                            <Box sx={{ display: "flex", gap: 1 }}>
                              {[1, 2, 3].map((i) => (
                                <Box
                                  key={i}
                                  sx={{
                                    width: "18px",
                                    height: "18px",
                                    bgcolor: "#10b981",
                                    borderRadius: "4px",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                  }}
                                >
                                  <Check
                                    sx={{ color: "white", fontSize: "12px" }}
                                  />
                                </Box>
                              ))}
                            </Box>
                          )}
                        </Box>
                      </Box>
                    ))}
                  </Box>
                </Box>
              </Box>
            </Grid>
          </Grid>
        </Box>

        {/* Features Section - Symmetric Layout */}
        <Box sx={{ py: { xs: 10, md: 16 } }}>
          <Box sx={{ textAlign: "center", mb: 12 }}>
            <Typography
              variant="h2"
              component="h2"
              sx={{
                fontWeight: "800",
                color: "#1f2937",
                mb: 4,
                fontSize: { xs: "2.5rem", md: "3.5rem" },
                fontFamily: "system-ui, -apple-system, sans-serif",
                letterSpacing: "-0.02em",
              }}
            >
              Why Choose HABITIX?
            </Typography>
            <Typography
              variant="body1"
              sx={{
                color: "#4b5563",
                fontSize: "20px",
                lineHeight: 1.6,
                maxWidth: "600px",
                mx: "auto",
              }}
            >
              Discover the features that make HABITIX the most effective habit
              tracking app
            </Typography>
          </Box>

          <Grid container spacing={6}>
            {features.map((feature, index) => (
              <Grid size={{ xs: 12, md: 4 }} key={index}>
                <Card
                  sx={{
                    height: "100%",
                    textAlign: "center",
                    p: 6,
                    border: "none",
                    boxShadow: "0 8px 32px rgba(0,0,0,0.08)",
                    borderRadius: "24px",
                    transition: "all 0.3s ease",
                    "&:hover": {
                      transform: "translateY(-8px)",
                      boxShadow: "0 16px 48px rgba(0,0,0,0.12)",
                    },
                  }}
                >
                  <CardContent sx={{ p: 0 }}>
                    <Box sx={{ mb: 4 }}>{feature.icon}</Box>
                    <Typography
                      variant="h5"
                      component="h3"
                      sx={{
                        fontWeight: "700",
                        color: "#1f2937",
                        mb: 3,
                        fontSize: "1.5rem",
                      }}
                    >
                      {feature.title}
                    </Typography>
                    <Typography
                      variant="body1"
                      sx={{
                        color: "#4b5563",
                        lineHeight: 1.6,
                        fontSize: "16px",
                      }}
                    >
                      {feature.description}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>

        {/* Second Hero Section - Symmetric */}
        <Box sx={{ py: { xs: 10, md: 16 } }}>
          <Grid container spacing={8} alignItems="center">
            {/* Left Content */}
            <Grid size={{ xs: 12, md: 6 }}>
              <Box
                sx={{ pr: { md: 6 }, textAlign: { xs: "center", md: "left" } }}
              >
                <Typography
                  variant="h2"
                  component="h2"
                  sx={{
                    fontWeight: "800",
                    color: "#1f2937",
                    mb: 4,
                    fontSize: { xs: "2.5rem", md: "3.5rem" },
                    lineHeight: 1.2,
                    fontFamily: "system-ui, -apple-system, sans-serif",
                    letterSpacing: "-0.02em",
                  }}
                >
                  Track your
                  <br />
                  habits easily
                </Typography>

                <Typography
                  variant="body1"
                  sx={{
                    color: "#4b5563",
                    fontSize: "20px",
                    lineHeight: 1.6,
                    maxWidth: "480px",
                    mb: 6,
                    mx: { xs: "auto", md: 0 },
                  }}
                >
                  Develop new habits and keep tabs on your progress with ease
                  using our intuitive interface.
                </Typography>

                <Button
                  variant="contained"
                  sx={{
                    bgcolor: "#8b7cf6",
                    color: "white",
                    px: 6,
                    py: 2.5,
                    textTransform: "none",
                    fontSize: "18px",
                    fontWeight: 600,
                    borderRadius: "50px",
                    minWidth: "180px",
                    transition: "all 0.2s ease",
                    "&:hover": {
                      bgcolor: "#7c3aed",
                      transform: "translateY(-2px)",
                      boxShadow: "0 10px 25px rgba(139, 124, 246, 0.3)",
                    },
                  }}
                  endIcon={<ArrowForward />}
                >
                  <Link href={"/pricing"}>Start Tracking</Link>
                </Button>
              </Box>
            </Grid>

            {/* Right Content - Progress Chart */}
            <Grid size={{ xs: 12, md: 6 }}>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  position: "relative",
                  height: "400px",
                }}
              >
                {/* Main Circle */}
                <Box
                  sx={{
                    width: "240px",
                    height: "240px",
                    borderRadius: "50%",
                    background:
                      "conic-gradient(#10b981 0deg 270deg, #dcfce7 270deg 360deg)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    position: "relative",
                  }}
                >
                  <Box
                    sx={{
                      width: "160px",
                      height: "160px",
                      borderRadius: "50%",
                      bgcolor: "white",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      boxShadow: "0 8px 32px rgba(0,0,0,0.1)",
                    }}
                  >
                    <Box
                      sx={{
                        width: "80px",
                        height: "80px",
                        borderRadius: "50%",
                        bgcolor: "#10b981",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Check sx={{ color: "white", fontSize: "40px" }} />
                    </Box>
                  </Box>
                </Box>

                {/* Floating Checkmarks - Symmetric Positioning */}
                {[
                  { top: "10%", left: "20%" },
                  { top: "20%", right: "15%" },
                  { bottom: "20%", left: "15%" },
                  { bottom: "10%", right: "20%" },
                ].map((position, index) => (
                  <Box
                    key={index}
                    sx={{
                      position: "absolute",
                      width: "48px",
                      height: "48px",
                      borderRadius: "50%",
                      bgcolor: "#10b981",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      boxShadow: "0 8px 24px rgba(16, 185, 129, 0.25)",
                      ...position,
                    }}
                  >
                    <Check sx={{ color: "white", fontSize: "24px" }} />
                  </Box>
                ))}
              </Box>
            </Grid>
          </Grid>
        </Box>

        {/* CTA Section - Centered and Symmetric */}
        <Box
          sx={{
            textAlign: "center",
            py: { xs: 12, md: 16 },
            background: "linear-gradient(135deg, #8b7cf6 0%, #a855f7 100%)",
            borderRadius: "32px",
            color: "white",
            my: 8,
          }}
        >
          <Typography
            variant="h2"
            component="h2"
            sx={{
              fontWeight: "800",
              mb: 4,
              fontSize: { xs: "2.5rem", md: "3.5rem" },
              fontFamily: "system-ui, -apple-system, sans-serif",
              letterSpacing: "-0.02em",
            }}
          >
            Ready to Build Better Habits?
          </Typography>
          <Typography
            variant="body1"
            sx={{
              mb: 8,
              fontSize: "20px",
              lineHeight: 1.6,
              maxWidth: "600px",
              mx: "auto",
              opacity: 0.95,
            }}
          >
            Join over 100,000 users who have already transformed their lives
            with HABITIX
          </Typography>
          <Box
            sx={{
              display: "flex",
              gap: 4,
              justifyContent: "center",
              flexWrap: "wrap",
            }}
          >
            <Button
              variant="contained"
              sx={{
                bgcolor: "white",
                color: "#8b7cf6",
                px: 6,
                py: 2.5,
                textTransform: "none",
                fontSize: "18px",
                fontWeight: 600,
                borderRadius: "50px",
                minWidth: "180px",
                transition: "all 0.2s ease",
                "&:hover": {
                  bgcolor: "#f8f9ff",
                  transform: "translateY(-2px)",
                  boxShadow: "0 15px 35px rgba(255,255,255,0.25)",
                },
              }}
              endIcon={<ArrowForward />}
            >
              Start Free Trial
            </Button>
            <Button
              variant="outlined"
              sx={{
                color: "white",
                borderColor: "white",
                borderWidth: "2px",
                px: 6,
                py: 2.5,
                textTransform: "none",
                fontSize: "18px",
                fontWeight: 600,
                borderRadius: "50px",
                minWidth: "180px",
                transition: "all 0.2s ease",
                "&:hover": {
                  bgcolor: "rgba(255,255,255,0.15)",
                  transform: "translateY(-2px)",
                  borderColor: "white",
                },
              }}
            >
              Learn More
            </Button>
          </Box>
        </Box>
      </Container>

      <AutoNotificationPrompt />
    </Box>
  );
}
