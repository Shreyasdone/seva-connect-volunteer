import { redirect } from "next/navigation"
import { createClient } from "@/utils/supabase/server"
import DashboardContent from "@/components/dashboard/dashboard-content"

export default async function Dashboard() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  // Check if onboarding is complete
  const { data: profile } = await supabase.from("volunteers").select("*").eq("id", user.id).single()

  if (!profile?.onboarding_completed) {
    redirect(`/onboarding/step-${profile?.onboarding_step || 1}`)
  }

  return <DashboardContent profile={profile} userId={user.id} />
}

