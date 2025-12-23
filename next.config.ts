import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["@prisma/client", "prisma"],
  images: {
    // We must whitelist the domains we'll be using for our product images.
    // This is a security feature of Next.js Image Optimization.
    dangerouslyAllowSVG: true,
    contentDispositionType: "attachment",
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    remotePatterns: [
      {
        protocol: "https",
        hostname: "placehold.co",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "avatars.githubusercontent.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "github.com",
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
