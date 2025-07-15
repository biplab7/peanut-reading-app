/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['@supabase/supabase-js']
  },
  env: {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  },
  async rewrites() {
    const apiBaseUrl = process.env.NODE_ENV === 'development' 
      ? 'http://localhost:3001'
      : 'https://peanut-reading-app.onrender.com';
    
    return [
      {
        source: '/api/health',
        destination: `${apiBaseUrl}/health`
      },
      {
        source: '/api/:path*',
        destination: `${apiBaseUrl}/api/:path*`
      }
    ]
  }
}

module.exports = nextConfig