"use client"

import { useState, useEffect } from "react"
import DashboardHeader from "@/components/dashboard/header"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog"
import { CalendarDays, MapPin, Clock } from "lucide-react"
import { createClient } from "@/utils/supabase/client"
import { format } from "date-fns"

export default function EventsPage() {
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
          .order("start_date", { ascending: true })
        
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
      
      // You might want to create a table for user event interests
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
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-white">
      <DashboardHeader />
      <main className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-red-900 mb-8">Events</h1>
        
        {loading ? (
          <div className="flex justify-center items-center min-h-[400px]">
            <p className="text-gray-500">Loading events...</p>
          </div>
        ) : events.length === 0 ? (
          <div className="bg-white p-8 rounded-lg shadow text-center">
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No events available</h3>
            <p className="text-gray-500">Check back later for upcoming volunteer opportunities.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((event) => (
              <Card 
                key={event.id}
                className="overflow-hidden hover:shadow-xl transition-shadow cursor-pointer"
                onClick={() => setSelectedEvent(event)}
              >
                <div className="h-48 overflow-hidden">
                  <img 
                    src={event.thumbnail_image || "/placeholder.svg?height=300&width=500"} 
                    alt={event.title} 
                    className="w-full h-full object-cover"
                  />
                </div>
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="font-semibold text-red-900 text-lg">{event.title}</h3>
                    <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded-full">
                      {event.event_category}
                    </span>
                  </div>
                  
                  <div className="space-y-2 text-gray-600 text-sm">
                    <div className="flex items-center">
                      <CalendarDays className="h-4 w-4 mr-2 text-red-600" />
                      {event.formattedDate}
                    </div>
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 mr-2 text-red-600" />
                      {event.formattedTime}
                    </div>
                    <div className="flex items-center">
                      <MapPin className="h-4 w-4 mr-2 text-red-600" />
                      {event.location}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
        
        {/* Event Details Dialog */}
        <Dialog open={selectedEvent !== null} onOpenChange={(open) => !open && setSelectedEvent(null)}>
          {selectedEvent && (
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle className="text-xl text-red-900">{selectedEvent.title}</DialogTitle>
                <DialogDescription>{selectedEvent.event_category}</DialogDescription>
              </DialogHeader>
              
              <div className="mt-4">
                <img 
                  src={selectedEvent.thumbnail_image || "/placeholder.svg?height=300&width=500"} 
                  alt={selectedEvent.title} 
                  className="w-full h-64 object-cover rounded-md mb-4"
                />
                
                <p className="text-gray-700 mb-6">{selectedEvent.description}</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div className="space-y-3 border-r pr-4">
                    <h4 className="font-medium text-gray-900">Date & Time</h4>
                    <div className="space-y-2">
                      <div className="flex items-center text-sm text-gray-600">
                        <CalendarDays className="h-4 w-4 mr-2 text-red-600" />
                        {selectedEvent.formattedDate}
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <Clock className="h-4 w-4 mr-2 text-red-600" />
                        {selectedEvent.formattedTime}
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <h4 className="font-medium text-gray-900">Location</h4>
                    <div className="flex items-center text-sm text-gray-600">
                      <MapPin className="h-4 w-4 mr-2 text-red-600" />
                      {selectedEvent.location}
                    </div>
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
                
                <div className="mb-4">
                  <h4 className="font-medium text-gray-900 mb-2">Status</h4>
                  <span className={`text-sm px-2 py-1 rounded-full ${
                    selectedEvent.status === 'upcoming' ? 'bg-blue-100 text-blue-800' :
                    selectedEvent.status === 'ongoing' ? 'bg-green-100 text-green-800' :
                    selectedEvent.status === 'completed' ? 'bg-gray-100 text-gray-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {selectedEvent.status.charAt(0).toUpperCase() + selectedEvent.status.slice(1)}
                  </span>
                </div>
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
      </main>
    </div>
  )
} 