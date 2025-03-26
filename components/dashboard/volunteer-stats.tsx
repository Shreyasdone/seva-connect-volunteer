"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Clock, Calendar, Award } from "lucide-react"
import { createClient } from "@/utils/supabase/client"

interface Stats {
  completedTasks: number
  attendedEvents: number
}

export default function VolunteerStats() {
  const [stats, setStats] = useState<Stats>({ completedTasks: 0, attendedEvents: 0 })
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        
        if (!user) {
          console.error("User not authenticated")
          return
        }

        // Fetch completed tasks count
        const { count: completedTasksCount } = await supabase
          .from("tasks")
          .select("*", { count: "exact", head: true })
          .eq("volunteer_id", user.id)
          .eq("task_status", "complete")

        // Fetch attended events count
        const { count: attendedEventsCount } = await supabase
          .from("volunteer_event")
          .select("*", { count: "exact", head: true })
          .eq("volunteer_id", user.id)
          .eq("status", "registered")

        setStats({
          completedTasks: completedTasksCount || 0,
          attendedEvents: attendedEventsCount || 0
        })
      } catch (error) {
        console.error("Error fetching stats:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [])

  if (loading) {
    return (
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-red-900">Your Volunteer Stats</CardTitle>
          <CardDescription>Loading your contributions...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col items-center p-4 bg-red-50 rounded-lg">
              <Clock className="h-8 w-8 text-red-600 mb-2" />
              <div className="h-8 w-8 bg-red-100 rounded animate-pulse" />
            </div>
            <div className="flex flex-col items-center p-4 bg-red-50 rounded-lg">
              <Calendar className="h-8 w-8 text-red-600 mb-2" />
              <div className="h-8 w-8 bg-red-100 rounded animate-pulse" />
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="text-xl font-bold text-red-900">Your Volunteer Stats</CardTitle>
        <CardDescription>Track your volunteer contributions</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex flex-col items-center p-4 bg-red-50 rounded-lg hover:bg-red-100 transition-colors">
            <Clock className="h-8 w-8 text-red-600 mb-2" />
            <h3 className="text-2xl font-bold text-red-900">{stats.completedTasks}</h3>
            <p className="text-sm text-gray-600">Tasks Completed</p>
          </div>

          <div className="flex flex-col items-center p-4 bg-red-50 rounded-lg hover:bg-red-100 transition-colors">
            <Calendar className="h-8 w-8 text-red-600 mb-2" />
            <h3 className="text-2xl font-bold text-red-900">{stats.attendedEvents}</h3>
            <p className="text-sm text-gray-600">Events Attended</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

