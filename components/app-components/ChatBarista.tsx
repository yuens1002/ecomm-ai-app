"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  MessageCircle,
  X,
  Loader2,
  Sparkles,
  Send,
  RotateCw,
} from "lucide-react";

interface ChatBaristaProps {
  userName?: string;
  onOpenAiModal?: () => void;
}

export default function ChatBarista({
  userName,
  onOpenAiModal,
}: ChatBaristaProps) {
  const [isActive, setIsActive] = useState(false);
  const [messages, setMessages] = useState<
    Array<{ role: "user" | "assistant"; text: string; error?: boolean }>
  >([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const handleStartConversation = () => {
    setIsActive(true);
    setMessages([
      {
        role: "assistant",
        text: `Hi ${userName || "there"}! Welcome back to Artisan Roast. I'm your personal coffee barista. How can I help you today?`,
      },
    ]);
  };

  const handleEndConversation = () => {
    setIsActive(false);
    setMessages([]);
    setInput("");
  };

  const handleSendMessage = async (retryMessage?: string) => {
    const messageToSend = retryMessage || input.trim();
    if (!messageToSend || isLoading || isRetrying) return;

    const isRetry = !!retryMessage;

    if (!isRetry) {
      setInput("");
    }

    // Add user message only if not retrying
    const newMessages = isRetry
      ? messages
      : [...messages, { role: "user" as const, text: messageToSend }];

    if (!isRetry) {
      setMessages(newMessages);
    }

    if (isRetry) {
      setIsRetrying(true);
    } else {
      setIsLoading(true);
    }

    try {
      // Clean the conversation history to only include serializable data
      const conversationHistory = (
        retryMessage ? messages.slice(0, -1) : messages
      ).map((msg) => ({
        role: msg.role,
        text: msg.text,
      }));

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: messageToSend,
          conversationHistory,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("API error:", response.status, errorData);
        throw new Error(errorData.error || "Failed to get response");
      }

      const data = await response.json();
      console.log("Chat API response:", data);

      // Check if the response contains an error flag (rate limit or service issues)
      const hasError =
        data.error === "rate_limit" || data.error === "service_unavailable";

      // If no message or generic error, provide a helpful message without retry button
      const messageText =
        data.message ||
        "I'm having trouble understanding that. Could you rephrase your question?";

      if (retryMessage) {
        // Replace the last error message
        setMessages((prev) => [
          ...prev.slice(0, -1),
          {
            role: "assistant",
            text: messageText,
            error: hasError,
          },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            text: messageText,
            error: hasError,
          },
        ]);
      }
    } catch (error) {
      console.error("Error sending message:", error);
      if (retryMessage) {
        // Replace the last error message with new error
        setMessages((prev) => [
          ...prev.slice(0, -1),
          {
            role: "assistant",
            text: "Sorry, something went wrong. Please try again.",
            error: true,
          },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            text: "Sorry, something went wrong. Please try again.",
            error: true,
          },
        ]);
      }
    } finally {
      setIsLoading(false);
      setIsRetrying(false);
    }
  };

  const handleRetry = () => {
    // Find the last user message
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].role === "user") {
        handleSendMessage(messages[i].text);
        break;
      }
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
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
                Chat with your personal coffee barista. Get recommendations,
                reorder favorites, or discover something new.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-start">
                <div className="flex flex-col items-center gap-1">
                  <Button
                    size="lg"
                    className="gap-2 text-lg px-8 py-6"
                    onClick={handleStartConversation}
                  >
                    <MessageCircle className="w-5 h-5" />
                    Chat Now
                  </Button>
                  <p className="text-xs text-muted-foreground">
                    English & Spanish
                  </p>
                </div>
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
            </div>
          </div>
        </div>
      )}

      {/* Chat Modal */}
      {isActive && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-3xl h-[80vh] flex flex-col">
            <CardContent className="p-6 flex flex-col h-full">
              {/* Header */}
              <div className="flex items-center justify-between pb-4 border-b shrink-0">
                <div className="flex items-center gap-3">
                  <MessageCircle className="w-5 h-5 text-primary" />
                  <h2 className="text-lg font-semibold">Coffee Barista Chat</h2>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleEndConversation}
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>

              {/* Messages */}
              <div className="flex-1 space-y-4 my-4 overflow-y-auto min-h-0">
                {messages.map((message, index) => {
                  const isLastMessage = index === messages.length - 1;
                  const shouldHideForRetry =
                    isLastMessage &&
                    message.role === "assistant" &&
                    message.error &&
                    isRetrying;
                  const showRetry =
                    message.role === "assistant" &&
                    message.error &&
                    !isRetrying;

                  if (shouldHideForRetry) {
                    return null;
                  }

                  return (
                    <div
                      key={index}
                      className={`flex items-start gap-2 ${
                        message.role === "user"
                          ? "justify-end"
                          : "justify-start"
                      }`}
                    >
                      <div
                        className={`max-w-[80%] rounded-lg px-4 py-3 ${
                          message.role === "user"
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-foreground"
                        }`}
                      >
                        <p className="text-sm whitespace-pre-wrap">
                          {message.text}
                        </p>
                      </div>
                      {showRetry && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 shrink-0 mt-1"
                          onClick={handleRetry}
                          title="Retry"
                        >
                          <RotateCw className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  );
                })}
                {isRetrying && (
                  <div className="flex items-start gap-2 justify-start">
                    <div className="bg-muted rounded-lg px-4 py-3">
                      <p className="text-sm">Retrying...</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 shrink-0 mt-1"
                      disabled
                      title="Retrying..."
                    >
                      <RotateCw className="w-4 h-4 animate-spin" />
                    </Button>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="shrink-0">
                <div className="flex items-center gap-2 pt-4 border-t">
                  <Input
                    type="text"
                    placeholder="Type your message..."
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={handleKeyPress}
                    disabled={isLoading || isRetrying}
                    className="flex-1"
                    autoFocus
                  />
                  <Button
                    size="icon"
                    onClick={() => handleSendMessage()}
                    disabled={!input.trim() || isLoading || isRetrying}
                  >
                    {isLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                  </Button>
                </div>

                {/* Status */}
                <div className="mt-2 text-center">
                  <p className="text-xs text-muted-foreground">
                    Your conversation is private and secure • English & Spanish
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
