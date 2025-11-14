"use client";

import { useState } from "react";
// --- REMOVED: useEffect and Product type ---
import { AiHelperModalProps } from "@/lib/types"; // Import shared types
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
  DialogDescription,
} from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Loader2, X } from "lucide-react"; // Import icons

// --- AI Helper Modal Component ---
export default function AiHelperModal({ isOpen, onClose }: AiHelperModalProps) {
  const [step, setStep] = useState<number>(1);
  const [taste, setTaste] = useState<string>("");
  const [brewMethod, setBrewMethod] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [recommendation, setRecommendation] = useState<string>("");

  // Reset all state when the modal is closed
  const handleClose = () => {
    onClose();
    // Add a small delay for the close animation to finish
    setTimeout(() => {
      setStep(1);
      setTaste("");
      setBrewMethod("");
      setRecommendation("");
      setIsLoading(false);
    }, 300);
  };

  const getRecommendation = async () => {
    setIsLoading(true);
    setRecommendation("");
    try {
      // --- UPDATED: Simplified fetch call ---
      // We no longer pass the product list.
      const response = await fetch("/api/recommend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          taste,
          brewMethod,
        }),
      });
      if (!response.ok) {
        // Try to parse the error message from the API
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to get recommendation.");
      }

      const result = await response.json();

      if (!result.text) {
        throw new Error("No recommendation text received.");
      }

      setRecommendation(result.text);
      setStep(3); // Move to the result step
    } catch (error) {
      console.error(error);
      // In a real app, show a toast or error message
      alert(
        `Sorry, something went wrong: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    // shadcn/ui Dialog handles the open/close state and animations
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md bg-background">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-text-base">
            {step === 3 ? "Your Recommendation" : "Find Your Perfect Coffee"}
          </DialogTitle>
          <DialogDescription>
            Answer a few quick questions to find the perfect roast for your
            brewing style.
          </DialogDescription>
        </DialogHeader>

        {/* Step 1: Taste */}
        {step === 1 && (
          <div className="space-y-6 py-4">
            <RadioGroup
              onValueChange={setTaste}
              value={taste}
              className="space-y-3"
            >
              <Label className="text-sm font-medium text-text-base">
                What flavors do you typically enjoy?
              </Label>
              {[
                "Fruity & Bright",
                "Chocolate & Rich",
                "Nutty & Smooth",
                "Floral & Delicate",
              ].map((t) => (
                <div key={t} className="flex items-center space-x-2">
                  <RadioGroupItem value={t} id={t} />
                  <Label htmlFor={t} className="font-normal text-text-base">
                    {t}
                  </Label>
                </div>
              ))}
            </RadioGroup>
            <DialogFooter>
              <Button
                onClick={() => setStep(2)}
                disabled={!taste}
                className="w-full"
              >
                Next
              </Button>
            </DialogFooter>
          </div>
        )}

        {/* Step 2: Brew Method */}
        {step === 2 && (
          <div className="space-y-6 py-4">
            <RadioGroup
              onValueChange={setBrewMethod}
              value={brewMethod}
              className="space-y-3"
            >
              <Label className="text-sm font-medium text-text-base">
                How do you brew your coffee?
              </Label>
              {["Pour Over", "French Press", "Espresso", "Drip Machine"].map(
                (b) => (
                  <div key={b} className="flex items-center space-x-2">
                    <RadioGroupItem value={b} id={b} />
                    <Label htmlFor={b} className="font-normal text-text-base">
                      {b}
                    </Label>
                  </div>
                )
              )}
            </RadioGroup>
            <DialogFooter className="flex-col-reverse sm:flex-row sm:justify-between sm:space-x-2">
              <Button
                onClick={() => setStep(1)}
                variant="outline"
                className="w-full sm:w-auto"
              >
                Back
              </Button>
              <Button
                onClick={getRecommendation}
                disabled={!brewMethod || isLoading}
                className="w-full sm:w-auto"
              >
                {isLoading ? (
                  // UPDATED: Removed 'mr-2' so the spinner is centered
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Get Recommendation"
                )}
              </Button>
            </DialogFooter>
          </div>
        )}

        {/* Step 3: Result */}
        {step === 3 && (
          <div className="space-y-4 py-4">
            {/* We use whitespace-pre-wrap to respect newlines from the AI */}
            <p className="text-text-base whitespace-pre-wrap">
              {recommendation}
            </p>
            <DialogFooter>
              <DialogClose asChild>
                <Button onClick={handleClose} className="w-full">
                  Start Over
                </Button>
              </DialogClose>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
