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
  const [selectedEvent, setSelectedEvent] = useState<any>(null)
  const [events, setEvents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

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

        // First, get all events
        const { data: eventsData, error: eventsError } = await supabase
          .from("events")
          .select("*")
          .order("start_date", { ascending: true })
        
        if (eventsError) {
          console.error("Error fetching events:", eventsError)
          return
        }

        // Then, get the user's registration status for these events
        const { data: registrationData, error: registrationError } = await supabase
          .from("volunteer_event")
          .select("event_id, status")
          .eq("volunteer_id", user.id)
        
        if (registrationError) {
          console.error("Error fetching registration status:", registrationError)
          return
        }

        // Create a map of event_id to registration status
        const registrationMap = new Map(
          registrationData.map(item => [item.event_id, item.status])
        )
        
        // Process the data to add formatted date and time for display
        const processedEvents = eventsData.map(event => ({
          ...event,
          registrationStatus: registrationMap.get(event.id) || "not registered",
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

  const handleRegister = async (eventId) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        console.error("User not authenticated")
        return
      }
      
      // Register the user for the event
      const { error } = await supabase
        .from("volunteer_event")
        .upsert({ 
          volunteer_id: user.id,
          event_id: eventId,
          status: "registered",
          created_at: new Date().toISOString()
        })
      
      if (error) {
        console.error("Error registering for event:", error)
        return
      }
      
      // Close the dialog after successful registration
      setSelectedEvent(null)
      
      // Refresh the events list
      fetchEvents()
    } catch (error) {
      console.error("Error:", error)
    }
  }

  // Filter events by registration status
  const registeredEvents = events.filter(event => event.registrationStatus === "registered")
  const nonRegisteredEvents = events.filter(event => event.registrationStatus !== "registered")

  interface EventCardProps {
    event: {
      id: string;
      title: string;
      location: string;
      location_type: string;
      thumbnail_image?: string;
      formattedDate: string;
      formattedTime: string;
      registration_deadline?: string;
      registrationStatus: string;
    };
    showDeadline?: boolean;
  }

  // Event Card component to avoid repetition
  const EventCard = ({ event, showDeadline = true }: EventCardProps) => (
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
            {event.location} ({event.location_type})
          </div>
          {showDeadline && event.registration_deadline && (
            <div className="flex items-center">
              <Clock className="h-4 w-4 mr-2 text-red-600" />
              Register by: {format(new Date(event.registration_deadline), "MMM d, yyyy")}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );

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
          <div className="space-y-12">
            {/* Registered Events Section */}
            <div>
              <h2 className="text-2xl font-bold text-red-900 mb-4">Registered Events</h2>
              {registeredEvents.length === 0 ? (
                <div className="bg-white p-6 rounded-lg shadow text-center">
                  <p className="text-gray-500">You haven't registered for any events yet.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {registeredEvents.map((event) => (
                    <EventCard key={event.id} event={event} showDeadline={false} />
                  ))}
                </div>
              )}
            </div>
            
            {/* All Events Section */}
            <div>
              <h2 className="text-2xl font-bold text-red-900 mb-4">All Events</h2>
              {nonRegisteredEvents.length === 0 ? (
                <div className="bg-white p-6 rounded-lg shadow text-center">
                  <p className="text-gray-500">No additional events available at this time.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {nonRegisteredEvents.map((event) => (
                    <EventCard key={event.id} event={event} showDeadline={true} />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* Event Details Dialog */}
        <Dialog open={selectedEvent !== null} onOpenChange={(open) => !open && setSelectedEvent(null)}>
          {selectedEvent && (
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle className="text-xl text-red-900">{selectedEvent.title}</DialogTitle>
                <DialogDescription>{selectedEvent.location_type}</DialogDescription>
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
                      {selectedEvent.location} ({selectedEvent.location_type})
                    </div>
                  </div>
                </div>
                
                {selectedEvent.registration_deadline && selectedEvent.registrationStatus !== "registered" && (
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
                  onClick={() => handleRegister(selectedEvent.id)}
                  disabled={selectedEvent.registrationStatus === "registered"}
                >
                  {selectedEvent.registrationStatus === "registered" ? "Already Registered" : "Register"}
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