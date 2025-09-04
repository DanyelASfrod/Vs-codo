/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    return [
      // Auth endpoints no backend não usam prefixo /api
      {
        source: '/api/auth/:path*',
        destination: 'http://localhost:4000/auth/:path*'
      },
      // Endpoints que já existem com /api no backend
      {
        source: '/api/:path*',
        destination: 'http://localhost:4000/api/:path*'
      }
    ]
  },
}

module.exports = nextConfig
