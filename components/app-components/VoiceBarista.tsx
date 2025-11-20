"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Mic, MicOff, X, ShoppingCart, Loader2, Sparkles } from "lucide-react";

interface VoiceBaristaProps {
  userName?: string;
  onOpenAiModal?: () => void;
}

export default function VoiceBarista({
  userName,
  onOpenAiModal,
}: VoiceBaristaProps) {
  const [isActive, setIsActive] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState<
    Array<{ role: "user" | "assistant"; text: string }>
  >([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleStartConversation = () => {
    setIsActive(true);
    setIsListening(true);
    setTranscript([
      {
        role: "assistant",
        text: `Hi ${userName || "there"}! Welcome back to Artisan Roast. I'm your personal coffee barista. How can I help you today?`,
      },
    ]);
    // TODO: Initialize VAPI session
  };

  const handleEndConversation = () => {
    setIsActive(false);
    setIsListening(false);
    setTranscript([]);
    // TODO: End VAPI session
  };

  const toggleMicrophone = () => {
    setIsListening(!isListening);
    // TODO: Toggle VAPI microphone
  };

  return (
    <div className="relative w-full">
      {/* Hero Section - When Inactive */}
      {!isActive && (
        <div className="relative overflow-hidden bg-linear-to-br from-primary/10 via-background to-accent/10 border-b">
          <div className="container mx-auto px-4 py-16 md:py-24">
            <div className="max-w-3xl mx-auto text-center space-y-6">
              <h1 className="text-4xl md:text-5xl font-bold text-foreground">
                Welcome back{userName ? `, ${userName}` : ""}! 👋
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground">
                Talk to your personal coffee barista. Get recommendations,
                reorder favorites, or discover something new.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <Button
                  size="lg"
                  className="gap-2 text-lg px-8 py-6"
                  onClick={handleStartConversation}
                >
                  <Mic className="w-5 h-5" />
                  Start Voice Chat
                </Button>
                {onOpenAiModal && (
                  <Button
                    size="lg"
                    variant="outline"
                    className="gap-2 text-lg px-8 py-6"
                    onClick={onOpenAiModal}
                  >
                    <Sparkles className="w-5 h-5" />
                    Get AI Recommendation
                  </Button>
                )}
              </div>
              <p className="text-sm text-muted-foreground mt-4">
                Voice chat available in English & Spanish
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Voice Conversation - When Active */}
      {isActive && (
        <Card className="mx-auto max-w-4xl my-8">
          <CardContent className="p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6 pb-4 border-b">
              <div className="flex items-center gap-3">
                <div
                  className={`w-3 h-3 rounded-full ${
                    isListening ? "bg-green-500 animate-pulse" : "bg-gray-400"
                  }`}
                />
                <h2 className="text-lg font-semibold">
                  {isListening ? "Listening..." : "Paused"}
                </h2>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleEndConversation}
              >
                <X className="w-5 h-5" />
              </Button>
            </div>

            {/* Transcript */}
            <div className="space-y-4 mb-6 max-h-[400px] overflow-y-auto">
              {transcript.map((message, index) => (
                <div
                  key={index}
                  className={`flex ${
                    message.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg px-4 py-3 ${
                      message.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-foreground"
                    }`}
                  >
                    <p className="text-sm">{message.text}</p>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-muted rounded-lg px-4 py-3">
                    <Loader2 className="w-4 h-4 animate-spin" />
                  </div>
                </div>
              )}
            </div>

            {/* Controls */}
            <div className="flex items-center justify-center gap-4 pt-4 border-t">
              <Button
                size="lg"
                variant={isListening ? "destructive" : "default"}
                className="gap-2"
                onClick={toggleMicrophone}
              >
                {isListening ? (
                  <>
                    <MicOff className="w-5 h-5" />
                    Mute
                  </>
                ) : (
                  <>
                    <Mic className="w-5 h-5" />
                    Unmute
                  </>
                )}
              </Button>
              <Button variant="outline" size="lg" className="gap-2">
                <ShoppingCart className="w-5 h-5" />
                View Cart
              </Button>
            </div>

            {/* Status */}
            <div className="mt-4 text-center">
              <p className="text-xs text-muted-foreground">
                Your conversation is private and secure
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
