import type { Metadata } from 'next'
import './globals.css'
import { AccessibilityProvider } from '../components/AccessibilityProvider'
import AccessibilityMenu from '../components/AccessibilityMenu'
import ColorBlindnessFilters from '../components/ColorBlindnessFilters'
import { Toaster } from '@/components/ui/sonner'

export const metadata: Metadata = {
  title: 'Sevaconnect Volunteer portal',
  description: 'Made with ❤️ by Parth Kulkarni',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body>
        <AccessibilityProvider>
          {children}
          <AccessibilityMenu />
          <ColorBlindnessFilters />
          <Toaster />
        </AccessibilityProvider>
      </body>
    </html>
  )
}
