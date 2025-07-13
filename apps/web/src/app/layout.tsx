import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Peanut Reading - AI-Powered Reading Companion for Kids',
  description: 'Help children improve their reading skills with AI-powered stories and speech recognition',
  keywords: 'reading, children, AI, education, speech recognition, stories',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
          {children}
        </div>
      </body>
    </html>
  )
}