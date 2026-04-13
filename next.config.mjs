/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false, // Helps identify if double-rendering causes permission prompts
  trailingSlash: true,    // Ensures consistent asset paths on subdomains
  images: {
    domains: ["www.fishndrop.com"],
  },
};

export default nextConfig;
