import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css"; // Your global styles with CSS variables

// Import the new layout components
import { ThemeProvider } from "@components/app-components/ThemeProvider";
import { SessionProvider } from "@components/app-components/SessionProvider";
import { Toaster } from "@/components/ui/toaster";
import { Analytics } from "@vercel/analytics/react";
import { EnvironmentIndicator } from "@/components/app-components/EnvironmentIndicator";
import { getSiteMetadata } from "@/lib/site-metadata";

// Setup the Inter font with a CSS variable
const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  preload: true,
  variable: "--font-inter", // We link this in tailwind.config.js
});

// Generate metadata dynamically from database
export async function generateMetadata(): Promise<Metadata> {
  const { storeName, storeTagline, storeDescription, storeLogoUrl, storeFaviconUrl } =
    await getSiteMetadata();

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://ecomm-ai-app.vercel.app";

  return {
    metadataBase: new URL(appUrl),
    title: {
      default: storeName,
      template: `%s | ${storeName}`,
    },
    description: storeDescription,
    keywords: ["coffee", "specialty coffee", "coffee roaster", "coffee shop", "online coffee store", "coffee subscriptions"],
    authors: [{ name: storeName }],
    creator: storeName,
    icons: {
      icon: storeFaviconUrl,
      apple: storeFaviconUrl,
    },
    openGraph: {
      type: "website",
      locale: "en_US",
      url: appUrl,
      siteName: storeName,
      title: storeName,
      description: storeTagline,
      images: [
        {
          url: storeLogoUrl,
          width: 512,
          height: 512,
          alt: storeName,
        },
      ],
    },
    twitter: {
      card: "summary",
      title: storeName,
      description: storeTagline,
      images: [storeLogoUrl],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-video-preview": -1,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },
  };
}

/**
 * This is the root layout (a Server Component).
 * It provides global wrappers (theme, session, analytics) for all routes.
 * Individual route groups like (site) and admin have their own layouts.
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // We add 'suppressHydrationWarning' as required by next-themes
    <html lang="en" className={`${inter.variable}`} suppressHydrationWarning>
      <body className="min-h-screen bg-background font-sans antialiased">
        <SessionProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            {children}
            <Toaster />
          </ThemeProvider>
        </SessionProvider>
        <EnvironmentIndicator />
        <Analytics />
      </body>
    </html>
  );
}
