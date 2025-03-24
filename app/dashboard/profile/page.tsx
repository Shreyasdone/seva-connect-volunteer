"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/utils/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
  const [preferredLocation, setPreferredLocation] = useState("")
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

      const { data: profileData, error } = await supabase.from("profiles").select("*").eq("id", user.id).single()

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
      setPreferredLocation(profileData.preferred_location || "")
      setStartDate(profileData.availability_start_date ? new Date(profileData.availability_start_date) : undefined)
      setEndDate(profileData.availability_end_date ? new Date(profileData.availability_end_date) : undefined)
      setTimePreference(profileData.time_preference || "")
      setDaysAvailable(profileData.days_available || [])
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

  const locationOptions = [
    { id: "remote", label: "Remote Only" },
    { id: "local", label: "Local Community" },
    { id: "city", label: "City-wide" },
    { id: "regional", label: "Regional" },
    { id: "national", label: "National" },
    { id: "international", label: "International" },
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

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        setError("You must be logged in")
        return
      }

      // Update profile
      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: fullName,
          mobile_number: mobile,
          age: Number.parseInt(age),
          organization: organization,
          work_types: workTypes,
          preferred_location: preferredLocation,
          availability_start_date: startDate?.toISOString(),
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
      <main className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-red-900 mb-8">Edit Profile</h1>

        <div className="max-w-3xl mx-auto">
          <form onSubmit={handleSubmit}>
            {error && (
              <Alert variant="destructive" className="mb-6">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {success && (
              <Alert className="mb-6 bg-green-50 text-green-800 border-green-200">
                <AlertDescription>{success}</AlertDescription>
              </Alert>
            )}

            <Card className="shadow-lg mb-6">
              <CardHeader>
                <CardTitle className="text-xl font-bold text-red-900">Personal Information</CardTitle>
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

            <Card className="shadow-lg mb-6">
              <CardHeader>
                <CardTitle className="text-xl font-bold text-red-900">Work Preferences</CardTitle>
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
                  <Label htmlFor="location">Preferred Location</Label>
                  <Select value={preferredLocation} onValueChange={setPreferredLocation}>
                    <SelectTrigger id="location">
                      <SelectValue placeholder="Select a location" />
                    </SelectTrigger>
                    <SelectContent>
                      {locationOptions.map((option) => (
                        <SelectItem key={option.id} value={option.id}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-lg mb-6">
              <CardHeader>
                <CardTitle className="text-xl font-bold text-red-900">Availability</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="startDate">Start Date</Label>
                    <DatePicker
                      id="startDate"
                      date={startDate}
                      onSelect={setStartDate}
                      placeholder="Select start date"
                    />
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
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {dayOptions.map((option) => (
                      <div key={option.id} className="flex items-center space-x-2">
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
        </div>
      </main>
    </div>
  )
}

