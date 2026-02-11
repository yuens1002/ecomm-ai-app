"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

interface NewsletterSignupProps {
  enabled?: boolean;
}

export default function NewsletterSignup({
  enabled = true,
}: NewsletterSignupProps) {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  if (!enabled) {
    return (
      <div className="rounded-md border border-dashed bg-muted/40 p-4 text-sm text-muted-foreground">
        Newsletter signups are currently disabled.
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to subscribe");
      }

      toast({
        title: "Success!",
        description: data.message,
      });

      setEmail("");
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to subscribe",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex max-w-[40ch] items-center">
      <Input
        type="email"
        placeholder="Your email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        disabled={isLoading}
        className="rounded-r-none border-r-0 focus-visible:z-10"
      />
      <Button
        type="submit"
        disabled={isLoading}
        className="rounded-l-none whitespace-nowrap"
      >
        {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Subscribe"}
      </Button>
    </form>
  );
}
