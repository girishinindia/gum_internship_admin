/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: { remotePatterns: [{ protocol: 'https', hostname: '**.b-cdn.net' }, { protocol: 'https', hostname: 'cdn.gum-demo.in' }] },
};
export default nextConfig;
