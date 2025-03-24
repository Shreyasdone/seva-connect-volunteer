import Link from "next/link"
import { redirect } from "next/navigation"
import { createClient } from "@/utils/supabase/server"
import { Button } from "@/components/ui/button"

export default async function Home() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) {
    // Check if onboarding is complete
    const { data: profile } = await supabase
      .from("profiles")
      .select("onboarding_completed, onboarding_step")
      .eq("id", user.id)
      .single()

    if (!profile?.onboarding_completed) {
      redirect(`/onboarding/step-${profile?.onboarding_step || 1}`)
    } else {
      redirect("/dashboard")
    }
  }

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-red-50 to-white">
      <main className="flex-1">
        <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48">
          <div className="container px-4 md:px-6">
            <div className="grid gap-6 lg:grid-cols-[1fr_400px] lg:gap-12 xl:grid-cols-[1fr_600px]">
              <div className="flex flex-col justify-center space-y-4">
                <div className="space-y-2">
                  <h1 className="text-3xl font-bold tracking-tighter sm:text-5xl xl:text-6xl/none text-red-900">
                    Join Our Volunteer Community
                  </h1>
                  <p className="max-w-[600px] text-gray-700 md:text-xl">
                    Make a difference by volunteering with us. Sign up today and become part of our growing community of
                    change-makers.
                  </p>
                </div>
                <div className="flex flex-col gap-2 min-[400px]:flex-row">
                  <Link href="/signup">
                    <Button className="bg-gradient-to-r from-red-600 to-red-800 hover:from-red-700 hover:to-red-900">
                      Sign Up
                    </Button>
                  </Link>
                  <Link href="/login">
                    <Button variant="outline" className="border-red-600 text-red-600 hover:bg-red-50">
                      Log In
                    </Button>
                  </Link>
                </div>
              </div>
              <div className="rounded-xl overflow-hidden shadow-xl">
                <img
                  src="/placeholder.svg?height=550&width=550"
                  alt="Volunteers working together"
                  className="mx-auto aspect-video overflow-hidden rounded-xl object-cover object-center sm:w-full"
                />
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}

