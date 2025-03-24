import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CalendarDays, MapPin, Clock } from "lucide-react"

export default function UpcomingOpportunities() {
  // Sample opportunities data
  const opportunities = [
    {
      id: 1,
      title: "Community Garden Cleanup",
      date: "June 15, 2023",
      time: "9:00 AM - 12:00 PM",
      location: "Central Park",
      type: "Environment",
    },
    {
      id: 2,
      title: "Food Bank Distribution",
      date: "June 18, 2023",
      time: "2:00 PM - 5:00 PM",
      location: "Downtown Community Center",
      type: "Community",
    },
    {
      id: 3,
      title: "After-School Tutoring",
      date: "June 20, 2023",
      time: "3:30 PM - 5:30 PM",
      location: "Lincoln Elementary School",
      type: "Education",
    },
  ]

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="text-xl font-bold text-red-900">Upcoming Opportunities</CardTitle>
        <CardDescription>Volunteer opportunities that match your preferences</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {opportunities.map((opportunity) => (
            <div key={opportunity.id} className="border rounded-lg p-4 hover:border-red-200 transition-colors">
              <div className="flex justify-between items-start">
                <h3 className="font-semibold text-red-900">{opportunity.title}</h3>
                <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded-full">{opportunity.type}</span>
              </div>

              <div className="mt-2 space-y-2">
                <div className="flex items-center text-sm text-gray-600">
                  <CalendarDays className="h-4 w-4 mr-2 text-red-600" />
                  {opportunity.date}
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <Clock className="h-4 w-4 mr-2 text-red-600" />
                  {opportunity.time}
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <MapPin className="h-4 w-4 mr-2 text-red-600" />
                  {opportunity.location}
                </div>
              </div>

              <div className="mt-4 flex justify-end">
                <Button variant="outline" className="text-red-600 border-red-600 hover:bg-red-50">
                  Sign Up
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

