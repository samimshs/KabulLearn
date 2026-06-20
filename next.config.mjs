/** @type {import('next').NextConfig} */
const isDev = process.env.NODE_ENV === "development";

const nextConfig = {
  // pdfkit ships .afm font metric files that webpack can't bundle — load it as a
  // native CommonJS module in the Node runtime instead.
  // pdf-parse v2 uses pdfjs-dist which dynamically imports a Web Worker; if bundled
  // the worker file ends up at the wrong .next path and the import fails at runtime.
  serverExternalPackages: ["pdfkit", "pdf-parse", "pdfjs-dist"],
  images: {
    remotePatterns: [
      // Vercel Blob (user-uploaded avatars)
      { protocol: "https", hostname: "*.public.blob.vercel-storage.com" },
      // Google OAuth profile pictures
      { protocol: "https", hostname: "lh3.googleusercontent.com" }
    ]
  },
  async headers() {
    // No security headers in dev — they cause browser enforcement issues
    // (CSP upgrade-insecure-requests breaks CSS/images on HTTP localhost in Safari)
    if (isDev) return [];

    const csp = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' https://www.youtube.com https://www.youtube-nocookie.com https://s.ytimg.com",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https://*.public.blob.vercel-storage.com https://lh3.googleusercontent.com https://i.ytimg.com https://*.ytimg.com https://yt3.ggpht.com",
      "font-src 'self' data:",
      "connect-src 'self' https://api.resend.com https://*.blob.vercel-storage.com https://*.public.blob.vercel-storage.com https://www.youtube.com https://www.youtube-nocookie.com https://*.youtube.com https://*.youtubei.googleapis.com https://*.googlevideo.com",
      "media-src 'self' blob: https://*.public.blob.vercel-storage.com https://*.googlevideo.com https://*.youtube.com https://www.youtube.com https://www.youtube-nocookie.com",
      "frame-src https://www.youtube.com https://www.youtube-nocookie.com https://youtube.com",
      "child-src https://www.youtube.com https://www.youtube-nocookie.com https://youtube.com",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
      "upgrade-insecure-requests"
    ].join("; ");

    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: ["camera=()", "microphone=()", "geolocation=()"].join(", ")
          },
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
          { key: "Cross-Origin-Opener-Policy", value: "unsafe-none" },
          { key: "Cross-Origin-Resource-Policy", value: "cross-origin" },
          { key: "Content-Security-Policy", value: csp }
        ]
      }
    ];
  }
};

export default nextConfig;
