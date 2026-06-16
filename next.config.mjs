/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone', // self-contained server bundle for Docker (.next/standalone)
  images: { remotePatterns: [{ protocol: 'https', hostname: '**.b-cdn.net' }, { protocol: 'https', hostname: 'cdn.gum-demo.in' }] },
};
export default nextConfig;
