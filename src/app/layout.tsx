import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Relai — AI Relationship Intelligence',
  description: 'CRM that builds itself from your email and calendar.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
