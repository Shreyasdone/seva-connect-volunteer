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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"

export default function OnboardingStep2() {
  const [workTypes, setWorkTypes] = useState<string[]>([])
  const [preferredLocation, setPreferredLocation] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  // Check if user has completed step 1
  useEffect(() => {
    const checkStep = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (user) {
        const { data: profile } = await supabase.from("profiles").select("onboarding_step").eq("id", user.id).single()

        if (profile?.onboarding_step < 2) {
          router.push("/onboarding/step-1")
        }
      }
    }

    checkStep()
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

  const handleWorkTypeChange = (id: string, checked: boolean) => {
    if (checked) {
      setWorkTypes([...workTypes, id])
    } else {
      setWorkTypes(workTypes.filter((type) => type !== id))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    if (workTypes.length === 0) {
      setError("Please select at least one work type")
      setLoading(false)
      return
    }

    if (!preferredLocation) {
      setError("Please select a preferred location")
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

      // Update profile with step 2 data
      const { error } = await supabase
        .from("profiles")
        .update({
          work_types: workTypes,
          preferred_location: preferredLocation,
          onboarding_step: 3,
        })
        .eq("id", user.id)

      if (error) {
        setError(error.message)
        return
      }

      router.push("/onboarding/step-3")
    } catch (err) {
      setError("An unexpected error occurred")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="w-full shadow-lg">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold text-red-900">Work Preferences</CardTitle>
        <CardDescription>
          Let us know what type of volunteer work you're interested in and your preferred location.
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
          <div className="flex justify-between pt-4">
            <Button
              type="button"
              variant="outline"
              className="border-red-600 text-red-600 hover:bg-red-50"
              onClick={() => router.push("/onboarding/step-1")}
            >
              Back
            </Button>
            <Button
              type="submit"
              className="bg-gradient-to-r from-red-600 to-red-800 hover:from-red-700 hover:to-red-900"
              disabled={loading}
            >
              {loading ? "Saving..." : "Continue"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

