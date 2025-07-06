"use client";
import {
  ThemeProvider,
  createTheme,
  CssBaseline,
  Container,
  Typography,
  Button,
  Box,
} from "@mui/material";
import { Check, Close } from "@mui/icons-material";
import PaymentButton from "@/components/razorpay/PaymentButton";

const theme = createTheme({
  palette: {
    primary: {
      main: "#7C3AED",
      light: "#A78BFA",
      dark: "#5B21B6",
    },
    background: {
      default: "#E0E7FF",
      paper: "#FFFFFF",
    },
    text: {
      primary: "#1E293B",
      secondary: "#64748B",
    },
  },
  typography: {
    fontFamily: "Inter, -apple-system, BlinkMacSystemFont, sans-serif",
    h1: {
      fontWeight: 700,
      fontSize: "3rem",
      color: "#1E293B",
      "@media (max-width:768px)": {
        fontSize: "2.5rem",
      },
    },
    h2: {
      fontWeight: 600,
      fontSize: "1.75rem",
      color: "#1E293B",
    },
    h3: {
      fontWeight: 700,
      fontSize: "3rem",
      color: "#1E293B",
    },
    subtitle1: {
      fontSize: "1.25rem",
      color: "#64748B",
      fontWeight: 400,
    },
    body1: {
      fontSize: "1.125rem",
      color: "#64748B",
    },
  },
  shape: {
    borderRadius: 24,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: "none",
          fontWeight: 600,
          borderRadius: 50,
          padding: "16px 32px",
          fontSize: "1.125rem",
          boxShadow: "none",
          "&:hover": {
            boxShadow: "none",
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 32,
          boxShadow: "0 4px 20px rgba(0, 0, 0, 0.08)",
          border: "none",
        },
      },
    },
  },
});

interface Feature {
  text: string;
  included: boolean;
}

interface PricingPlan {
  title: string;
  price: string;
  subtitle: string;
  features: Feature[];
  buttonText: string;
  buttonStyle: "outlined" | "contained";
  cardStyle: string;
}

const plans: PricingPlan[] = [
  {
    title: "Free Plan",
    price: "Free",
    subtitle: "15 Daily Credits",
    features: [
      { text: "Track up to 3 Habits", included: true },
      { text: "Basic Daily Streak & Progress", included: true },
      { text: "1 Daily Reminder Notification", included: true },
      { text: "Limited Motivation Quotes", included: true },
      { text: "AI Roadmap Generator", included: false },
      { text: "Upload & Share Task Proofs", included: false },
      { text: "Community Access", included: false },
    ],
    buttonText: "Get Started",
    buttonStyle: "outlined",
    cardStyle: "bg-white/90 backdrop-blur-sm",
  },
  {
    title: "Pro Plan",
    price: "₹9",
    subtitle: "Unlimited Access",
    features: [
      { text: "Unlimited Habits & Categories", included: true },
      { text: "Advanced Streaks & Progress Insights", included: true },
      { text: "Custom Reminders Per Habit", included: true },
      { text: "Smart Motivation Nudges & Rewards", included: true },
      { text: "AI Roadmap Generator Access", included: true },
      { text: "Upload & Share Proofs for Tasks", included: true },
      { text: "Access to Support Community", included: true },
    ],
    buttonText: "Upgrade Now",
    buttonStyle: "contained",
    cardStyle: "bg-white/60 backdrop-blur-sm border border-white/40",
  },
];

export default function PricingPage() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <div className="min-h-screen bg-gradient-to-br from-purple-200 via-indigo-200 to-blue-200">
        <Container maxWidth="lg" className="py-16 px-4">
          {/* Header */}
          <Box className="text-center mb-16 flex flex-col items-center">
            <Typography
              variant="h1"
              className="mb-4 mt-43 font-bold text-slate-800"
            >
              Choose Your Plan
            </Typography>
            <Typography
              variant="subtitle1"
              className="text-slate-600 max-w-md text-center"
            >
              Unlock your best self with the support Habitix provides
            </Typography>
          </Box>

          {/* Pricing Cards */}
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {plans.map((plan, index) => (
              <div key={index} className={`rounded-3xl p-8 ${plan.cardStyle}`}>
                {/* Plan Header */}
                <Box className="text-center mb-8">
                  <Typography variant="h2" className="mb-4 text-slate-800">
                    {plan.title}
                  </Typography>
                  <Box className="mb-2">
                    <Typography
                      variant="h3"
                      className="text-slate-800 font-bold inline"
                    >
                      {plan.price}
                    </Typography>
                    {index === 1 && (
                      <Typography
                        variant="h3"
                        className="text-slate-600 font-normal inline"
                      >
                        /mo
                      </Typography>
                    )}
                  </Box>
                  <Typography variant="body1" className="text-slate-600">
                    {plan.subtitle}
                  </Typography>
                </Box>

                {/* Features List */}
                <Box className="mb-8 space-y-4">
                  {plan.features.map((feature, featureIndex) => (
                    <div key={featureIndex} className="flex items-start gap-3">
                      <div className="flex-shrink-0 mt-1">
                        {feature.included ? (
                          <div className="w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center">
                            <Check className="text-white w-4 h-4" />
                          </div>
                        ) : (
                          <div className="w-6 h-6 bg-slate-300 rounded-full flex items-center justify-center">
                            <Close className="text-slate-500 w-4 h-4" />
                          </div>
                        )}
                      </div>
                      <Typography
                        variant="body1"
                        className={`text-slate-700 leading-relaxed ${
                          !feature.included ? "text-slate-400" : ""
                        }`}
                        style={{ whiteSpace: "pre-line" }}
                      >
                        {feature.text}
                      </Typography>
                    </div>
                  ))}
                </Box>

                {/* CTA Button */}
                <PaymentButton
                  amount={9}
                  buttonStyle={plan.buttonStyle}
                  buttonText={plan.buttonText}
                />
              </div>
            ))}
          </div>
        </Container>
      </div>
    </ThemeProvider>
  );
}
