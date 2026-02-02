"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ResetPasswordForm } from "@/components/auth/ResetPasswordForm";
import { resetPasswordWithTokenAction } from "@/app/auth/actions";

export function ResetPasswordContent() {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Get token from sessionStorage
    const storedToken = sessionStorage.getItem("passwordResetToken");

    if (!storedToken) {
      // Schedule state update to avoid cascading render
      queueMicrotask(() => {
        setError("No reset token found. Please request a new password reset.");
      });
      // Redirect after showing error
      const timer = setTimeout(() => {
        router.push("/auth/forgot-password");
      }, 3000);
      return () => clearTimeout(timer);
    }

    queueMicrotask(() => {
      setToken(storedToken);
    });
  }, [router]);

  const handleResetPassword = async (
    prevState: unknown,
    formData: FormData
  ): Promise<{ ok?: boolean; error?: string; message?: string }> => {
    if (!token) return { ok: false, error: "No reset token available" };

    // Create new FormData and add token
    const newFormData = new FormData();
    if (formData instanceof FormData) {
      for (const [key, value] of formData) {
        newFormData.append(key, value);
      }
    }
    newFormData.set("token", token);

    const result = await resetPasswordWithTokenAction(prevState, newFormData);

    if (result.ok) {
      // Clear the token
      sessionStorage.removeItem("passwordResetToken");
      // Redirect after 2 seconds
      setTimeout(() => {
        router.push("/auth/signin");
      }, 2000);
    } else if (result.error) {
      // For expired/used tokens, redirect to forgot password
      if (
        result.error.includes("expired") ||
        result.error.includes("used") ||
        result.error.includes("invalid")
      ) {
        setTimeout(() => {
          router.push("/auth/forgot-password");
        }, 3000);
      }
    }

    return result;
  };

  if (error) {
    return (
      <div className="text-center space-y-4">
        <p className="text-destructive">{error}</p>
        <p className="text-sm text-muted-foreground">Redirecting...</p>
      </div>
    );
  }

  if (!token) {
    return (
      <div className="text-center space-y-4">
        <p className="text-sm text-muted-foreground">Checking reset token...</p>
      </div>
    );
  }

  return (
    <ResetPasswordForm resetPasswordWithTokenAction={handleResetPassword} />
  );
}
