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
  async redirects() {
    return [
      {
        source: "/property/atma-miami-by-aman",
        destination: "/atma",
        permanent: true,
      },
      {
        source: "/property/faena-residences-miami",
        destination: "/faena",
        permanent: true,
      },
      {
        source: "/property/619-brickell-nobu-residences",
        destination: "/619-brickell",
        permanent: true,
      },
      {
        source: "/neighborhoods/:slug*",
        destination: "/neighborhood/:slug*",
        permanent: true,
      },
      {
        source: "/neighborhoods",
        destination: "/neighborhood",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
