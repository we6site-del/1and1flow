import type { NextConfig } from "next";
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin();

const nextConfig: NextConfig = {
  /* config options here */
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://127.0.0.1:8000/api/:path*',
      },
    ]
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'pub-6d184072434a418fb5462c6de3117397.r2.dev',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'bamcwwtwtvxjjcdfbmdr.supabase.co',
        port: '',
        pathname: '/**',
      },
    ],
  },
  // Ensure we transpile all tldraw packages to avoid dual-package hazard (ESM vs CJS)
  transpilePackages: [
    'tldraw',
    '@tldraw/editor',
    '@tldraw/store',
    '@tldraw/state',
    '@tldraw/utils',
    '@tldraw/tlschema',
    '@tldraw/state-react'
  ],
  webpack: (config, { isServer }) => {
    if (!config.resolve) {
      config.resolve = {};
    }
    if (!config.resolve.alias) {
      config.resolve.alias = {};
    }
    config.resolve.alias = {
      ...config.resolve.alias,
      "zod/v3": require.resolve("zod"),
      "zod/v4": require.resolve("zod"),
      // Force tldraw packages to resolve to the same CommonJS instance
      // This combined with transpilePackages ensures safety
      "@tldraw/editor": require.resolve("@tldraw/editor"),
      "@tldraw/store": require.resolve("@tldraw/store"),
      "@tldraw/state": require.resolve("@tldraw/state"),
      "@tldraw/utils": require.resolve("@tldraw/utils"),
      "@tldraw/tlschema": require.resolve("@tldraw/tlschema"),
      "tldraw": require.resolve("tldraw"),
      "react": require.resolve("react"),
      "react-dom": require.resolve("react-dom"),
    };
    return config;
  },
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default withNextIntl(nextConfig);
