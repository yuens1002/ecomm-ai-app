"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Sparkles,
  Loader2,
  Upload,
  X,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";

interface WizardAnswers {
  businessName: string;
  foundingStory: string;
  heroImageUrl?: string;
  heroImageDescription?: string;
  uniqueApproach: string;
  coffeeSourcing: string;
  roastingPhilosophy: string;
  targetAudience: string;
  brandPersonality: string;
  keyValues: string;
  communityRole: string;
  futureVision: string;
}

const questions = [
  {
    id: "businessName",
    title: "What's your business name?",
    subtitle: "This will be used throughout your About page",
    type: "text",
    placeholder: "Artisan Roast Coffee",
  },
  {
    id: "foundingStory",
    title: "How did your coffee journey begin?",
    subtitle:
      "Share the origin story - what inspired you to start roasting coffee?",
    type: "textarea",
    placeholder:
      "I started roasting in my garage in 2015, experimenting with beans from local importers...",
  },
  {
    id: "heroImageUrl",
    title: "Add a hero image to your story (Optional)",
    subtitle:
      "Upload an image that represents your roastery - could be your space, your roaster, or you at origin",
    type: "file",
    placeholder: "",
    optional: true,
  },
  {
    id: "uniqueApproach",
    title: "What makes your approach unique?",
    subtitle: "What sets you apart from other roasters?",
    type: "textarea",
    placeholder:
      "We focus on single-origin beans and develop custom roast profiles for each...",
  },
  {
    id: "coffeeSourcing",
    title: "How do you source your coffee?",
    subtitle: "Describe your relationships with farmers and importers",
    type: "textarea",
    placeholder:
      "We work directly with farmers in Ethiopia, Colombia, and Guatemala...",
  },
  {
    id: "roastingPhilosophy",
    title: "What's your roasting philosophy?",
    subtitle: "Light, medium, dark? What guides your roasting decisions?",
    type: "select",
    options: [
      "Light roasts to highlight origin characteristics",
      "Medium roasts for balanced flavor",
      "Dark roasts for bold intensity",
      "Variable by origin - we adapt to each bean",
    ],
  },
  {
    id: "targetAudience",
    title: "Who do you roast for?",
    subtitle: "Describe your ideal customer",
    type: "textarea",
    placeholder:
      "Coffee enthusiasts who appreciate quality and want to explore different origins...",
  },
  {
    id: "brandPersonality",
    title: "How would you describe your brand?",
    subtitle: "Choose the tone that best fits your business",
    type: "radio",
    options: [
      { value: "professional", label: "Professional & Expert" },
      { value: "friendly", label: "Friendly & Approachable" },
      { value: "passionate", label: "Passionate & Artisanal" },
      { value: "educational", label: "Educational & Informative" },
    ],
  },
  {
    id: "keyValues",
    title: "What are your core values?",
    subtitle:
      "What principles guide your business? (e.g., sustainability, quality, community)",
    type: "textarea",
    placeholder: "Sustainability, direct trade, quality craftsmanship...",
  },
  {
    id: "communityRole",
    title: "What role do you play in your community?",
    subtitle: "How do you engage with customers and local community?",
    type: "textarea",
    placeholder:
      "We host cupping events, teach brewing workshops, and support local artists...",
  },
  {
    id: "futureVision",
    title: "Where do you see your roastery in 5 years?",
    subtitle: "Share your aspirations and goals",
    type: "textarea",
    placeholder:
      "Expanding our direct trade relationships and opening a public tasting room...",
  },
];

interface AIWizardClientProps {
  initialBusinessName: string;
}

export default function AIWizardClient({
  initialBusinessName,
}: AIWizardClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [answers, setAnswers] = useState<WizardAnswers>({
    businessName: initialBusinessName,
    foundingStory: "",
    heroImageUrl: "",
    uniqueApproach: "",
    coffeeSourcing: "",
    roastingPhilosophy: "",
    targetAudience: "",
    brandPersonality: "",
    keyValues: "",
    communityRole: "",
    futureVision: "",
  });

  // Load answers from URL params if coming from "Start Over"
  useEffect(() => {
    const answersParam = searchParams.get("answers");
    if (answersParam) {
      try {
        const parsed = JSON.parse(answersParam);
        setAnswers(parsed);
      } catch (error) {
        console.error("Failed to parse answers:", error);
      }
    }
  }, [searchParams]);

  const currentQuestion = questions[currentStep];
  const progress = ((currentStep + 1) / questions.length) * 100;

  const handleNext = () => {
    const currentAnswer = answers[currentQuestion.id as keyof WizardAnswers];
    const isOptional = (currentQuestion as any).optional;

    if (!isOptional && (!currentAnswer || currentAnswer.trim() === "")) {
      toast({
        title: "Answer required",
        description: "Please answer this question before continuing.",
        variant: "destructive",
      });
      return;
    }

    if (currentStep < questions.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleGenerate();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleGenerate = async () => {
    setIsGenerating(true);

    try {
      const response = await fetch("/api/admin/pages/generate-about", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to generate content");
      }

      const data = await response.json();

      // Navigate to variation selector with answers for Start Over functionality
      router.push(
        `/admin/pages/new/wizard/select?variations=${encodeURIComponent(JSON.stringify(data.variations))}&answers=${encodeURIComponent(JSON.stringify(answers))}`
      );
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Failed to generate About page",
        variant: "destructive",
      });
      setIsGenerating(false);
    }
  };

  const updateAnswer = (value: string) => {
    setAnswers((prev) => ({
      ...prev,
      [currentQuestion.id]: value,
    }));
  };

  const handleFileUpload = async (file: File) => {
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/admin/upload-hero-image", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to upload image");
      }

      const { url } = await response.json();
      updateAnswer(url);

      toast({
        title: "Success",
        description: "Image uploaded successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to upload image",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveImage = () => {
    updateAnswer("");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <h1 className="text-3xl font-bold">AI About Page Wizard</h1>
          </div>
          <p className="text-muted-foreground">
            Answer 10 questions to generate your About page
          </p>
        </div>
      </div>

      {/* Progress */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            Question {currentStep + 1} of {questions.length}
          </span>
          <span className="font-medium">{Math.round(progress)}% Complete</span>
        </div>
        <Progress value={progress} />
      </div>

      {/* Question Card */}
      <div className="rounded-lg border border-border bg-card p-8">
        <div className="mb-6 space-y-2">
          <h2 className="text-2xl font-bold">{currentQuestion.title}</h2>
          <p className="text-muted-foreground">{currentQuestion.subtitle}</p>
        </div>

        {/* Question Input */}
        <div className="space-y-4">
          {currentQuestion.type === "text" && (
            <Input
              value={answers[currentQuestion.id as keyof WizardAnswers]}
              onChange={(e) => updateAnswer(e.target.value)}
              placeholder={currentQuestion.placeholder}
              className="text-lg"
            />
          )}

          {currentQuestion.type === "textarea" && (
            <Textarea
              value={answers[currentQuestion.id as keyof WizardAnswers]}
              onChange={(e) => updateAnswer(e.target.value)}
              placeholder={currentQuestion.placeholder}
              rows={6}
              className="text-base"
            />
          )}

          {currentQuestion.type === "select" && currentQuestion.options && (
            <Select
              value={answers[currentQuestion.id as keyof WizardAnswers]}
              onValueChange={updateAnswer}
            >
              <SelectTrigger className="text-lg">
                <SelectValue placeholder="Choose an option..." />
              </SelectTrigger>
              <SelectContent>
                {(currentQuestion.options as string[]).map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {currentQuestion.type === "radio" && currentQuestion.options && (
            <RadioGroup
              value={answers[currentQuestion.id as keyof WizardAnswers]}
              onValueChange={updateAnswer}
            >
              {(
                currentQuestion.options as Array<{
                  value: string;
                  label: string;
                }>
              ).map((option) => (
                <div
                  key={option.value}
                  className="flex items-center space-x-3 rounded-lg border border-border p-4 hover:bg-muted/50"
                >
                  <RadioGroupItem value={option.value} id={option.value} />
                  <Label
                    htmlFor={option.value}
                    className="flex-1 cursor-pointer text-base"
                  >
                    {option.label}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          )}

          {currentQuestion.type === "file" && (
            <div className="space-y-4">
              {!answers[currentQuestion.id as keyof WizardAnswers] ? (
                <div className="flex items-center justify-center w-full">
                  <label
                    htmlFor="hero-image-upload"
                    className="flex flex-col items-center justify-center w-full aspect-video border-2 border-border border-dashed rounded-lg cursor-pointer bg-muted/10 hover:bg-muted/20 transition-colors"
                  >
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      {isUploading ? (
                        <>
                          <Loader2 className="w-12 h-12 mb-4 text-muted-foreground animate-spin" />
                          <p className="mb-2 text-sm text-muted-foreground">
                            <span className="font-semibold">Uploading...</span>
                          </p>
                        </>
                      ) : (
                        <>
                          <Upload className="w-12 h-12 mb-4 text-muted-foreground" />
                          <p className="mb-2 text-sm text-muted-foreground">
                            <span className="font-semibold">
                              Click to upload
                            </span>{" "}
                            or drag and drop
                          </p>
                          <p className="text-xs text-muted-foreground">
                            PNG, JPG, WebP or GIF (MAX. 5MB)
                          </p>
                        </>
                      )}
                    </div>
                    <input
                      id="hero-image-upload"
                      type="file"
                      className="hidden"
                      accept="image/png,image/jpeg,image/jpg,image/gif,image/webp"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          handleFileUpload(file);
                        }
                      }}
                      disabled={isUploading}
                    />
                  </label>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="relative w-full aspect-video rounded-lg overflow-hidden border border-border">
                    <Image
                      src={
                        answers[
                          currentQuestion.id as keyof WizardAnswers
                        ] as string
                      }
                      alt="Hero image preview"
                      fill
                      className="object-cover"
                    />
                    <Button
                      variant="destructive"
                      size="sm"
                      className="absolute top-2 right-2"
                      onClick={handleRemoveImage}
                    >
                      <X className="h-4 w-4 mr-1" />
                      Remove
                    </Button>
                  </div>

                  {/* Image Description */}
                  <div>
                    <Label htmlFor="heroImageDescription">
                      Image Description (Optional)
                    </Label>
                    <Textarea
                      id="heroImageDescription"
                      value={answers.heroImageDescription || ""}
                      onChange={(e) => {
                        setAnswers({
                          ...answers,
                          heroImageDescription: e.target.value,
                        });
                      }}
                      placeholder="Describe this image... (e.g., Our roasting facility in Portland, Oregon)"
                      rows={2}
                      className="mt-2"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      This will appear as a caption on your hero image
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={handleBack}
          disabled={currentStep === 0 || isGenerating}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>

        <Button onClick={handleNext} disabled={isGenerating}>
          {isGenerating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating with AI...
            </>
          ) : currentStep === questions.length - 1 ? (
            <>
              <Sparkles className="mr-2 h-4 w-4" />
              Generate About Page
            </>
          ) : (
            <>
              Next
              <ArrowRight className="ml-2 h-4 w-4" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
