"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/utils/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function OnboardingStep1() {
  const [fullName, setFullName] = useState("")
  const [mobile, setMobile] = useState("")
  const [age, setAge] = useState("")
  const [organization, setOrganization] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        setError("You must be logged in")
        return
      }

      // Update profile with step 1 data
      const { error } = await supabase
        .from("volunteers")
        .update({
          full_name: fullName,
          mobile_number: mobile,
          age: Number.parseInt(age),
          organization: organization,
          onboarding_step: 2,
        })
        .eq("id", user.id)

      if (error) {
        setError(error.message)
        return
      }

      router.push("/onboarding/step-2")
    } catch (err) {
      setError("An unexpected error occurred")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="w-full shadow-lg">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold text-red-900">Personal Information</CardTitle>
        <CardDescription>
          Tell us a bit about yourself. This information helps us match you with the right volunteer opportunities.
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
          <Button
            type="submit"
            className="w-full bg-gradient-to-r from-red-600 to-red-800 hover:from-red-700 hover:to-red-900"
            disabled={loading}
          >
            {loading ? "Saving..." : "Continue"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

