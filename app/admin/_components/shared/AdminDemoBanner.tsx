"use client";

const IS_DEMO = process.env.NEXT_PUBLIC_DEMO_MODE === "true";

export function AdminDemoBanner() {
  if (!IS_DEMO) return null;
  return (
    <div className="mb-4 rounded-md border border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950 px-4 py-3 text-sm text-amber-800 dark:text-amber-200">
      <span className="font-medium">Demo mode</span>
      {" — "}
      <span>Changes are disabled in this environment.</span>
    </div>
  );
}
