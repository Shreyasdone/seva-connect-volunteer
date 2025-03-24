"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { createClient } from "@/utils/supabase/client"
import { format, parseISO } from "date-fns"
import { AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { DatePicker } from "@/components/ui/date-picker"

export default function AvailabilityCalendar({ userId }) {
  const [date, setDate] = useState(new Date())
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  
  // Availability states
  const [availabilityStartDate, setAvailabilityStartDate] = useState<Date | undefined>(undefined)
  const [availabilityEndDate, setAvailabilityEndDate] = useState<Date | undefined>(undefined)
  const [timePreference, setTimePreference] = useState("")
  const [daysAvailable, setDaysAvailable] = useState<string[]>([])
  
  const supabase = createClient()
  
  // Time preference options
  const timeOptions = [
    { id: "morning", label: "Morning (8am - 12pm)" },
    { id: "afternoon", label: "Afternoon (12pm - 5pm)" },
    { id: "evening", label: "Evening (5pm - 9pm)" },
    { id: "flexible", label: "Flexible" },
  ]

  // Day options
  const dayOptions = [
    { id: "monday", label: "Monday" },
    { id: "tuesday", label: "Tuesday" },
    { id: "wednesday", label: "Wednesday" },
    { id: "thursday", label: "Thursday" },
    { id: "friday", label: "Friday" },
    { id: "saturday", label: "Saturday" },
    { id: "sunday", label: "Sunday" },
  ]
  
  // Fetch user's availability data
  useEffect(() => {
    const fetchAvailability = async () => {
      setLoading(true)
      
      try {
        const { data, error } = await supabase
          .from("volunteers")
          .select("availability_start_date, availability_end_date, time_preference, days_available")
          .eq("id", userId)
          .single()
        
        if (error) {
          console.error("Error fetching availability:", error)
          setError("Failed to load your availability. Please try again.")
          return
        }
        
        if (data) {
          if (data.availability_start_date) {
            setAvailabilityStartDate(parseISO(data.availability_start_date))
          }
          
          if (data.availability_end_date) {
            setAvailabilityEndDate(parseISO(data.availability_end_date))
          }
          
          if (data.time_preference) {
            setTimePreference(data.time_preference)
          }
          
          if (data.days_available) {
            setDaysAvailable(data.days_available)
          }
        }
      } catch (error) {
        console.error("Error:", error)
        setError("An unexpected error occurred. Please try again.")
      } finally {
        setLoading(false)
      }
    }
    
    if (userId) {
      fetchAvailability()
    }
  }, [userId])
  
  // Open edit dialog
  const openEditDialog = () => {
    setIsEditOpen(true)
  }
  
  // Handle day selection
  const handleDayChange = (id: string, checked: boolean) => {
    if (id === "weekend") {
      if (checked) {
        // When weekends is checked, clear all other days and only set saturday and sunday
        setDaysAvailable(["saturday", "sunday"])
      } else {
        // When weekends is unchecked, clear saturday and sunday
        setDaysAvailable(prev => prev.filter(day => day !== "saturday" && day !== "sunday"))
      }
      return
    }

    // If any other day is selected, remove saturday and sunday
    if (checked) {
      setDaysAvailable(prev => [...prev.filter(day => day !== "saturday" && day !== "sunday"), id])
    } else {
      setDaysAvailable(prev => prev.filter(day => day !== id))
    }
  }
  
  // Save availability changes
  const saveAvailability = async () => {
    setError(null)
    
    if (!availabilityStartDate) {
      setError("Please select a start date")
      return
    }

    if (!timePreference) {
      setError("Please select a time preference")
      return
    }

    if (daysAvailable.length === 0) {
      setError("Please select at least one day of availability")
      return
    }
    
    try {
      const { error } = await supabase
        .from("volunteers")
        .update({
          availability_start_date: availabilityStartDate.toISOString(),
          availability_end_date: availabilityEndDate?.toISOString() || null,
          time_preference: timePreference,
          days_available: daysAvailable,
        })
        .eq("id", userId)
      
      if (error) {
        console.error("Error updating availability:", error)
        setError("Failed to save your availability. Please try again.")
        return
      }
      
      setIsEditOpen(false)
    } catch (error) {
      console.error("Error:", error)
      setError("An unexpected error occurred. Please try again.")
    }
  }
  
  // Format day names for display
  const formatDayName = (day: string) => {
    return day.charAt(0).toUpperCase() + day.slice(1)
  }
  
  // Get time preference display name
  const getTimePreferenceLabel = (id: string) => {
    const option = timeOptions.find(opt => opt.id === id)
    return option ? option.label : id
  }

  return (
    <>
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-red-900">My Availability</CardTitle>
          <CardDescription>Your available times for volunteering</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="h-48 flex justify-center items-center">
              <p className="text-gray-500">Loading your availability...</p>
            </div>
          ) : (
            <>
              <div className="space-y-4 mb-6">
                <div className="border rounded-lg p-4">
                  <h3 className="font-medium text-gray-700 mb-2">Availability Period</h3>
                  <div className="space-y-1">
                    <p className="text-sm text-gray-600">
                      <span className="font-semibold">Start Date:</span> {availabilityStartDate 
                        ? format(availabilityStartDate, "MMMM d, yyyy") 
                        : "Not set"}
                    </p>
                    {availabilityEndDate && (
                      <p className="text-sm text-gray-600">
                        <span className="font-semibold">End Date:</span> {format(availabilityEndDate, "MMMM d, yyyy")}
                      </p>
                    )}
                  </div>
                </div>
                
                <div className="border rounded-lg p-4">
                  <h3 className="font-medium text-gray-700 mb-2">Time Preference</h3>
                  <p className="text-sm text-gray-600">
                    {timePreference ? getTimePreferenceLabel(timePreference) : "Not set"}
                  </p>
                </div>
                
                <div className="border rounded-lg p-4">
                  <h3 className="font-medium text-gray-700 mb-2">Days Available</h3>
                  {daysAvailable.length === 0 ? (
                    <p className="text-sm text-gray-600">No days selected</p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {daysAvailable.map(day => (
                        <span 
                          key={day} 
                          className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded-full"
                        >
                          {formatDayName(day)}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              
              <Button 
                className="w-full bg-gradient-to-r from-red-600 to-red-800 hover:from-red-700 hover:to-red-900"
                onClick={openEditDialog}
              >
                Edit Availability
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      {/* Edit Availability Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="text-xl text-red-900">Edit Availability</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="startDate">Start Date</Label>
                <DatePicker 
                  id="startDate" 
                  date={availabilityStartDate} 
                  onSelect={setAvailabilityStartDate} 
                  placeholder="Select start date" 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate">End Date (Optional)</Label>
                <DatePicker 
                  id="endDate" 
                  date={availabilityEndDate} 
                  onSelect={setAvailabilityEndDate} 
                  placeholder="Select end date" 
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="timePreference">Preferred Time</Label>
              <Select value={timePreference} onValueChange={setTimePreference}>
                <SelectTrigger id="timePreference">
                  <SelectValue placeholder="Select preferred time" />
                </SelectTrigger>
                <SelectContent>
                  {timeOptions.map((option) => (
                    <SelectItem key={option.id} value={option.id}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-4">
              <Label>Days Available</Label>
              <div className="space-y-6">
                {/* Weekend Button */}
                <div className="flex items-center space-x-3 p-4 bg-red-50 rounded-lg border border-red-100">
                  <Checkbox
                    id="weekend"
                    className="h-5 w-5"
                    checked={daysAvailable.length === 2 && daysAvailable.includes("saturday") && daysAvailable.includes("sunday")}
                    onCheckedChange={(checked) => handleDayChange("weekend", checked as boolean)}
                  />
                  <Label htmlFor="weekend" className="cursor-pointer text-lg font-semibold text-red-900">
                    Weekends Only
                  </Label>
                </div>

                {/* All Days */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {dayOptions.map((option) => (
                    <div key={option.id} 
                      className="flex items-center space-x-2 p-2 hover:bg-gray-50 rounded-md transition-colors">
                      <Checkbox
                        id={option.id}
                        checked={daysAvailable.includes(option.id)}
                        onCheckedChange={(checked) => handleDayChange(option.id, checked as boolean)}
                      />
                      <Label htmlFor={option.id} className="cursor-pointer">
                        {option.label}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              className="bg-gradient-to-r from-red-600 to-red-800 hover:from-red-700 hover:to-red-900"
              onClick={saveAvailability}
            >
              Save Changes
            </Button>
            <DialogClose asChild>
              <Button variant="outline" className="border-red-600 text-red-600 hover:bg-red-50">
                Cancel
              </Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
} 