import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  // next dev prints every server action's arguments by default, and the login and
  // change-password actions receive passwords.
  logging: { serverFunctions: false },
  partialPrefetching: true,
  // The Git & GitHub studio boots a StackBlitz WebContainer, which needs a cross-origin
  // isolated page. Only that route gets these headers, so images, fonts and embeds on
  // every other page load exactly as before.
  async headers() {
    return [
      {
        source: "/learn/git/:path*",
        headers: [
          { key: "Cross-Origin-Embedder-Policy", value: "require-corp" },
          { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
        ],
      },
    ];
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
