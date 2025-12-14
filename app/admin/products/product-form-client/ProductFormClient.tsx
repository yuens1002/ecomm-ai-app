"use client";

import { useState, useEffect, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ProductType, RoastLevel } from "@prisma/client";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Form, FormField } from "@/components/ui/form";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Save, Upload } from "lucide-react";
import { FormHeading } from "@/components/ui/app/FormHeading";
import { MultiImageUpload } from "@/components/ui/app/MultiImageUpload";
import { FormCard } from "@/components/ui/app/FormCard";
import { ProductCoffeeDetailsSection } from "./ProductCoffeeDetailsSection";
import { ProductCategoriesSection } from "./ProductCategoriesSection";
import { ProductVariantsSection } from "./ProductVariantsSection";
import { ProductAddOnsSection } from "./ProductAddOnsSection";
import { ROAST_LEVELS } from "@/lib/productEnums";
import { useSlugGenerator } from "@/hooks/useSlugGenerator";
import { useMultiImageUpload } from "@/hooks/useImageUpload";

interface CategoryLabel {
  id: string;
  name: string;
  icon: string | null;
  order: number;
}

interface Category {
  id: string;
  name: string;
  labels: CategoryLabel[];
}

interface ProductFormClientProps {
  productId?: string; // If undefined, it's a new product
  onClose?: () => void;
  onSaved?: (id: string) => void;
  productType?: ProductType;
}

// Base schema with conditional validation based on productType
const formSchema = z
  .object({
    name: z.string().min(1, "Name is required"),
    slug: z.string().min(1, "Slug is required"),
    description: z.string().optional(),
    isOrganic: z.boolean(),
    isFeatured: z.boolean(),
    isDisabled: z.boolean(),
    categoryIds: z.array(z.string()),
    productType: z.nativeEnum(ProductType),
    // Coffee-specific fields
    roastLevel: z.nativeEnum(RoastLevel),
    origin: z.string().optional(),
    variety: z.string().optional(),
    altitude: z.string().optional(),
    tastingNotes: z.string().optional(),
  })
  .refine(
    (data) => {
      // If product type is COFFEE, require roast level
      if (data.productType === ProductType.COFFEE) {
        return !!data.roastLevel;
      }
      return true;
    },
    {
      message: "Roast level is required for coffee products",
      path: ["roastLevel"],
    }
  )
  .refine(
    (data) => {
      // If product type is COFFEE, require origin
      if (data.productType === ProductType.COFFEE) {
        return !!data.origin && data.origin.trim() !== "";
      }
      return true;
    },
    {
      message: "Origin is required for coffee products",
      path: ["origin"],
    }
  );

type ProductFormValues = z.infer<typeof formSchema>;

export default function ProductFormClient({
  productId,
  onClose: _onClose,
  onSaved,
  productType = ProductType.COFFEE,
}: ProductFormClientProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(!!productId);
  const [categories, setCategories] = useState<Category[]>([]);
  const [originalName, setOriginalName] = useState<string>("");

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      slug: "",
      description: "",
      isOrganic: false,
      isFeatured: false,
      isDisabled: false,
      categoryIds: [],
      productType: productType as ProductFormValues["productType"],
      roastLevel: undefined as any,
      origin: "",
      variety: "",
      altitude: "",
      tastingNotes: "",
    },
  });

  // Auto-generate slug from name
  useSlugGenerator({
    sourceField: "name",
    targetField: "slug",
    form,
  });

  // Watch slug value for display
  const slugValue = form.watch("slug");

  // Image upload handler
  const [existingImages, setExistingImages] = useState<
    Array<{ url: string; alt: string }>
  >([]);
  const {
    images: productImages,
    addImage,
    removeImage,
    handleFileSelect,
    uploadAll: uploadAllImages,
    hasChanges: hasImageChanges,
  } = useMultiImageUpload({
    currentImages: existingImages,
    minImages: 0,
    maxImages: 5,
  });

  const fetchCategories = useCallback(async () => {
    try {
      const response = await fetch("/api/admin/categories");
      if (response.ok) {
        const data = await response.json();
        setCategories(data.categories);
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  }, []);

  const fetchProduct = useCallback(
    async (id: string) => {
      try {
        const response = await fetch(`/api/admin/products/${id}`);
        if (!response.ok) throw new Error("Failed to fetch product");
        const data = await response.json();
        const p = data.product;
        setOriginalName(p.name);
        setExistingImages(
          p.images?.map((img: any) => ({
            url: img.url,
            alt: img.altText || "",
          })) || []
        );
        form.reset({
          name: p.name,
          slug: p.slug,
          description: p.description || "",
          isOrganic: p.isOrganic,
          isFeatured: p.isFeatured,
          isDisabled: p.isDisabled ?? false,
          categoryIds: p.categoryIds || [],
          productType: p.type || productType,
          roastLevel: (p.roastLevel as RoastLevel) || "MEDIUM",
          origin: Array.isArray(p.origin) ? p.origin.join(", ") : "",
          variety: p.variety || "",
          altitude: p.altitude || "",
          tastingNotes: Array.isArray(p.tastingNotes)
            ? p.tastingNotes.join(", ")
            : "",
        });
      } catch (error) {
        console.error("Error:", error);
        toast({
          title: "Error",
          description: "Failed to load product",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    },
    [form, toast, productType]
  );

  useEffect(() => {
    fetchCategories();
    if (productId) {
      fetchProduct(productId);
    }
  }, [productId, fetchCategories, fetchProduct]);

  const toList = (value?: string | null) =>
    value
      ? value
          .split(",")
          .map((v) => v.trim())
          .filter(Boolean)
      : [];

  const onSubmit = async (data: ProductFormValues) => {
    try {
      // Upload any pending images first
      let uploadedImages: Array<{ url: string; alt: string }> = [];
      if (hasImageChanges) {
        uploadedImages = await uploadAllImages();
      }

      const url = productId
        ? `/api/admin/products/${productId}`
        : "/api/admin/products";

      const method = productId ? "PUT" : "POST";

      const isCoffee = data.productType === ProductType.COFFEE;
      const payload = {
        ...data,
        images: uploadedImages.length > 0 ? uploadedImages : undefined,
        origin: isCoffee ? toList(data.origin) : [],
        tastingNotes: isCoffee ? toList(data.tastingNotes) : [],
        variety: isCoffee ? data.variety : "",
        altitude: isCoffee ? data.altitude : "",
        roastLevel: isCoffee ? data.roastLevel : null,
        isDisabled: data.isDisabled,
      };

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error("Failed to save product");

      const responseData = await response.json();

      toast({
        title: "Success",
        description: "Product saved successfully",
      });

      if (!productId && responseData.product?.id) {
        if (onSaved) onSaved(responseData.product.id);
      } else {
        if (onSaved && productId) onSaved(productId);
      }
    } catch (error) {
      console.error("Error:", error);
      toast({
        title: "Error",
        description: "Failed to save product",
        variant: "destructive",
      });
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="space-y-1.5">
          <CardTitle className="text-lg font-semibold">
            {productId ? "Edit Product" : "Add a Product"}
          </CardTitle>
          <CardDescription>
            {productId
              ? originalName
              : "Fill out the details for your product and add variants"}
          </CardDescription>
        </div>
        <Button
          onClick={form.handleSubmit(onSubmit)}
          disabled={form.formState.isSubmitting}
        >
          <Save className="mr-2 h-4 w-4" />
          {form.formState.isSubmitting
            ? "Saving..."
            : productId
              ? "Save Product"
              : "Save & Add Variants"}
        </Button>
      </CardHeader>

      <CardContent className="pt-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Left Column: Basic Information */}
              <FieldGroup>
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field, fieldState }) => (
                    <Field>
                      <FormHeading
                        htmlFor="name"
                        label="Product Name"
                        required
                        validationType={fieldState.error ? "error" : undefined}
                        errorMessage={fieldState.error?.message}
                        description="Slug will be auto-generated from the name"
                      />
                      <InputGroup>
                        <InputGroupInput
                          id="name"
                          {...field}
                          placeholder="Name of the coffee"
                        />
                        <InputGroupAddon align="inline-end">
                          <div className="text-xs italic font-mono text-muted-foreground">
                            {slugValue || "slug-preview"}
                          </div>
                        </InputGroupAddon>
                      </InputGroup>
                    </Field>
                  )}
                />

                <div className="space-y-4">
                  <FormHeading
                    label="Product Images"
                    description="Upload up to 5 images. First image will be the primary."
                  />
                  <MultiImageUpload
                    images={productImages}
                    onImageSelect={handleFileSelect}
                    onRemove={removeImage}
                    onAdd={addImage}
                    maxImages={5}
                    columns={4}
                    aspectRatio="square"
                  />
                </div>
              </FieldGroup>

              {/* Right Column: Description & Settings */}
              <FieldGroup>
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field, fieldState }) => (
                    <Field>
                      <FormHeading
                        htmlFor="description"
                        label="Description"
                        validationType={fieldState.error ? "error" : undefined}
                        errorMessage={fieldState.error?.message}
                      />
                      <Textarea
                        id="description"
                        {...field}
                        className="h-32"
                        placeholder="Describe your product..."
                      />
                    </Field>
                  )}
                />

                <div className="space-y-3">
                  <FormField
                    control={form.control}
                    name="isOrganic"
                    render={({ field }) => (
                      <Field
                        orientation="horizontal"
                        className="rounded-md border p-4"
                      >
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                        <FieldContent>
                          <FieldLabel>Organic Certified</FieldLabel>
                          <FieldDescription>
                            This product is certified organic
                          </FieldDescription>
                        </FieldContent>
                      </Field>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="isFeatured"
                    render={({ field }) => (
                      <Field
                        orientation="horizontal"
                        className="rounded-md border p-4"
                      >
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                        <FieldContent>
                          <FieldLabel>Featured</FieldLabel>
                          <FieldDescription>
                            Show this product on the homepage.
                          </FieldDescription>
                        </FieldContent>
                      </Field>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="isDisabled"
                    render={({ field }) => (
                      <Field
                        orientation="horizontal"
                        className="rounded-md border p-4"
                      >
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                        <FieldContent>
                          <FieldLabel>Disabled</FieldLabel>
                          <FieldDescription>
                            Hide product from storefront
                          </FieldDescription>
                        </FieldContent>
                      </Field>
                    )}
                  />
                </div>
              </FieldGroup>
            </div>

            <ProductCoffeeDetailsSection
              control={form.control}
              show={productType === ProductType.COFFEE}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <ProductCategoriesSection
                control={form.control}
                categories={categories}
              />

              <ProductVariantsSection productId={productId} />
            </div>

            <ProductAddOnsSection productId={productId} />
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
