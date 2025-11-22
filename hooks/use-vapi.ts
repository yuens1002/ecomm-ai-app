import { useEffect, useState, useCallback, useRef } from 'react';
import Vapi from '@vapi-ai/web';

// Initialize Vapi outside component to avoid recreation
// We'll set the token in the hook if needed, or assume env var is present
const vapiPublicKey = process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY || '';

export function useVapi() {
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [isSpeechActive, setIsSpeechActive] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [volumeLevel, setVolumeLevel] = useState(0);
  const [error, setError] = useState<string | null>(null);
  
  // Use ref to hold the vapi instance to ensure we only create it once client-side
  const vapiRef = useRef<Vapi | null>(null);

  useEffect(() => {
    if (!vapiPublicKey) {
      console.error("NEXT_PUBLIC_VAPI_PUBLIC_KEY is missing");
      setError("VAPI configuration missing");
      return;
    }

    if (!vapiRef.current) {
      vapiRef.current = new Vapi(vapiPublicKey);
    }
    
    const vapi = vapiRef.current;

    const onCallStart = () => {
      console.log('Vapi: Call started');
      setIsConnecting(false);
      setIsSessionActive(true);
      setError(null);
    };

    const onCallEnd = () => {
      console.log('Vapi: Call ended');
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

    const onError = (e: any) => {
      console.error('Vapi error:', e);
      setError(e.message || "An error occurred with the voice assistant");
      setIsConnecting(false);
      setIsSessionActive(false);
    };

    vapi.on('call-start', onCallStart);
    vapi.on('call-end', onCallEnd);
    vapi.on('speech-start', onSpeechStart);
    vapi.on('speech-end', onSpeechEnd);
    vapi.on('volume-level', onVolumeLevel);
    vapi.on('error', onError);

    return () => {
      vapi.off('call-start', onCallStart);
      vapi.off('call-end', onCallEnd);
      vapi.off('speech-start', onSpeechStart);
      vapi.off('speech-end', onSpeechEnd);
      vapi.off('volume-level', onVolumeLevel);
      vapi.off('error', onError);
    };
  }, []);

  const startSession = useCallback(async (assistant: string | object) => {
    if (!vapiRef.current) return;
    
    setIsConnecting(true);
    setError(null);
    
    try {
      await vapiRef.current.start(assistant as any);
    } catch (err: any) {
      console.error("Failed to start Vapi session", err);
      setError(err.message || "Failed to start voice session");
      setIsConnecting(false);
    }
  }, []);

  const stopSession = useCallback(() => {
    if (!vapiRef.current) return;
    vapiRef.current.stop();
  }, []);

  const toggleMute = useCallback((mute: boolean) => {
    if (!vapiRef.current) return;
    vapiRef.current.setMuted(mute);
  }, []);

  const sendData = useCallback((data: any) => {
      if (!vapiRef.current) return;
      // Vapi allows sending messages/data to the assistant context
      // vapiRef.current.send(data); // Check SDK for exact method if needed, usually .send()
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
    vapi: vapiRef.current
  };
}
