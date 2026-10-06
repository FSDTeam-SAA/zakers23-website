import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  images: {
    unoptimized: true,
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
        hostname: "api.cotality.com"
      },
      {
        protocol: "https",
        hostname: "staticos.idxbroker.com"
      },
      {
        protocol: "https",
        hostname: "s3.amazonaws.com"
      }
    ]
  },
  outputFileTracingRoot: path.join(__dirname),
};

export default nextConfig;
