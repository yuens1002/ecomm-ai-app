import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://ecomm-ai-app.vercel.app";

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/admin/",
          "/api/",
          "/auth/",
          "/checkout/",
          "/account/",
          "/orders/",
          "/newsletter/unsubscribe/",
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
