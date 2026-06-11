/** @type {import('next').NextConfig} */
const nextConfig = {
  // pdfkit ships .afm font metric files that webpack can't bundle — load it as a
  // native CommonJS module in the Node runtime instead.
  serverExternalPackages: ["pdfkit"],
  images: {
    remotePatterns: [
      // Vercel Blob (user-uploaded avatars)
      { protocol: "https", hostname: "*.public.blob.vercel-storage.com" },
      // Google OAuth profile pictures
      { protocol: "https", hostname: "lh3.googleusercontent.com" }
    ]
  },
  async headers() {
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
          // Prevent clickjacking — disallow embedding in iframes
          { key: "X-Frame-Options", value: "DENY" },
          // Prevent MIME-sniffing attacks
          { key: "X-Content-Type-Options", value: "nosniff" },
          // Don't leak internal URLs (with tokens, route params) in Referer headers
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          // Deny sensitive device access. Leave media/embed features at browser defaults so
          // cross-origin video providers can negotiate playback inside their iframe.
          {
            key: "Permissions-Policy",
            value: [
              "camera=()",
              "microphone=()",
              "geolocation=()"
            ].join(", ")
          },
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
          // YouTube embeds need cross-origin media, script, and postMessage flows.
          // Use explicit non-isolating values so stale/merged platform headers cannot
          // fall back to same-origin isolation and freeze playback.
          { key: "Cross-Origin-Opener-Policy", value: "unsafe-none" },
          { key: "Cross-Origin-Resource-Policy", value: "cross-origin" },
          { key: "Content-Security-Policy", value: csp }
        ]
      }
    ];
  }
};

export default nextConfig;
