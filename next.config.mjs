/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false, // Helps identify if double-rendering causes permission prompts
  trailingSlash: true,    // Ensures consistent asset paths on subdomains
  images: {
    domains: [
      "www.fishndrop.com",
      "images.unsplash.com",
      "res.cloudinary.com",
    ],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
      {
        protocol: "https",
        hostname: "www.fishndrop.com",
      },
    ],
  },
  async rewrites() {
    return [
      {
        source: "/user/venue_bookings/:path*",
        destination: "/user/venue-bookings/:path*",
      },
    ];
  },
};

export default nextConfig;
