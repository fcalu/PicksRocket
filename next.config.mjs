/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // Team logos are loaded from ESPN's CDN (remote images).
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "a.espncdn.com" },
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
      { protocol: "https", hostname: "avatars.githubusercontent.com" },
    ],
  },
};

export default nextConfig;
