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
          // Deny access to camera, mic, geolocation
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" }
        ]
      }
    ];
  }
};

export default nextConfig;
