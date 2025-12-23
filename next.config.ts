import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '15mb', // Increased for file uploads (max file size is 10MB + overhead)
    },
  },
};

export default nextConfig;
