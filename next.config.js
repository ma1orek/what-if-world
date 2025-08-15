/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config) => {
    // Handle Three.js and other 3D libraries
    config.module.rules.push({
      test: /\.(glsl|vs|fs|vert|frag)$/,
      use: ['raw-loader', 'glslify-loader'],
    });
    
    return config;
  },
  // Enable static file serving for audio files
  async rewrites() {
    return [
      {
        source: '/audio/:path*',
        destination: '/api/audio/:path*',
      },
    ];
  },
};

module.exports = nextConfig;