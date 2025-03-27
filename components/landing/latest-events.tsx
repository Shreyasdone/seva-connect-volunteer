"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { CalendarDays, MapPin, Clock, Users } from "lucide-react"
import { createClient } from "@/utils/supabase/client"
import { format } from "date-fns"

export default function LatestEvents() {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  // Format date and time for display
  const formatEventDate = (startDate: string, endDate: string) => {
    const start = new Date(startDate)
    const end = new Date(endDate)
    
    // If dates are the same, just show one date
    if (start.toDateString() === end.toDateString()) {
      return format(start, "MMMM d, yyyy")
    }
    
    // If dates are different, show date range
    return `${format(start, "MMM d")} - ${format(end, "MMM d, yyyy")}`
  }

  const formatEventTime = (startDate: string, endDate: string) => {
    return `${format(new Date(startDate), "h:mm a")} - ${format(new Date(endDate), "h:mm a")}`
  }

  // Fetch latest events from Supabase
  useEffect(() => {
    const fetchEvents = async () => {
      setLoading(true)
      
      try {
        const { data, error } = await supabase
          .from("events")
          .select("*")
          .order("start_date", { ascending: true })
          .limit(5)
        
        if (error) {
          console.error("Error fetching events:", error)
          return
        }
        
        // Process the data to add formatted date and time for display
        const processedEvents = data.map(event => ({
          ...event,
          formattedDate: formatEventDate(event.start_date, event.end_date),
          formattedTime: formatEventTime(event.start_date, event.end_date)
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

  if (loading) {
    return (
      <div className="container px-4 md:px-6 py-12">
        <div className="flex justify-center items-center min-h-[400px]">
          <p className="text-gray-500">Loading events...</p>
        </div>
      </div>
    )
  }

  if (events.length === 0) {
    return (
      <div className="container px-4 md:px-6 py-12">
        <div className="bg-white p-8 rounded-lg shadow text-center">
          <h3 className="text-xl font-semibold text-gray-700 mb-2">No events available</h3>
          <p className="text-gray-500">Check back later for upcoming volunteer opportunities.</p>
        </div>
      </div>
    )
  }

  return (
    <section className="w-full py-12 md:py-24 lg:py-32 bg-white">
      <div className="container px-4 md:px-6">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-red-900 mb-4">Our Recent Events</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Discover exciting volunteer events and make a difference in your community. Join us in creating positive change.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((event) => (
            <Card key={event.id} className="overflow-hidden hover:shadow-lg transition-shadow">
              {event.thumbnail_image && (
                <div className="aspect-video relative">
                  <img
                    src={event.thumbnail_image}
                    alt={event.title}
                    className="object-cover w-full h-full"
                  />
                </div>
              )}
              <CardContent className="p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{event.title}</h3>
                <div className="space-y-3">
                  <div className="flex items-center text-gray-600">
                    <CalendarDays className="h-4 w-4 mr-2 text-red-600" />
                    <span className="text-sm">{event.formattedDate}</span>
                  </div>
                  <div className="flex items-center text-gray-600">
                    <Clock className="h-4 w-4 mr-2 text-red-600" />
                    <span className="text-sm">{event.formattedTime}</span>
                  </div>
                  <div className="flex items-center text-gray-600">
                    <MapPin className="h-4 w-4 mr-2 text-red-600" />
                    <span className="text-sm">{event.location} ({event.location_type})</span>
                  </div>
                  {event.max_volunteers && (
                    <div className="flex items-center text-gray-600">
                      <Users className="h-4 w-4 mr-2 text-red-600" />
                      <span className="text-sm">Up to {event.max_volunteers} volunteers needed</span>
                    </div>
                  )}
                </div>
                <div className="mt-4 pt-4 border-t">
                  <p className="text-sm text-gray-600 line-clamp-2">{event.description}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
} 