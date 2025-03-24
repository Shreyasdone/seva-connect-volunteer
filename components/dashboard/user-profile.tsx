import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CalendarDays, MapPin, Briefcase, Phone, Mail, Building } from "lucide-react"

interface UserProfileProps {
  profile: any
}

export default function UserProfile({ profile }: UserProfileProps) {
  // Helper function to format the time preference
  const formatTimePreference = (preference: string) => {
    const options: Record<string, string> = {
      morning: "Morning (8am - 12pm)",
      afternoon: "Afternoon (12pm - 5pm)",
      evening: "Evening (5pm - 9pm)",
      flexible: "Flexible",
    }
    return options[preference] || preference
  }

  // Helper function to format the location preference
  const formatLocation = (location: string) => {
    const options: Record<string, string> = {
      remote: "Remote Only",
      local: "Local Community",
      city: "City-wide",
      regional: "Regional",
      national: "National",
      international: "International",
    }
    return options[location] || location
  }

  // Helper function to format days available
  const formatDays = (days: string[]) => {
    if (!days || days.length === 0) return "None specified"

    return days.map((day) => day.charAt(0).toUpperCase() + day.slice(1)).join(", ")
  }

  // Helper function to format work types
  const formatWorkTypes = (types: string[]) => {
    if (!types || types.length === 0) return []

    const options: Record<string, string> = {
      education: "Education",
      environment: "Environment",
      healthcare: "Healthcare",
      community: "Community",
      events: "Events",
      tech: "Technical",
      admin: "Administrative",
    }

    return types.map((type) => options[type] || type)
  }

  return (
    <Card className="shadow-lg">
      <CardHeader className="pb-2">
        <CardTitle className="text-xl font-bold text-red-900">Your Profile</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col items-center mb-4">
          <div className="w-24 h-24 rounded-full bg-gradient-to-r from-red-500 to-red-700 flex items-center justify-center text-white text-2xl font-bold mb-2">
            {profile.full_name
              ?.split(" ")
              .map((n: string) => n[0])
              .join("")
              .toUpperCase() || "V"}
          </div>
          <h3 className="text-lg font-semibold">{profile.full_name}</h3>
        </div>

        <div className="space-y-3">
          <div className="flex items-start gap-2">
            <Phone className="h-4 w-4 mt-1 text-red-600" />
            <div>
              <p className="text-sm font-medium">Phone</p>
              <p className="text-sm text-gray-600">{profile.mobile_number || "Not provided"}</p>
            </div>
          </div>

          <div className="flex items-start gap-2">
            <Mail className="h-4 w-4 mt-1 text-red-600" />
            <div>
              <p className="text-sm font-medium">Email</p>
              <p className="text-sm text-gray-600">{profile.email}</p>
            </div>
          </div>

          {profile.organization && (
            <div className="flex items-start gap-2">
              <Building className="h-4 w-4 mt-1 text-red-600" />
              <div>
                <p className="text-sm font-medium">Organization</p>
                <p className="text-sm text-gray-600">{profile.organization}</p>
              </div>
            </div>
          )}

          <div className="flex items-start gap-2">
            <MapPin className="h-4 w-4 mt-1 text-red-600" />
            <div>
              <p className="text-sm font-medium">Preferred Location</p>
              <p className="text-sm text-gray-600">{formatLocation(profile.preferred_location)}</p>
            </div>
          </div>

          <div className="flex items-start gap-2">
            <CalendarDays className="h-4 w-4 mt-1 text-red-600" />
            <div>
              <p className="text-sm font-medium">Availability</p>
              <p className="text-sm text-gray-600">{formatTimePreference(profile.time_preference)}</p>
              <p className="text-sm text-gray-600">{formatDays(profile.days_available)}</p>
            </div>
          </div>

          <div className="flex items-start gap-2">
            <Briefcase className="h-4 w-4 mt-1 text-red-600" />
            <div>
              <p className="text-sm font-medium">Work Types</p>
              <div className="flex flex-wrap gap-1 mt-1">
                {formatWorkTypes(profile.work_types).map((type, index) => (
                  <Badge key={index} variant="outline" className="bg-red-50 text-red-700 border-red-200">
                    {type}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

