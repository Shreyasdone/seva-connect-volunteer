import { NextResponse, type NextRequest } from "next/server"
import { updateSession } from "@/utils/supabase/middleware"

export async function middleware(request: NextRequest) {
  const res = await updateSession(request)

  // Get the pathname from the URL
  const pathname = request.nextUrl.pathname

  // Protected routes that require authentication
  const protectedRoutes = ["/dashboard", "/onboarding"]
  const isProtectedRoute = protectedRoutes.some((route) => pathname.startsWith(route))

  // Get the session from the request
  const requestUrl = new URL(request.url)
  const response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  return res
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}

