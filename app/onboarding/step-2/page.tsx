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

export default function OnboardingStep2() {
  const [workTypes, setWorkTypes] = useState<string[]>([])
  const [isVirtual, setIsVirtual] = useState(false)
  const [isInPerson, setIsInPerson] = useState(false)
  const [placeName, setPlaceName] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  // Check if user has completed step 1
  useEffect(() => {
    const checkStep = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (!user) {
          router.push("/login")
          return
        }

        const { data: profile, error } = await supabase
          .from("volunteers")
          .select("onboarding_step")
          .eq("id", user.id)
          .single()

        if (error) {
          console.error("Error checking step:", error)
          return
        }

        if (!profile || profile.onboarding_step < 2) {
          router.push("/onboarding/step-1")
        }
      } catch (err) {
        console.error("Error in checkStep:", err)
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

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        setError("You must be logged in")
        setLoading(false)
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

      // Update profile with step 2 data
      const { error: updateError } = await supabase
        .from("volunteers")
        .update({
          work_types: workTypes,
          preferred_location: formattedLocation,
          onboarding_step: 2,
          onboarding_completed: true,
        })
        .eq("id", user.id)

      if (updateError) {
        console.error("Error updating profile:", updateError)
        setError(updateError.message)
        setLoading(false)
        return
      }

      router.push("/dashboard")
    } catch (err) {
      console.error("Error in step 2:", err)
      setError("An unexpected error occurred. Please try again.")
      setLoading(false)
    }
  }

  return (
    <Card className="w-full shadow-lg">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold text-red-900">Work Preferences</CardTitle>
        <CardDescription>
          Tell us what kind of volunteer work you're interested in and where you'd like to volunteer.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <div className="space-y-2">
            <Label>Work Types</Label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
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
              {loading ? "Saving..." : "Complete"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

