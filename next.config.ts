/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    // TypeScript hatalarını derleme (build) sırasında yoksayar
    ignoreBuildErrors: true,
  },
  eslint: {
    // ESLint uyarılarını derleme sırasında yoksayar
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
