"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Mail, CheckCircle2, XCircle } from "lucide-react";
import Link from "next/link";

export default function UnsubscribeClient() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [isLoading, setIsLoading] = useState(true);
  const [status, setStatus] = useState<"success" | "error" | "already">(
    "success"
  );
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("Invalid unsubscribe link. No token provided.");
      setIsLoading(false);
      return;
    }

    const unsubscribe = async () => {
      try {
        const response = await fetch("/api/newsletter/unsubscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });

        const data = await response.json();

        if (response.ok) {
          if (data.message.includes("already")) {
            setStatus("already");
          } else {
            setStatus("success");
          }
          setMessage(data.message);
        } else {
          setStatus("error");
          setMessage(data.error || "Failed to unsubscribe");
        }
      } catch {
        setStatus("error");
        setMessage("An unexpected error occurred. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    };

    unsubscribe();
  }, [token]);

  return (
    <div className="min-h-screen flex justify-center pt-12 sm:pt-20 p-4 bg-muted/30">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center pb-4">
          <div className="flex justify-center mb-4">
            {isLoading ? (
              <Loader2 className="h-16 w-16 animate-spin text-primary" />
            ) : status === "success" ? (
              <CheckCircle2 className="h-16 w-16 text-green-600" />
            ) : status === "already" ? (
              <Mail className="h-16 w-16 text-muted-foreground" />
            ) : (
              <XCircle className="h-16 w-16 text-destructive" />
            )}
          </div>
          <h1 className="text-2xl font-bold">
            {isLoading
              ? "Processing..."
              : status === "success"
                ? "Unsubscribed Successfully"
                : status === "already"
                  ? "Already Unsubscribed"
                  : "Unsubscribe Failed"}
          </h1>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-muted-foreground">
            {isLoading
              ? "Please wait while we process your request..."
              : message}
          </p>

          {!isLoading && status === "success" && (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                We&apos;re sorry to see you go! You won&apos;t receive any more
                newsletter emails from us.
              </p>
              <p className="text-sm text-muted-foreground">
                If you change your mind, you can always subscribe again from our
                website.
              </p>
            </div>
          )}

          {!isLoading && (
            <div className="pt-4">
              <Link href="/">
                <Button variant="default" className="w-full">
                  Return to Homepage
                </Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
