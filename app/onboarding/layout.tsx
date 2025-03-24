import type React from "react"
import { redirect } from "next/navigation"
import { createClient } from "@/utils/supabase/server"
import OnboardingProgress from "@/components/onboarding/progress-bar"

export default async function OnboardingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  // Check if onboarding is already completed
  const { data: profile } = await supabase.from("volunteers").select("onboarding_completed").eq("id", user.id).single()

  if (profile?.onboarding_completed) {
    redirect("/dashboard")
  }

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-red-50 to-white">
      <div className="container max-w-screen-lg mx-auto px-4 py-10">
        <OnboardingProgress />
        <div className="mt-8">{children}</div>
      </div>
    </div>
  )
}

