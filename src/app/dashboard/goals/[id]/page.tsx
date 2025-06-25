"use client"

import type React from "react"

import { useState, useEffect } from "react"
import {
  Card,
  Chip,
  Avatar,
  IconButton,
  Tooltip,
  LinearProgress,
  Snackbar,
  Alert,
  Box,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Drawer,
  AppBar,
  Toolbar,
} from "@mui/material"
import {
  PlayArrow,
  Pause,
  Favorite,
  FavoriteBorder,
  Bolt,
  Chat,
  People,
  Schedule,
  Settings,
  VolumeUp,
  VolumeOff,
  CheckCircle,
  RadioButtonUnchecked,
  Camera,
  Check,
  Close,
  Lock,
  EmojiEvents,
  PersonAdd,
  Menu as MenuIcon,
} from "@mui/icons-material"
import { ThemeProvider, createTheme } from "@mui/material/styles"
import CssBaseline from "@mui/material/CssBaseline"
import { useParams } from "next/navigation"

// Types based on your schema
interface Task {
  _id: string
  title: string
  description: string
  isCompleted: boolean
  createdAt: Date
}

interface RoadmapDay {
  dayNumber: number
  date?: Date
  unlocked: boolean
  completed: boolean
  tasks: Task[]
  proof: {
    uploaded: boolean
    imageUrl?: string
    uploadedAt?: Date
  }
}

export default function RoadmapApp() {
  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [currentDay, setCurrentDay] = useState(1)
  const [progress, setProgress] = useState(0)
  const [likedTasks, setLikedTasks] = useState<string[]>([])
  const [snackbarOpen, setSnackbarOpen] = useState(false)
  const [snackbarMessage, setSnackbarMessage] = useState("")
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string>("")
  const [drawerOpen, setDrawerOpen] = useState(false)
  
  const params = useParams();

  // Theme matching the original design
  const theme = createTheme({
    palette: {
      mode: "light",
      background: {
        default: "#e2e8f0",
        paper: "#ffffff",
      },
    },
    shape: { borderRadius: 20 },
    breakpoints: {
      values: {
        xs: 0,
        sm: 600,
        md: 900,
        lg: 1200,
        xl: 1536,
      },
    },
  })

  // Sample roadmap data matching your schema
  const [roadmapData, setRoadmapData] = useState({
    _id: "roadmap_001",
    userId: "user_001",
    title: "30-Day Productivity Challenge",
    description: "Transform your daily habits and boost productivity",
    startDate: new Date(),
    targetDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    status: "in_progress" as const,
    roadmap: [
      {
        dayNumber: 1,
        date: new Date(),
        unlocked: true,
        completed: false,
        tasks: [
          {
            _id: "task_001",
            title: "Morning Routine Setup",
            description: "Create a 15-minute morning routine",
            isCompleted: false,
            createdAt: new Date(),
          },
          {
            _id: "task_002",
            title: "Workspace Organization",
            description: "Clean and organize your workspace",
            isCompleted: false,
            createdAt: new Date(),
          },
          {
            _id: "task_003",
            title: "Goal Setting",
            description: "Write down 3 specific monthly goals",
            isCompleted: false,
            createdAt: new Date(),
          },
          {
            _id: "task_004",
            title: "Digital Detox Hour",
            description: "Spend 1 hour without digital devices",
            isCompleted: false,
            createdAt: new Date(),
          },
          {
            _id: "task_005",
            title: "Evening Reflection",
            description: "Write 3 things you're grateful for",
            isCompleted: false,
            createdAt: new Date(),
          },
        ],
        proof: { uploaded: false },
      },
      {
        dayNumber: 2,
        unlocked: false,
        completed: false,
        tasks: [
          {
            _id: "task_006",
            title: "Time Blocking",
            description: "Plan your day using time blocks",
            isCompleted: false,
            createdAt: new Date(),
          },
          {
            _id: "task_007",
            title: "Priority Matrix",
            description: "Use Eisenhower Matrix for tasks",
            isCompleted: false,
            createdAt: new Date(),
          },
          {
            _id: "task_008",
            title: "Deep Work Session",
            description: "2 hours of focused work",
            isCompleted: false,
            createdAt: new Date(),
          },
        ],
        proof: { uploaded: false },
      },
      {
        dayNumber: 3,
        unlocked: false,
        completed: false,
        tasks: [
          {
            _id: "task_009",
            title: "Habit Tracking Setup",
            description: "Create a habit tracking system",
            isCompleted: false,
            createdAt: new Date(),
          },
          {
            _id: "task_010",
            title: "Energy Management",
            description: "Identify your peak energy hours",
            isCompleted: false,
            createdAt: new Date(),
          },
        ],
        proof: { uploaded: false },
      },
      {
        dayNumber: 4,
        unlocked: false,
        completed: false,
        tasks: [
          {
            _id: "task_011",
            title: "Weekly Review",
            description: "Review progress and adjust plans",
            isCompleted: false,
            createdAt: new Date(),
          },
        ],
        proof: { uploaded: false },
      },
    ],
    createdAt: new Date(),
    updatedAt: new Date(),
  })

  useEffect(() => {
    const fetchGoal = async () => {
      try {
        const res = await fetch(`/api/goals/${params.id}`); // Change ID dynamically if needed
        if (!res.ok) throw new Error("Failed to fetch goal");
        const data = await res.json();
        setRoadmapData(data);
        
      } catch (err) {
        console.error("Error fetching goal:", err);
      }
    };

    fetchGoal();
  }, []);

  

  // Navigation items
  const navigationItems = [
    { icon: <Bolt />, active: true, label: "Dashboard", color: "#000" },
    { icon: <Chat />, active: false, label: "Tasks", color: "#f97316" },
    { icon: <People />, active: false, label: "Community", color: "#6b7280" },
    { icon: <Schedule />, active: false, label: "Schedule", color: "#6b7280" },
    { icon: <Settings />, active: false, label: "Settings", color: "#6b7280" },
  ]

  // Get current day data
  const getCurrentDay = () => {
    return roadmapData.roadmap.find((day) => day.dayNumber === currentDay) || roadmapData.roadmap[0]
  }

  const currentDayData = getCurrentDay()

  // Calculate progress
  const getDayProgress = (day: RoadmapDay) => {
    const completedTasks = day.tasks.filter((task) => task.isCompleted).length
    return day.tasks.length > 0 ? (completedTasks / day.tasks.length) * 100 : 0
  }

  // Progress simulation when "playing"
  useEffect(() => {
    if (isPlaying) {
      const interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 100) {
            setIsPlaying(false)
            setSnackbarMessage("Day completed! 🎉")
            setSnackbarOpen(true)
            return 0
          }
          return prev + 2
        })
      }, 100)
      return () => clearInterval(interval)
    }
  }, [isPlaying])

  // Event handlers
  const handlePlayPause = () => {
    setIsPlaying(!isPlaying)
    setSnackbarMessage(isPlaying ? "Paused" : "Started working on tasks")
    setSnackbarOpen(true)
  }

  const handleTaskToggle = (taskId: string) => {
    setRoadmapData((prev) => ({
      ...prev,
      roadmap: prev.roadmap.map((day) => {
        if (day.dayNumber === currentDay) {
          const updatedTasks = day.tasks.map((task) =>
            task._id === taskId ? { ...task, isCompleted: !task.isCompleted } : task,
          )
          const allCompleted = updatedTasks.every((task) => task.isCompleted)

          // Unlock next day if current day is completed
          if (allCompleted) {
            const nextDayIndex = prev.roadmap.findIndex((d) => d.dayNumber === day.dayNumber + 1)
            if (nextDayIndex !== -1) {
              prev.roadmap[nextDayIndex].unlocked = true
            }
          }

          return {
            ...day,
            tasks: updatedTasks,
            completed: allCompleted,
          }
        }
        return day
      }),
    }))

    setSnackbarMessage("Task updated! 🎉")
    setSnackbarOpen(true)
  }

  const handleLike = (taskId: string) => {
    setLikedTasks((prev) => (prev.includes(taskId) ? prev.filter((id) => id !== taskId) : [...prev, taskId]))
    setSnackbarMessage("Task liked! ❤️")
    setSnackbarOpen(true)
  }

  const handleDayChange = (day: number) => {
    const dayData = roadmapData.roadmap.find((d) => d.dayNumber === day)
    if (dayData?.unlocked) {
      setCurrentDay(day)
    } else {
      setSnackbarMessage("Complete previous day to unlock!")
      setSnackbarOpen(true)
    }
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      const url = URL.createObjectURL(file)
      setPreviewUrl(url)
    }
  }

  const handleProofUpload = () => {
    if (selectedFile) {
      setRoadmapData((prev) => ({
        ...prev,
        roadmap: prev.roadmap.map((day) =>
          day.dayNumber === currentDay
            ? {
                ...day,
                proof: {
                  uploaded: true,
                  imageUrl: previewUrl,
                  uploadedAt: new Date(),
                },
              }
            : day,
        ),
      }))
      setUploadDialogOpen(false)
      setSnackbarMessage("Proof uploaded! 📸")
      setSnackbarOpen(true)
    }
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />

      {/* Mobile App Bar */}
      <AppBar
        position="sticky"
        elevation={0}
        sx={{
          backgroundColor: "white",
          borderBottom: "1px solid #e5e7eb",
          display: { xs: "flex", lg: "none" },
        }}
      >
        <Toolbar>
          <IconButton edge="start" onClick={() => setDrawerOpen(true)} aria-label="open menu" sx={{ color: "#1f2937" }}>
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 700, color: "#1f2937" }}>
            RoadmapPro
          </Typography>
        </Toolbar>
      </AppBar>

      {/* Mobile Navigation Drawer */}
      <Drawer anchor="left" open={drawerOpen} onClose={() => setDrawerOpen(false)}>
        <Box sx={{ width: 280, p: 3 }}>
          <Typography variant="h6" sx={{ mb: 3, fontWeight: 700, textAlign: "center" }}>
            Navigation
          </Typography>
          <div className="space-y-3">
            {navigationItems.map((item, index) => (
              <Button
                key={index}
                fullWidth
                startIcon={item.icon}
                sx={{
                  justifyContent: "flex-start",
                  p: 2,
                  borderRadius: 3,
                  backgroundColor: item.active ? item.color : "transparent",
                  color: item.active ? "white" : item.color,
                  "&:hover": {
                    backgroundColor: item.active ? item.color : "#f3f4f6",
                  },
                }}
              >
                {item.label}
              </Button>
            ))}
          </div>
        </Box>
      </Drawer>

      <div
        className="min-h-screen"
        style={{
          background: "linear-gradient(135deg, #e2e8f0 0%, #cbd5e1 100%)",
          // paddingTop: { xs: 0, lg: 24 },
        }}
      >
        <div className="max-w-7xl mx-auto p-3 lg:p-6">
          {/* Desktop Layout */}
          <div className="hidden lg:grid lg:grid-cols-12 gap-6 h-screen max-h-[900px]">
            {/* Left Sidebar - Desktop Only */}
            <div className="col-span-1">
              <Card
                className="h-full flex flex-col items-center py-6 px-2"
                sx={{
                  backgroundColor: "white",
                  borderRadius: "24px",
                  boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
                }}
              >
                <div className="space-y-4">
                  {navigationItems.map((item, index) => (
                    <Tooltip key={index} title={item.label} placement="right">
                      <IconButton
                        sx={{
                          width: 48,
                          height: 48,
                          backgroundColor: item.active ? item.color : "transparent",
                          color: item.active ? "white" : item.color,
                          borderRadius: index === 0 ? "12px" : index === 1 ? "50%" : "12px",
                          "&:hover": {
                            backgroundColor: item.active ? item.color : "#f3f4f6",
                            transform: "scale(1.1)",
                          },
                          transition: "all 0.2s",
                        }}
                      >
                        {item.icon}
                      </IconButton>
                    </Tooltip>
                  ))}
                </div>
              </Card>
            </div>

            {/* Main Content - Desktop */}
            <div className="col-span-7 space-y-6">
              {/* Day Navigation Header */}
              <Card
                sx={{
                  backgroundColor: "white",
                  borderRadius: "24px",
                  p: 3,
                  boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
                }}
              >
                <div className="flex items-center space-x-8">
                  <Bolt sx={{ fontSize: 28, color: "#000" }} />
                  {[1, 2, 3, 4].map((day) => {
                    const dayData = roadmapData.roadmap.find((d) => d.dayNumber === day)
                    const isActive = currentDay === day
                    const isUnlocked = dayData?.unlocked
                    const isCompleted = dayData?.completed

                    return (
                      <Button
                        key={day}
                        onClick={() => handleDayChange(day)}
                        disabled={!isUnlocked}
                        sx={{
                          color: isActive ? "#1f2937" : isUnlocked ? "#9ca3af" : "#d1d5db",
                          fontWeight: isActive ? 700 : 400,
                          fontSize: "1.1rem",
                          textTransform: "none",
                          "&:hover": {
                            backgroundColor: "transparent",
                            transform: isUnlocked ? "scale(1.05)" : "none",
                          },
                        }}
                      >
                        {!isUnlocked && <Lock sx={{ fontSize: 16, mr: 1 }} />}
                        Day {day} {day === 1 && "😊"}
                        {isCompleted && <CheckCircle sx={{ fontSize: 16, ml: 1, color: "#10b981" }} />}
                      </Button>
                    )
                  })}
                </div>
              </Card>

              {/* Main Task Card */}
              <Card
                sx={{
                  background: "linear-gradient(135deg, #bfdbfe 0%, #a7f3d0 100%)",
                  borderRadius: "24px",
                  p: 4,
                  boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
                }}
              >
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <Typography variant="h4" sx={{ fontWeight: 700, color: "#1f2937", mb: 1 }}>
                      Task {currentDayData.tasks.filter((t) => t.isCompleted).length + 1}/{currentDayData.tasks.length}
                    </Typography>
                    <Typography variant="body1" sx={{ color: "#6b7280" }}>
                      Daily productivity tasks
                    </Typography>
                  </div>
                  <IconButton
                    onClick={() => handleLike(currentDayData.tasks[0]?._id)}
                    sx={{
                      backgroundColor: likedTasks.includes(currentDayData.tasks[0]?._id) ? "#ef4444" : "white",
                      color: likedTasks.includes(currentDayData.tasks[0]?._id) ? "white" : "#6b7280",
                      width: 48,
                      height: 48,
                      borderRadius: "12px",
                      "&:hover": { transform: "scale(1.1)" },
                    }}
                  >
                    {likedTasks.includes(currentDayData.tasks[0]?._id) ? <Favorite /> : <FavoriteBorder />}
                  </IconButton>
                </div>

                {/* Task Image Area */}
                <Box
                  sx={{
                    position: "relative",
                    borderRadius: "20px",
                    overflow: "hidden",
                    mb: 4,
                    height: 300,
                  }}
                >
                  <img
                    src="/1.webp"
                    alt="Productivity workspace setup"
                    className="w-full h-full object-cover"
                  />
                  <Box
                    sx={{
                      position: "absolute",
                      inset: 0,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      backgroundColor: "rgba(0,0,0,0.1)",
                    }}
                  >
                    <IconButton
                      onClick={handlePlayPause}
                      sx={{
                        backgroundColor: "rgba(255,255,255,0.9)",
                        color: "#1f2937",
                        width: 80,
                        height: 80,
                        "&:hover": {
                          backgroundColor: "white",
                          transform: "scale(1.1)",
                        },
                      }}
                    >
                      {isPlaying ? <Pause sx={{ fontSize: 40 }} /> : <PlayArrow sx={{ fontSize: 40 }} />}
                    </IconButton>
                  </Box>
                  <IconButton
                    onClick={() => setIsMuted(!isMuted)}
                    sx={{
                      position: "absolute",
                      top: 16,
                      right: 16,
                      backgroundColor: "rgba(255,255,255,0.2)",
                      color: "white",
                      "&:hover": { backgroundColor: "rgba(255,255,255,0.3)" },
                    }}
                  >
                    {isMuted ? <VolumeOff /> : <VolumeUp />}
                  </IconButton>
                </Box>

                {/* Progress Bar */}
                {isPlaying && (
                  <Box sx={{ mb: 4 }}>
                    <LinearProgress
                      variant="determinate"
                      value={progress}
                      sx={{
                        height: 8,
                        borderRadius: 4,
                        backgroundColor: "rgba(255,255,255,0.3)",
                        "& .MuiLinearProgress-bar": { borderRadius: 4 },
                      }}
                    />
                  </Box>
                )}

                {/* Stats Cards */}
                <div className="grid grid-cols-4 gap-4">
                  <Card sx={{ backgroundColor: "#fef3c7", borderRadius: "20px", p: 2, textAlign: "center" }}>
                    <Typography sx={{ fontSize: "1.5rem", mb: 1 }}>🏃</Typography>
                    <Typography variant="caption" sx={{ color: "#6b7280", fontWeight: 600, display: "block" }}>
                      CATEGORY
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>
                      Productivity
                    </Typography>
                  </Card>

                  <Card sx={{ backgroundColor: "#e9d5ff", borderRadius: "20px", p: 2, textAlign: "center" }}>
                    <Typography sx={{ fontSize: "1.5rem", mb: 1 }}>⭐</Typography>
                    <Typography variant="caption" sx={{ color: "#6b7280", fontWeight: 600, display: "block" }}>
                      DIFFICULTY
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>
                      {currentDay}
                    </Typography>
                  </Card>

                  <Card sx={{ backgroundColor: "#d1fae5", borderRadius: "20px", p: 2, textAlign: "center" }}>
                    <Typography sx={{ fontSize: "1.5rem", mb: 1 }}>⏱️</Typography>
                    <Typography variant="caption" sx={{ color: "#6b7280", fontWeight: 600, display: "block" }}>
                      TOTAL TASKS
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>
                      {currentDayData.tasks.length}
                    </Typography>
                  </Card>

                  <Card sx={{ backgroundColor: "#fce7f3", borderRadius: "20px", p: 2, textAlign: "center" }}>
                    <Typography sx={{ fontSize: "1.5rem", mb: 1 }}>⏰</Typography>
                    <Typography variant="caption" sx={{ color: "#6b7280", fontWeight: 600, display: "block" }}>
                      COMPLETED
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>
                      {currentDayData.tasks.filter((t) => t.isCompleted).length}
                    </Typography>
                  </Card>
                </div>
              </Card>

              {/* Description Section */}
              <Card
                sx={{
                  backgroundColor: "white",
                  borderRadius: "24px",
                  p: 4,
                  boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
                }}
              >
                <Typography variant="h6" sx={{ mb: 3, fontWeight: 700, color: "#1f2937" }}>
                  DESCRIPTION
                </Typography>
                <div className="flex items-start space-x-4 mb-4">
                  <Avatar sx={{ bgcolor: "#1f2937", width: 32, height: 32, fontSize: "0.875rem" }}>1</Avatar>
                  <div>
                    <Typography variant="body1" sx={{ fontWeight: 600, mb: 1 }}>
                      Start point:
                    </Typography>
                    <Typography variant="body2" sx={{ color: "#6b7280" }}>
                      Begin with small, manageable tasks that build momentum for the day ahead.
                    </Typography>
                  </div>
                </div>
                <div className="flex items-start space-x-4">
                  <Avatar sx={{ bgcolor: "#9ca3af", width: 32, height: 32, fontSize: "0.875rem" }}>2</Avatar>
                  <div>
                    <Typography variant="body1" sx={{ fontWeight: 600, mb: 1 }}>
                      Actions:
                    </Typography>
                    <Typography variant="body2" sx={{ color: "#6b7280" }}>
                      Complete each task mindfully, upload proof of completion, and unlock the next day's challenges.
                    </Typography>
                  </div>
                </div>
              </Card>
            </div>

            {/* Right Sidebar - Desktop */}
            <div className="col-span-4 space-y-6">
              {/* Tasks List */}
              <Card
                sx={{
                  backgroundColor: "white",
                  borderRadius: "24px",
                  p: 3,
                  boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
                }}
              >
                <Typography variant="h6" sx={{ mb: 3, fontWeight: 700, color: "#1f2937" }}>
                  TASKS
                </Typography>
                <div className="space-y-3">
                  {currentDayData.tasks.map((task, index) => {
                    const colors = ["#bfdbfe", "#ddd6fe", "#a7f3d0", "#fecaca", "#fed7aa"]
                    return (
                      <div
                        key={task._id}
                        className="flex items-center space-x-3 p-3 rounded-2xl hover:bg-gray-50 transition-all cursor-pointer"
                        onClick={() => handleTaskToggle(task._id)}
                        style={{ backgroundColor: colors[index % colors.length] }}
                      >
                        <div
                          className="w-12 h-12 rounded-2xl flex items-center justify-center"
                          style={{ backgroundColor: colors[index % colors.length] }}
                        >
                          <Typography sx={{ fontSize: "1.2rem" }}>
                            {index === 0 ? "🧠" : index === 1 ? "🎯" : index === 2 ? "📝" : index === 3 ? "📱" : "🙏"}
                          </Typography>
                        </div>
                        <div className="flex-1">
                          <Typography variant="body1" sx={{ fontWeight: 600, color: "#1f2937" }}>
                            {task.title}
                          </Typography>
                          <div className="flex items-center space-x-3 text-sm">
                            <Typography variant="caption" sx={{ color: "#6b7280" }}>
                              ⏱️ 15 mins
                            </Typography>
                            <Typography variant="caption" sx={{ color: "#6b7280" }}>
                              🔥 Focus
                            </Typography>
                          </div>
                        </div>
                        {task.isCompleted ? (
                          <CheckCircle sx={{ color: "#10b981" }} />
                        ) : (
                          <RadioButtonUnchecked sx={{ color: "#d1d5db" }} />
                        )}
                      </div>
                    )
                  })}
                </div>
              </Card>

              {/* User Level */}
              <Card
                sx={{
                  background: "linear-gradient(135deg, #e9d5ff 0%, #fce7f3 100%)",
                  borderRadius: "24px",
                  p: 3,
                  boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
                }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Typography sx={{ fontSize: "2rem" }}>😊</Typography>
                    <div>
                      <Typography variant="h6" sx={{ fontWeight: 700, color: "#1f2937" }}>
                        BEGINNER
                      </Typography>
                      <Typography variant="body2" sx={{ color: "#6b7280" }}>
                        YOUR LEVEL
                      </Typography>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <EmojiEvents sx={{ color: "#f59e0b" }} />
                    <Typography variant="h6" sx={{ fontWeight: 700, color: "#1f2937" }}>
                      {Math.round(getDayProgress(currentDayData) * 10)}
                    </Typography>
                  </div>
                </div>
              </Card>

              {/* Friends */}
              <Card
                sx={{
                  backgroundColor: "white",
                  borderRadius: "24px",
                  p: 3,
                  boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
                }}
              >
                <div className="flex items-center justify-between mb-4">
                  <Typography variant="h6" sx={{ fontWeight: 700, color: "#1f2937" }}>
                    MY FRIENDS
                  </Typography>
                  <Chip label="+10" sx={{ backgroundColor: "#f97316", color: "white", fontWeight: 600 }} />
                </div>
                <div className="flex items-center space-x-2">
                  {["A", "S", "M", "E"].map((initial, index) => {
                    const colors = ["#6366f1", "#ec4899", "#10b981", "#f59e0b"]
                    return (
                      <Avatar
                        key={index}
                        sx={{
                          bgcolor: colors[index],
                          width: 40,
                          height: 40,
                          cursor: "pointer",
                          "&:hover": { transform: "scale(1.1)" },
                          transition: "transform 0.2s",
                        }}
                      >
                        {initial}
                      </Avatar>
                    )
                  })}
                  <IconButton
                    sx={{
                      backgroundColor: "#f97316",
                      color: "white",
                      width: 40,
                      height: 40,
                      ml: 2,
                      "&:hover": {
                        backgroundColor: "#ea580c",
                        transform: "scale(1.1)",
                      },
                    }}
                  >
                    <PersonAdd />
                  </IconButton>
                </div>
              </Card>
            </div>
          </div>

          {/* Mobile Layout */}
          <div className="lg:hidden space-y-4">
            {/* Mobile Day Navigation */}
            <Card sx={{ backgroundColor: "white", borderRadius: "20px", p: 3 }}>
              <div className="flex items-center justify-between mb-4">
                <Bolt sx={{ fontSize: 24, color: "#000" }} />
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  Day {currentDay}
                </Typography>
              </div>
              <div className="flex space-x-2 overflow-x-auto pb-2">
                {[1, 2, 3, 4].map((day) => {
                  const dayData = roadmapData.roadmap.find((d) => d.dayNumber === day)
                  const isActive = currentDay === day
                  const isUnlocked = dayData?.unlocked
                  const isCompleted = dayData?.completed

                  return (
                    <Button
                      key={day}
                      onClick={() => handleDayChange(day)}
                      disabled={!isUnlocked}
                      size="small"
                      sx={{
                        minWidth: "80px",
                        color: isActive ? "#1f2937" : isUnlocked ? "#9ca3af" : "#d1d5db",
                        fontWeight: isActive ? 700 : 400,
                        fontSize: "0.9rem",
                        textTransform: "none",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {!isUnlocked && <Lock sx={{ fontSize: 14, mr: 0.5 }} />}
                      Day {day} {day === 1 && "😊"}
                      {isCompleted && <CheckCircle sx={{ fontSize: 14, ml: 0.5, color: "#10b981" }} />}
                    </Button>
                  )
                })}
              </div>
            </Card>

            {/* Mobile Main Task Card */}
            <Card
              sx={{
                background: "linear-gradient(135deg, #bfdbfe 0%, #a7f3d0 100%)",
                borderRadius: "20px",
                p: 3,
              }}
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <Typography variant="h5" sx={{ fontWeight: 700, color: "#1f2937", mb: 1 }}>
                    Task {currentDayData.tasks.filter((t) => t.isCompleted).length + 1}/{currentDayData.tasks.length}
                  </Typography>
                  <Typography variant="body2" sx={{ color: "#6b7280" }}>
                    Daily productivity tasks
                  </Typography>
                </div>
                <IconButton
                  onClick={() => handleLike(currentDayData.tasks[0]?._id)}
                  sx={{
                    backgroundColor: likedTasks.includes(currentDayData.tasks[0]?._id) ? "#ef4444" : "white",
                    color: likedTasks.includes(currentDayData.tasks[0]?._id) ? "white" : "#6b7280",
                    width: 40,
                    height: 40,
                    borderRadius: "10px",
                  }}
                >
                  {likedTasks.includes(currentDayData.tasks[0]?._id) ? <Favorite /> : <FavoriteBorder />}
                </IconButton>
              </div>

              {/* Mobile Image Area */}
              <Box
                sx={{
                  position: "relative",
                  borderRadius: "16px",
                  overflow: "hidden",
                  mb: 3,
                  height: 200,
                }}
              >
                <img
                  src="/fitness-hero.webp"
                  alt="Productivity workspace setup"
                  className="w-full h-full object-cover"
                />
                <Box
                  sx={{
                    position: "absolute",
                    inset: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: "rgba(0,0,0,0.1)",
                  }}
                >
                  <IconButton
                    onClick={handlePlayPause}
                    sx={{
                      backgroundColor: "rgba(255,255,255,0.9)",
                      color: "#1f2937",
                      width: 60,
                      height: 60,
                    }}
                  >
                    {isPlaying ? <Pause sx={{ fontSize: 30 }} /> : <PlayArrow sx={{ fontSize: 30 }} />}
                  </IconButton>
                </Box>
                <IconButton
                  onClick={() => setIsMuted(!isMuted)}
                  sx={{
                    position: "absolute",
                    top: 12,
                    right: 12,
                    backgroundColor: "rgba(255,255,255,0.2)",
                    color: "white",
                    width: 36,
                    height: 36,
                  }}
                >
                  {isMuted ? <VolumeOff sx={{ fontSize: 20 }} /> : <VolumeUp sx={{ fontSize: 20 }} />}
                </IconButton>
              </Box>

              {/* Mobile Progress Bar */}
              {isPlaying && (
                <Box sx={{ mb: 3 }}>
                  <LinearProgress
                    variant="determinate"
                    value={progress}
                    sx={{
                      height: 6,
                      borderRadius: 3,
                      backgroundColor: "rgba(255,255,255,0.3)",
                      "& .MuiLinearProgress-bar": { borderRadius: 3 },
                    }}
                  />
                </Box>
              )}

              {/* Mobile Stats Cards */}
              <div className="grid grid-cols-2 gap-3">
                <Card sx={{ backgroundColor: "#fef3c7", borderRadius: "16px", p: 2, textAlign: "center" }}>
                  <Typography sx={{ fontSize: "1.2rem", mb: 1 }}>🏃</Typography>
                  <Typography variant="caption" sx={{ color: "#6b7280", fontWeight: 600, display: "block" }}>
                    CATEGORY
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700 }}>
                    Productivity
                  </Typography>
                </Card>

                <Card sx={{ backgroundColor: "#e9d5ff", borderRadius: "16px", p: 2, textAlign: "center" }}>
                  <Typography sx={{ fontSize: "1.2rem", mb: 1 }}>⭐</Typography>
                  <Typography variant="caption" sx={{ color: "#6b7280", fontWeight: 600, display: "block" }}>
                    DIFFICULTY
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700 }}>
                    {currentDay}
                  </Typography>
                </Card>

                <Card sx={{ backgroundColor: "#d1fae5", borderRadius: "16px", p: 2, textAlign: "center" }}>
                  <Typography sx={{ fontSize: "1.2rem", mb: 1 }}>⏱️</Typography>
                  <Typography variant="caption" sx={{ color: "#6b7280", fontWeight: 600, display: "block" }}>
                    TOTAL TASKS
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700 }}>
                    {currentDayData.tasks.length}
                  </Typography>
                </Card>

                <Card sx={{ backgroundColor: "#fce7f3", borderRadius: "16px", p: 2, textAlign: "center" }}>
                  <Typography sx={{ fontSize: "1.2rem", mb: 1 }}>⏰</Typography>
                  <Typography variant="caption" sx={{ color: "#6b7280", fontWeight: 600, display: "block" }}>
                    COMPLETED
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700 }}>
                    {currentDayData.tasks.filter((t) => t.isCompleted).length}
                  </Typography>
                </Card>
              </div>
            </Card>

            {/* Mobile Tasks List */}
            <Card sx={{ backgroundColor: "white", borderRadius: "20px", p: 3 }}>
              <Typography variant="h6" sx={{ mb: 3, fontWeight: 700, color: "#1f2937" }}>
                TASKS
              </Typography>
              <div className="space-y-3">
                {currentDayData.tasks.map((task, index) => {
                  const colors = ["#bfdbfe", "#ddd6fe", "#a7f3d0", "#fecaca", "#fed7aa"]
                  return (
                    <div
                      key={task._id}
                      className="flex items-center space-x-3 p-3 rounded-xl hover:bg-gray-50 transition-all cursor-pointer"
                      onClick={() => handleTaskToggle(task._id)}
                      style={{ backgroundColor: colors[index % colors.length] }}
                    >
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center"
                        style={{ backgroundColor: colors[index % colors.length] }}
                      >
                        <Typography sx={{ fontSize: "1rem" }}>
                          {index === 0 ? "🧠" : index === 1 ? "🎯" : index === 2 ? "📝" : index === 3 ? "📱" : "🙏"}
                        </Typography>
                      </div>
                      <div className="flex-1">
                        <Typography variant="body2" sx={{ fontWeight: 600, color: "#1f2937" }}>
                          {task.title}
                        </Typography>
                        <Typography variant="caption" sx={{ color: "#6b7280" }}>
                          ⏱️ 15 mins • 🔥 Focus
                        </Typography>
                      </div>
                      {task.isCompleted ? (
                        <CheckCircle sx={{ color: "#10b981", fontSize: 20 }} />
                      ) : (
                        <RadioButtonUnchecked sx={{ color: "#d1d5db", fontSize: 20 }} />
                      )}
                    </div>
                  )
                })}
              </div>
            </Card>

            {/* Mobile User Level */}
            <Card
              sx={{
                background: "linear-gradient(135deg, #e9d5ff 0%, #fce7f3 100%)",
                borderRadius: "20px",
                p: 3,
              }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Typography sx={{ fontSize: "1.5rem" }}>😊</Typography>
                  <div>
                    <Typography variant="h6" sx={{ fontWeight: 700, color: "#1f2937" }}>
                      BEGINNER
                    </Typography>
                    <Typography variant="body2" sx={{ color: "#6b7280" }}>
                      YOUR LEVEL
                    </Typography>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <EmojiEvents sx={{ color: "#f59e0b" }} />
                  <Typography variant="h6" sx={{ fontWeight: 700, color: "#1f2937" }}>
                    {Math.round(getDayProgress(currentDayData) * 10)}
                  </Typography>
                </div>
              </div>
            </Card>

            {/* Mobile Friends */}
            <Card sx={{ backgroundColor: "white", borderRadius: "20px", p: 3 }}>
              <div className="flex items-center justify-between mb-4">
                <Typography variant="h6" sx={{ fontWeight: 700, color: "#1f2937" }}>
                  MY FRIENDS
                </Typography>
                <Chip label="+10" sx={{ backgroundColor: "#f97316", color: "white", fontWeight: 600 }} />
              </div>
              <div className="flex items-center space-x-2">
                {["A", "S", "M", "E"].map((initial, index) => {
                  const colors = ["#6366f1", "#ec4899", "#10b981", "#f59e0b"]
                  return (
                    <Avatar
                      key={index}
                      sx={{
                        bgcolor: colors[index],
                        width: 36,
                        height: 36,
                        fontSize: "0.875rem",
                        cursor: "pointer",
                        "&:hover": { transform: "scale(1.1)" },
                        transition: "transform 0.2s",
                      }}
                    >
                      {initial}
                    </Avatar>
                  )
                })}
                <IconButton
                  sx={{
                    backgroundColor: "#f97316",
                    color: "white",
                    width: 36,
                    height: 36,
                    ml: 2,
                    "&:hover": {
                      backgroundColor: "#ea580c",
                      transform: "scale(1.1)",
                    },
                  }}
                >
                  <PersonAdd sx={{ fontSize: 18 }} />
                </IconButton>
              </div>
            </Card>

            {/* Mobile Description */}
            <Card sx={{ backgroundColor: "white", borderRadius: "20px", p: 3 }}>
              <Typography variant="h6" sx={{ mb: 3, fontWeight: 700, color: "#1f2937" }}>
                DESCRIPTION
              </Typography>
              <div className="space-y-3">
                <div className="flex items-start space-x-3">
                  <Avatar sx={{ bgcolor: "#1f2937", width: 28, height: 28, fontSize: "0.75rem" }}>1</Avatar>
                  <div>
                    <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
                      Start point:
                    </Typography>
                    <Typography variant="body2" sx={{ color: "#6b7280", fontSize: "0.875rem" }}>
                      Begin with small, manageable tasks that build momentum for the day ahead.
                    </Typography>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <Avatar sx={{ bgcolor: "#9ca3af", width: 28, height: 28, fontSize: "0.75rem" }}>2</Avatar>
                  <div>
                    <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
                      Actions:
                    </Typography>
                    <Typography variant="body2" sx={{ color: "#6b7280", fontSize: "0.875rem" }}>
                      Complete each task mindfully, upload proof of completion, and unlock the next day's challenges.
                    </Typography>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* Upload Dialog */}
        <Dialog open={uploadDialogOpen} onClose={() => setUploadDialogOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Upload Completion Proof</DialogTitle>
          <DialogContent>
            <Box sx={{ textAlign: "center", py: 3 }}>
              <input
                accept="image/*"
                style={{ display: "none" }}
                id="proof-upload"
                type="file"
                onChange={handleFileSelect}
              />
              <label htmlFor="proof-upload">
                <Button variant="outlined" component="span" startIcon={<Camera />} sx={{ mb: 2 }}>
                  Select Image
                </Button>
              </label>
              {previewUrl && (
                <Box sx={{ mt: 2 }}>
                  <img
                    src={previewUrl || "/placeholder.svg"}
                    alt="Preview"
                    className="w-full max-w-xs mx-auto rounded-lg"
                  />
                </Box>
              )}
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setUploadDialogOpen(false)} startIcon={<Close />}>
              Cancel
            </Button>
            <Button onClick={handleProofUpload} variant="contained" disabled={!selectedFile} startIcon={<Check />}>
              Upload
            </Button>
          </DialogActions>
        </Dialog>

        {/* Snackbar */}
        <Snackbar
          open={snackbarOpen}
          autoHideDuration={3000}
          onClose={() => setSnackbarOpen(false)}
          anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        >
          <Alert onClose={() => setSnackbarOpen(false)} severity="success" variant="filled">
            {snackbarMessage}
          </Alert>
        </Snackbar>
      </div>
    </ThemeProvider>
  )
}
