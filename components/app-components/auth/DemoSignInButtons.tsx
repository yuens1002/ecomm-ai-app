"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Loader2, ShieldCheck, User } from "lucide-react";

// Demo credentials - only used when NEXT_PUBLIC_DEMO_MODE is true
const DEMO_ACCOUNTS = {
  admin: {
    email: "admin@artisanroast.com",
    password: "ivcF8ZV3FnGaBJ&#8j",
    redirectTo: "/admin",
    label: "Sign in as Admin",
    description: "Full dashboard access",
    icon: ShieldCheck,
  },
  customer: {
    email: "demo@artisanroast.com",
    password: "ixcF8ZV3FnGaBJ&#8j",
    redirectTo: "/account",
    label: "Sign in as Demo Customer",
    description: "View orders, recommendations",
    icon: User,
  },
} as const;

type AccountType = keyof typeof DEMO_ACCOUNTS;

/**
 * Demo sign-in buttons that auto-authenticate without exposing passwords.
 * Only renders when NEXT_PUBLIC_DEMO_MODE=true
 */
export function DemoSignInButtons() {
  const [loading, setLoading] = useState<AccountType | null>(null);

  // Only show in demo mode
  if (process.env.NEXT_PUBLIC_DEMO_MODE !== "true") {
    return null;
  }

  const handleDemoSignIn = async (accountType: AccountType) => {
    setLoading(accountType);
    const account = DEMO_ACCOUNTS[accountType];

    try {
      await signIn("credentials", {
        email: account.email,
        password: account.password,
        callbackUrl: account.redirectTo,
      });
    } catch (error) {
      console.error("Demo sign-in failed:", error);
      setLoading(null);
    }
  };

  return (
    <div className="space-y-3">
      <div className="text-center text-xs text-muted-foreground">
        Quick demo access
      </div>

      <div className="grid gap-2">
        {(Object.keys(DEMO_ACCOUNTS) as AccountType[]).map((accountType) => {
          const account = DEMO_ACCOUNTS[accountType];
          const Icon = account.icon;
          const isLoading = loading === accountType;

          return (
            <Button
              key={accountType}
              variant="outline"
              className="w-full justify-start h-auto py-3"
              onClick={() => handleDemoSignIn(accountType)}
              disabled={loading !== null}
            >
              {isLoading ? (
                <Loader2 className="mr-3 h-5 w-5 animate-spin" />
              ) : (
                <Icon className="mr-3 h-5 w-5" />
              )}
              <div className="text-left">
                <div className="font-medium">{account.label}</div>
                <div className="text-xs text-muted-foreground">
                  {account.description}
                </div>
              </div>
            </Button>
          );
        })}
      </div>
    </div>
  );
}
