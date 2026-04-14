import { useSession } from "next-auth/react";
import { useEffect, useRef } from "react";

type ActivityType = "PAGE_VIEW" | "PRODUCT_VIEW" | "ADD_TO_CART" | "REMOVE_FROM_CART";

interface TrackActivityParams {
  activityType: ActivityType;
  productId?: string;
  searchQuery?: string;
}

// Generate or retrieve session ID from sessionStorage
function getSessionId(): string {
  if (typeof window === "undefined") return "";

  let sessionId = sessionStorage.getItem("artisan_session_id");
  if (!sessionId) {
    // crypto.randomUUID() requires HTTPS (secure context).
    // In dev, allow HTTP local-network access with a non-cryptographic fallback.
    // In production this always runs over HTTPS so randomUUID() is always available.
    if (process.env.NODE_ENV === "development") {
      sessionId = crypto.randomUUID?.() ??
        `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`;
    } else {
      sessionId = crypto.randomUUID();
    }
    sessionStorage.setItem("artisan_session_id", sessionId);
  }
  return sessionId;
}

export function useActivityTracking() {
  const { data: session } = useSession();
  const sessionIdRef = useRef<string>("");

  useEffect(() => {
    sessionIdRef.current = getSessionId();
  }, []);

  const trackActivity = async (params: TrackActivityParams) => {
    try {
      const sessionId = sessionIdRef.current || getSessionId();

      await fetch("/api/track-activity", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sessionId,
          userId: session?.user?.id || null,
          activityType: params.activityType,
          productId: params.productId || null,
          searchQuery: params.searchQuery || null,
        }),
      });
    } catch (error) {
      // Silent fail - don't disrupt user experience
      console.error("Failed to track activity:", error);
    }
  };

  return { trackActivity };
}
