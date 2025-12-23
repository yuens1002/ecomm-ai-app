"use client";

import { useState, useEffect, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { ProductType, RoastLevel } from "@prisma/client";
import {
  Field,
  FieldContent,
  FieldDescription,
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
import { FormHeading } from "@/components/ui/app/FormHeading";
import { MultiImageUpload } from "@/components/ui/app/MultiImageUpload";
import { ProductCoffeeDetailsSection } from "./ProductCoffeeDetailsSection";
import { ProductCategoriesSection } from "./ProductCategoriesSection";
import { ProductVariantsSection } from "./ProductVariantsSection";
import { ProductAddOnsSection } from "./ProductAddOnsSection";
import { NameSlugField } from "@/components/app-components/NameSlugField";
import { useMultiImageUpload } from "@/hooks/useImageUpload";
import { SaveButton } from "@/components/admin/SaveButton";

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
      roastLevel: undefined as RoastLevel | undefined,
      origin: "",
      variety: "",
      altitude: "",
      tastingNotes: "",
    },
  });

  // Name/Slug handled via NameSlugField; keep form values in sync

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
          p.images?.map((img: { url: string; altText?: string }) => ({
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
      const uploadedImages = await uploadAllImages();

      const url = productId
        ? `/api/admin/products/${productId}`
        : "/api/admin/products";

      const method = productId ? "PUT" : "POST";

      const isCoffee = data.productType === ProductType.COFFEE;
      const cleanImages = uploadedImages.filter((img) => img.url);

      const payload = {
        ...data,
        images: cleanImages.length > 0 ? cleanImages : undefined,
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

      if (!response.ok) {
        let message = "Failed to save product";
        try {
          const err = await response.json();
          if (err?.error) message = err.error;
          if (err?.details) {
            const detailMsg = Array.isArray(err.details)
              ? err.details
                  .map(
                    (d: { path: string; message: string }) =>
                      `${d.path}: ${d.message}`
                  )
                  .join("; ")
              : String(err.details);
            message = `${message} – ${detailMsg}`;
          }
        } catch {
          /* ignore */
        }
        throw new Error(message);
      }

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
        <SaveButton
          onClick={form.handleSubmit(onSubmit)}
          isSaving={form.formState.isSubmitting}
          label={productId ? "Save Product" : "Save & Add Variants"}
          savingLabel="Saving..."
        />
      </CardHeader>

      <CardContent className="pt-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Left Column: Basic Information */}
              <FieldGroup>
                <NameSlugField
                  label="Product Name"
                  name={form.watch("name")}
                  slug={form.watch("slug")}
                  errorMessage={form.formState.errors.name?.message}
                  onChange={({ name, slug }) => {
                    form.setValue("name", name, {
                      shouldDirty: true,
                      shouldValidate: true,
                    });
                    form.setValue("slug", slug, {
                      shouldDirty: true,
                      shouldValidate: true,
                    });
                  }}
                />

                <div className="space-y-4">
                  <FormHeading label="Product Images" />
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
