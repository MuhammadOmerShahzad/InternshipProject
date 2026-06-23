import path from "path";

const nextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '15mb',
    },
  },
  turbopack: {
    resolveAlias: {
      // Fix: @tailwindcss/postcss resolves 'tailwindcss' from wrong directory in Turbopack
      tailwindcss: path.resolve('./node_modules/tailwindcss'),
    },
  },
};

export default nextConfig;
