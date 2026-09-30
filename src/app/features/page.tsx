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
  BarChart,
  AutoAwesome,
  School,
  Today,
} from "@mui/icons-material";

const features = [
  {
    title: "Goal Plans",
    icon: <CheckCircle color="primary" fontSize="large" />,
    description:
      "Create a goal and follow its executable tasks, whether your plan is manual, AI-created, or course-based.",
  },
  {
    title: "AI-assisted Planning",
    icon: <AutoAwesome color="secondary" fontSize="large" />,
    description:
      "Use AI to turn a goal into a structured plan of tasks you can review and edit.",
  },
  {
    title: "Course Learning",
    icon: <School color="primary" fontSize="large" />,
    description:
      "Explore courses, work through lessons, and track lesson completion separately from goal progress.",
  },
  {
    title: "Daily Execution",
    icon: <Today color="primary" fontSize="large" />,
    description:
      "Use Today to focus on scheduled tasks and record their completion.",
  },
  {
    title: "Progress Summaries",
    icon: <BarChart color="info" fontSize="large" />,
    description:
      "Review executable task completion for goals and lesson completion for linked courses.",
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
