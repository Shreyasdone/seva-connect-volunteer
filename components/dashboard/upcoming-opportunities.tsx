"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CalendarDays, MapPin, Clock } from "lucide-react"
import { createClient } from "@/utils/supabase/client"
import { format } from "date-fns"
import { useRouter } from "next/navigation"

export default function UpcomingEvents() {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()
  const router = useRouter()

  // Format date and time for display
  const formatEventDate = (startDate, endDate) => {
    const start = new Date(startDate)
    const end = new Date(endDate)
    
    // If dates are the same, just show one date
    if (start.toDateString() === end.toDateString()) {
      return format(start, "MMMM d, yyyy")
    }
    
    // If dates are different, show date range
    return `${format(start, "MMM d")} - ${format(end, "MMM d, yyyy")}`
  }

  const formatEventTime = (startDate, endDate) => {
    return `${format(new Date(startDate), "h:mm a")} - ${format(new Date(endDate), "h:mm a")}`
  }

  // Fetch events from Supabase
  useEffect(() => {
    const fetchEvents = async () => {
      setLoading(true)
      
      try {
        const { data: { user } } = await supabase.auth.getUser()
        
        if (!user) {
          console.error("User not authenticated")
          return
        }

        const { data, error } = await supabase
          .from("volunteer_event")
          .select(`
            event_id,
            status,
            events (
              id,
              title,
              location,
              location_type,
              thumbnail_image,
              start_date,
              end_date,
              registration_deadline
            )
          `)
          .eq("volunteer_id", user.id)
          .eq("status", "registered")
          .order("events(start_date)", { ascending: true })
          .limit(5)
        
        if (error) {
          console.error("Error fetching events:", error)
          return
        }
        
        // Process the data to add formatted date and time for display
        const processedEvents = data.map(item => ({
          ...item.events,
          registrationStatus: item.status,
          formattedDate: formatEventDate(item.events.start_date, item.events.end_date),
          formattedTime: formatEventTime(item.events.start_date, item.events.end_date)
        }))
        
        setEvents(processedEvents)
      } catch (error) {
        console.error("Error:", error)
      } finally {
        setLoading(false)
      }
    }
    
    fetchEvents()
  }, [])

  const handleEventClick = (eventId) => {
    router.push(`/dashboard/events/${eventId}`)
  }

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="text-xl font-bold text-red-900">My Registered Events</CardTitle>
        <CardDescription>Events you have registered for</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="h-48 flex justify-center items-center">
            <p className="text-gray-500">Loading events...</p>
          </div>
        ) : events.length === 0 ? (
          <div className="p-4 text-center">
            <p className="text-gray-500">You haven't registered for any events yet.</p>
          </div>
        ) : (
          <div className="flex gap-4 overflow-x-auto pb-4">
            {events.map((event) => (
              <div 
                key={event.id} 
                className="min-w-[280px] border rounded-lg p-4 hover:border-red-200 transition-colors cursor-pointer"
                onClick={() => handleEventClick(event.id)}
              >
                <div className="mb-3">
                  <img 
                    src={event.thumbnail_image || "/placeholder.svg?height=200&width=300"} 
                    alt={event.title} 
                    className="w-full h-32 object-cover rounded-md"
                  />
                </div>
                <div className="flex justify-between items-start">
                  <h3 className="font-semibold text-red-900">{event.title}</h3>
                  <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded-full">
                    {event.location_type}
                  </span>
                </div>

                <div className="mt-2 space-y-2">
                  <div className="flex items-center text-sm text-gray-600">
                    <CalendarDays className="h-4 w-4 mr-2 text-red-600" />
                    {event.formattedDate}
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <Clock className="h-4 w-4 mr-2 text-red-600" />
                    {event.formattedTime}
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <MapPin className="h-4 w-4 mr-2 text-red-600" />
                    {event.location} ({event.location_type})
                  </div>
                  {event.registration_deadline && (
                    <div className="flex items-center text-sm text-gray-600">
                      <Clock className="h-4 w-4 mr-2 text-red-600" />
                      Register by: {format(new Date(event.registration_deadline), "MMM d, yyyy")}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

