"use client"

import DashboardHeader from "@/components/dashboard/header"
import AvailabilityCalendar from "@/components/dashboard/availability-calendar"
import VolunteerStats from "@/components/dashboard/volunteer-stats"
import UpcomingEvents from "@/components/dashboard/upcoming-opportunities"
import MyTasksWidget from "@/components/dashboard/my-tasks-widget"
import RecentDiscussions from "@/components/dashboard/recent-discussions"

interface DashboardContentProps {
  profile: {
    full_name: string
  }
  userId: string
}

export default function DashboardContent({ profile, userId }: DashboardContentProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-white">
      <DashboardHeader />
      <main className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-red-900 mb-8">Welcome, {profile.full_name}</h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-8">
            <VolunteerStats />
            <UpcomingEvents />
            <RecentDiscussions />
          </div>
          <div className="space-y-8">
            <MyTasksWidget />
            <AvailabilityCalendar userId={userId}/>
          </div>
        </div>
      </main>
    </div>
  )
} 