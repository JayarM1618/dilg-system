import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  poweredByHeader: false,
  productionBrowserSourceMaps: false,
  compiler: {
    removeConsole: process.env.NODE_ENV === "production" ? { exclude: ["error"] } : false,
  },
  images: {
    unoptimized: true,
  },
  async rewrites() {
    return [
      {
        source: "/sanctum/:path*",
        destination: `${process.env.NEXT_PUBLIC_API_URL}/sanctum/:path*`,
      },
      {
        source: "/api/:path*",
        destination: `${process.env.NEXT_PUBLIC_API_URL}/api/:path*`,
      },
    ];
  },
  async redirects() {
    return [
      {
        source: "/:role(user|admin)/requirements/:path*",
        destination: "/borms/requirements/:path*",
        permanent: false,
      },
      {
        source: "/:role(user|admin)/requirements",
        destination: "/borms/requirements",
        permanent: false,
      },
      {
        source: "/:role(user|admin)/reports/:path*",
        destination: "/borms/reports/:path*",
        permanent: false,
      },
      {
        source: "/:role(user|admin)/reports",
        destination: "/borms/reports",
        permanent: false,
      },
      {
        source: "/:role(user|admin)/repository/:path*",
        destination: "/borms/repository/:path*",
        permanent: false,
      },
      {
        source: "/:role(user|admin)/repository",
        destination: "/borms/repository",
        permanent: false,
      },
      {
        source: "/:role(user|admin)/resources/:path*",
        destination: "/borms/resources/:path*",
        permanent: false,
      },
      {
        source: "/:role(user|admin)/resources",
        destination: "/borms/resources",
        permanent: false,
      },
      {
        source: "/:role(user|admin)/community/:path*",
        destination: "/borms/community/:path*",
        permanent: false,
      },
      {
        source: "/:role(user|admin)/community",
        destination: "/borms/community",
        permanent: false,
      },
      {
        source: "/super-admin/accounts/:path*",
        destination: "/talaghayan/users/:path*",
        permanent: false,
      },
      {
        source: "/super-admin/accounts",
        destination: "/talaghayan/users",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;