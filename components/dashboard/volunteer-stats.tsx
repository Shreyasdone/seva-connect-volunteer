import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Clock, Calendar, Award } from "lucide-react"

export default function VolunteerStats() {
  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="text-xl font-bold text-red-900">Your Volunteer Stats</CardTitle>
        <CardDescription>Track your volunteer contributions</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex flex-col items-center p-4 bg-red-50 rounded-lg">
            <Clock className="h-8 w-8 text-red-600 mb-2" />
            <h3 className="text-2xl font-bold text-red-900">0</h3>
            <p className="text-sm text-gray-600">Tasks excecuted</p>
          </div>

          <div className="flex flex-col items-center p-4 bg-red-50 rounded-lg">
            <Calendar className="h-8 w-8 text-red-600 mb-2" />
            <h3 className="text-2xl font-bold text-red-900">0</h3>
            <p className="text-sm text-gray-600">Events Attended</p>
          </div>

          <div className="flex flex-col items-center p-4 bg-red-50 rounded-lg">
            <Award className="h-8 w-8 text-red-600 mb-2" />
            <h3 className="text-2xl font-bold text-red-900">0</h3>
            <p className="text-sm text-gray-600">Achievements</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

