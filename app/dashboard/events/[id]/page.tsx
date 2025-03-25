"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import DashboardHeader from "@/components/dashboard/header"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { CalendarDays, MapPin, Clock, Trash2, Star } from "lucide-react"
import { createClient } from "@/utils/supabase/client"
import { format } from "date-fns"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Label } from "@/components/ui/label"

interface TaskSkill {
  skills: {
    skill_id: number
    skill: string
    skill_icon: string
  }
}

interface SkillType {
  skill_id: number
  skill: string
  skill_icon: string
}

interface Task {
  task_id: number
  task_description: string
  task_status: string
  task_feedback: string
  original_status: string
  original_feedback: string
  skills: {
    skill_id: number
    skill: string
    skill_icon: string
  }[]
  commonSkills: {
    skill_id: number
    skill: string
    skill_icon: string
  }[]
  missingSkills: {
    skill_id: number
    skill: string
    skill_icon: string
  }[]
}

interface Event {
  id: number
  title: string
  description: string
  location: string
  location_type: string
  thumbnail_image: string
  start_date: string
  end_date: string
  registration_deadline: string
  formattedDate: string
  formattedTime: string
}

export default function EventDetailsPage() {
  const params = useParams()
  const [event, setEvent] = useState<Event | null>(null)
  const [unassignedTasks, setUnassignedTasks] = useState<Task[]>([])
  const [assignedTasks, setAssignedTasks] = useState<Task[]>([])
  const [selectedTasks, setSelectedTasks] = useState<number[]>([])
  const [loading, setLoading] = useState(true)
  const [hasChanges, setHasChanges] = useState(false)
  const supabase = createClient()
  const [volunteerSkills, setVolunteerSkills] = useState<number[]>([])
  const [feedback, setFeedback] = useState("")
  const [starRating, setStarRating] = useState(0)
  const [existingFeedback, setExistingFeedback] = useState<{feedback: string, star_rating: number} | null>(null)
  const [submittingFeedback, setSubmittingFeedback] = useState(false)

  // Format date and time for display
  const formatEventDate = (startDate: string, endDate: string) => {
    const start = new Date(startDate)
    const end = new Date(endDate)
    
    if (start.toDateString() === end.toDateString()) {
      return format(start, "MMMM d, yyyy")
    }
    
    return `${format(start, "MMM d")} - ${format(end, "MMM d, yyyy")}`
  }

  const formatEventTime = (startDate: string, endDate: string) => {
    return `${format(new Date(startDate), "h:mm a")} - ${format(new Date(endDate), "h:mm a")}`
  }

  // Fetch event details and tasks
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      
      try {
        const { data: { user } } = await supabase.auth.getUser()
        
        if (!user) {
          console.error("User not authenticated")
          return
        }

        // Fetch volunteer's skills
        const { data: userSkillsData, error: userSkillsError } = await supabase
          .from("volunteer_skills")
          .select("skill_id")
          .eq("volunteer_id", user.id)
          
        if (userSkillsError) {
          console.error("Error fetching volunteer skills:", userSkillsError)
          return
        }
        
        const volunteerSkillIds = userSkillsData.map(item => item.skill_id)
        setVolunteerSkills(volunteerSkillIds)

        // Fetch event details
        const { data: eventData, error: eventError } = await supabase
          .from("events")
          .select("*")
          .eq("id", params.id)
          .single()
        
        if (eventError) {
          console.error("Error fetching event:", eventError)
          return
        }

        // Verify user is registered for this event
        const { data: registrationData, error: registrationError } = await supabase
          .from("volunteer_event")
          .select("status")
          .eq("volunteer_id", user.id)
          .eq("event_id", params.id)
          .single()

        if (registrationError || registrationData?.status !== "registered") {
          toast.error("You are not registered for this event")
          return
        }

        // Fetch unassigned tasks with skills
        const { data: unassignedData, error: unassignedError } = await supabase
          .from("tasks")
          .select(`
            *,
            task_skills (
              skills (
                skill_id,
                skill,
                skill_icon
              )
            )
          `)
          .eq("event_id", params.id)
          .eq("task_status", "unassigned")
        
        if (unassignedError) {
          console.error("Error fetching unassigned tasks:", unassignedError)
          return
        }

        // Fetch assigned tasks
        const { data: assignedData, error: assignedError } = await supabase
          .from("tasks")
          .select("*")
          .eq("event_id", params.id)
          .eq("volunteer_id", user.id)
          .neq("task_status", "unassigned")
        
        if (assignedError) {
          console.error("Error fetching assigned tasks:", assignedError)
          return
        }

        // Fetch existing feedback
        const { data: feedbackData, error: feedbackError } = await supabase
          .from("volunteer_event")
          .select("feedback, star_rating")
          .eq("volunteer_id", user.id)
          .eq("event_id", params.id)
          .single()
          
        if (!feedbackError && feedbackData) {
          setExistingFeedback(feedbackData)
          setFeedback(feedbackData.feedback || "")
          setStarRating(feedbackData.star_rating || 0)
        }

        setEvent({
          ...eventData,
          formattedDate: formatEventDate(eventData.start_date, eventData.end_date),
          formattedTime: formatEventTime(eventData.start_date, eventData.end_date)
        })
        
        // Process unassigned tasks to include skills and compare with volunteer skills
        const processedUnassignedTasks = (unassignedData || []).map(task => {
          // Extract all skills from task_skills
          const taskSkills = task.task_skills?.map((ts: TaskSkill) => ts.skills) || []
          
          // Compare with volunteer skills to find common and missing skills
          const commonSkills = taskSkills.filter((skill: SkillType) => 
            volunteerSkillIds.includes(skill.skill_id)
          )
          
          const missingSkills = taskSkills.filter((skill: SkillType) => 
            !volunteerSkillIds.includes(skill.skill_id)
          )
          
          return {
            ...task,
            skills: taskSkills,
            commonSkills,
            missingSkills
          }
        })
        
        setUnassignedTasks(processedUnassignedTasks)
        
        setAssignedTasks((assignedData || []).map(task => ({
          ...task,
          original_status: task.task_status,
          original_feedback: task.task_feedback
        })))
      } catch (error) {
        console.error("Error:", error)
      } finally {
        setLoading(false)
      }
    }
    
    fetchData()
  }, [params.id])

  const handleAssignTasks = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        console.error("User not authenticated")
        return
      }

      // Update selected tasks
      const { error } = await supabase
        .from("tasks")
        .update({
          volunteer_id: user.id,
          volunteer_email: user.email,
          task_status: "to do"
        })
        .in("task_id", selectedTasks)
      
      if (error) {
        console.error("Error assigning tasks:", error)
        toast.error("Failed to assign tasks")
        return
      }

      // Refresh tasks
      const { data: newUnassignedData } = await supabase
        .from("tasks")
        .select("*")
        .eq("event_id", params.id)
        .eq("task_status", "unassigned")

      const { data: newAssignedData } = await supabase
        .from("tasks")
        .select("*")
        .eq("event_id", params.id)
        .eq("volunteer_id", user.id)
        .neq("task_status", "unassigned")

      setUnassignedTasks(newUnassignedData || [])
      setAssignedTasks((newAssignedData || []).map(task => ({
        ...task,
        original_status: task.task_status,
        original_feedback: task.task_feedback
      })))
      setSelectedTasks([])
      toast.success("Tasks assigned successfully")
    } catch (error) {
      console.error("Error:", error)
      toast.error("Failed to assign tasks")
    }
  }

  const handleTaskChange = (taskId: number, field: 'task_status' | 'task_feedback', value: string) => {
    setAssignedTasks(tasks => tasks.map(task => {
      if (task.task_id === taskId) {
        return { ...task, [field]: value }
      }
      return task
    }))
    setHasChanges(true)
  }

  const handleSubmitChanges = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        console.error("User not authenticated")
        return
      }

      // Get tasks that have been modified
      const modifiedTasks = assignedTasks.filter(task => 
        task.task_status !== task.original_status || 
        task.task_feedback !== task.original_feedback
      )

      // Update each modified task
      for (const task of modifiedTasks) {
        const { error } = await supabase
          .from("tasks")
          .update({
            task_status: task.task_status,
            task_feedback: task.task_feedback
          })
          .eq("task_id", task.task_id)

        if (error) {
          console.error("Error updating task:", error)
          toast.error("Failed to update tasks")
          return
        }
      }

      // Update the original values to match current values
      setAssignedTasks(tasks => tasks.map(task => ({
        ...task,
        original_status: task.task_status,
        original_feedback: task.task_feedback
      })))
      setHasChanges(false)
      toast.success("Tasks updated successfully")
    } catch (error) {
      console.error("Error:", error)
      toast.error("Failed to update tasks")
    }
  }

  const handleDeassignTask = async (taskId: number) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        console.error("User not authenticated")
        return
      }

      const { error } = await supabase
        .from("tasks")
        .update({
          volunteer_id: null,
          volunteer_email: null,
          task_status: "unassigned"
        })
        .eq("task_id", taskId)
      
      if (error) {
        console.error("Error de-assigning task:", error)
        toast.error("Failed to de-assign task")
        return
      }

      // Refresh tasks
      const { data: newUnassignedData } = await supabase
        .from("tasks")
        .select("*")
        .eq("event_id", params.id)
        .eq("task_status", "unassigned")

      const { data: newAssignedData } = await supabase
        .from("tasks")
        .select("*")
        .eq("event_id", params.id)
        .eq("volunteer_id", user.id)
        .neq("task_status", "unassigned")

      setUnassignedTasks(newUnassignedData || [])
      setAssignedTasks((newAssignedData || []).map(task => ({
        ...task,
        original_status: task.task_status,
        original_feedback: task.task_feedback
      })))
      toast.success("Task de-assigned successfully")
    } catch (error) {
      console.error("Error:", error)
      toast.error("Failed to de-assign task")
    }
  }

  const handleFeedbackSubmit = async () => {
    try {
      setSubmittingFeedback(true)
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        console.error("User not authenticated")
        return
      }

      const { error } = await supabase
        .from("volunteer_event")
        .update({
          feedback: feedback,
          star_rating: starRating,
          feedback_submitted_at: new Date().toISOString()
        })
        .eq("volunteer_id", user.id)
        .eq("event_id", params.id)
      
      if (error) {
        console.error("Error submitting feedback:", error)
        toast.error("Failed to submit feedback")
        return
      }

      setExistingFeedback({
        feedback,
        star_rating: starRating
      })
      toast.success("Feedback submitted successfully")
    } catch (error) {
      console.error("Error:", error)
      toast.error("Failed to submit feedback")
    } finally {
      setSubmittingFeedback(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-white">
        <DashboardHeader />
        <main className="container mx-auto px-4 py-8">
          <p className="text-gray-500">Loading...</p>
        </main>
      </div>
    )
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-white">
        <DashboardHeader />
        <main className="container mx-auto px-4 py-8">
          <p className="text-gray-500">Event not found</p>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-white">
      <DashboardHeader />
      <main className="container mx-auto px-4 py-8">
        {/* My Tasks */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-red-900">My Tasks</h2>
              <Button 
                className={`bg-gradient-to-r from-red-600 to-red-800 hover:from-red-700 hover:to-red-900 ${
                  !hasChanges ? 'opacity-50 cursor-not-allowed' : ''
                }`}
                onClick={handleSubmitChanges}
                disabled={!hasChanges}
              >
                Submit Changes
              </Button>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Description</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Notes</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {assignedTasks.map((task) => (
                  <TableRow key={task.task_id}>
                    <TableCell>{task.task_description}</TableCell>
                    <TableCell>
                      <Select
                        value={task.task_status}
                        onValueChange={(value) => handleTaskChange(task.task_id, 'task_status', value)}
                      >
                        <SelectTrigger className="w-[120px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="to do">To Do</SelectItem>
                          <SelectItem value="doing">Doing</SelectItem>
                          <SelectItem value="done">Done</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Textarea
                        value={task.task_feedback || ""}
                        placeholder="Add Notes..."
                        onChange={(e) => handleTaskChange(task.task_id, 'task_feedback', e.target.value)}
                        className="min-h-[80px]"
                      />
                    </TableCell>
                    <TableCell>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="text-red-600 hover:text-red-800">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>De-assign Task</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to de-assign this task? This will remove it from your assigned tasks.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDeassignTask(task.task_id)}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              De-assign
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Event Details */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <h1 className="text-3xl font-bold text-red-900 mb-4">{event.title}</h1>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <img 
                  src={event.thumbnail_image || "/placeholder.svg?height=300&width=500"} 
                  alt={event.title} 
                  className="w-full h-64 object-cover rounded-md mb-4"
                />
                <p className="text-gray-700 mb-4">{event.description}</p>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center text-gray-600">
                  <CalendarDays className="h-4 w-4 mr-2 text-red-600" />
                  {event.formattedDate}
                </div>
                <div className="flex items-center text-gray-600">
                  <Clock className="h-4 w-4 mr-2 text-red-600" />
                  {event.formattedTime}
                </div>
                <div className="flex items-center text-gray-600">
                  <MapPin className="h-4 w-4 mr-2 text-red-600" />
                  {event.location} ({event.location_type})
                </div>
                {event.registration_deadline && (
                  <div className="flex items-center text-gray-600">
                    <Clock className="h-4 w-4 mr-2 text-red-600" />
                    Register by: {format(new Date(event.registration_deadline), "MMM d, yyyy")}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Unassigned Tasks */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <h2 className="text-2xl font-bold text-red-900 mb-4">Available Tasks</h2>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]">Select</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Matching Skills</TableHead>
                  <TableHead>Missing Skills</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {unassignedTasks.map((task) => (
                  <TableRow key={task.task_id}>
                    <TableCell>
                      <Checkbox
                        checked={selectedTasks.includes(task.task_id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedTasks([...selectedTasks, task.task_id])
                          } else {
                            setSelectedTasks(selectedTasks.filter(id => id !== task.task_id))
                          }
                        }}
                      />
                    </TableCell>
                    <TableCell>{task.task_description}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-2">
                        {task?.commonSkills?.length > 0 ? (
                          task.commonSkills.map((skill, index) => (
                            <span 
                              key={index}
                              className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800"
                            >
                              {skill.skill_icon && <span className="mr-1">{skill.skill_icon}</span>}
                              {skill.skill}
                            </span>
                          ))
                        ) : (
                          <span className="text-gray-500 text-sm">No matching skills</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-2">
                        {task?.missingSkills?.length > 0 ? (
                          task.missingSkills.map((skill, index) => (
                            <span 
                              key={index}
                              className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800"
                            >
                              {skill.skill_icon && <span className="mr-1">{skill.skill_icon}</span>}
                              {skill.skill}
                            </span>
                          ))
                        ) : (
                          <span className="text-gray-500 text-sm">None - you have all required skills!</span>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {unassignedTasks.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-4 text-gray-500">
                      No available tasks for this event
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
            {selectedTasks.length > 0 && (
              <div className="mt-4">
                <Button 
                  className="bg-gradient-to-r from-red-600 to-red-800 hover:from-red-700 hover:to-red-900"
                  onClick={handleAssignTasks}
                >
                  Assign Selected Tasks
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Feedback Section */}
        <Card>
          <CardContent className="p-6">
            <h2 className="text-2xl font-bold text-red-900 mb-2">Event Feedback</h2>
            <p className="text-gray-600 mb-6">
              Your feedback is invaluable to Samarthanam Trust for the Disabled. It helps us improve our volunteer events, 
              better support our community, and create more meaningful experiences for everyone involved. 
              Your insights directly contribute to our mission of empowering persons with disabilities through quality education, 
              training, and rehabilitation.
            </p>

            <div className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="star-rating" className="text-md font-medium">How would you rate this event?</Label>
                <div className="flex items-center space-x-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setStarRating(star)}
                      className={`p-1 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors ${
                        starRating >= star 
                          ? 'text-yellow-400 hover:text-yellow-500' 
                          : 'text-gray-300 hover:text-yellow-300'
                      }`}
                    >
                      <Star className="h-8 w-8 fill-current" />
                    </button>
                  ))}
                  <span className="ml-2 text-sm text-gray-500">
                    {starRating === 1 && "Poor"}
                    {starRating === 2 && "Fair"}
                    {starRating === 3 && "Good"}
                    {starRating === 4 && "Very Good"}
                    {starRating === 5 && "Excellent"}
                    {starRating === 0 && "Select a rating"}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="feedback" className="text-md font-medium">Share your thoughts about this event</Label>
                <Textarea
                  id="feedback"
                  placeholder="What did you like? What could be improved? Any other comments?"
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  className="min-h-[150px]"
                />
              </div>

              <div className="flex justify-end">
                <Button
                  onClick={handleFeedbackSubmit}
                  disabled={starRating === 0 || !feedback.trim() || submittingFeedback}
                  className="bg-gradient-to-r from-red-600 to-red-800 hover:from-red-700 hover:to-red-900"
                >
                  {submittingFeedback ? "Submitting..." : existingFeedback ? "Update Feedback" : "Submit Feedback"}
                </Button>
              </div>

              {existingFeedback && (
                <div className="p-4 bg-green-50 border border-green-100 rounded-md text-green-800 text-sm">
                  You have already submitted feedback for this event. You can update it if you'd like.
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
} 