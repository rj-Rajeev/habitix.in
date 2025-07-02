"use client"

import { useState } from "react"
import { IconButton, TextField, Chip, Collapse, Button } from "@mui/material"
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  CheckCircle as CheckCircleIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  RadioButtonUnchecked as RadioButtonUncheckedIcon,
} from "@mui/icons-material"

interface Task {
  id: string
  text: string
  completed: boolean
}

interface Day {
  day: number
  tasks: Task[]
}

interface Props {
  roadmap: Day[]
  goalTitle?: string
  goalSubtitle?: string
  onToggle?: (day: number, task: Task) => void
  onEdit?: (day: number, task: Task, newText: string) => void
  onRemove?: (day: number, task: Task) => void
}

export default function RoadmapTree({
  roadmap,
  goalTitle = "Roadmap",
  goalSubtitle = "Your learning journey",
  onToggle = () => {},
  onEdit = () => {},
  onRemove = () => {},
}: Props) {
  const [editingTask, setEditingTask] = useState<string | null>(null)
  const [editText, setEditText] = useState("")
  const [expandedDays, setExpandedDays] = useState<Set<number>>(new Set([1]))
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null)

  const handleToggleDay = (day: number) => {
    const newExpanded = new Set(expandedDays)
    if (newExpanded.has(day)) {
      newExpanded.delete(day)
    } else {
      newExpanded.add(day)
    }
    setExpandedDays(newExpanded)
  }

  const handleTaskToggle = (day: number, task: Task) => {
    onToggle(day, task)
  }

  const handleEditStart = (task: Task) => {
    setEditingTask(task.id)
    setEditText(task.text)
    setShowDeleteConfirm(null)
  }

  const handleEditSave = (day: number, task: Task) => {
    if (editText.trim()) {
      onEdit(day, task, editText.trim())
    }
    setEditingTask(null)
    setEditText("")
  }

  const handleEditCancel = () => {
    setEditingTask(null)
    setEditText("")
  }

  const handleDeleteStart = (taskId: string) => {
    setShowDeleteConfirm(taskId)
    setEditingTask(null)
  }

  const handleDeleteConfirm = (day: number, task: Task) => {
    onRemove(day, task)
    setShowDeleteConfirm(null)
  }

  const handleDeleteCancel = () => {
    setShowDeleteConfirm(null)
  }

  const getCompletionStatus = (tasks: Task[]) => {
    const completed = tasks.filter((task) => task.completed).length
    const total = tasks.length
    return { completed, total, percentage: total > 0 ? (completed / total) * 100 : 0 }
  }

  const getDayStatus = (dayData: Day, dayIndex: number) => {
    const { percentage } = getCompletionStatus(dayData.tasks)
    if (percentage === 100) return "completed"
    if (dayIndex === 0 || (dayIndex > 0 && getCompletionStatus(roadmap[dayIndex - 1].tasks).percentage === 100)) {
      return "current"
    }
    return "upcoming"
  }

  return (
    <div className="min-h-screen bg-gradient-to-tr from-purple-300 via-purple-100 to-indigo-100 py-8 px-4">
      <div className="max-w-lg mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">{goalTitle}</h1>
          <p className="text-gray-600 text-lg">{goalSubtitle}</p>
        </div>

        {/* Timeline */}
        <div className="relative">
          {/* Vertical Line */}
          <div className="absolute left-8 top-0 bottom-0 w-1 bg-gradient-to-b from-green-400 via-purple-400 to-gray-300 rounded-full"></div>

          {roadmap.map((dayData, dayIndex) => {
            const { completed, total, percentage } = getCompletionStatus(dayData.tasks)
            const isExpanded = expandedDays.has(dayData.day)
            const status = getDayStatus(dayData, dayIndex)
            const isLast = dayIndex === roadmap.length - 1

            return (
              <div key={dayData.day} className={`relative ${!isLast ? "mb-12" : ""}`}>
                {/* Day Node */}
                <div className="flex items-start">
                  {/* Node Icon */}
                  <div className="relative z-10 flex-shrink-0 mr-6">
                    {status === "completed" ? (
                      <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-green-600 rounded-xl rotate-45 flex items-center justify-center shadow-xl border-4 border-white">
                        <span className="text-white font-bold text-lg -rotate-45">S{dayData.day}</span>
                      </div>
                    ) : status === "current" ? (
                      <div className="w-16 h-16 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full flex items-center justify-center shadow-xl border-4 border-white">
                        <span className="text-white font-bold text-lg">S{dayData.day}</span>
                      </div>
                    ) : (
                      <div className="w-16 h-16 bg-gradient-to-br from-gray-300 to-gray-400 rounded-full flex items-center justify-center shadow-xl border-4 border-white">
                        <span className="text-white font-bold text-lg">S{dayData.day}</span>
                      </div>
                    )}
                  </div>

                  {/* Day Content */}
                  <div className="flex-1 min-w-0">
                    <div
                      className="bg-white/95 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-white/50 cursor-pointer hover:shadow-2xl hover:scale-[1.02] transition-all duration-300"
                      onClick={() => handleToggleDay(dayData.day)}
                    >
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex-1">
                          <h3 className="font-bold text-gray-800 text-xl mb-2">Day {dayData.day}</h3>
                          <p className="text-gray-600 text-base mb-3">
                            {completed}/{total} tasks completed
                          </p>

                          {/* Progress Bar */}
                          <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden shadow-inner">
                            <div
                              className={`h-full transition-all duration-700 ease-out rounded-full ${
                                status === "completed"
                                  ? "bg-gradient-to-r from-green-400 to-green-600"
                                  : status === "current"
                                    ? "bg-gradient-to-r from-orange-400 to-orange-600"
                                    : "bg-gradient-to-r from-purple-400 to-indigo-500"
                              }`}
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>

                        <div className="flex items-center space-x-3 ml-6">
                          <Chip
                            label={`${Math.round(percentage)}%`}
                            size="medium"
                            sx={{
                              backgroundColor:
                                status === "completed" ? "#10b981" : status === "current" ? "#f59e0b" : "#8b5cf6",
                              color: "white",
                              fontWeight: "bold",
                              fontSize: "13px",
                              height: "32px",
                              minWidth: "60px",
                            }}
                          />
                          <IconButton
                            size="large"
                            sx={{
                              padding: "12px",
                              backgroundColor: "rgba(139, 92, 246, 0.1)",
                              "&:hover": { backgroundColor: "rgba(139, 92, 246, 0.2)" },
                            }}
                          >
                            {isExpanded ? (
                              <ExpandLessIcon sx={{ fontSize: 28, color: "#8b5cf6" }} />
                            ) : (
                              <ExpandMoreIcon sx={{ fontSize: 28, color: "#8b5cf6" }} />
                            )}
                          </IconButton>
                        </div>
                      </div>
                    </div>

                    {/* Tasks */}
                    <Collapse in={isExpanded} timeout={400}>
                      <div className="mt-6 space-y-4">
                        {dayData.tasks.map((task, taskIndex) => (
                          <div
                            key={task.id}
                            className={`relative ml-8 transition-all duration-300 ${
                              editingTask === task.id || showDeleteConfirm === task.id ? "transform scale-[1.02]" : ""
                            }`}
                            style={{ animationDelay: `${taskIndex * 150}ms` }}
                          >
                            {/* Task Branch */}
                            <div className="absolute -left-8 top-8 w-8 h-0.5 bg-gradient-to-r from-purple-400 to-purple-200"></div>
                            <div className="absolute -left-8 top-0 w-0.5 h-8 bg-gradient-to-b from-purple-400 to-purple-200"></div>

                            {/* Task Card */}
                            <div
                              className={`rounded-2xl border-2 transition-all duration-300 ${
                                task.completed
                                  ? "bg-green-50/90 border-green-300 shadow-lg"
                                  : "bg-white/90 border-purple-300 hover:border-purple-400 hover:shadow-xl"
                              } ${
                                editingTask === task.id
                                  ? "ring-4 ring-blue-200 border-blue-400"
                                  : showDeleteConfirm === task.id
                                    ? "ring-4 ring-red-200 border-red-400"
                                    : ""
                              }`}
                            >
                              {/* Edit Mode */}
                              {editingTask === task.id ? (
                                <div className="p-6">
                                  <div className="flex items-start space-x-4">
                                    <div className="flex-shrink-0 pt-2">
                                      <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                                        <EditIcon sx={{ fontSize: 16, color: "white" }} />
                                      </div>
                                    </div>
                                    <div className="flex-1">
                                      <h4 className="font-semibold text-blue-800 mb-3">Edit Task</h4>
                                      <TextField
                                        value={editText}
                                        onChange={(e) => setEditText(e.target.value)}
                                        onKeyDown={(e) => {
                                          if (e.key === "Enter" && !e.shiftKey) {
                                            e.preventDefault()
                                            handleEditSave(dayData.day, task)
                                          } else if (e.key === "Escape") {
                                            handleEditCancel()
                                          }
                                        }}
                                        variant="outlined"
                                        fullWidth
                                        autoFocus
                                        multiline
                                        maxRows={4}
                                        placeholder="Enter task description..."
                                        sx={{
                                          "& .MuiOutlinedInput-root": {
                                            fontSize: "16px",
                                            backgroundColor: "white",
                                            borderRadius: "12px",
                                            "& fieldset": { borderColor: "#3b82f6" },
                                            "&:hover fieldset": { borderColor: "#2563eb" },
                                            "&.Mui-focused fieldset": { borderColor: "#1d4ed8" },
                                          },
                                        }}
                                      />
                                      <div className="flex justify-end space-x-3 mt-4">
                                        <Button
                                          onClick={handleEditCancel}
                                          variant="outlined"
                                          sx={{
                                            borderColor: "#6b7280",
                                            color: "#6b7280",
                                            "&:hover": { borderColor: "#4b5563", backgroundColor: "#f9fafb" },
                                            borderRadius: "12px",
                                            textTransform: "none",
                                            fontWeight: 600,
                                            px: 3,
                                            py: 1,
                                          }}
                                        >
                                          Cancel
                                        </Button>
                                        <Button
                                          onClick={() => handleEditSave(dayData.day, task)}
                                          variant="contained"
                                          sx={{
                                            backgroundColor: "#3b82f6",
                                            "&:hover": { backgroundColor: "#2563eb" },
                                            borderRadius: "12px",
                                            textTransform: "none",
                                            fontWeight: 600,
                                            px: 3,
                                            py: 1,
                                          }}
                                        >
                                          Save Changes
                                        </Button>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              ) : showDeleteConfirm === task.id ? (
                                /* Delete Confirmation Mode */
                                <div className="p-6">
                                  <div className="flex items-start space-x-4">
                                    <div className="flex-shrink-0 pt-2">
                                      <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">
                                        <DeleteIcon sx={{ fontSize: 16, color: "white" }} />
                                      </div>
                                    </div>
                                    <div className="flex-1">
                                      <h4 className="font-semibold text-red-800 mb-2">Delete Task</h4>
                                      <p className="text-gray-700 mb-2 font-medium">"{task.text}"</p>
                                      <p className="text-red-600 text-sm mb-4">
                                        Are you sure you want to delete this task? This action cannot be undone.
                                      </p>
                                      <div className="flex justify-end space-x-3">
                                        <Button
                                          onClick={handleDeleteCancel}
                                          variant="outlined"
                                          sx={{
                                            borderColor: "#6b7280",
                                            color: "#6b7280",
                                            "&:hover": { borderColor: "#4b5563", backgroundColor: "#f9fafb" },
                                            borderRadius: "12px",
                                            textTransform: "none",
                                            fontWeight: 600,
                                            px: 3,
                                            py: 1,
                                          }}
                                        >
                                          Cancel
                                        </Button>
                                        <Button
                                          onClick={() => handleDeleteConfirm(dayData.day, task)}
                                          variant="contained"
                                          sx={{
                                            backgroundColor: "#ef4444",
                                            "&:hover": { backgroundColor: "#dc2626" },
                                            borderRadius: "12px",
                                            textTransform: "none",
                                            fontWeight: 600,
                                            px: 3,
                                            py: 1,
                                          }}
                                        >
                                          Delete Task
                                        </Button>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              ) : (
                                /* Normal Task Display */
                                <div className="p-5">
                                  <div className="flex items-start space-x-4">
                                    {/* Task Checkbox */}
                                    <div className="flex-shrink-0 pt-1">
                                      {task.completed ? (
                                        <CheckCircleIcon
                                          onClick={() => handleTaskToggle(dayData.day, task)}
                                          sx={{
                                            fontSize: 32,
                                            color: "#10b981",
                                            cursor: "pointer",
                                            minWidth: "48px",
                                            minHeight: "48px",
                                            padding: "8px",
                                            "&:hover": { transform: "scale(1.1)" },
                                            transition: "transform 0.2s",
                                          }}
                                        />
                                      ) : (
                                        <RadioButtonUncheckedIcon
                                          onClick={() => handleTaskToggle(dayData.day, task)}
                                          sx={{
                                            fontSize: 32,
                                            color: "#8b5cf6",
                                            cursor: "pointer",
                                            minWidth: "48px",
                                            minHeight: "48px",
                                            padding: "8px",
                                            "&:hover": { transform: "scale(1.1)" },
                                            transition: "transform 0.2s",
                                          }}
                                        />
                                      )}
                                    </div>

                                    {/* Task Content */}
                                    <div className="flex-1 min-w-0 pt-2">
                                      <p
                                        className={`text-lg leading-relaxed ${
                                          task.completed ? "text-green-700 line-through opacity-75" : "text-gray-800"
                                        }`}
                                      >
                                        {task.text}
                                      </p>
                                    </div>

                                    {/* Task Actions */}
                                    <div className="flex-shrink-0">
                                      <div className="flex space-x-2">
                                        <IconButton
                                          onClick={() => handleEditStart(task)}
                                          size="large"
                                          sx={{
                                            minWidth: "48px",
                                            minHeight: "48px",
                                            backgroundColor: "#8b5cf6",
                                            color: "white",
                                            "&:hover": {
                                              backgroundColor: "#7c3aed",
                                              transform: "scale(1.05)",
                                            },
                                            borderRadius: "12px",
                                            transition: "all 0.2s",
                                          }}
                                        >
                                          <EditIcon fontSize="small" />
                                        </IconButton>
                                        <IconButton
                                          onClick={() => handleDeleteStart(task.id)}
                                          size="large"
                                          sx={{
                                            minWidth: "48px",
                                            minHeight: "48px",
                                            backgroundColor: "#ef4444",
                                            color: "white",
                                            "&:hover": {
                                              backgroundColor: "#dc2626",
                                              transform: "scale(1.05)",
                                            },
                                            borderRadius: "12px",
                                            transition: "all 0.2s",
                                          }}
                                        >
                                          <DeleteIcon fontSize="small" />
                                        </IconButton>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </Collapse>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Bottom Spacing */}
        <div className="h-20"></div>
      </div>
    </div>
  )
}
