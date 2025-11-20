"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

interface UserData {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
}

interface ProfileTabProps {
  user: UserData;
  onUpdate: (user: UserData) => void;
}

/**
 * Profile Tab Component
 *
 * Allows users to update:
 * - Name (optional field)
 * - Email (must be unique, triggers re-verification)
 *
 * Educational Notes:
 * - Email changes should trigger email verification in production
 * - Check for duplicate emails before updating
 * - Update session after email change
 */
export default function ProfileTab({ user, onUpdate }: ProfileTabProps) {
  const [name, setName] = useState(user.name || "");
  const [email, setEmail] = useState(user.email || "");
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const hasChanges = name !== (user.name || "") || email !== (user.email || "");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage(null);

    try {
      const response = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to update profile");
      }

      // Update local state
      onUpdate(data.user);
      setMessage({ type: "success", text: "Profile updated successfully!" });

      // If email changed, suggest signing in again
      if (email !== user.email) {
        setTimeout(() => {
          setMessage({
            type: "success",
            text: "Email updated! Please sign in again to refresh your session.",
          });
        }, 2000);
      }
    } catch (error: unknown) {
      setMessage({ type: "error", text: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Profile Information</CardTitle>
        <CardDescription>
          Update your personal information. Your email is used for order
          confirmations and account recovery.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
            />
            <p className="text-xs text-text-muted">
              Your name is displayed on orders and can be shared with delivery
              services.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your.email@example.com"
              required
            />
            <p className="text-xs text-text-muted">
              Used for order confirmations and account notifications. Must be
              unique.
            </p>
          </div>

          {message && (
            <div
              className={`p-3 rounded-md text-sm ${
                message.type === "success"
                  ? "bg-green-50 dark:bg-green-950 text-green-800 dark:text-green-200 border border-green-200 dark:border-green-800"
                  : "bg-red-50 dark:bg-red-950 text-red-800 dark:text-red-200 border border-red-200 dark:border-red-800"
              }`}
            >
              {message.text}
            </div>
          )}

          <Button type="submit" disabled={!hasChanges || isLoading}>
            {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {isLoading ? "Saving..." : "Save Changes"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
