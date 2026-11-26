import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: [
    "localhost:3000",
    "127.0.0.1:3000",
    "192.168.1.32:3000",
    "192.168.1.32",
  ],
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;