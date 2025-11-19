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
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
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
