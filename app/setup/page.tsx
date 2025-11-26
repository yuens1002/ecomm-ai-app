"use client";

import { useState, FormEvent, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Loader2, Eye, EyeOff, Shield, AlertCircle } from "lucide-react";
import { useSiteSettings } from "@/hooks/useSiteSettings";

interface PasswordValidation {
  minLength: boolean;
  hasUpperCase: boolean;
  hasLowerCase: boolean;
  hasNumber: boolean;
  hasSpecialChar: boolean;
}

export default function SetupPage() {
  const router = useRouter();
  const { settings } = useSiteSettings();
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
    // Check if setup is still needed
    const checkSetupStatus = async () => {
      try {
        const response = await fetch("/api/admin/setup", {
          method: "HEAD",
        });
        // If we get 403, admin already exists
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
    // Validate password whenever it changes
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

    // Validate passwords match
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      setIsLoading(false);
      return;
    }

    // Validate password strength
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
        body: JSON.stringify({ email, password, name }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Something went wrong");
        setIsLoading(false);
        return;
      }

      // Success - redirect to signin
      router.push(
        "/auth/signin?message=Admin account created. Please sign in."
      );
    } catch (error) {
      console.error("Setup error:", error);
      setError("An unexpected error occurred. Please try again.");
      setIsLoading(false);
    }
  };

  if (isChecking) {
    return (
      <div className="container mx-auto px-4 py-16 flex items-center justify-center min-h-[80vh]">
        <Card className="w-full max-w-md">
          <CardContent className="py-12 flex flex-col items-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground">Checking setup status...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (adminExists) {
    return (
      <div className="container mx-auto px-4 py-16 flex items-center justify-center min-h-[80vh]">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1">
            <div className="flex justify-center mb-4">
              <div className="h-16 w-16 rounded-full bg-amber-100 dark:bg-amber-900/20 flex items-center justify-center">
                <AlertCircle className="h-8 w-8 text-amber-600 dark:text-amber-500" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold text-center">
              Setup Already Complete
            </CardTitle>
            <CardDescription className="text-center">
              An admin account already exists
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-md p-4">
              <p className="text-sm text-amber-900 dark:text-amber-100">
                This site has already been set up with an admin account. If you
                need admin access, please contact an existing administrator.
              </p>
            </div>
            <Button
              onClick={() => router.push("/auth/signin")}
              className="w-full"
            >
              Go to Sign In
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-16 flex items-center justify-center min-h-[80vh]">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="flex justify-center mb-4">
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
              <Shield className="h-8 w-8 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-center">
            Initial Setup
          </CardTitle>
          <CardDescription className="text-center">
            Create the first admin account for {settings.storeName}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md p-4">
            <p className="text-sm text-blue-900 dark:text-blue-100">
              <strong>Welcome!</strong> This appears to be the first time
              setting up {settings.storeName}. Create an admin account to get
              started.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-3">
                <p className="text-sm text-red-600 dark:text-red-400">
                  {error}
                </p>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <input
                id="name"
                name="name"
                type="text"
                placeholder="John Doe"
                required
                className="w-full px-3 py-2 border border-border rounded-md bg-background text-text-base focus:outline-none focus:ring-2 focus:ring-primary"
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <input
                id="email"
                name="email"
                type="email"
                placeholder="admin@artisan-roast.com"
                required
                className="w-full px-3 py-2 border border-border rounded-md bg-background text-text-base focus:outline-none focus:ring-2 focus:ring-primary"
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter a secure password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={() => setShowValidation(true)}
                  className="w-full px-3 py-2 pr-10 border border-border rounded-md bg-background text-text-base focus:outline-none focus:ring-2 focus:ring-primary"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-base"
                  disabled={isLoading}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>

              {showValidation && password.length > 0 && (
                <div className="mt-2 space-y-1 text-xs">
                  <div
                    className={
                      validation.minLength
                        ? "text-green-600 dark:text-green-500"
                        : "text-muted-foreground"
                    }
                  >
                    {validation.minLength ? "✓" : "○"} At least 8 characters
                  </div>
                  <div
                    className={
                      validation.hasUpperCase
                        ? "text-green-600 dark:text-green-500"
                        : "text-muted-foreground"
                    }
                  >
                    {validation.hasUpperCase ? "✓" : "○"} One uppercase letter
                  </div>
                  <div
                    className={
                      validation.hasLowerCase
                        ? "text-green-600 dark:text-green-500"
                        : "text-muted-foreground"
                    }
                  >
                    {validation.hasLowerCase ? "✓" : "○"} One lowercase letter
                  </div>
                  <div
                    className={
                      validation.hasNumber
                        ? "text-green-600 dark:text-green-500"
                        : "text-muted-foreground"
                    }
                  >
                    {validation.hasNumber ? "✓" : "○"} One number
                  </div>
                  <div
                    className={
                      validation.hasSpecialChar
                        ? "text-green-600 dark:text-green-500"
                        : "text-muted-foreground"
                    }
                  >
                    {validation.hasSpecialChar ? "✓" : "○"} One special
                    character
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type={showPassword ? "text" : "password"}
                placeholder="Re-enter your password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-md bg-background text-text-base focus:outline-none focus:ring-2 focus:ring-primary"
                disabled={isLoading}
              />
              {confirmPassword.length > 0 && password !== confirmPassword && (
                <p className="text-xs text-red-600 dark:text-red-500">
                  Passwords do not match
                </p>
              )}
              {confirmPassword.length > 0 && password === confirmPassword && (
                <p className="text-xs text-green-600 dark:text-green-500">
                  ✓ Passwords match
                </p>
              )}
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating Admin Account...
                </>
              ) : (
                <>
                  <Shield className="mr-2 h-4 w-4" />
                  Create Admin Account
                </>
              )}
            </Button>
          </form>

          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-md p-3">
            <p className="text-xs text-amber-900 dark:text-amber-100">
              <strong>Security Note:</strong> This page is only accessible when
              no admin accounts exist. After creating an admin, use the admin
              panel to manage additional users.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
