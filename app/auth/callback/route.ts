import { createClient } from "@/utils/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get("code")

  if (code) {
    const supabase = createClient()
    await supabase.auth.exchangeCodeForSession(code)

    const { data: { user } } = await supabase.auth.getUser()

    if (user) {
      let { data: profile } = await supabase
        .from("volunteers")
        .select("onboarding_completed, onboarding_step")
        .eq("id", user.id)
        .single()

      if (!profile) {
        const { error: insertError } = await supabase.from("volunteers").insert({
          id: user.id,
          email: user.email,
          onboarding_step: 1,
          onboarding_completed: false,
        })

        if (insertError) {
          console.error("Error creating volunteer profile in callback:", insertError)
        } else {
          profile = {
            onboarding_completed: false,
            onboarding_step: 1,
          }
        }
      }

      if (profile?.onboarding_completed) {
        return NextResponse.redirect(requestUrl.origin + "/dashboard")
      }

      return NextResponse.redirect(
        requestUrl.origin + `/onboarding/step-${profile?.onboarding_step || 1}`
      )
    }
  }

  return NextResponse.redirect(requestUrl.origin + "/onboarding/step-1")
}

