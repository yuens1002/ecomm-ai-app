import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css"; // Your global styles with CSS variables

// Import the new layout components
import { ThemeProvider } from "@components/app-components/ThemeProvider";
import { SessionProvider } from "@components/app-components/SessionProvider";
import SiteHeaderWrapper from "@/components/app-components/SiteHeaderWrapper";
import SiteFooter from "@components/app-components/SiteFooter";

// Setup the Inter font with a CSS variable
const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  preload: true,
  variable: "--font-inter", // We link this in tailwind.config.js
});

export const metadata: Metadata = {
  title: "Artisan Roast E-Commerce",
  description: "Specialty coffee sourced from the world's finest origins.",
};

/**
 * This is the root layout (a Server Component).
 * It wraps every page in the ThemeProvider, Header, Main, and Footer.
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
        {/* ThemeProvider is a Client Component wrapper.
          It must wrap all content, including the header/footer,
          to allow them to react to theme changes.
        */}
        <SessionProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <div className="relative flex min-h-screen flex-col">
              {/* Our site header (Client Component) */}
              <SiteHeaderWrapper />

              {/* The <main> tag holds the unique page content (our {children}).
                'flex-1' ensures it grows to push the footer to the bottom.
              */}
              <main className="flex-1 w-full">{children}</main>

              {/* Our site footer (Server Component) */}
              <SiteFooter />
            </div>
          </ThemeProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
