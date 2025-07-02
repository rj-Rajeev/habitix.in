"use client"

import { useState } from "react"
import RoadmapTree from "@/components/roadmap-tree"
import { ThemeProvider, createTheme } from "@mui/material/styles"
import CssBaseline from "@mui/material/CssBaseline"

const theme = createTheme({
  palette: {
    primary: {
      main: "#6366f1",
    },
    secondary: {
      main: "#8b5cf6",
    },
  },
})

interface Task {
  id: string
  text: string
  completed: boolean
}

interface Day {
  day: number
  tasks: Task[]
}

const initialRoadmap: Day[] = [
  {
    day: 1,
    tasks: [
      { id: "1-1", text: "Set up development environment", completed: true },
      { id: "1-2", text: "Learn basic React concepts", completed: true },
      { id: "1-3", text: "Create your first component", completed: false },
    ],
  },
  {
    day: 2,
    tasks: [
      { id: "2-1", text: "Understand JSX syntax", completed: false },
      { id: "2-2", text: "Work with props and state", completed: false },
      { id: "2-3", text: "Handle events in React", completed: false },
      { id: "2-4", text: "Practice with forms", completed: false },
    ],
  },
  {
    day: 3,
    tasks: [
      { id: "3-1", text: "Learn about React hooks", completed: false },
      { id: "3-2", text: "Implement useEffect", completed: false },
      { id: "3-3", text: "Build a todo app", completed: false },
    ],
  },
  {
    day: 4,
    tasks: [
      { id: "4-1", text: "Explore React Router", completed: false },
      { id: "4-2", text: "Create multi-page application", completed: false },
      { id: "4-3", text: "Add navigation components", completed: false },
    ],
  },
  {
    day: 5,
    tasks: [
      { id: "5-1", text: "Learn state management", completed: false },
      { id: "5-2", text: "Implement Context API", completed: false },
      { id: "5-3", text: "Build final project", completed: false },
    ],
  },
]

export default function Home() {
  const [roadmap, setRoadmap] = useState<Day[]>(initialRoadmap)

  const handleToggle = (dayNumber: number, task: Task) => {
    setRoadmap((prev) =>
      prev.map((day) =>
        day.day === dayNumber
          ? {
              ...day,
              tasks: day.tasks.map((t) => (t.id === task.id ? { ...t, completed: !t.completed } : t)),
            }
          : day,
      ),
    )
  }

  const handleEdit = (dayNumber: number, task: Task, newText: string) => {
    setRoadmap((prev) =>
      prev.map((day) =>
        day.day === dayNumber
          ? {
              ...day,
              tasks: day.tasks.map((t) => (t.id === task.id ? { ...t, text: newText } : t)),
            }
          : day,
      ),
    )
  }

  const handleRemove = (dayNumber: number, task: Task) => {
    setRoadmap((prev) =>
      prev.map((day) =>
        day.day === dayNumber
          ? {
              ...day,
              tasks: day.tasks.filter((t) => t.id !== task.id),
            }
          : day,
      ),
    )
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <div className="min-h-screen">
        <RoadmapTree
          roadmap={roadmap}
          goalTitle="React Learning Roadmap"
          goalSubtitle="Master React in 5 days with hands-on practice"
          onToggle={handleToggle}
          onEdit={handleEdit}
          onRemove={handleRemove}
        />
      </div>
    </ThemeProvider>
  )
}
