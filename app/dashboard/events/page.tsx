"use client"

import { useState, useEffect, useMemo } from "react"
import DashboardHeader from "@/components/dashboard/header"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog"
import { CalendarDays, MapPin, Clock, Filter, X, ChevronDown } from "lucide-react"
import { createClient } from "@/utils/supabase/client"
import { format, addDays, addMonths, isAfter, isBefore, parseISO } from "date-fns"
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from "@/components/ui/popover"
import { 
  Accordion, 
  AccordionContent, 
  AccordionItem, 
  AccordionTrigger 
} from "@/components/ui/accordion"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { DatePicker } from "@/components/ui/date-picker"
import { Label } from "@/components/ui/label"

const BATCH_SIZE = 5

export default function EventsPage() {
  const [selectedEvent, setSelectedEvent] = useState<any>(null)
  const [events, setEvents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()
  
  // Lazy loading state
  const [visibleUpcomingCount, setVisibleUpcomingCount] = useState(BATCH_SIZE)
  const [visiblePastCount, setVisiblePastCount] = useState(BATCH_SIZE)
  const [visibleRegisteredCount, setVisibleRegisteredCount] = useState(BATCH_SIZE)
  
  // Filter state
  const [showFilters, setShowFilters] = useState(false)
  const [registrationFilters, setRegistrationFilters] = useState<Record<string, boolean>>({
    registered: false,
    "not registered": false,
  })
  const [categoryFilters, setCategoryFilters] = useState<Record<string, boolean>>({
    A: false,
    B: false,
    C: false,
    D: false,
    E: false,
  })
  const [eventTypeFilters, setEventTypeFilters] = useState<Record<string, boolean>>({
    physical: false,
    virtual: false,
  })
  const [timeFilter, setTimeFilter] = useState<string>("all")
  const [customDateRange, setCustomDateRange] = useState<{start: Date | null, end: Date | null}>({
    start: null,
    end: null
  })

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

  // Fetch events from Supabase
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

  useEffect(() => {
    fetchEvents()
  }, [])

  const handleRegister = async (eventId: string) => {
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

  // Update a single checkbox filter
  const updateFilter = (
    filterType: 'registration' | 'category' | 'eventType',
    value: string,
    checked: boolean
  ) => {
    if (filterType === 'registration') {
      setRegistrationFilters(prev => ({ ...prev, [value]: checked }))
    } else if (filterType === 'category') {
      setCategoryFilters(prev => ({ ...prev, [value]: checked }))
    } else if (filterType === 'eventType') {
      setEventTypeFilters(prev => ({ ...prev, [value]: checked }))
    }
  }

  // Apply filters to events
  const filteredEvents = useMemo(() => {
    return events.filter(event => {
      const now = new Date()
      const eventStartDate = new Date(event.start_date)
      
      // Registration Status Filter
      const registrationSelected = Object.values(registrationFilters).some(v => v)
      if (registrationSelected) {
        // If both registration filters are checked or none are checked, don't filter by registration
        const isRegistered = registrationFilters.registered;
        const isNotRegistered = registrationFilters["not registered"];
        
        // Skip registration filtering if both or neither are selected
        if (isRegistered && isNotRegistered) {
          // Don't filter - show all events
        } else if (isRegistered && event.registrationStatus !== "registered") {
          return false;
        } else if (isNotRegistered && event.registrationStatus === "registered") {
          return false;
        }
      }
      
      // Category Filter
      const categoriesSelected = Object.values(categoryFilters).some(v => v)
      if (categoriesSelected) {
        // If any category is checked, but the event doesn't match any selected category
        if (!categoryFilters[event.event_category]) {
          return false
        }
      }
      
      // Event Type Filter
      const eventTypesSelected = Object.values(eventTypeFilters).some(v => v)
      if (eventTypesSelected) {
        const eventLocationType = event.location_type.toLowerCase() // Ensure consistent case
        if (!eventTypeFilters[eventLocationType]) {
          return false
        }
      }
      
      // Time Filter
      if (timeFilter === "next7days") {
        const sevenDaysFromNow = addDays(now, 7)
        if (!isAfter(eventStartDate, now) || !isBefore(eventStartDate, sevenDaysFromNow)) {
          return false
        }
      } else if (timeFilter === "nextmonth") {
        const oneMonthFromNow = addMonths(now, 1)
        if (!isAfter(eventStartDate, now) || !isBefore(eventStartDate, oneMonthFromNow)) {
          return false
        }
      } else if (timeFilter === "custom" && customDateRange.start && customDateRange.end) {
        if (!isAfter(eventStartDate, customDateRange.start) || !isBefore(eventStartDate, customDateRange.end)) {
          return false
        }
      }
      
      return true
    })
  }, [events, registrationFilters, categoryFilters, eventTypeFilters, timeFilter, customDateRange])
  
  // Separate events by category with improved classification
  const now = new Date()
  // Upcoming registered events (exclude completed events)
  const registeredEvents = filteredEvents.filter(event => 
    event.registrationStatus === "registered" && new Date(event.end_date) > now
  )
  // Upcoming non-registered events
  const upcomingEvents = filteredEvents.filter(event => 
    new Date(event.start_date) > now && event.registrationStatus !== "registered"
  )
  // All past events including registered ones that are completed
  const pastEvents = filteredEvents.filter(event => 
    new Date(event.end_date) <= now
  )
  
  // Get visible events based on lazy loading counts
  const visibleRegisteredEvents = registeredEvents.slice(0, visibleRegisteredCount)
  const visibleUpcomingEvents = upcomingEvents.slice(0, visibleUpcomingCount)
  const visiblePastEvents = pastEvents.slice(0, visiblePastCount)
  
  // Check if there are more events to load
  const hasMoreRegistered = visibleRegisteredCount < registeredEvents.length
  const hasMoreUpcoming = visibleUpcomingCount < upcomingEvents.length
  const hasMorePast = visiblePastCount < pastEvents.length

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
      event_category: string;
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
          <Badge variant="outline" className="text-xs ml-2 border-red-800 text-red-800">
            {event.event_category}
          </Badge>
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

  // Generate selected filter tags
  const selectedFilters = []
  
  // Registration filters
  const selectedRegistrationFilters = Object.entries(registrationFilters)
    .filter(([_, checked]) => checked)
    .map(([value]) => value)
  
  if (selectedRegistrationFilters.length > 0) {
    selectedFilters.push({
      id: "registration",
      label: `Status: ${selectedRegistrationFilters.join(", ")}`,
      filterType: 'registration' as const
    })
  }
  
  // Category filters
  const selectedCategoryFilters = Object.entries(categoryFilters)
    .filter(([_, checked]) => checked)
    .map(([value]) => value)
  
  if (selectedCategoryFilters.length > 0) {
    selectedFilters.push({
      id: "category",
      label: `Categories: ${selectedCategoryFilters.join(", ")}`,
      filterType: 'category' as const
    })
  }
  
  // Event type filters
  const selectedEventTypeFilters = Object.entries(eventTypeFilters)
    .filter(([_, checked]) => checked)
    .map(([value]) => value.charAt(0).toUpperCase() + value.slice(1)) // Capitalize
  
  if (selectedEventTypeFilters.length > 0) {
    selectedFilters.push({
      id: "eventType",
      label: `Types: ${selectedEventTypeFilters.join(", ")}`,
      filterType: 'eventType' as const
    })
  }
  
  // Time filter
  if (timeFilter !== "all") {
    let timeLabel = "Custom Time Range"
    if (timeFilter === "next7days") timeLabel = "Next 7 Days"
    if (timeFilter === "nextmonth") timeLabel = "Next Month"
    
    selectedFilters.push({
      id: "time",
      label: timeLabel,
      filterType: 'time' as const
    })
  }

  const clearFilter = (filterId: string, filterType: 'registration' | 'category' | 'eventType' | 'time') => {
    if (filterType === 'registration') {
      setRegistrationFilters({
        registered: false,
        "not registered": false,
      })
    } else if (filterType === 'category') {
      setCategoryFilters({
        A: false,
        B: false,
        C: false,
        D: false,
        E: false,
      })
    } else if (filterType === 'eventType') {
      setEventTypeFilters({
        physical: false,
        virtual: false,
      })
    } else if (filterType === 'time') {
      setTimeFilter("all")
      setCustomDateRange({ start: null, end: null })
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-white">
      <DashboardHeader />
      <main className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-red-900">Events</h1>
          <Button 
            variant="outline" 
            className="flex items-center gap-2 border-red-800 text-red-800 hover:bg-red-50"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="h-4 w-4" />
            {showFilters ? "Hide Filters" : "Apply Filters"}
          </Button>
        </div>
        
        {/* Selected Filters Display - Always visible when filters are selected */}
        {selectedFilters.length > 0 && !showFilters && (
          <div className="flex flex-wrap gap-2 mb-6">
            {selectedFilters.map(filter => (
              <Badge 
                key={filter.id} 
                variant="secondary" 
                className="px-3 py-1 flex items-center gap-1 bg-red-50 text-red-800 border-red-200"
              >
                {filter.label}
                <X 
                  className="h-3 w-3 ml-1 cursor-pointer" 
                  onClick={(e) => {
                    e.stopPropagation()
                    clearFilter(filter.id, filter.filterType)
                  }} 
                />
              </Badge>
            ))}
            
            <Button
              variant="outline"
              size="sm"
              className="px-3 py-1 h-auto text-xs border-red-200 text-red-800 hover:bg-red-50"
              onClick={() => {
                setRegistrationFilters({registered: false, "not registered": false})
                setCategoryFilters({A: false, B: false, C: false, D: false, E: false})
                setEventTypeFilters({physical: false, virtual: false})
                setTimeFilter("all")
                setCustomDateRange({ start: null, end: null })
              }}
            >
              Clear All
            </Button>
          </div>
        )}
        
        {/* Main Content Area with Filter Layout */}
        <div className={`
          grid gap-6 transition-all duration-300 ease-in-out
          ${showFilters 
            ? 'grid-cols-1 lg:grid-cols-[300px_1fr]' 
            : 'grid-cols-1'
          }
        `}>
          {/* Filter Section - Responsive for all screen sizes */}
          <aside 
            className={`
              transition-all duration-300 ease-in-out
              bg-white rounded-lg shadow-md border border-red-100
              z-20
              lg:sticky lg:top-24 lg:self-start lg:max-h-[calc(100vh-140px)] lg:overflow-auto
              order-2 lg:order-1
              h-auto
              ${showFilters ? 'block' : 'hidden'} 
            `}
          >
            <div className="p-4">
              <div className="mb-4 flex justify-between items-center">
                <h2 className="text-lg font-semibold text-black">Filter Options</h2>
                <Button 
                  variant="ghost" 
                  size="sm"
                  className="lg:hidden text-red-800 hover:bg-red-50"
                  onClick={() => setShowFilters(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              
              {/* Selected Filters Display - Within the filter panel */}
              {selectedFilters.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {selectedFilters.map(filter => (
                    <Badge 
                      key={filter.id} 
                      variant="secondary" 
                      className="px-3 py-1 flex items-center gap-1 bg-red-50 text-red-800 border-red-200"
                    >
                      {filter.label}
                      <X 
                        className="h-3 w-3 ml-1 cursor-pointer" 
                        onClick={(e) => {
                          e.stopPropagation()
                          clearFilter(filter.id, filter.filterType)
                        }} 
                      />
                    </Badge>
                  ))}
                  
                  <Button
                    variant="outline"
                    size="sm"
                    className="px-3 py-1 h-auto text-xs border-red-200 text-red-800 hover:bg-red-50"
                    onClick={() => {
                      setRegistrationFilters({registered: false, "not registered": false})
                      setCategoryFilters({A: false, B: false, C: false, D: false, E: false})
                      setEventTypeFilters({physical: false, virtual: false})
                      setTimeFilter("all")
                      setCustomDateRange({ start: null, end: null })
                    }}
                  >
                    Clear All
                  </Button>
                </div>
              )}
              
              <div className="space-y-6 overflow-y-auto pr-2 pb-6">
                {/* Registration Status Filter */}
                <div>
                  <h3 className="text-sm font-medium text-black mb-3">
                    Registration Status
                  </h3>
                  <div className="space-y-2">
                    {Object.entries(registrationFilters).map(([status, checked]) => (
                      <div key={status} className="flex items-center space-x-2">
                        <Checkbox 
                          id={`registration-${status}`}
                          checked={checked}
                          onCheckedChange={(checked) => 
                            updateFilter('registration', status, checked === true)
                          }
                          className="h-4 w-4 rounded border-red-400 text-red-600 focus:ring-red-500 focus:ring-offset-0"
                        />
                        <Label 
                          htmlFor={`registration-${status}`}
                          className="text-sm text-black cursor-pointer"
                        >
                          {status.charAt(0).toUpperCase() + status.slice(1)}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Event Type Filter */}
                <div>
                  <h3 className="text-sm font-medium text-black mb-3">
                    Event Type
                  </h3>
                  <div className="space-y-2">
                    {Object.entries(eventTypeFilters).map(([type, checked]) => (
                      <div key={type} className="flex items-center space-x-2">
                        <Checkbox 
                          id={`event-type-${type}`}
                          checked={checked}
                          onCheckedChange={(checked) => 
                            updateFilter('eventType', type, checked === true)
                          }
                          className="h-4 w-4 rounded border-red-400 text-red-600 focus:ring-red-500 focus:ring-offset-0"
                        />
                        <Label 
                          htmlFor={`event-type-${type}`}
                          className="text-sm text-black cursor-pointer"
                        >
                          {type.charAt(0).toUpperCase() + type.slice(1)}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Category Filter */}
                <div>
                  <h3 className="text-sm font-medium text-black mb-3">
                    Event Category
                  </h3>
                  <div className="grid grid-cols-1 gap-2">
                    {Object.entries(categoryFilters).map(([category, checked]) => (
                      <div key={category} className="flex items-center space-x-2">
                        <Checkbox 
                          id={`category-${category}`}
                          checked={checked}
                          onCheckedChange={(checked) => 
                            updateFilter('category', category, checked === true)
                          }
                          className="h-4 w-4 rounded border-red-400 text-red-600 focus:ring-red-500 focus:ring-offset-0"
                        />
                        <Label 
                          htmlFor={`category-${category}`}
                          className="text-sm text-black cursor-pointer"
                        >
                          Category {category}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Time Filter */}
                <div>
                  <h3 className="text-sm font-medium text-black mb-3">
                    Time Period
                  </h3>
                  <Select value={timeFilter} onValueChange={setTimeFilter}>
                    <SelectTrigger className="border-red-200 focus:ring-red-500 text-black">
                      <SelectValue placeholder="Filter by time" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Time</SelectItem>
                      <SelectItem value="next7days">Next 7 Days</SelectItem>
                      <SelectItem value="nextmonth">Next Month</SelectItem>
                      <SelectItem value="custom">Custom Range</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                {/* Custom Date Range */}
                {timeFilter === "custom" && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-black mb-2">
                        Start Date
                      </label>
                      <DatePicker
                        value={customDateRange.start}
                        onChange={(date) => setCustomDateRange(prev => ({ ...prev, start: date }))}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-black mb-2">
                        End Date
                      </label>
                      <DatePicker
                        value={customDateRange.end}
                        onChange={(date) => setCustomDateRange(prev => ({ ...prev, end: date }))}
                      />
                    </div>
                  </div>
                )}
                
                <div className="mt-6">
                  <Button
                    variant="outline"
                    className="w-full border-red-800 text-red-800 hover:bg-red-50"
                    onClick={() => {
                      setRegistrationFilters({registered: false, "not registered": false})
                      setCategoryFilters({A: false, B: false, C: false, D: false, E: false})
                      setEventTypeFilters({physical: false, virtual: false})
                      setTimeFilter("all")
                      setCustomDateRange({ start: null, end: null })
                    }}
                  >
                    Clear All Filters
                  </Button>
                </div>
              </div>
            </div>
          </aside>
          
          {/* Main Content */}
          <div className="order-1 lg:order-2">
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
                {registeredEvents.length > 0 && (
                  <div>
                    <h2 className="text-2xl font-bold text-red-900 mb-4">Registered Events</h2>
                    {visibleRegisteredEvents.length === 0 ? (
                      <div className="bg-white p-6 rounded-lg shadow text-center">
                        <p className="text-gray-500">You haven't registered for any upcoming events that match your filters.</p>
                      </div>
                    ) : (
                      <>
                        <div className={`
                          grid gap-6 transition-all duration-300 ease-in-out
                          grid-cols-1 
                          md:grid-cols-2 
                          ${!showFilters ? 'lg:grid-cols-3 xl:grid-cols-4' : 'lg:grid-cols-2 xl:grid-cols-3'}
                        `}>
                          {visibleRegisteredEvents.map((event) => (
                            <EventCard key={event.id} event={event} showDeadline={false} />
                          ))}
                        </div>
                        
                        {hasMoreRegistered && (
                          <div className="mt-6 text-center">
                            <Button 
                              variant="outline"
                              className="border-red-800 text-red-800 hover:bg-red-50"
                              onClick={() => setVisibleRegisteredCount(prev => prev + BATCH_SIZE)}
                            >
                              Load More
                            </Button>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}
                
                {/* Upcoming Events Section */}
                <div>
                  <h2 className="text-2xl font-bold text-red-900 mb-4">Upcoming Events</h2>
                  {visibleUpcomingEvents.length === 0 ? (
                    <div className="bg-white p-6 rounded-lg shadow text-center">
                      <p className="text-gray-500">No upcoming events match your filters.</p>
                    </div>
                  ) : (
                    <>
                      <div className={`
                        grid gap-6 transition-all duration-300 ease-in-out
                        grid-cols-1 
                        md:grid-cols-2 
                        ${!showFilters ? 'lg:grid-cols-3 xl:grid-cols-4' : 'lg:grid-cols-2 xl:grid-cols-3'}
                      `}>
                        {visibleUpcomingEvents.map((event) => (
                          <EventCard key={event.id} event={event} showDeadline={true} />
                        ))}
                      </div>
                      
                      {hasMoreUpcoming && (
                        <div className="mt-6 text-center">
                          <Button 
                            variant="outline"
                            className="border-red-800 text-red-800 hover:bg-red-50"
                            onClick={() => setVisibleUpcomingCount(prev => prev + BATCH_SIZE)}
                          >
                            Load More
                          </Button>
                        </div>
                      )}
                    </>
                  )}
                </div>
                
                {/* Past Events Section */}
                <div>
                  <h2 className="text-2xl font-bold text-red-900 mb-4">Past Events</h2>
                  {visiblePastEvents.length === 0 ? (
                    <div className="bg-white p-6 rounded-lg shadow text-center">
                      <p className="text-gray-500">No past events match your filters.</p>
                    </div>
                  ) : (
                    <>
                      <div className={`
                        grid gap-6 transition-all duration-300 ease-in-out
                        grid-cols-1 
                        md:grid-cols-2 
                        ${!showFilters ? 'lg:grid-cols-3 xl:grid-cols-4' : 'lg:grid-cols-2 xl:grid-cols-3'}
                      `}>
                        {visiblePastEvents.map((event) => (
                          <EventCard key={event.id} event={event} showDeadline={false} />
                        ))}
                      </div>
                      
                      {hasMorePast && (
                        <div className="mt-6 text-center">
                          <Button 
                            variant="outline"
                            className="border-red-800 text-red-800 hover:bg-red-50"
                            onClick={() => setVisiblePastCount(prev => prev + BATCH_SIZE)}
                          >
                            Load More
                          </Button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
            
        {/* Event Details Dialog */}
        <Dialog open={selectedEvent !== null} onOpenChange={(open) => !open && setSelectedEvent(null)}>
          {selectedEvent && (
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle className="text-xl text-red-900">{selectedEvent.title}</DialogTitle>
                <DialogDescription>{selectedEvent.location_type}</DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4 py-4">
                <div className="relative h-48 overflow-hidden">
                  <img
                    src={selectedEvent.thumbnail_image || "/placeholder.svg?height=300&width=600"}
                    alt={selectedEvent.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-2 right-2">
                    <Badge className="bg-red-900 hover:bg-red-800">
                      {selectedEvent.event_category}
                    </Badge>
                  </div>
                </div>

                <div className="space-y-3 pt-2">
                  <div className="flex items-center">
                    <CalendarDays className="h-4 w-4 mr-2 text-red-600" />
                    <span>{selectedEvent.formattedDate}</span>
                  </div>
                  
                  <div className="flex items-center">
                    <Clock className="h-4 w-4 mr-2 text-red-600" />
                    <span>{selectedEvent.formattedTime}</span>
                  </div>
                  
                  <div className="flex items-center">
                    <MapPin className="h-4 w-4 mr-2 text-red-600" />
                    <span>{selectedEvent.location} ({selectedEvent.location_type})</span>
                  </div>
                  
                  {selectedEvent.registrationStatus !== "registered" && selectedEvent.registration_deadline && (
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 mr-2 text-red-600" />
                      <span>Registration Deadline: {format(new Date(selectedEvent.registration_deadline), "MMMM d, yyyy")}</span>
                    </div>
                  )}
                </div>
                
                <div className="py-2">
                  <h3 className="font-medium mb-2">Description</h3>
                  <p className="text-sm text-gray-600">{selectedEvent.description || "No description available for this event."}</p>
                </div>
              </div>

              <DialogFooter>
                {selectedEvent.registrationStatus === "registered" ? (
                  <div>
                    <Badge className="mr-2 bg-green-600">You're Registered</Badge>
                    <DialogClose asChild>
                      <Button variant="secondary">Close</Button>
                    </DialogClose>
                  </div>
                ) : (
                  <>
                    <Button
                      variant="outline"
                      className="border-red-800 text-red-800 hover:bg-red-50"
                      onClick={() => setSelectedEvent(null)}
                    >
                      Cancel
                    </Button>
                    <Button 
                      className="bg-red-800 hover:bg-red-900"
                      onClick={() => handleRegister(selectedEvent.id)}
                      disabled={new Date() > new Date(selectedEvent.registration_deadline || selectedEvent.start_date)}
                    >
                      Register
                    </Button>
                  </>
                )}
              </DialogFooter>
            </DialogContent>
          )}
        </Dialog>
      </main>
    </div>
  )
} 