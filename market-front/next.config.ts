import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  reactCompiler: true,
  images: {
    remotePatterns: [
      { protocol: "http", hostname: "localhost", pathname: "/**", port: "8080" },
      { protocol: "http", hostname: "127.0.0.1", pathname: "/**", port: "8080" },
    ],
  },
  async rewrites() {
    const backend = process.env.BACKEND_URL || "http://localhost:8080";
    return [
      { source: "/api/:path*", destination: `${backend}/api/:path*` },
      { source: "/uploads/:path*", destination: `${backend}/uploads/:path*` },
    ];
  },
};

export default nextConfig;
