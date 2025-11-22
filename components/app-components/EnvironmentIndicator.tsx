"use client";

import { useEffect, useState } from "react";

export function EnvironmentIndicator() {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsClient(true);
  }, []);

  if (!isClient) return null;

  // Check environment variables
  // Note: NEXT_PUBLIC_VERCEL_ENV is available on Vercel
  // NODE_ENV is standard
  const env = process.env.NEXT_PUBLIC_VERCEL_ENV || process.env.NODE_ENV;

  if (!env || env === "production") return null;

  return (
    <div className="fixed bottom-4 left-4 z-50 flex items-center gap-2 rounded-full bg-black/80 px-3 py-1 text-xs font-medium text-white backdrop-blur-sm dark:bg-white/80 dark:text-black pointer-events-none">
      <span className="h-2 w-2 rounded-full bg-yellow-400 animate-pulse" />
      <span className="uppercase">{env}</span>
    </div>
  );
}
