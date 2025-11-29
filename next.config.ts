import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  turbopack: {},
  
  // Webpack configuration for react-pdf compatibility
  webpack: (config) => {
    // Disable canvas and encoding modules for react-pdf
    config.resolve.alias.canvas = false;
    config.resolve.alias.encoding = false;
    
    // Ensure proper handling of PDF generation in browser
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      path: false,
      stream: false,
    };
    
    return config;
  },
};

export default nextConfig;
