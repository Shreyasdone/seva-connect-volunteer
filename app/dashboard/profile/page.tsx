"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/utils/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { DatePicker } from "@/components/ui/date-picker"
import DashboardHeader from "@/components/dashboard/header"

export default function ProfilePage() {
  const [profile, setProfile] = useState<any>(null)
  const [fullName, setFullName] = useState("")
  const [mobile, setMobile] = useState("")
  const [age, setAge] = useState("")
  const [organization, setOrganization] = useState("")
  const [workTypes, setWorkTypes] = useState<string[]>([])
  const [isVirtual, setIsVirtual] = useState(false)
  const [isInPerson, setIsInPerson] = useState(false)
  const [placeName, setPlaceName] = useState("")
  const [startDate, setStartDate] = useState<Date | undefined>(undefined)
  const [endDate, setEndDate] = useState<Date | undefined>(undefined)
  const [timePreference, setTimePreference] = useState("")
  const [daysAvailable, setDaysAvailable] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const fetchProfile = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push("/login")
        return
      }

      const { data: profileData, error } = await supabase.from("volunteers").select("*").eq("id", user.id).single()

      if (error) {
        console.error("Error fetching profile:", error)
        return
      }

      setProfile(profileData)
      setFullName(profileData.full_name || "")
      setMobile(profileData.mobile_number || "")
      setAge(profileData.age?.toString() || "")
      setOrganization(profileData.organization || "")
      setWorkTypes(profileData.work_types || [])
      setStartDate(profileData.availability_start_date ? new Date(profileData.availability_start_date) : undefined)
      setEndDate(profileData.availability_end_date ? new Date(profileData.availability_end_date) : undefined)
      setTimePreference(profileData.time_preference || "")
      setDaysAvailable(profileData.days_available || [])

      // Parse preferred location
      const location = profileData.preferred_location || ""
      setIsVirtual(location.includes("virtual"))
      setIsInPerson(location.includes(",") || (location !== "virtual" && location !== ""))
      setPlaceName(location.includes(",") ? location.split(",")[1].trim() : location === "virtual" ? "" : location)
    }

    fetchProfile()
  }, [router, supabase])

  const workTypeOptions = [
    { id: "education", label: "Education & Tutoring" },
    { id: "environment", label: "Environmental Conservation" },
    { id: "healthcare", label: "Healthcare Support" },
    { id: "community", label: "Community Outreach" },
    { id: "events", label: "Event Organization" },
    { id: "tech", label: "Technical Support" },
    { id: "admin", label: "Administrative Work" },
  ]

  const timeOptions = [
    { id: "morning", label: "Morning (8am - 12pm)" },
    { id: "afternoon", label: "Afternoon (12pm - 5pm)" },
    { id: "evening", label: "Evening (5pm - 9pm)" },
    { id: "flexible", label: "Flexible" },
  ]

  const dayOptions = [
    { id: "monday", label: "Monday" },
    { id: "tuesday", label: "Tuesday" },
    { id: "wednesday", label: "Wednesday" },
    { id: "thursday", label: "Thursday" },
    { id: "friday", label: "Friday" },
    { id: "saturday", label: "Saturday" },
    { id: "sunday", label: "Sunday" },
  ]

  const handleWorkTypeChange = (id: string, checked: boolean) => {
    if (checked) {
      setWorkTypes([...workTypes, id])
    } else {
      setWorkTypes(workTypes.filter((type) => type !== id))
    }
  }

  const handleDayChange = (id: string, checked: boolean) => {
    if (id === "weekend") {
      if (checked) {
        setDaysAvailable(prev => [...new Set([...prev, "saturday", "sunday"])])
      } else {
        setDaysAvailable(prev => prev.filter(day => day !== "saturday" && day !== "sunday"))
      }
      return
    }

    if (checked) {
      setDaysAvailable([...daysAvailable, id])
    } else {
      setDaysAvailable(daysAvailable.filter((day) => day !== id))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(null)

    if (workTypes.length === 0) {
      setError("Please select at least one work type")
      setLoading(false)
      return
    }

    if (!isVirtual && !isInPerson) {
      setError("Please select at least one location type")
      setLoading(false)
      return
    }

    if (isInPerson && !placeName.trim()) {
      setError("Please enter a place name for in-person volunteering")
      setLoading(false)
      return
    }

    if (!startDate) {
      setError("Please select a start date")
      setLoading(false)
      return
    }

    if (!timePreference) {
      setError("Please select a time preference")
      setLoading(false)
      return
    }

    if (daysAvailable.length === 0) {
      setError("Please select at least one day of availability")
      setLoading(false)
      return
    }

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        setError("You must be logged in")
        return
      }

      // Format preferred location based on selections
      let formattedLocation = ""
      if (isVirtual && !isInPerson) {
        formattedLocation = "virtual"
      } else if (!isVirtual && isInPerson) {
        formattedLocation = placeName.trim()
      } else if (isVirtual && isInPerson) {
        formattedLocation = `virtual, ${placeName.trim()}`
      }

      // Update profile
      const { error } = await supabase
        .from("volunteers")
        .update({
          full_name: fullName,
          mobile_number: mobile,
          age: Number.parseInt(age),
          organization: organization,
          work_types: workTypes,
          preferred_location: formattedLocation,
          availability_start_date: startDate.toISOString(),
          availability_end_date: endDate?.toISOString() || null,
          time_preference: timePreference,
          days_available: daysAvailable,
        })
        .eq("id", user.id)

      if (error) {
        setError(error.message)
        return
      }

      setSuccess("Profile updated successfully")
      setTimeout(() => setSuccess(null), 3000) // Clear success message after 3 seconds
    } catch (err) {
      setError("An unexpected error occurred")
    } finally {
      setLoading(false)
    }
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-white">
        <DashboardHeader />
        <main className="container mx-auto px-4 py-8">
          <p className="text-center">Loading profile...</p>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-white">
      <DashboardHeader />
      <main className="container max-w-screen-lg mx-auto px-4 py-10">
        <h1 className="text-3xl font-bold text-red-900 mb-8">Edit Profile</h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="bg-green-50 text-green-800 border-green-200">
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}

          <Card className="w-full shadow-lg">
            <CardHeader className="space-y-1">
              <CardTitle className="text-2xl font-bold text-red-900">Personal Information</CardTitle>
              <CardDescription>
                Tell us a bit about yourself. This information helps us match you with the right volunteer opportunities.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="mobile">Mobile Number</Label>
                <Input id="mobile" type="tel" value={mobile} onChange={(e) => setMobile(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="age">Age</Label>
                <Input
                  id="age"
                  type="number"
                  min="16"
                  max="120"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="organization">Organization (if applicable)</Label>
                <Input id="organization" value={organization} onChange={(e) => setOrganization(e.target.value)} />
              </div>
            </CardContent>
          </Card>

          <Card className="w-full shadow-lg">
            <CardHeader className="space-y-1">
              <CardTitle className="text-2xl font-bold text-red-900">Work Preferences</CardTitle>
              <CardDescription>
                Let us know what type of volunteer work you're interested in and your preferred location.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <Label>What type of volunteer work are you interested in?</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {workTypeOptions.map((option) => (
                    <div key={option.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={option.id}
                        checked={workTypes.includes(option.id)}
                        onCheckedChange={(checked) => handleWorkTypeChange(option.id, checked as boolean)}
                      />
                      <Label htmlFor={option.id} className="cursor-pointer">
                        {option.label}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <Label>Preferred Location</Label>
                <div className="space-y-4">
                  <div className="flex flex-col space-y-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="virtual"
                        checked={isVirtual}
                        onCheckedChange={(checked) => setIsVirtual(checked as boolean)}
                      />
                      <Label htmlFor="virtual" className="cursor-pointer">
                        Virtual
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="in-person"
                        checked={isInPerson}
                        onCheckedChange={(checked) => setIsInPerson(checked as boolean)}
                      />
                      <Label htmlFor="in-person" className="cursor-pointer">
                        In Person
                      </Label>
                    </div>
                  </div>
                  {isInPerson && (
                    <div className="space-y-2">
                      <Label htmlFor="placeName">Place Name</Label>
                      <input
                        type="text"
                        id="placeName"
                        value={placeName}
                        onChange={(e) => setPlaceName(e.target.value)}
                        placeholder="Enter city or location name"
                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      />
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="w-full shadow-lg">
            <CardHeader className="space-y-1">
              <CardTitle className="text-2xl font-bold text-red-900">Availability</CardTitle>
              <CardDescription>
                Let us know when you're available to volunteer. This helps us match you with opportunities that fit your
                schedule.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="startDate">Start Date</Label>
                  <DatePicker id="startDate" date={startDate} onSelect={setStartDate} placeholder="Select start date" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endDate">End Date (Optional)</Label>
                  <DatePicker id="endDate" date={endDate} onSelect={setEndDate} placeholder="Select end date" />
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
                      checked={daysAvailable.includes("saturday") && daysAvailable.includes("sunday")}
                      onCheckedChange={(checked) => handleDayChange("weekend", checked as boolean)}
                    />
                    <Label htmlFor="weekend" className="cursor-pointer text-lg font-semibold text-red-900">
                      Weekends
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
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button
              type="submit"
              className="bg-gradient-to-r from-red-600 to-red-800 hover:from-red-700 hover:to-red-900"
              disabled={loading}
            >
              {loading ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </main>
    </div>
  )
}

