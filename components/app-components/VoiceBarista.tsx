"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Mic, MicOff, Loader2, Send } from "lucide-react";
import { useVapi } from "@/hooks/use-vapi";
import { VAPI_ASSISTANT_CONFIG } from "@/lib/vapi-config";
import { useCartStore } from "@/lib/store/cart-store";
import { useToast } from "@/hooks/use-toast";
import { getProductVariantForCart } from "@/app/actions";
import { motion, AnimatePresence } from "motion/react";

interface VoiceBaristaProps {
  userEmail?: string;
  onOpenAiModal?: () => void;
}

export default function VoiceBarista({ userEmail }: VoiceBaristaProps) {
  const [messages, setMessages] = useState<
    Array<{ role: "user" | "assistant"; text: string; error?: boolean }>
  >([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [placeholderText, setPlaceholderText] = useState("Type a message...");

  const { addItem } = useCartStore();
  const { toast } = useToast();
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const {
    isSessionActive,
    isConnecting,
    startSession,
    stopSession,
    volumeLevel,
    vapi,
    error: voiceError,
  } = useVapi();

  const hasStarted = messages.length > 0 || isSessionActive;

  // Animate placeholder dots
  useEffect(() => {
    if (isSessionActive) {
      let dots = 0;
      const interval = setInterval(() => {
        dots = (dots + 1) % 4;
        setPlaceholderText(`Listening${".".repeat(dots)}`);
      }, 500);
      return () => clearInterval(interval);
    } else {
      setPlaceholderText("Type a message...");
    }
  }, [isSessionActive]);

  // Auto-scroll
  useEffect(() => {
    if (scrollContainerRef.current) {
      const { scrollHeight, clientHeight } = scrollContainerRef.current;
      scrollContainerRef.current.scrollTo({
        top: scrollHeight - clientHeight,
        behavior: "smooth",
      });
    }
  }, [messages]);

  // Handle VAPI events
  useEffect(() => {
    if (!vapi) return;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const onMessage = async (message: any) => {
      if (message.type === "transcript" && message.transcriptType === "final") {
        setMessages((prev) => [
          ...prev,
          {
            role: message.role === "assistant" ? "assistant" : "user",
            text: message.transcript,
          },
        ]);
      }

      // Handle function calls
      const toolCalls =
        message.toolCalls ||
        (message.type === "tool-calls" ? message.toolCalls : undefined);
      const functionCall =
        message.functionCall ||
        (message.type === "function-call" ? message.functionCall : undefined);

      if (functionCall && functionCall.name === "addToCart") {
        await handleAddToCart(functionCall.parameters);
      } else if (toolCalls && Array.isArray(toolCalls)) {
        const addToCartCall = toolCalls.find(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (tc: any) => tc.function && tc.function.name === "addToCart"
        );
        if (addToCartCall) {
          await handleAddToCart(addToCartCall.function.arguments);
        }
      }
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleAddToCart = async (args: any) => {
      try {
        const parsedArgs = typeof args === "string" ? JSON.parse(args) : args;
        if (parsedArgs && parsedArgs.variantId) {
          const variantDetails = await getProductVariantForCart(
            parsedArgs.variantId
          );
          if (variantDetails) {
            addItem({
              productId: variantDetails.product.id,
              productName: variantDetails.product.name,
              productSlug: variantDetails.product.slug,
              variantId: variantDetails.id,
              variantName: variantDetails.name,
              purchaseOptionId: variantDetails.purchaseOptionId || "unknown",
              purchaseType: "ONE_TIME",
              priceInCents: variantDetails.priceInCents,
              quantity: parsedArgs.quantity || 1,
              imageUrl: variantDetails.product.image,
            });
            toast({
              title: "Added to cart",
              description: `Added ${variantDetails.product.name} (${variantDetails.name}) to your cart.`,
            });
          }
        }
      } catch (e) {
        console.error("Error processing addToCart:", e);
      }
    };

    vapi.on("message", onMessage);
    return () => {
      vapi.off("message", onMessage);
    };
  }, [vapi, toast, addItem]);

  const handleStartVoice = async () => {
    const config = { ...VAPI_ASSISTANT_CONFIG };
    if (userEmail && config.server) {
      const separator = config.server.url.includes("?") ? "&" : "?";
      config.server = {
        ...config.server,
        url: `${config.server.url}${separator}userEmail=${encodeURIComponent(userEmail)}`,
      };
    }
    await startSession(config);
  };

  const toggleVoice = () => {
    if (isSessionActive) {
      stopSession();
    } else {
      handleStartVoice();
    }
  };

  const handleSendMessage = async () => {
    if (!input.trim()) return;

    const userMsg = input;
    setInput("");
    setMessages((prev) => [...prev, { role: "user", text: userMsg }]);
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMsg,
          conversationHistory: messages.map((m) => ({
            role: m.role,
            text: m.text,
          })),
        }),
      });

      const data = await response.json();
      setMessages((prev) => [
        ...prev,
        { role: "assistant", text: data.message || "I didn't catch that." },
      ]);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative w-full h-[calc(100vh-4rem)] overflow-hidden bg-background transition-colors duration-500">
      {/* Interactive Background Gradient - Blue Hue, Top Aligned */}
      <div className="absolute top-[-15%] left-1/2 -translate-x-1/2 w-full max-w-4xl aspect-square pointer-events-none opacity-50">
        <motion.div
          animate={{
            scale: isSessionActive ? 1 + Math.min(volumeLevel * 3, 0.5) : 1,
            opacity: isSessionActive ? 0.8 : 0.4,
          }}
          transition={{ type: "spring", stiffness: 200, damping: 25 }}
          className="w-full h-full rounded-full blur-[100px] bg-radial-gradient from-blue-600/40 via-cyan-500/20 to-transparent"
          style={{
            background:
              "radial-gradient(circle, rgba(37, 99, 235, 0.4) 0%, rgba(6, 182, 212, 0.2) 40%, rgba(0,0,0,0) 70%)",
          }}
        />
      </div>

      {/* Main Interface */}
      <div className="relative z-10 flex flex-col h-full max-w-2xl mx-auto px-6 py-8 gap-6">
        {/* Header - Fades out when started */}
        <AnimatePresence>
          {!hasStarted && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20, height: 0, marginBottom: 0 }}
              className="flex-1 flex flex-col items-center justify-center text-center space-y-6 mb-12"
            >
              <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-foreground">
                Artisan Voice
              </h1>
              <p className="text-xl text-muted-foreground max-w-lg mx-auto">
                Experience the future of coffee. Just ask for what you need.
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Transcript Area - Fills space when started */}
        {hasStarted && (
          <div
            ref={scrollContainerRef}
            className="flex-1 overflow-y-auto flex flex-col space-y-6 pb-24 scrollbar-hide"
            style={{
              maskImage:
                "linear-gradient(to bottom, transparent 0%, black 10%, black 90%, transparent 100%)",
            }}
          >
            <div className="flex-1" />{" "}
            {/* Spacer to push content down initially */}
            {messages.map((msg, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex ${msg.role === "assistant" ? "justify-start" : "justify-end"}`}
              >
                <div
                  className={`max-w-[80%] text-lg leading-relaxed ${
                    msg.role === "assistant"
                      ? "text-foreground font-medium"
                      : "text-muted-foreground text-right"
                  }`}
                >
                  {msg.text}
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Controls Container */}
        <div
          className={`shrink-0 transition-all duration-500 ${!hasStarted ? "flex justify-center pb-20" : "pb-4"}`}
        >
          <AnimatePresence mode="wait">
            {!hasStarted ? (
              <motion.div
                key="start-button"
                layoutId="controls"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
              >
                <Button
                  size="icon"
                  className="w-24 h-24 rounded-full bg-foreground hover:opacity-90 shadow-xl transition-transform hover:scale-105"
                  onClick={handleStartVoice}
                  disabled={isConnecting}
                >
                  {isConnecting ? (
                    <Loader2 className="w-10 h-10 animate-spin text-background" />
                  ) : (
                    <Mic className="w-10 h-10 text-background" />
                  )}
                </Button>
              </motion.div>
            ) : (
              <motion.div
                key="input-bar"
                layoutId="controls"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full"
              >
                <div className="relative flex items-center gap-3 bg-secondary/50 backdrop-blur-md p-2 rounded-full border border-border/50 shadow-lg">
                  {/* Text Input */}
                  <Input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder={placeholderText}
                    className="border-0 bg-transparent dark:bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 shadow-none h-12 text-lg pl-6 pr-2 placeholder:text-muted-foreground/70"
                    onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                  />

                  {/* Send Button */}
                  <AnimatePresence>
                    {input.trim() && (
                      <motion.div
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0, opacity: 0 }}
                      >
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={handleSendMessage}
                          className="h-10 w-10 rounded-full hover:bg-blue-100 dark:hover:bg-blue-900/30"
                          disabled={isLoading}
                        >
                          {isLoading ? (
                            <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                          ) : (
                            <Send className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                          )}
                        </Button>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Mic Toggle (Start/Stop) */}
                  <Button
                    size="icon"
                    variant={isSessionActive ? "destructive" : "default"}
                    className={`h-12 w-12 rounded-full shrink-0 transition-all ${
                      isSessionActive
                        ? "animate-pulse bg-red-500 hover:bg-red-600 text-white shadow-[0_0_15px_rgba(239,68,68,0.5)]"
                        : "bg-foreground hover:opacity-90 text-background"
                    }`}
                    onClick={toggleVoice}
                  >
                    {isConnecting ? (
                      <Loader2 className="w-5 h-5 animate-spin text-current" />
                    ) : isSessionActive ? (
                      <MicOff className="w-5 h-5 text-current" />
                    ) : (
                      <Mic className="w-5 h-5 text-current" />
                    )}
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Error Toast */}
      {voiceError && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-destructive/90 text-white px-6 py-2 rounded-full text-sm font-medium shadow-lg backdrop-blur-sm z-50">
          {voiceError}
        </div>
      )}
    </div>
  );
}
