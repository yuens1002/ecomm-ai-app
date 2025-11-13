import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // We must whitelist the domains we'll be using for our product images.
    // This is a security feature of Next.js Image Optimization.
    remotePatterns: [
      {
        protocol: "https",
        hostname: "placehold.co",
        port: "",
        pathname: "/**",
      },
      // When you add a real image host (like S3 or Cloudinary),
      // you will add its hostname here as well.
      // {
      //   protocol: 'https',
      //   hostname: 'your-s3-bucket-name.s3.amazonaws.com',
      //   port: '',
      //   pathname: '/**',
      // }
    ],
  },
};

export default nextConfig;
