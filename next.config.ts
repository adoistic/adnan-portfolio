import type { NextConfig } from "next";

// Content-Security-Policy. The load-bearing control for BYOK is connect-src:
// the only places anything can be sent are this origin and openrouter.ai, so an
// injected script cannot exfiltrate the visitor's key to a third party. Combined
// with text-only rendering (no HTML injection sink anywhere), that closes the
// realistic XSS surface.
//
// NOTE / deliberate deviation from the spec's strict `script-src 'self'`: Next
// injects inline hydration scripts (and turbopack dev uses eval), so a nonce-less
// strict script-src would blank the app. Reaching strict script-src needs
// nonce-based middleware, which is fragile under turbopack dev and risks breaking
// the preview. So script-src keeps 'unsafe-inline' (+ 'unsafe-eval' in dev only).
// Follow-up for deploy (R10): add nonce-based CSP once the prod host is known.
const isDev = process.env.NODE_ENV !== "production";
const csp = [
  "default-src 'self'",
  "base-uri 'none'",
  "frame-ancestors 'none'",
  "object-src 'none'",
  "img-src 'self' data:",
  "font-src 'self'",
  "style-src 'self' 'unsafe-inline'",
  `connect-src 'self' https://openrouter.ai${isDev ? " ws: wss:" : ""}`,
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
].join("; ");

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "Content-Security-Policy", value: csp },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "DENY" },
        ],
      },
    ];
  },
};

export default nextConfig;
