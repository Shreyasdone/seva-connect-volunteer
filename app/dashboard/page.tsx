import { redirect } from "next/navigation"
import { createClient } from "@/utils/supabase/server"
import DashboardHeader from "@/components/dashboard/header"
import UserProfile from "@/components/dashboard/user-profile"
import VolunteerStats from "@/components/dashboard/volunteer-stats"
import UpcomingOpportunities from "@/components/dashboard/upcoming-opportunities"

export default async function Dashboard() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  // Check if onboarding is complete
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

  if (!profile?.onboarding_completed) {
    redirect(`/onboarding/step-${profile?.onboarding_step || 1}`)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-white">
      <DashboardHeader />
      <main className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-red-900 mb-8">Welcome, {profile.full_name}</h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-1">
            <UserProfile profile={profile} />
          </div>
          <div className="md:col-span-2">
            <div className="space-y-6">
              <VolunteerStats />
              <UpcomingOpportunities />
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

