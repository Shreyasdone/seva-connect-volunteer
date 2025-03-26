import type { Metadata } from 'next'
import './globals.css'

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
      <body>{children}</body>
    </html>
  )
}
