/** @type {import('next').NextConfig} */
const nextConfig = {
  // pdfkit ships .afm font metric files that webpack can't bundle — load it as a
  // native CommonJS module in the Node runtime instead.
  serverExternalPackages: ["pdfkit"],
  images: {
    remotePatterns: [
      // Allow any HTTPS image URL (user-uploaded avatars can come from any host)
      { protocol: "https", hostname: "**" }
    ]
  }
};

export default nextConfig;
