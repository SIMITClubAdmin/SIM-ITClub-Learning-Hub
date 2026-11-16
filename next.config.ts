import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  // next dev prints every server action's arguments by default, and the login and
  // change-password actions receive passwords.
  logging: { serverFunctions: false },
  partialPrefetching: true,
  // The Git & GitHub studio boots a StackBlitz WebContainer, which needs a cross-origin
  // isolated page. Only the studio's routes (the Git track and the Skull Trials) get these
  // headers, so images, fonts and embeds on every other page load exactly as before.
  async headers() {
    const isolation = [
      { key: "Cross-Origin-Embedder-Policy", value: "require-corp" },
      { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
    ];
    return [
      { source: "/learn/git/:path*", headers: isolation },
      { source: "/practice/skull/:path*", headers: isolation },
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
