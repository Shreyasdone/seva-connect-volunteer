"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CalendarDays, MapPin, Clock, X } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog"
import { createClient } from "@/utils/supabase/client"
import { format } from "date-fns"

export default function UpcomingEvents() {
  const [selectedEvent, setSelectedEvent] = useState(null)
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  // Format date and time for display
  const formatEventDate = (dateString) => {
    return format(new Date(dateString), "MMMM d, yyyy")
  }

  const formatEventTime = (startDate, endDate) => {
    return `${format(new Date(startDate), "h:mm a")} - ${format(new Date(endDate), "h:mm a")}`
  }

  // Fetch events from Supabase
  useEffect(() => {
    const fetchEvents = async () => {
      setLoading(true)
      
      try {
        const { data, error } = await supabase
          .from("events")
          .select("*")
          .eq("status", "upcoming") // Only get upcoming events
          .order("start_date", { ascending: true })
          .limit(5) // Limit to 5 events for horizontal scrolling
        
        if (error) {
          console.error("Error fetching events:", error)
          return
        }
        
        // Process the data to add formatted date and time for display
        const processedEvents = data.map(event => ({
          ...event,
          formattedDate: formatEventDate(event.start_date),
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

  const handleExpressInterest = async (eventId) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        console.error("User not authenticated")
        return
      }
      
      // Save the user's interest to the database
      const { error } = await supabase
        .from("event_interests")
        .upsert({ 
          user_id: user.id,
          event_id: eventId,
          created_at: new Date().toISOString()
        })
      
      if (error) {
        console.error("Error expressing interest:", error)
        return
      }
      
      // Close the dialog after successful expression of interest
      setSelectedEvent(null)
      
      // You might want to show a success message or update UI
      console.log(`Successfully expressed interest in event ${eventId}`)
    } catch (error) {
      console.error("Error:", error)
    }
  }

  return (
    <>
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-red-900">Upcoming Events</CardTitle>
          <CardDescription>Events that match your preferences</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="h-48 flex justify-center items-center">
              <p className="text-gray-500">Loading events...</p>
            </div>
          ) : events.length === 0 ? (
            <div className="p-4 text-center">
              <p className="text-gray-500">No upcoming events available at this time.</p>
            </div>
          ) : (
            <div className="flex gap-4 overflow-x-auto pb-4">
              {events.map((event) => (
                <div 
                  key={event.id} 
                  className="min-w-[280px] border rounded-lg p-4 hover:border-red-200 transition-colors cursor-pointer"
                  onClick={() => setSelectedEvent(event)}
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
                    <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded-full">{event.event_category}</span>
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
                      {event.location}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Event Details Dialog */}
      <Dialog open={selectedEvent !== null} onOpenChange={(open) => !open && setSelectedEvent(null)}>
        {selectedEvent && (
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle className="text-xl text-red-900">{selectedEvent.title}</DialogTitle>
              <DialogDescription>{selectedEvent.event_category}</DialogDescription>
            </DialogHeader>
            
            <div className="mt-4">
              <img 
                src={selectedEvent.thumbnail_image || "/placeholder.svg?height=200&width=300"} 
                alt={selectedEvent.title} 
                className="w-full h-48 object-cover rounded-md mb-4"
              />
              
              <p className="text-gray-700 mb-4">{selectedEvent.description}</p>
              
              <div className="space-y-2 mb-6">
                <div className="flex items-center text-sm text-gray-600">
                  <CalendarDays className="h-4 w-4 mr-2 text-red-600" />
                  {selectedEvent.formattedDate}
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <Clock className="h-4 w-4 mr-2 text-red-600" />
                  {selectedEvent.formattedTime}
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <MapPin className="h-4 w-4 mr-2 text-red-600" />
                  {selectedEvent.location}
                </div>
              </div>
              
              {selectedEvent.registration_deadline && (
                <div className="mb-4">
                  <h4 className="font-medium text-gray-900 mb-2">Registration Deadline</h4>
                  <p className="text-sm text-gray-600">
                    {format(new Date(selectedEvent.registration_deadline), "MMMM d, yyyy 'at' h:mm a")}
                  </p>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button 
                className="bg-gradient-to-r from-red-600 to-red-800 hover:from-red-700 hover:to-red-900"
                onClick={() => handleExpressInterest(selectedEvent.id)}
              >
                Express Interest
              </Button>
              <DialogClose asChild>
                <Button variant="outline" className="border-red-600 text-red-600 hover:bg-red-50">
                  Close
                </Button>
              </DialogClose>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>
    </>
  )
}

