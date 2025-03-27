"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { createClient } from "@/utils/supabase/client"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import Link from "next/link"

interface Task {
  task_id: number
  task_description: string
  task_status: string
  task_feedback: string
  original_status: string
  original_feedback: string
  event_id: number
  event_title: string
}

export default function MyTasksWidget() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [hasChanges, setHasChanges] = useState(false)
  const supabase = createClient()

  // Fetch all assigned tasks
  useEffect(() => {
    const fetchTasks = async () => {
      setLoading(true)
      
      try {
        const { data: { user } } = await supabase.auth.getUser()
        
        if (!user) {
          console.error("User not authenticated")
          return
        }

        // Fetch tasks with event details
        const { data, error } = await supabase
          .from("tasks")
          .select(`
            *,
            events (
              title
            )
          `)
          .eq("volunteer_id", user.id)
          .neq("task_status", "unassigned")
          .order("created_at", { ascending: false })
        
        if (error) {
          console.error("Error fetching tasks:", error)
          return
        }

        // Process the data to include event title and original values
        const processedTasks = (data || []).map(task => ({
          ...task,
          event_title: task.events?.title || "Unknown Event",
          original_status: task.task_status,
          original_feedback: task.task_feedback
        }))

        setTasks(processedTasks)
      } catch (error) {
        console.error("Error:", error)
      } finally {
        setLoading(false)
      }
    }
    
    fetchTasks()
  }, [])

  const handleTaskChange = (taskId: number, field: 'task_status' | 'task_feedback', value: string) => {
    setTasks(tasks => tasks.map(task => {
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
      const modifiedTasks = tasks.filter(task => 
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
      setTasks(tasks => tasks.map(task => ({
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

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-body-small">Loading tasks...</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
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
              <TableHead>Event</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Notes</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tasks.map((task) => (
              <TableRow key={task.task_id}>
                <TableCell>
                  <Link 
                    href={`/dashboard/events/${task.event_id}`}
                    className="text-red-600 hover:text-red-800 hover:underline"
                  >
                    {task.event_title}
                  </Link>
                </TableCell>
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
                      <SelectItem value="assigned">Assigned</SelectItem>
                      <SelectItem value="inprogress">In Progress</SelectItem>
                      <SelectItem value="complete">Complete</SelectItem>
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
              </TableRow>
            ))}
            {tasks.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-body-small text-gray-500">
                  No tasks assigned yet
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
} 