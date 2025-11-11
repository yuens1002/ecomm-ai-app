"use client"; // This directive is necessary for React Client Components (which use state)

import { ModeToggle } from "@/components/app-components/mode-toggle";
import { Button } from "@/components/ui/button";
import React, { useState } from "react";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

// --- Type Definitions ---
interface Product {
  id: number;
  name: string;
  origin: string;
  shortDesc?: string;
  tastingNotes: string;
  price: number;
  imageUrl: string;
}

interface AppHeaderProps {
  cartItemCount: number;
}

interface ProductCardProps {
  product: Product;
  onAddToCart: (productId: number) => void;
}

interface AiHelperModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// --- Mock Product Data ---
// In a real app, this would come from your Postgres database via your API.
const mockProducts: Product[] = [
  {
    id: 1,
    name: "Vietnam Lam Dong Peaberry",
    origin: "Vietnam",
    shortDesc: "A unique peaberry coffee from the Lam Dong region.",
    tastingNotes: "Chocolate, Bright Citrus, Smooth Body",
    price: 22.5,
    imageUrl:
      "https://placehold.co/600x400/8B4513/FFFFFF?text=Vietnam+Peaberry",
  },
  {
    id: 2,
    name: "Ethiopian Yirgacheffe",
    origin: "Ethiopia",
    shortDesc: "A bright and floral coffee from the Yirgacheffe region.",
    tastingNotes: "Floral, Lemon, Black Tea",
    price: 24.0,
    imageUrl: "https://placehold.co/600x400/A0522D/FFFFFF?text=Yirgacheffe",
  },
  {
    id: 3,
    name: "Colombian Supremo",
    origin: "Colombia",
    shortDesc: "A rich and smooth coffee from the Colombian highlands.",
    tastingNotes: "Caramel, Nutty, Mild Acidity",
    price: 21.0,
    imageUrl:
      "https://placehold.co/600x400/D2691E/FFFFFF?text=Colombian+Supremo",
  },
];

// --- SVG Icons ---
// Using inline SVGs is a good practice for performance and customization.
const CartIcon: React.FC = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    className="w-6 h-6"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 0 1-1.12-1.243l1.264-12A1.125 1.125 0 0 1 5.513 7.5h12.974c.576 0 1.059.435 1.119 1.007Z"
    />
  </svg>
);

const CloseIcon: React.FC = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    className="w-6 h-6"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M6 18L18 6M6 6l12 12"
    />
  </svg>
);

// --- NEW ThemeSwitcher Component ---

// --- Header Component ---
// We now use the new theme colors (e.g., bg-background, text-primary)
const AppHeader: React.FC<AppHeaderProps> = ({ cartItemCount }) => {
  return (
    <nav className="bg-card-bg shadow-md sticky top-0 z-50">
      <div className="container mx-auto px-4 md:px-8 py-4 flex justify-between items-center">
        <div className="text-2xl font-bold text-primary">Artisan Roast</div>
        <div className="flex items-center space-x-6">
          <ModeToggle />
          <a
            href="#"
            className="text-text-base hover:text-primary transition-colors"
          >
            Shop
          </a>
          <a
            href="#"
            className="text-text-base hover:text-primary transition-colors"
          >
            About
          </a>
          <button
            className="relative text-text-muted hover:text-primary transition-colors"
            aria-label="Open cart"
          >
            <CartIcon />
            {cartItemCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-600 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                {cartItemCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </nav>
  );
};

// --- Product Card Component ---
// We now use the new theme colors
const ProductCard: React.FC<ProductCardProps> = ({ product, onAddToCart }) => {
  return (
    // <div className="bg-card-bg rounded-lg shadow-lg overflow-hidden transition-transform duration-300 hover:scale-105">
    <Card className="shadow-none">
      <CardHeader>
        <CardTitle className="text-xl">{product.name}</CardTitle>
        <CardDescription>{product.shortDesc}</CardDescription>
      </CardHeader>
      <CardContent>
        <p>{product.tastingNotes}</p>
        <p className="text-lg font-bold text-primary mb-4">
          ${product.price.toFixed(2)}
        </p>
      </CardContent>
      <CardFooter>
        <Button onClick={() => onAddToCart(product.id)}>Add to Cart</Button>
      </CardFooter>
    </Card>
  );
  /*{ <img
        src={product.imageUrl}
        alt={`A bag of ${product.name} coffee`}
        className="w-full h-56 object-cover"
        onError={(e: React.SyntheticEvent<HTMLImageElement, Event>) => {
          const target = e.target as HTMLImageElement;
          target.src =
            "https://placehold.co/600x400/CCCCCC/FFFFFF?text=Image+Not+Found";
        }}
      />
      <div className="p-6">
        <h3 className="text-xl font-semibold text-text-base mb-1"></h3>
        <p className="text-sm text-text-muted italic mb-3"></p>
        <p className="text-lg font-bold text-primary mb-4">
          ${product.price.toFixed(2)}
        </p>
        <button
          onClick={() => onAddToCart(product.id)}
          className="w-full bg-primary text-button-text py-2 px-4 rounded-lg font-medium hover:bg-primary-hover transition-colors"
        >
          Add to Cart
        </button>
      </div>
    </div>}
  );*/
};

// --- AI Helper Modal Component ---
// We now use the new theme colors
const AiHelperModal: React.FC<AiHelperModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  // --- Mock AI State ---
  // In a real app, you'd manage the chat state here.
  const [step, setStep] = useState<number>(1);
  const [taste, setTaste] = useState<string>("");
  const [brewMethod, setBrewMethod] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [recommendation, setRecommendation] = useState<string>("");

  // This function would eventually call your Gemini API route
  const getRecommendation = async () => {
    setIsLoading(true);
    setRecommendation("");

    // In a real Next.js app, you'd create `app/api/recommend/route.ts`
    try {
      const response = await fetch("/api/recommend", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          taste,
          brewMethod,
          // Send mock products for the AI to choose from
          products: mockProducts.map((p) => ({
            name: p.name,
            tastingNotes: p.tastingNotes,
          })),
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to get recommendation.");
      }

      const result = await response.json();
      setRecommendation(result.text); // Assuming the API returns { text: "..." }
      setStep(3); // Go to results step
    } catch (error) {
      console.error(error);
      alert("Sorry, something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const resetModal = () => {
    setStep(1);
    setTaste("");
    setBrewMethod("");
    setRecommendation("");
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-100 p-4">
      <div className="bg-background rounded-lg shadow-2xl w-full max-w-md p-6 relative">
        <button
          onClick={resetModal}
          className="absolute top-4 right-4 text-text-muted hover:text-text-base"
          aria-label="Close"
        >
          <CloseIcon />
        </button>
        <h2 className="text-2xl font-bold text-text-base mb-4">
          {step === 3 ? "Your Recommendation" : "Find Your Perfect Coffee"}
        </h2>

        {/* Step 1: Taste Preference */}
        {step === 1 && (
          <div className="space-y-4">
            <label
              htmlFor="taste"
              className="block text-sm font-medium text-text-base"
            >
              What flavors do you typically enjoy?
            </label>
            <div className="flex flex-wrap gap-2">
              {[
                "Fruity & Bright",
                "Chocolate & Rich",
                "Nutty & Smooth",
                "Floral & Delicate",
              ].map((t) => (
                <button
                  key={t}
                  onClick={() => setTaste(t)}
                  className={`px-3 py-1 rounded-full border-2 ${
                    taste === t
                      ? "bg-primary text-button-text border-primary"
                      : "border-gray-300 text-text-base hover:border-gray-500"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
            <button
              onClick={() => setStep(2)}
              disabled={!taste}
              className="w-full bg-primary text-button-text py-2 px-4 rounded-lg font-medium hover:bg-primary-hover transition-colors disabled:bg-gray-400 mt-4"
            >
              Next
            </button>
          </div>
        )}

        {/* Step 2: Brew Method */}
        {step === 2 && (
          <div className="space-y-4">
            <label
              htmlFor="brew"
              className="block text-sm font-medium text-text-base"
            >
              How do you brew your coffee?
            </label>
            <div className="flex flex-wrap gap-2">
              {["Pour Over", "French Press", "Espresso", "Drip Machine"].map(
                (b) => (
                  <button
                    key={b}
                    onClick={() => setBrewMethod(b)}
                    className={`px-3 py-1 rounded-full border-2 ${
                      brewMethod === b
                        ? "bg-primary text-button-text border-primary"
                        : "border-gray-300 text-text-base hover:border-gray-500"
                    }`}
                  >
                    {b}
                  </button>
                )
              )}
            </div>
            <div className="flex gap-2 mt-4">
              <button
                onClick={() => setStep(1)}
                className="w-1/2 bg-secondary text-text-base py-2 px-4 rounded-lg font-medium hover:bg-opacity-80 transition-colors"
              >
                Back
              </button>
              <button
                onClick={getRecommendation}
                disabled={!brewMethod || isLoading}
                className="w-1/2 bg-primary text-button-text py-2 px-4 rounded-lg font-medium hover:bg-primary-hover transition-colors disabled:bg-gray-400 flex items-center justify-center"
              >
                {isLoading ? (
                  <svg
                    className="animate-spin h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                ) : (
                  "Get Recommendation"
                )}
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Result */}
        {step === 3 && (
          <div className="space-y-4">
            <p className="text-text-base whitespace-pre-wrap">
              {recommendation || "No recommendation found."}
            </p>
            <button
              onClick={resetModal}
              className="w-full bg-primary text-button-text py-2 px-4 rounded-lg font-medium hover:bg-primary-hover transition-colors mt-4"
            >
              Start Over
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// --- Main App Component ---
// This is the root component that ties everything together.
export default function Home() {
  const [cartItemCount, setCartItemCount] = useState<number>(0);
  const [isAiModalOpen, setIsAiModalOpen] = useState<boolean>(false);

  const handleAddToCart = (productId: number) => {
    // This is a mock implementation.
    // A real app would update state/context.
    console.log(`Added product ${productId} to cart.`);
    setCartItemCount((prevCount) => prevCount + 1);
  };

  // Apply theme class to the root div
  return (
    <div className={`min-h-screen font-sans`}>
      <AppHeader cartItemCount={cartItemCount} />

      {/* Hero Section */}
      <header className="bg-hero-bg text-hero-text dark:bg-black">
        <div className="container mx-auto px-4 md:px-8 py-20 text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-4">
            Discover Your Perfect Roast
          </h1>
          <p className="text-lg md:text-xl text-hero-text opacity-90 mb-8">
            Specialty coffee sourced from the world's finest origins.
          </p>
          <Button
            className="ml-4"
            size="lg"
            onClick={() => setIsAiModalOpen(true)}
          >
            Get an AI Recommendation
          </Button>
        </div>
      </header>

      {/* Product Grid Section */}
      <main className="container mx-auto px-4 md:px-8 py-16">
        <h2 className="text-3xl font-bold text-center text-text-base mb-12">
          Our Small Batch Collection
        </h2>

        {/* This grid is responsive: 1 col on mobile, 2 on tablet, 3 on desktop */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {mockProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onAddToCart={handleAddToCart}
            />
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-800 text-gray-400 py-8">
        <div className="container mx-auto px-4 text-center">
          &copy; {new Date().getFullYear()} Artisan Roast. All rights reserved.
        </div>
      </footer>

      {/* AI Helper Modal (conditionally rendered) */}
      <AiHelperModal
        isOpen={isAiModalOpen}
        onClose={() => setIsAiModalOpen(false)}
      />
    </div>
  );
}
