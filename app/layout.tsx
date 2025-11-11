import { ThemeProvider } from "@/components/theme-provider";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

// Import the 'Inter' font and configure it
const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter", // Define a CSS variable for the font
});

export const metadata: Metadata = {
  title: "Artisan Roast E-Commerce",
  description: "Specialty coffee sourced from the world's finest origins.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable}`} suppressHydrationWarning>
      <body>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <header>Artisan Roast</header>
          <main>{children}</main>
          <footer>© 2024 Artisan Roast. All rights reserved.</footer>
        </ThemeProvider>
      </body>
    </html>
  );
}
