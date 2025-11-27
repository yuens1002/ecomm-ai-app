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
  const { storeName, storeDescription, storeFaviconUrl } =
    await getSiteMetadata();

  return {
    title: storeName,
    description: storeDescription,
    icons: {
      icon: storeFaviconUrl,
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
