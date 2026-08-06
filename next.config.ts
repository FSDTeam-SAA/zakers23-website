import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "frasermiami.s3.amazonaws.com"
      },
      {
        protocol: "https",
        hostname: "frasermiami.s3.us-east-2.amazonaws.com"
      },
      {
        protocol: "https",
        hostname: "newdev.miami"
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com"
      }
    ]
  },
  outputFileTracingRoot: path.join(__dirname),
};

export default nextConfig;
