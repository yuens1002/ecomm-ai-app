import { useEffect, useState, useCallback } from "react";
import Vapi from "@vapi-ai/web";

// Initialize Vapi outside component to avoid recreation
// We'll set the token in the hook if needed, or assume env var is present
const vapiPublicKey = process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY || "";

// Singleton instance to prevent multiple SDK initializations
let vapiSingleton: Vapi | null = null;

export function useVapi() {
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [isSpeechActive, setIsSpeechActive] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [volumeLevel, setVolumeLevel] = useState(0);
  const [error, setError] = useState<string | null>(
    !vapiPublicKey ? "VAPI configuration missing" : null
  );
  const [vapi, setVapi] = useState<Vapi | null>(null);

  useEffect(() => {
    if (!vapiPublicKey) {
      console.error("NEXT_PUBLIC_VAPI_PUBLIC_KEY is missing");
      return;
    }

    if (!vapiSingleton) {
      vapiSingleton = new Vapi(vapiPublicKey);
    }

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setVapi(vapiSingleton);

    const onCallStart = () => {
      console.log("Vapi: Call started");
      setIsConnecting(false);
      setIsSessionActive(true);
      setError(null);
    };

    const onCallEnd = () => {
      console.log("Vapi: Call ended");
      setIsSessionActive(false);
      setIsSpeechActive(false);
      setIsConnecting(false);
    };

    const onSpeechStart = () => {
      setIsSpeechActive(true);
    };

    const onSpeechEnd = () => {
      setIsSpeechActive(false);
    };

    const onVolumeLevel = (level: number) => {
      setVolumeLevel(level);
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const onError = (e: any) => {
      console.error("Vapi error:", e);
      // Try to extract a meaningful message from the error object
      let errorMessage = "An error occurred with the voice assistant";
      if (e.message) errorMessage = e.message;
      else if (e.error && e.error.message) errorMessage = e.error.message;
      else if (typeof e === "string") errorMessage = e;
      else if (Object.keys(e).length === 0)
        errorMessage =
          "Connection failed (Empty error response). Check console for details.";

      setError(errorMessage);
      setIsConnecting(false);
      setIsSessionActive(false);
    };

    vapiSingleton.on("call-start", onCallStart);
    vapiSingleton.on("call-end", onCallEnd);
    vapiSingleton.on("speech-start", onSpeechStart);
    vapiSingleton.on("speech-end", onSpeechEnd);
    vapiSingleton.on("volume-level", onVolumeLevel);
    vapiSingleton.on("error", onError);

    return () => {
      if (vapiSingleton) {
        vapiSingleton.off("call-start", onCallStart);
        vapiSingleton.off("call-end", onCallEnd);
        vapiSingleton.off("speech-start", onSpeechStart);
        vapiSingleton.off("speech-end", onSpeechEnd);
        vapiSingleton.off("volume-level", onVolumeLevel);
        vapiSingleton.off("error", onError);
      }
    };
  }, []);

  const startSession = useCallback(async (assistant: string | object) => {
    if (!vapiSingleton) return;

    setIsConnecting(true);
    setError(null);

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await vapiSingleton.start(assistant as any);
    } catch (err: unknown) {
      console.error("Failed to start Vapi session", err);

      let errorMessage = "Failed to start voice session";
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const e = err as any;
      if (e.message) errorMessage = e.message;
      else if (e.error && e.error.message) errorMessage = e.error.message;
      else if (typeof e === "string") errorMessage = e;
      else if (Object.keys(e).length === 0)
        errorMessage =
          "Connection failed. The voice assistant could not connect to the server.";

      setError(errorMessage);
      setIsConnecting(false);
    }
  }, []);

  const stopSession = useCallback(() => {
    if (!vapiSingleton) return;
    vapiSingleton.stop();
  }, []);

  const toggleMute = useCallback((mute: boolean) => {
    if (!vapiSingleton) return;
    vapiSingleton.setMuted(mute);
  }, []);

  return {
    isSessionActive,
    isSpeechActive,
    isConnecting,
    volumeLevel,
    error,
    startSession,
    stopSession,
    toggleMute,
    vapi,
  };
}
