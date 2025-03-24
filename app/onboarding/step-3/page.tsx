"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/utils/supabase/client"

export default function OnboardingStep3() {
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const redirectToDashboard = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push("/login")
      } else {
        // Check if onboarding is completed
        const { data } = await supabase.from("volunteers").select("onboarding_completed").eq("id", user.id).single()
        
        if (data?.onboarding_completed) {
          router.push("/dashboard")
        } else {
          router.push("/onboarding/step-1")
        }
      }
    }

    redirectToDashboard()
  }, [router, supabase])

  return null
}

