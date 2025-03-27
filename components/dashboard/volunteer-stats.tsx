"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Clock, Calendar, Award, Users, Star, Brain, Hourglass } from "lucide-react"
import { createClient } from "@/utils/supabase/client"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { differenceInHours } from "date-fns"

export default function VolunteerStats() {
  const [stats, setStats] = useState({
    completedTasks: 0,
    eventsAttended: 0,
    upcomingEvents: 0,
    averageRating: 0,
    skillsCount: 0,
    totalHours: 0,
    loading: true
  })
  
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
        const { count: completedTasksCount, error: completedTasksError } = await supabase
          .from("tasks")
          .select("*", { count: "exact", head: true })
          .eq("volunteer_id", user.id)
          .eq("task_status", "complete")
        
        if (completedTasksError) {
          console.error("Error fetching completed tasks:", completedTasksError)
        }

        // Fetch attended events with start and end times to calculate hours
        const { data: eventsAttendedData, error: eventsAttendedError } = await supabase
          .from("volunteer_event")
          .select(`
            id,
            events!inner (
              start_date,
              end_date
            )
          `)
          .eq("volunteer_id", user.id)
          .eq("status", "registered")
          .lt("events.end_date", new Date().toISOString())
        
        if (eventsAttendedError) {
          console.error("Error fetching attended events:", eventsAttendedError)
        }

        // Calculate total volunteer hours from attended events
        let totalHours = 0
        if (eventsAttendedData && eventsAttendedData.length > 0) {
          totalHours = eventsAttendedData.reduce((acc, item) => {
            const startDate = new Date(item.events.start_date)
            const endDate = new Date(item.events.end_date)
            const hours = differenceInHours(endDate, startDate)
            return acc + (hours > 0 ? hours : 0)
          }, 0)
        }

        // Fetch upcoming events
        const { data: upcomingEventsData, error: upcomingEventsError } = await supabase
          .from("volunteer_event")
          .select(`
            id,
            events!inner (
              start_date
            )
          `)
          .eq("volunteer_id", user.id)
          .eq("status", "registered")
          .gt("events.start_date", new Date().toISOString())
        
        if (upcomingEventsError) {
          console.error("Error fetching upcoming events:", upcomingEventsError)
        }

        // Fetch average star rating
        const { data: ratingsData, error: ratingsError } = await supabase
          .from("volunteer_event")
          .select("star_rating")
          .eq("volunteer_id", user.id)
          .not("star_rating", "is", null)
        
        if (ratingsError) {
          console.error("Error fetching ratings:", ratingsError)
        }

        // Calculate average rating
        let averageRating = 0
        if (ratingsData && ratingsData.length > 0) {
          const sum = ratingsData.reduce((acc, item) => acc + item.star_rating, 0)
          averageRating = parseFloat((sum / ratingsData.length).toFixed(1))
        }

        // Fetch skills count
        const { count: skillsCount, error: skillsError } = await supabase
          .from("volunteer_skills")
          .select("*", { count: "exact", head: true })
          .eq("volunteer_id", user.id)
        
        if (skillsError) {
          console.error("Error fetching skills:", skillsError)
        }

        setStats({
          completedTasks: completedTasksCount || 0,
          eventsAttended: eventsAttendedData?.length || 0,
          upcomingEvents: upcomingEventsData?.length || 0,
          averageRating: averageRating,
          skillsCount: skillsCount || 0,
          totalHours: totalHours,
          loading: false
        })
      } catch (error) {
        console.error("Error fetching volunteer stats:", error)
        setStats(prev => ({ ...prev, loading: false }))
      }
    }

    fetchStats()
  }, [])

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="text-xl font-bold text-red-900">Your Volunteer Stats</CardTitle>
        <CardDescription>Track your volunteer contributions</CardDescription>
      </CardHeader>
      <CardContent>
        {stats.loading ? (
          <div className="h-32 flex justify-center items-center">
            <p className="text-gray-500">Loading your stats...</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex flex-col items-center p-4 bg-red-50 rounded-lg">
                    <Clock className="h-8 w-8 text-red-600 mb-2" />
                    <h3 className="text-2xl font-bold text-red-900">{stats.completedTasks}</h3>
                    <p className="text-sm text-gray-600">Tasks Completed</p>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Number of tasks you've completed</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex flex-col items-center p-4 bg-red-50 rounded-lg">
                    <Calendar className="h-8 w-8 text-red-600 mb-2" />
                    <h3 className="text-2xl font-bold text-red-900">{stats.eventsAttended}</h3>
                    <p className="text-sm text-gray-600">Events Attended</p>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Number of events you've attended</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex flex-col items-center p-4 bg-red-50 rounded-lg">
                    <Hourglass className="h-8 w-8 text-red-600 mb-2" />
                    <h3 className="text-2xl font-bold text-red-900">{stats.totalHours}</h3>
                    <p className="text-sm text-gray-600">Volunteer Hours</p>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Total hours volunteered at events</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex flex-col items-center p-4 bg-red-50 rounded-lg">
                    <Users className="h-8 w-8 text-red-600 mb-2" />
                    <h3 className="text-2xl font-bold text-red-900">{stats.upcomingEvents}</h3>
                    <p className="text-sm text-gray-600">Upcoming Events</p>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Your upcoming registered events</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex flex-col items-center p-4 bg-red-50 rounded-lg">
                    <Star className="h-8 w-8 text-red-600 mb-2" />
                    <h3 className="text-2xl font-bold text-red-900">{stats.averageRating || "-"}</h3>
                    <p className="text-sm text-gray-600">Average Rating</p>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Your average event feedback rating</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex flex-col items-center p-4 bg-red-50 rounded-lg">
                    <Brain className="h-8 w-8 text-red-600 mb-2" />
                    <h3 className="text-2xl font-bold text-red-900">{stats.skillsCount}</h3>
                    <p className="text-sm text-gray-600">Skills</p>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Number of skills in your profile</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

