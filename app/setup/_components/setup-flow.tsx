"use client";

import { useState, FormEvent, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Eye, EyeOff, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { EulaStep } from "./eula-step";
import { SetupLayout, SetupStepper, SetupHeader } from "./setup-ui";
import type { LegalDocument } from "@/lib/legal-utils";

interface PasswordValidation {
  minLength: boolean;
  hasUpperCase: boolean;
  hasLowerCase: boolean;
  hasNumber: boolean;
  hasSpecialChar: boolean;
}

type Step = "eula" | "account";

interface SetupFlowProps {
  docs: LegalDocument[];
}

export function SetupFlow({ docs }: SetupFlowProps) {
  const router = useRouter();
  const { settings } = useSiteSettings();
  const [step, setStep] = useState<Step>("eula");
  const [isLoading, setIsLoading] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const [adminExists, setAdminExists] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [validation, setValidation] = useState<PasswordValidation>({
    minLength: false,
    hasUpperCase: false,
    hasLowerCase: false,
    hasNumber: false,
    hasSpecialChar: false,
  });
  const [showValidation, setShowValidation] = useState(false);

  useEffect(() => {
    const checkSetupStatus = async () => {
      try {
        const response = await fetch("/api/admin/setup", { method: "HEAD" });
        if (response.status === 403) {
          setAdminExists(true);
        }
      } catch (error) {
        console.error("Error checking setup status:", error);
      } finally {
        setIsChecking(false);
      }
    };

    checkSetupStatus();
  }, []);

  useEffect(() => {
    setValidation({
      minLength: password.length >= 8,
      hasUpperCase: /[A-Z]/.test(password),
      hasLowerCase: /[a-z]/.test(password),
      hasNumber: /[0-9]/.test(password),
      hasSpecialChar: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password),
    });
  }, [password]);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const name = formData.get("name") as string;
    const storeName = (formData.get("storeName") as string | null)?.trim() ?? "";

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      setIsLoading(false);
      return;
    }

    const allValid = Object.values(validation).every((v) => v);
    if (!allValid) {
      setError("Password does not meet all requirements");
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/admin/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, name, storeName }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Something went wrong");
        setIsLoading(false);
        return;
      }

      router.push("/admin");
    } catch (error) {
      console.error("Setup error:", error);
      setError("An unexpected error occurred. Please try again.");
      setIsLoading(false);
    }
  };

  if (isChecking) {
    return (
      <SetupLayout>
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin" />
          <p className="text-sm">Getting things ready...</p>
        </div>
      </SetupLayout>
    );
  }

  if (adminExists) {
    return (
      <SetupLayout>

        <div className="space-y-6">
          <div className="space-y-2">
            <h2 className="text-2xl font-bold">You&apos;re all set</h2>
            <p className="text-muted-foreground text-sm leading-relaxed">
              This store is already configured and ready to go. Sign in with your admin account to access the dashboard.
            </p>
          </div>
          <Button onClick={() => router.push("/auth/signin")}>
            Sign in to your store
          </Button>
        </div>
      </SetupLayout>
    );
  }

  if (step === "eula") {
    return <EulaStep docs={docs} onAccepted={() => setStep("account")} />;
  }

  return (
    <SetupLayout>
      <SetupStepper current="account" />
      <SetupHeader
        title="Almost there."
        description={`Create your admin account for ${settings.storeName} — you can invite your team once you're in.`}
      />

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="bg-destructive/10 border border-destructive/20 rounded-md p-3">
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="storeName">Store name</Label>
          <Input
            id="storeName"
            name="storeName"
            type="text"
            placeholder="Morning Roast"
            disabled={isLoading}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="name">Your name</Label>
          <Input
            id="name"
            name="name"
            type="text"
            placeholder="Jane Smith"
            required
            disabled={isLoading}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email address</Label>
          <Input
            id="email"
            name="email"
            type="email"
            placeholder="you@yourdomain.com"
            required
            disabled={isLoading}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <div className="relative">
            <Input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              placeholder="Choose a strong password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onFocus={() => setShowValidation(true)}
              className="pr-10"
              disabled={isLoading}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              disabled={isLoading}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>

          {showValidation && password.length > 0 && (
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-2 text-xs">
              {[
                { ok: validation.minLength, label: "8+ characters" },
                { ok: validation.hasUpperCase, label: "Uppercase letter" },
                { ok: validation.hasLowerCase, label: "Lowercase letter" },
                { ok: validation.hasNumber, label: "Number" },
                { ok: validation.hasSpecialChar, label: "Special character" },
              ].map(({ ok, label }) => (
                <div key={label} className={cn("flex items-center gap-1", ok ? "text-green-600 dark:text-green-500" : "text-muted-foreground")}>
                  <span>{ok ? "✓" : "○"}</span>
                  <span>{label}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirmPassword">Confirm password</Label>
          <Input
            id="confirmPassword"
            name="confirmPassword"
            type={showPassword ? "text" : "password"}
            placeholder="Re-enter your password"
            required
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            disabled={isLoading}
          />
          {confirmPassword.length > 0 && password !== confirmPassword && (
            <p className="text-xs text-destructive">Passwords do not match</p>
          )}
          {confirmPassword.length > 0 && password === confirmPassword && (
            <p className="text-xs text-green-600 dark:text-green-500">✓ Passwords match</p>
          )}
        </div>

        <Button type="submit" disabled={isLoading}>
          {isLoading ? (
            <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Setting things up...</>
          ) : (
            <>Take me to my store <ArrowRight className="ml-2 h-4 w-4" /></>
          )}
        </Button>
      </form>
    </SetupLayout>
  );
}
