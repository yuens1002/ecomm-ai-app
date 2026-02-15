"use client";

import { useState, useEffect, useRef } from "react";
import { motion } from "motion/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  MessageCircle,
  X,
  Loader2,
  Send,
  RotateCw,
  ShoppingCart,
} from "lucide-react";
import { useCartStore } from "@/lib/store/cart-store";
import { useToast } from "@/hooks/use-toast";
import Image from "next/image";

interface ChatBaristaProps {
  userName?: string;
  isAuthenticated?: boolean;
}

interface ProductRecommendation {
  id: string;
  name: string;
  slug: string;
  images: string[];
  description: string;
  roastLevel: string;
  variants: Array<{
    id: string;
    name: string;
    purchaseOptions: Array<{
      id: string;
      type: string;
      priceInCents: number;
    }>;
  }>;
}

export default function ChatBarista({
  userName,
  isAuthenticated = false,
}: ChatBaristaProps) {
  const [isActive, setIsActive] = useState(false);
  const [messages, setMessages] = useState<
    Array<{
      role: "user" | "assistant";
      text: string;
      error?: boolean;
      product?: ProductRecommendation;
      id?: string;
    }>
  >([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);
  const [input, setInput] = useState("");
  const [gradientPosition, setGradientPosition] = useState(0);
  const [viewport, setViewport] = useState<{ height: number; offsetTop: number } | null>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const messageCountRef = useRef(0);
  const messageIdCounter = useRef(0);
  const { addItem, setCartOpen } = useCartStore();
  const { toast } = useToast();

  // Track visual viewport (shrinks + offsets when mobile keyboard opens)
  useEffect(() => {
    if (!isActive) return;
    const vv = window.visualViewport;
    if (!vv) return;

    const onResize = () => {
      setViewport({ height: vv.height, offsetTop: vv.offsetTop });
      // Keep messages scrolled to bottom when keyboard opens/closes
      requestAnimationFrame(() => {
        const el = messagesContainerRef.current;
        if (el) el.scrollTop = el.scrollHeight;
      });
    };
    onResize();
    vv.addEventListener("resize", onResize);
    vv.addEventListener("scroll", onResize);
    return () => {
      vv.removeEventListener("resize", onResize);
      vv.removeEventListener("scroll", onResize);
    };
  }, [isActive]);

  // Lock page scroll when chat is open
  useEffect(() => {
    if (!isActive) return;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isActive]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    requestAnimationFrame(() => {
      const el = messagesContainerRef.current;
      if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
    });
  }, [messages]);

  // Track message count for animations - update AFTER render
  useEffect(() => {
    messageCountRef.current = messages.length;
  }, [messages.length]);

  // Animate background gradient
  useEffect(() => {
    const interval = setInterval(() => {
      setGradientPosition((prev) => (prev + 1) % 360);
    }, 50);
    return () => clearInterval(interval);
  }, []);

  const handleStartConversation = () => {
    setIsActive(true);
    messageIdCounter.current = 0;
    messageCountRef.current = 0; // Reset before adding new message
    setMessages([
      {
        role: "assistant",
        text: userName
          ? `Hey ${userName}! Great to see you again! ☕ What kind of coffee are you in the mood for today?`
          : "Hey there! ☕ I'm here to help you find your perfect cup. What kind of coffee sounds good to you?",
        id: `msg-${messageIdCounter.current++}`,
      },
    ]);
  };

  const handleEndConversation = () => {
    setIsActive(false);
    setMessages([]);
    setInput("");
    messageCountRef.current = 0;
    messageIdCounter.current = 0;
  };

  const handleSendMessage = async (retryMessage?: string) => {
    const messageToSend = retryMessage || input.trim();
    if (!messageToSend || isLoading || isRetrying) return;

    const isRetry = !!retryMessage;

    // Add user message only if not retrying
    const newMessages = isRetry
      ? messages
      : [
          ...messages,
          {
            role: "user" as const,
            text: messageToSend,
            id: `msg-${messageIdCounter.current++}`,
          },
        ];

    if (!isRetry) {
      setMessages(newMessages);
      setInput("");
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

      let data;
      let hasError = false;

      if (isAuthenticated) {
        // Authenticated users: use personalized chat API
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

        data = await response.json();
        hasError =
          data.error === "rate_limit" || data.error === "service_unavailable";
      } else {
        // Guest users: provide simple responses and recommendations
        data = await handleGuestChat(messageToSend, conversationHistory);
        hasError = false;
      }

      // If no message or generic error, provide a helpful message without retry button
      const messageText =
        data.message ||
        "I'm having trouble understanding that. Could you rephrase your question?";

      // Extract taste and brew preferences from current conversation
      const extractPreferences = () => {
        // Only look at USER messages to avoid detecting keywords from bot responses
        const userMessages = newMessages
          .filter((m) => m.role === "user")
          .map((m) => m.text)
          .join(" ")
          .toLowerCase();

        // Extract taste preferences - user's actual words only
        const tasteKeywords = [
          "fruity",
          "fruit",
          "citrus",
          "berry",
          "floral",
          "bright",
          "chocolate",
          "chocolatey",
          "nutty",
          "caramel",
          "sweet",
          "bold",
          "smooth",
          "rich",
          "earthy",
          "spicy",
          "vanilla",
          "strong",
          "mild",
          "mellow",
          "intense",
          "balanced",
          "complex",
          "soft",
          "delicate",
          "robust",
          "full-bodied",
          "dark",
          "medium",
          "light",
        ];

        // Find ALL matching keywords and join them
        const matchedTastes = tasteKeywords.filter((keyword) =>
          userMessages.includes(keyword)
        );

        // Only return taste if explicitly mentioned
        const taste = matchedTastes.length > 0 ? matchedTastes.join(" ") : null;

        // Extract brew method - must be explicitly mentioned
        const brewMethods = [
          "espresso",
          "pour over",
          "pour-over",
          "french press",
          "drip",
          "cold brew",
          "aeropress",
          "moka pot",
          "chemex",
        ];
        const brewMethod =
          brewMethods.find((method) => userMessages.includes(method)) || null;

        return { taste, brewMethod };
      };

      // Check if we should fetch a recommendation
      // Only recommend when BOTH taste and brew method are explicitly mentioned
      const { taste, brewMethod } = extractPreferences();
      const shouldFetchRecommendation =
        (messageText.toLowerCase().includes("recommend") ||
          messageText.toLowerCase().includes("perfect") ||
          messageText.toLowerCase().includes("excellent") ||
          messageText.toLowerCase().includes("check this out") ||
          messageText.toLowerCase().includes("just the thing")) &&
        taste !== null &&
        brewMethod !== null;

      let productRecommendation: ProductRecommendation | undefined;

      // If we have complete preferences, call recommend API
      if (shouldFetchRecommendation && !hasError) {
        try {
          const recommendResponse = await fetch("/api/recommend", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              taste,
              brewMethod,
            }),
          });

          if (recommendResponse.ok) {
            const recommendData = await recommendResponse.json();

            if (recommendData.productData) {
              const product = recommendData.productData;
              productRecommendation = {
                id: product.id,
                name: product.name,
                slug: product.slug,
                images: product.variants?.[0]?.images?.map((img: { url: string }) => img.url) || [],
                description: recommendData.text || product.description,
                roastLevel: product.roastLevel,
                variants: product.variants,
              };
            }
          }
        } catch (error) {
          console.error("Error fetching recommendation:", error);
          // Continue without product, just show the AI message
        }
      }

      if (retryMessage) {
        // Replace the last error message
        setMessages((prev) => [
          ...prev.slice(0, -1),
          {
            role: "assistant",
            text: messageText,
            error: hasError,
            product: productRecommendation,
            id: `msg-${messageIdCounter.current++}`,
          },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            text: messageText,
            error: hasError,
            product: productRecommendation,
            id: `msg-${messageIdCounter.current++}`,
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
            id: `msg-${messageIdCounter.current++}`,
          },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            text: "Sorry, something went wrong. Please try again.",
            error: true,
            id: `msg-${messageIdCounter.current++}`,
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

  const handleGuestChat = async (
    message: string,
    history: Array<{ role: string; text: string }>
  ) => {
    const lowerMessage = message.toLowerCase();

    // Only look at USER messages for context
    const userMessages = history
      .filter((m) => m.role === "user")
      .map((m) => m.text.toLowerCase())
      .join(" ");

    // Define comprehensive keywords
    const tasteKeywords = [
      "chocolate",
      "chocolatey",
      "cocoa",
      "nutty",
      "nut",
      "almond",
      "fruity",
      "fruit",
      "floral",
      "citrus",
      "lemon",
      "orange",
      "caramel",
      "toffee",
      "sweet",
      "sugar",
      "honey",
      "bright",
      "bold",
      "smooth",
      "creamy",
      "rich",
      "full",
      "heavy",
      "earthy",
      "spicy",
      "pepper",
      "berry",
      "berries",
      "blueberry",
      "strawberry",
      "vanilla",
      "light",
      "delicate",
      "mild",
      "mellow",
      "strong",
      "intense",
      "robust",
      "complex",
      "soft",
      "gentle",
      "balanced",
      "medium",
      "dark",
    ];

    const brewKeywords = [
      "espresso",
      "shot",
      "espresso machine",
      "pour over",
      "pour-over",
      "pourover",
      "v60",
      "chemex",
      "french press",
      "press pot",
      "plunger",
      "drip",
      "drip coffee",
      "coffee maker",
      "automatic",
      "cold brew",
      "iced",
      "cold",
      "aeropress",
      "aero press",
      "moka pot",
      "stovetop",
      "percolator",
    ];

    const offtopicKeywords = [
      "weather",
      "time",
      "date",
      "news",
      "sports",
      "politics",
      "help",
      "support",
      "account",
      "password",
      "login",
    ];

    const cartCheckoutKeywords = [
      "checkout",
      "check out",
      "cart",
      "shopping cart",
      "buy",
      "purchase",
      "order",
    ];

    const moreOptionsKeywords = [
      "other",
      "else",
      "another",
      "different",
      "more",
      "alternatives",
      "options",
      "suggestions",
    ];

    // Check for informational questions - MUST be checked FIRST
    const priceQuestions = [
      "cheap",
      "price",
      "cost",
      "expensive",
      "affordable",
      "budget",
    ];
    const brewingQuestions = [
      "what's",
      "what is",
      "what are",
      "how do",
      "how to",
      "explain",
      "tell me about",
    ];

    const askingAboutPrice = priceQuestions.some((q) =>
      lowerMessage.includes(q)
    );
    const askingAboutBrewing =
      brewingQuestions.some((q) => lowerMessage.includes(q)) &&
      (lowerMessage.includes("pour over") ||
        lowerMessage.includes("espresso") ||
        lowerMessage.includes("french press") ||
        lowerMessage.includes("drip") ||
        lowerMessage.includes("brew"));

    // Check for product names being mentioned (don't confuse with preferences)
    const productNames = [
      "brazilian",
      "colombian",
      "ethiopian",
      "kenyan",
      "guatemalan",
      "santos",
      "supremo",
      "yirgacheffe",
      "sidamo",
    ];
    const mentionsProduct = productNames.some((name) =>
      lowerMessage.includes(name)
    );

    // FIRST: Check educational/informational questions (before detection logic)

    // Handle price/budget questions
    if (askingAboutPrice) {
      return {
        message:
          "Great question! Our bags range from $18-$28, with most around $20-22. Quality stuff without breaking the bank! 💰 So, what flavors get you excited - fruity, chocolatey, nutty, or something bold?",
      };
    }

    // Track if bot just asked about brewing method (to avoid counting answer as preference immediately)
    const lastBotMessage =
      history.length > 0 ? history[history.length - 1] : null;
    const justAskedAboutBrewing =
      lastBotMessage?.role === "assistant" &&
      (lastBotMessage.text.includes("Is that your weapon of choice?") ||
        lastBotMessage.text.includes("Is that what you're working with?") ||
        lastBotMessage.text.includes("Sound like your style?") ||
        lastBotMessage.text.includes("Is that your daily driver?") ||
        lastBotMessage.text.includes(
          "Which would you like to know more about?"
        ));

    // Check if asking follow-up brewing questions (how about, what about, etc.)
    const askingFollowUpBrewing =
      (lowerMessage.includes("how about") ||
        lowerMessage.includes("what about") ||
        lowerMessage.includes("and")) &&
      brewKeywords.some((kw) => lowerMessage.includes(kw));

    // Handle brewing method questions - answer WITHOUT counting as preference
    if (askingAboutBrewing || askingFollowUpBrewing) {
      if (lowerMessage.includes("pour over")) {
        return {
          message:
            "Ah, pour over! It's like art - you pour hot water in a slow spiral over the grounds. Makes a super clean, bright cup where you can really taste the coffee's personality. ✨ Sound like your style?",
        };
      }
      if (lowerMessage.includes("french press")) {
        return {
          message:
            "French press is classic! You steep the grounds, then press down a plunger. Gives you a rich, full-bodied cup with all those lovely oils. Perfect for bold flavors! 💪 Is that what you're working with?",
        };
      }
      if (lowerMessage.includes("espresso")) {
        return {
          message:
            "Espresso! Now we're talking! High pressure forces hot water through fine grounds for that intense, concentrated shot. Bold and beautiful! ☕💥 Is that your weapon of choice?",
        };
      }
      if (lowerMessage.includes("drip")) {
        return {
          message:
            "Good ol' drip! Your trusty automatic machine does the work - steady drip, smooth balanced cup. Can't beat the convenience! ☕ Is that your daily driver?",
        };
      }
      // General brewing question
      return {
        message:
          "I can explain any brewing method! Pour over makes bright, clean coffee. French press is rich and full-bodied. Espresso is intense and concentrated. Drip is smooth and balanced. Which would you like to know more about?",
      };
    }

    // Handle cart/checkout requests
    const wantsCheckout = cartCheckoutKeywords.some((keyword) =>
      lowerMessage.includes(keyword)
    );
    if (wantsCheckout) {
      return {
        message:
          "Ready to check out? Just click the shopping cart button below (next to the send button) to view your cart and complete your purchase! 🛒 Need help finding something else?",
      };
    }

    // Off-topic redirect
    const isOffTopic = offtopicKeywords.some((keyword) =>
      lowerMessage.includes(keyword)
    );
    if (isOffTopic) {
      if (
        lowerMessage.includes("order") ||
        lowerMessage.includes("track") ||
        lowerMessage.includes("shipping") ||
        lowerMessage.includes("account")
      ) {
        return {
          message:
            "For order tracking and account questions, please sign in to your account. I'm here to help you discover the perfect coffee! What kind of flavors do you enjoy?",
        };
      }
      return {
        message:
          "I specialize in coffee recommendations! Tell me about your taste preferences and how you brew, and I'll find the perfect match for you.",
      };
    }

    // THEN: Detect preferences (excluding questions)
    const hasTaste = tasteKeywords.some(
      (keyword) =>
        userMessages.includes(keyword) || lowerMessage.includes(keyword)
    );

    // Only count brew method if NOT just asked about it (unless confirming) AND not asking follow-up
    const confirmationWords = [
      "yes",
      "yeah",
      "yep",
      "sure",
      "that's right",
      "correct",
      "that's it",
      "exactly",
      "yup",
      "i'll go with",
      "i'll use",
      "i use",
    ];
    const isConfirming = confirmationWords.some((word) =>
      lowerMessage.includes(word)
    );

    // Count brew method from previous messages, or current if confirming or not just asked
    const hasBrewFromHistory = brewKeywords.some((keyword) =>
      userMessages.includes(keyword)
    );
    const hasBrewInCurrent = brewKeywords.some((keyword) =>
      lowerMessage.includes(keyword)
    );
    const hasBrew =
      hasBrewFromHistory ||
      (hasBrewInCurrent && !justAskedAboutBrewing && !askingFollowUpBrewing) ||
      (hasBrewInCurrent && isConfirming);

    // Check if user wants more options after receiving a recommendation
    const wantsMoreOptions = moreOptionsKeywords.some((keyword) =>
      lowerMessage.includes(keyword)
    );
    const hasReceivedRecommendation = history.some(
      (m) =>
        m.role === "assistant" &&
        m.text.toLowerCase().includes("check this out")
    );

    if (wantsMoreOptions && hasReceivedRecommendation && hasTaste && hasBrew) {
      return {
        message: "Let me find you another great option! 🎯 Check this out:",
      };
    }

    // Handle product name confusion
    if (mentionsProduct && !hasBrew && history.length > 0) {
      return {
        message:
          "I noticed you mentioned a coffee name! I need to know how you brew to make the best recommendation. Do you use espresso, pour over, French press, or drip?",
      };
    }

    // Conversation flow

    // 1. Have both - make recommendation
    if (hasTaste && hasBrew) {
      return {
        message: "Ooh, I know just the thing for you! 🎯 Check this out:",
      };
    }

    // 2. Have taste, need brew
    if (hasTaste && !hasBrew) {
      return {
        message:
          "Love it! And how do you usually make your coffee? Espresso machine, pour over, French press, or just a regular drip?",
      };
    }

    // 3. Have brew, need taste
    if (hasBrew && !hasTaste) {
      return {
        message:
          "Nice setup! Now, what kind of flavors make you happy? Fruity and bright, rich and chocolatey, smooth and nutty, or bold and earthy?",
      };
    }

    // 4. Multiple unclear responses - be more direct
    if (history.length >= 3) {
      return {
        message:
          "No worries! Let me make this easy - just tell me two things: (1) What flavors you dig - fruity? chocolatey? nutty? And (2) How you brew it - espresso, drip, pour over? 😊",
      };
    }

    // 5. First unclear response - provide clear examples
    return {
      message:
        "I'm here to find you something amazing! What kind of flavors do you usually go for? Fruity and bright, chocolatey and rich, smooth and nutty, or bold and earthy?",
    };
  };

  const handleAddToCart = (product: ProductRecommendation) => {
    try {
      // Get first variant and ONE_TIME purchase option
      const variant = product.variants[0];
      const oneTimePurchase = variant?.purchaseOptions?.find(
        (option) => option.type === "ONE_TIME"
      );

      if (variant && oneTimePurchase) {
        addItem({
          productId: product.id,
          productName: product.name,
          productSlug: product.slug,
          variantId: variant.id,
          variantName: variant.name,
          purchaseOptionId: oneTimePurchase.id,
          purchaseType: "ONE_TIME",
          priceInCents: oneTimePurchase.priceInCents,
          quantity: 1,
          imageUrl: product.images[0],
        });

        toast({
          title: "Added to cart",
          description: `Added ${product.name} (${variant.name}) to your cart.`,
        });

        // Add confirmation message
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            text: `Great! I've added ${product.name} (${variant.name}) to your cart. Would you like to checkout or keep browsing?`,
          },
        ]);
      }
    } catch (error) {
      console.error("Error adding to cart:", error);
      toast({
        title: "Error",
        description: "Failed to add item to cart. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Create animated gradient colors
  const hue1 = gradientPosition;
  const hue2 = (gradientPosition + 60) % 360;
  const hue3 = (gradientPosition + 120) % 360;

  return (
    <>
      {/* Hero Section - Always visible with animated background */}
      <div className="relative overflow-hidden border-b">
        {/* Animated gradient background */}
        <div
          className="absolute inset-0 opacity-20 transition-opacity duration-1000"
          style={{
            background: `linear-gradient(135deg, 
              hsl(${hue1}, 70%, 60%) 0%, 
              hsl(${hue2}, 60%, 50%) 50%, 
              hsl(${hue3}, 70%, 60%) 100%)`,
          }}
        />

        {/* Floating orbs */}
        <div className="absolute inset-0 overflow-hidden">
          <div
            className="absolute w-96 h-96 rounded-full blur-3xl opacity-20"
            style={{
              background: `radial-gradient(circle, hsl(${hue1}, 80%, 60%), transparent)`,
              top: "20%",
              left: "10%",
              animation: "float 8s ease-in-out infinite",
            }}
          />
          <div
            className="absolute w-80 h-80 rounded-full blur-3xl opacity-20"
            style={{
              background: `radial-gradient(circle, hsl(${hue2}, 80%, 60%), transparent)`,
              bottom: "10%",
              right: "15%",
              animation: "float 10s ease-in-out infinite reverse",
            }}
          />
          <div
            className="absolute w-64 h-64 rounded-full blur-3xl opacity-15"
            style={{
              background: `radial-gradient(circle, hsl(${hue3}, 80%, 60%), transparent)`,
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              animation: "float 12s ease-in-out infinite",
            }}
          />
        </div>

        <div className="py-16 md:py-24 relative z-10">
          <div className="mx-auto max-w-screen-2xl px-4 md:px-8">
            <div className="max-w-3xl mx-auto text-center space-y-6">
              <h1 className="text-4xl md:text-5xl font-bold text-foreground drop-shadow-sm">
                {userName ? (
                  `Welcome back, ${userName}! 👋`
                ) : (
                  <>
                    Your perfect ☕ awaits
                    <span className="inline-block animate-dots">.</span>
                    <span
                      className="inline-block animate-dots"
                      style={{ animationDelay: "0.2s" }}
                    >
                      .
                    </span>
                    <span
                      className="inline-block animate-dots"
                      style={{ animationDelay: "0.4s" }}
                    >
                      .
                    </span>
                  </>
                )}
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground drop-shadow-sm">
                {userName
                  ? "Chat with your personal coffee barista. Get recommendations, reorder favorites, or discover something new."
                  : "Chat with our AI barista to find your perfect roast. Get personalized recommendations based on your taste preferences."}
              </p>
              <div className="flex justify-center">
                <Button
                  size="lg"
                  className="gap-2 text-lg px-8 py-6 shadow-lg hover:shadow-xl transition-shadow"
                  onClick={handleStartConversation}
                >
                  <MessageCircle className="w-5 h-5" />
                  Chat Now
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Add keyframes for animations */}
        <style jsx>{`
          @keyframes float {
            0%,
            100% {
              transform: translateY(0) translateX(0);
            }
            33% {
              transform: translateY(-20px) translateX(10px);
            }
            66% {
              transform: translateY(10px) translateX(-10px);
            }
          }
          @keyframes dots {
            0%,
            20% {
              opacity: 0;
              transform: translateY(0);
            }
            50% {
              opacity: 1;
              transform: translateY(-5px);
            }
            100% {
              opacity: 0;
              transform: translateY(0);
            }
          }
          :global(.animate-dots) {
            animation: dots 1.4s infinite;
          }
        `}</style>
      </div>

      {/* Chat Modal */}
      {isActive && (
        <>
          {/* Backdrop — always covers full screen */}
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            onClick={handleEndConversation}
          />

          {/* Chat card — sized to visual viewport so keyboard doesn't overlap */}
          <div
            className="fixed inset-x-0 z-50 flex md:items-center md:justify-center md:p-4"
            style={{
              top: viewport ? `${viewport.offsetTop}px` : 0,
              height: viewport ? `${viewport.height}px` : '100dvh',
            }}
          >
            <Card className="w-full md:max-w-2xl h-full md:h-[70vh] flex flex-col relative overflow-hidden rounded-none border-0 py-0 gap-0 shadow-none md:rounded-xl md:border md:py-6 md:gap-6 md:shadow-sm">
              {/* Animated background */}
              <div
                className="absolute inset-0 opacity-5 pointer-events-none"
                style={{
                  background: `linear-gradient(135deg,
                    hsl(${gradientPosition}, 70%, 60%) 0%,
                    hsl(${(gradientPosition + 60) % 360}, 60%, 50%) 50%,
                    hsl(${(gradientPosition + 120) % 360}, 70%, 60%) 100%)`,
                }}
              />
              <CardContent className="p-4 md:p-6 flex flex-col h-full relative z-10">
                {/* Header */}
                <div className="flex items-center justify-between pb-3 shrink-0">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-full bg-primary/10">
                      <MessageCircle className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold">
                        Coffee Barista Chat
                      </h2>
                      <p className="text-xs text-muted-foreground">
                        Powered by AI ✨
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleEndConversation}
                  >
                    <X className="w-5 h-5" />
                  </Button>
                </div>

                {/* Messages — bottom-anchored like iMessage */}
                <div ref={messagesContainerRef} className="flex-1 overflow-y-auto overflow-x-hidden min-h-0 px-2 overscroll-contain">
                  <div className="flex flex-col justify-end min-h-full space-y-4">
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

                      // Only animate messages that are new (index >= previous count)
                      const isNewMessage = index >= messageCountRef.current;

                      // Calculate staggered delay: AI messages wait for user messages
                      const animationDelay = isNewMessage
                        ? message.role === "assistant"
                          ? 0.4
                          : 0.05
                        : 0;

                      return (
                        <div key={message.id || index} className="space-y-2">
                          <div
                            className={`flex items-start gap-2 ${
                              message.role === "user"
                                ? "justify-end"
                                : "justify-start"
                            }`}
                          >
                            <motion.div
                              initial={
                                isNewMessage
                                  ? {
                                      opacity: 0,
                                      x: message.role === "user" ? 30 : -30,
                                      scale: 0.95,
                                    }
                                  : false
                              }
                              animate={{
                                opacity: 1,
                                x: 0,
                                scale: 1,
                              }}
                              transition={{
                                duration: 0.5,
                                ease: [0.25, 0.1, 0.25, 1],
                                delay: animationDelay,
                              }}
                              className={`max-w-[80%] rounded-2xl px-4 py-3 shadow-sm ${
                                message.role === "user"
                                  ? "bg-gradient-to-br from-primary to-primary/90 text-primary-foreground"
                                  : "bg-gradient-to-br from-muted to-muted/80 text-foreground border border-border/50"
                              }`}
                            >
                              <p className="text-sm whitespace-pre-wrap">
                                {message.text}
                              </p>
                            </motion.div>
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

                          {/* Product Recommendation Card */}
                          {message.product && (
                            <motion.div
                              initial={
                                isNewMessage
                                  ? {
                                      opacity: 0,
                                      y: 20,
                                      scale: 0.95,
                                    }
                                  : false
                              }
                              animate={{
                                opacity: 1,
                                y: 0,
                                scale: 1,
                              }}
                              transition={{
                                duration: 0.6,
                                ease: [0.25, 0.1, 0.25, 1],
                                delay: animationDelay + 0.3,
                              }}
                              className="flex justify-start"
                            >
                              <Card className="max-w-[80%] overflow-hidden hover:shadow-lg transition-all hover:scale-[1.02] border-2 border-primary/20">
                                <CardContent className="p-0">
                                  <div
                                    onClick={() => {
                                      handleEndConversation();
                                      window.location.href = `/products/${message.product!.slug}`;
                                    }}
                                    className="cursor-pointer"
                                  >
                                    <div className="flex gap-3 p-3 hover:bg-muted/50 transition-colors">
                                      {/* Product Image */}
                                      <div className="relative w-24 h-24 flex-shrink-0 rounded-md overflow-hidden bg-muted">
                                        {message.product.images[0] && (
                                          <Image
                                            src={message.product.images[0]}
                                            alt={message.product.name}
                                            fill
                                            className="object-cover"
                                          />
                                        )}
                                      </div>

                                      {/* Product Details */}
                                      <div className="flex-1 min-w-0">
                                        <h3 className="font-semibold text-sm mb-1">
                                          {message.product.name}
                                        </h3>
                                        <p className="text-xs text-muted-foreground mb-2 line-clamp-3">
                                          {message.product.description}
                                        </p>
                                        <div className="flex items-center gap-2">
                                          <span className="text-xs font-medium capitalize bg-primary/10 text-primary px-2 py-0.5 rounded">
                                            {message.product.roastLevel} Roast
                                          </span>
                                          <span className="text-sm font-semibold">
                                            $
                                            {(
                                              message.product.variants[0]
                                                ?.purchaseOptions?.[0]
                                                ?.priceInCents / 100
                                            ).toFixed(2)}
                                          </span>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                  <div className="px-3 pb-3">
                                    <Button
                                      size="sm"
                                      className="w-full gap-2"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleAddToCart(message.product!);
                                      }}
                                    >
                                      <ShoppingCart className="w-4 h-4" />
                                      Add to Cart
                                    </Button>
                                  </div>
                                </CardContent>
                              </Card>
                            </motion.div>
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
                </div>

                {/* Input — pinned to bottom */}
                <div className="shrink-0 pt-3">
                  <div className="flex items-center gap-2">
                    <Input
                      ref={inputRef}
                      type="text"
                      enterKeyHint="send"
                      placeholder="Type your message..."
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleSendMessage();
                        }
                      }}
                      className="flex-1"
                      autoFocus
                    />
                    <div
                      role="button"
                      aria-label="Send message"
                      tabIndex={-1}
                      onClick={() => handleSendMessage()}
                      className="hidden md:inline-flex items-center justify-center h-9 w-9 rounded-md bg-primary text-primary-foreground shrink-0 cursor-pointer active:opacity-80"
                    >
                      {isLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Send className="w-4 h-4" />
                      )}
                    </div>
                    <div
                      role="button"
                      aria-label="View Cart"
                      tabIndex={-1}
                      onTouchEnd={(e) => {
                        e.preventDefault();
                        handleEndConversation();
                        setCartOpen(true);
                      }}
                      onClick={() => {
                        handleEndConversation();
                        setCartOpen(true);
                      }}
                      className="inline-flex items-center justify-center h-9 w-9 rounded-md border border-input bg-background shrink-0 cursor-pointer active:opacity-80"
                    >
                      <ShoppingCart className="w-4 h-4" />
                    </div>
                  </div>

                  {/* Status — hidden on mobile to save space */}
                  <div className="mt-2 text-center hidden md:block">
                    <p className="text-xs text-muted-foreground">
                      Your conversation is private and secure
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </>
  );
}
