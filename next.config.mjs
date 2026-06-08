/** @type {import('next').NextConfig} */
const nextConfig = {
  // pdfkit ships .afm font metric files that webpack can't bundle — load it as a
  // native CommonJS module in the Node runtime instead.
  serverExternalPackages: ["pdfkit"]
};

export default nextConfig;
