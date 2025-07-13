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
        <script
          dangerouslySetInnerHTML={{
            __html: `
              console.log('🚀 Peanut Reading App Loaded');
              console.log('🔧 Environment Info:', {
                userAgent: navigator.userAgent,
                language: navigator.language,
                platform: navigator.platform,
                url: window.location.href
              });
              console.log('🎯 Backend API URL: /api/* (proxied to backend)');
              console.log('📝 Debug logging enabled - watch console for API calls');
            `,
          }}
        />
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
          {children}
        </div>
      </body>
    </html>
  )
}