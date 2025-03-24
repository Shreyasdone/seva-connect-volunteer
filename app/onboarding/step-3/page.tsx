"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/utils/supabase/client"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Checkbox } from "@/components/ui/checkbox"
import { DatePicker } from "@/components/ui/date-picker"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function OnboardingStep3() {
  const [startDate, setStartDate] = useState<Date | undefined>(undefined)
  const [endDate, setEndDate] = useState<Date | undefined>(undefined)
  const [timePreference, setTimePreference] = useState("")
  const [daysAvailable, setDaysAvailable] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  // Check if user has completed step 2
  useEffect(() => {
    const checkStep = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (user) {
        const { data: profile } = await supabase.from("volunteers").select("onboarding_step").eq("id", user.id).single()

        if (profile?.onboarding_step < 3) {
          router.push("/onboarding/step-2")
        }
      }
    }

    checkStep()
  }, [router, supabase])

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
      setDaysAvailable(prev => [...prev, id])
    } else {
      setDaysAvailable(prev => prev.filter(day => day !== id))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

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

      // Update profile with step 3 data and mark onboarding as complete
      const { error } = await supabase
        .from("volunteers")
        .update({
          availability_start_date: startDate.toISOString(),
          availability_end_date: endDate?.toISOString() || null,
          time_preference: timePreference,
          days_available: daysAvailable,
          onboarding_step: 3,
          onboarding_completed: true,
        })
        .eq("id", user.id)

      if (error) {
        setError(error.message)
        return
      }

      router.push("/dashboard")
    } catch (err) {
      setError("An unexpected error occurred")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="w-full shadow-lg">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold text-red-900">Availability</CardTitle>
        <CardDescription>
          Let us know when you're available to volunteer. This helps us match you with opportunities that fit your
          schedule.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
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
          <div className="flex justify-between pt-4">
            <Button
              type="button"
              variant="outline"
              className="border-red-600 text-red-600 hover:bg-red-50"
              onClick={() => router.push("/onboarding/step-2")}
            >
              Back
            </Button>
            <Button
              type="submit"
              className="bg-gradient-to-r from-red-600 to-red-800 hover:from-red-700 hover:to-red-900"
              disabled={loading}
            >
              {loading ? "Completing..." : "Complete"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

