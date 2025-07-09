import {
  Container,
  Grid,
  Typography,
  Box,
  Card,
  CardContent,
  Chip,
  Divider,
} from "@mui/material";
import {
  CheckCircle,
  RocketLaunch,
  EmojiEvents,
  CameraAlt,
  Notifications,
  BarChart,
  CloudOff,
  PeopleAlt,
  AutoAwesome,
} from "@mui/icons-material";

const features = [
  {
    title: "Smart Habit Tracker",
    icon: <CheckCircle color="primary" fontSize="large" />,
    description:
      "Track habits effortlessly with ideal time targets and visual feedback on progress.",
  },
  {
    title: "AI Roadmap Generation",
    icon: <AutoAwesome color="secondary" fontSize="large" />,
    description:
      "Set goals and let AI break them into realistic daily steps you can follow.",
  },
  {
    title: "Gamified Levels",
    icon: <RocketLaunch color="success" fontSize="large" />,
    description:
      "Every day is a level. Complete your tasks to level up and stay engaged.",
  },
  {
    title: "Proof of Progress",
    icon: <CameraAlt color="action" fontSize="large" />,
    description:
      "Upload photos/videos as proof of completed tasks and celebrate your wins.",
  },
  {
    title: "Reward System",
    icon: <EmojiEvents color="warning" fontSize="large" />,
    description:
      "Earn small and big rewards for consistency and big achievements.",
  },
  {
    title: "Motivational Notifications",
    icon: <Notifications color="error" fontSize="large" />,
    description:
      "Receive smart reminders to work, refocus, and celebrate small wins.",
  },
  {
    title: "Productivity Analytics",
    icon: <BarChart color="info" fontSize="large" />,
    description:
      "View streaks, heatmaps, and performance stats to optimize your day.",
  },
  {
    title: "Offline Sync Support",
    icon: <CloudOff color="disabled" fontSize="large" />,
    description: "Work offline and sync automatically when back online.",
  },
  {
    title: "Social & Community (Coming Soon)",
    icon: <PeopleAlt fontSize="large" />,
    description:
      "Join groups, challenge friends, and grow together with community support.",
  },
];

export default function FeaturesPage() {
  return (
    <Box className="bg-gradient-to-br from-white to-green-50 py-16">
      <Container maxWidth="lg">
        <Box className="text-center mb-12">
          <Chip
            label="Features"
            color="success"
            className="mb-4 text-white font-semibold"
          />
          <Typography variant="h3" className="font-bold text-gray-800 mb-3">
            Why You'll Love Habitix 💚
          </Typography>
          <Typography variant="body1" className="text-gray-600">
            Your all-in-one growth companion, turning tasks into triumphs and
            habits into happiness.
          </Typography>
        </Box>

        <Grid container spacing={6}>
          {features.map((feature, index) => (
            <Grid size={{ xs: 12, sm: 6, md: 4 }} key={index}>
              <Card className="hover:scale-105 transition-transform duration-300 rounded-2xl shadow-md h-full">
                <CardContent className="flex flex-col items-start gap-4 h-full">
                  <Box className="bg-green-100 p-3 rounded-full">
                    {feature.icon}
                  </Box>
                  <Typography
                    variant="h6"
                    className="font-semibold text-gray-800"
                  >
                    {feature.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {feature.description}
                  </Typography>
                  <Divider className="w-full mt-auto" />
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>
    </Box>
  );
}
