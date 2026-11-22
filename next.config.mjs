// Most pages in this app are statically prerendered, so a per-request CSP nonce
// can't be baked into the cached HTML — Next's inline hydration scripts would
// have no nonce to match, breaking the page. Using 'unsafe-inline' for scripts
// is the honest tradeoff here; revisit with a nonce + 'strict-dynamic' only if
// these routes move to fully dynamic rendering.
// Next's dev bundler emits `eval()`-based source maps, which a CSP without
// 'unsafe-eval' blocks — that kills hydration in `next dev`, leaving every
// framer-motion element stuck at its initial opacity. Production builds don't
// use eval, so the shipped policy is unchanged.
const DEV = process.env.NODE_ENV !== "production";

const CSP = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${DEV ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com",
  "img-src 'self' data:",
  "connect-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "upgrade-insecure-requests",
].join("; ");

/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["rehype-raw"],
  experimental: {
    serverComponentsExternalPackages: ["pdf-parse", "pdfjs-dist", "tesseract.js"],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), interest-cohort=()" },
          { key: "Content-Security-Policy", value: CSP },
        ],
      },
    ];
  },
};
export default nextConfig;
