import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "frasermiami.s3.amazonaws.com"
      },
      {
        protocol: "https",
        hostname: "newdev.miami"
      }
    ]
  }
};

export default nextConfig;
