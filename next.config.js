/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: false },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**.supabase.co' },
    ],
  },
  async headers() {
    const noStore = { key: 'Cache-Control', value: 'no-store, no-cache, must-revalidate, proxy-revalidate' };
    return [
      {
        // never let the viewer/admin/data routes get cached anywhere (CDN, browser)
        source: '/api/:path*',
        headers: [noStore, { key: 'X-Content-Type-Options', value: 'nosniff' }],
      },
      { source: '/files', headers: [noStore] },
      { source: '/images', headers: [noStore] },
      { source: '/view/:path*', headers: [noStore] },
      { source: '/admin', headers: [noStore] },
      { source: '/admin/:path*', headers: [noStore] },
    ];
  },
};

module.exports = nextConfig;
