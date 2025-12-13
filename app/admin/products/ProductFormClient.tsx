"use client";

import { useState, useEffect, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
import { Save } from "lucide-react";
import { FormHeading } from "@/components/ui/app/FormHeading";
import ProductVariantsClient from "./ProductVariantsClient";
import ProductAddOnsClient from "./ProductAddOnsClient";
import { ROAST_LEVELS } from "@/lib/productEnums";

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
    imageUrl: z
      .string()
      .url("Must be a valid URL")
      .optional()
      .or(z.literal("")),
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
      // If product type is COFFEE, require roast level and origin
      if (data.productType === ProductType.COFFEE) {
        return !!data.roastLevel && !!data.origin && data.origin.trim() !== "";
      }
      return true;
    },
    {
      message: "Roast level and origin are required for coffee products",
      path: ["roastLevel"],
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
      imageUrl: "",
      isOrganic: false,
      isFeatured: false,
      isDisabled: false,
      categoryIds: [],
      productType: productType as ProductFormValues["productType"],
      roastLevel: "MEDIUM" as const,
      origin: "",
      variety: "",
      altitude: "",
      tastingNotes: "",
    },
  });

  // Watch for name changes to auto-generate slug
  const name = form.watch("name");

  useEffect(() => {
    // Only auto-generate slug if the name field has been modified by the user
    if (form.formState.dirtyFields.name) {
      const slug = name
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .trim()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/[\s_-]+/g, "-")
        .replace(/^-+|-+$/g, "");

      form.setValue("slug", slug, { shouldValidate: true });
    }
  }, [name, form.formState.dirtyFields.name, form]);

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
        form.reset({
          name: p.name,
          slug: p.slug,
          description: p.description || "",
          imageUrl: p.images?.[0]?.url || "",
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
      const url = productId
        ? `/api/admin/products/${productId}`
        : "/api/admin/products";

      const method = productId ? "PUT" : "POST";

      const isCoffee = data.productType === ProductType.COFFEE;
      const payload = {
        ...data,
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

  // Group categories by their labels (many-to-many relationship)
  // Deduplicate: show each category only once under its first (lowest order) label
  type LabelGroup = {
    labelName: string;
    labelOrder: number;
    categories: { category: Category; order: number }[];
  };

  const labelGroups = new Map<string, LabelGroup>();
  const unlabeledCategories: Category[] = [];
  const displayedCategoryIds = new Set<string>();

  categories.forEach((cat) => {
    if (cat.labels.length === 0) {
      unlabeledCategories.push(cat);
    } else {
      cat.labels.forEach((labelEntry) => {
        const labelId = labelEntry.id;
        if (!labelGroups.has(labelId)) {
          labelGroups.set(labelId, {
            labelName: labelEntry.name,
            labelOrder: labelEntry.order,
            categories: [],
          });
        }
        labelGroups.get(labelId)!.categories.push({
          category: cat,
          order: labelEntry.order,
        });
      });
    }
  });

  // Sort label groups by label order
  const sortedLabelGroups = Array.from(labelGroups.values())
    .sort((a, b) => a.labelOrder - b.labelOrder)
    .map((group) => {
      // Deduplicate categories within this label group first
      const seenIds = new Set<string>();
      const uniqueCategories = group.categories.filter(({ category }) => {
        if (seenIds.has(category.id)) return false;
        seenIds.add(category.id);
        return true;
      });

      // Sort by order within the label
      uniqueCategories.sort((a, b) => a.order - b.order);

      return { ...group, categories: uniqueCategories };
    })
    .map((group) => {
      // Deduplicate across labels: filter out categories already shown in earlier labels
      const filteredCategories = group.categories.filter(({ category }) => {
        if (displayedCategoryIds.has(category.id)) return false;
        displayedCategoryIds.add(category.id);
        return true;
      });

      return { ...group, categories: filteredCategories };
    })
    .filter((group) => group.categories.length > 0); // Remove empty label groups

  if (loading) return <div>Loading...</div>;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="space-y-1.5">
          <CardTitle>{productId ? "Edit Product" : "Add a Product"}</CardTitle>
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
                <div className="mb-4 pb-2 border-b">
                  <h3 className="text-lg font-semibold">Basic Information</h3>
                  <p className="text-sm text-muted-foreground">
                    Core product details and identification
                  </p>
                </div>
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field, fieldState }) => (
                    <Field>
                      <FormHeading
                        htmlFor="name"
                        label="Name"
                        required
                        validationType={fieldState.error ? "error" : undefined}
                        errorMessage={fieldState.error?.message}
                      />
                      <Input id="name" {...field} />
                    </Field>
                  )}
                />

                <FormField
                  control={form.control}
                  name="slug"
                  render={({ field, fieldState }) => (
                    <Field>
                      <FormHeading
                        htmlFor="slug"
                        label="Slug"
                        required
                        validationType={fieldState.error ? "error" : undefined}
                        errorMessage={fieldState.error?.message}
                      />
                      <Input
                        id="slug"
                        {...field}
                        readOnly
                        className="bg-muted"
                      />
                    </Field>
                  )}
                />

                <FormField
                  control={form.control}
                  name="imageUrl"
                  render={({ field, fieldState }) => (
                    <Field>
                      <FormHeading
                        htmlFor="imageUrl"
                        label="Image URL"
                        validationType={fieldState.error ? "error" : undefined}
                        errorMessage={fieldState.error?.message}
                      />
                      <Input id="imageUrl" {...field} placeholder="https://..." />
                    </Field>
                  )}
                />
                {form.watch("imageUrl") && (
                  <div className="mt-2 relative w-full h-40 rounded-md overflow-hidden border bg-muted">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={form.watch("imageUrl")}
                      alt="Preview"
                      className="object-cover w-full h-full"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = "none";
                      }}
                      onLoad={(e) => {
                        (e.target as HTMLImageElement).style.display = "block";
                      }}
                    />
                  </div>
                )}
              </FieldGroup>

              {/* Right Column: Description & Settings */}
              <FieldGroup>
                <div className="mb-4 pb-2 border-b">
                  <h3 className="text-lg font-semibold">
                    Description & Settings
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Product details and configuration options
                  </p>
                </div>

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

            {/* Coffee-Specific Section */}
            {productType === ProductType.COFFEE && (
              <div className="border rounded-lg p-6 bg-muted/30">
                <div className="mb-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    ☕ Coffee Details
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Coffee-specific attributes and characteristics
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="roastLevel"
                    render={({ field, fieldState }) => (
                      <Field>
                        <FieldLabel>Roast Level *</FieldLabel>
                        <Select
                          value={field.value}
                          onValueChange={(val) => field.onChange(val)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select roast level" />
                          </SelectTrigger>
                          <SelectContent>
                            {ROAST_LEVELS.map((level) => (
                              <SelectItem key={level} value={level}>
                                {level.charAt(0) + level.slice(1).toLowerCase()}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FieldError errors={[fieldState.error]} />
                      </Field>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="origin"
                    render={({ field, fieldState }) => (
                      <Field>
                        <FieldLabel>Origin(s) *</FieldLabel>
                        <Input
                          {...field}
                          placeholder="e.g., Colombia, Ethiopia"
                        />
                        <FieldDescription>
                          Comma-separated list (e.g., Colombia, Ethiopia)
                        </FieldDescription>
                        <FieldError errors={[fieldState.error]} />
                      </Field>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="variety"
                    render={({ field, fieldState }) => (
                      <Field>
                        <FieldLabel>Variety</FieldLabel>
                        <Input {...field} placeholder="e.g., Bourbon, Typica" />
                        <FieldDescription>
                          Coffee cultivar or variety
                        </FieldDescription>
                        <FieldError errors={[fieldState.error]} />
                      </Field>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="altitude"
                    render={({ field, fieldState }) => (
                      <Field>
                        <FieldLabel>Altitude</FieldLabel>
                        <Input {...field} placeholder="e.g., 1800m" />
                        <FieldDescription>Growing altitude</FieldDescription>
                        <FieldError errors={[fieldState.error]} />
                      </Field>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="tastingNotes"
                    render={({ field, fieldState }) => (
                      <Field className="md:col-span-2">
                        <FieldLabel>Tasting Notes</FieldLabel>
                        <Input
                          {...field}
                          placeholder="e.g., Chocolate, Caramel, Citrus"
                        />
                        <FieldDescription>
                          Comma-separated flavor notes displayed on product page
                        </FieldDescription>
                        <FieldError errors={[fieldState.error]} />
                      </Field>
                    )}
                  />
                </div>
              </div>
            )}

            {/* Bottom Section: Categories & Variants */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Categories */}
              <div className="border p-4 rounded-md">
                <FormHeading label="Categories" />
                <FormField
                  control={form.control}
                  name="categoryIds"
                  render={({ fieldState }) => (
                    <Field className="mt-4">
                      {sortedLabelGroups.map((group, groupIndex) => (
                        <div key={group.labelName}>
                          {groupIndex > 0 && <Separator className="my-4" />}
                          <h4 className="text-sm font-medium mb-3">
                            {group.labelName}
                          </h4>
                          <ul className="flex flex-row flex-wrap gap-4 list-none">
                            {group.categories.map(({ category: cat }) => (
                              <li key={cat.id} className="inline-block">
                                <FormField
                                  control={form.control}
                                  name="categoryIds"
                                  render={({ field }) => (
                                    <Field
                                      orientation="horizontal"
                                      className="w-auto"
                                    >
                                      <Checkbox
                                        checked={field.value?.includes(cat.id)}
                                        onCheckedChange={(checked) => {
                                          return checked
                                            ? field.onChange([
                                                ...(field.value || []),
                                                cat.id,
                                              ])
                                            : field.onChange(
                                                (field.value || []).filter(
                                                  (value) => value !== cat.id
                                                )
                                              );
                                        }}
                                      />
                                      <FieldLabel className="font-normal cursor-pointer">
                                        {cat.name}
                                      </FieldLabel>
                                    </Field>
                                  )}
                                />
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                      {unlabeledCategories.length > 0 && (
                        <div>
                          {sortedLabelGroups.length > 0 && (
                            <Separator className="my-4" />
                          )}
                          <h4 className="text-sm font-medium mb-3">
                            Unlabeled*
                          </h4>
                          <ul className="flex flex-row flex-wrap gap-4 list-none">
                            {unlabeledCategories.map((cat) => (
                              <li key={cat.id} className="inline-block">
                                <FormField
                                  control={form.control}
                                  name="categoryIds"
                                  render={({ field }) => (
                                    <Field
                                      orientation="horizontal"
                                      className="w-auto"
                                    >
                                      <Checkbox
                                        checked={field.value?.includes(cat.id)}
                                        onCheckedChange={(checked) => {
                                          return checked
                                            ? field.onChange([
                                                ...(field.value || []),
                                                cat.id,
                                              ])
                                            : field.onChange(
                                                (field.value || []).filter(
                                                  (value) => value !== cat.id
                                                )
                                              );
                                        }}
                                      />
                                      <FieldLabel className="font-normal cursor-pointer">
                                        {cat.name}
                                      </FieldLabel>
                                    </Field>
                                  )}
                                />
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {fieldState.error && (
                        <FieldError errors={[fieldState.error]} />
                      )}
                    </Field>
                  )}
                />
              </div>

              {/* Variants */}
              <div className="border p-4 rounded-md">
                {productId ? (
                  <ProductVariantsClient productId={productId} />
                ) : (
                  <>
                    <h3 className="font-medium mb-3">Variants & Pricing</h3>
                    <div className="flex h-40 items-center justify-center text-muted-foreground text-sm border border-dashed rounded-md">
                      Save product to add variants.
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Product Add-Ons Section */}
            {productId && (
              <div className="mt-6">
                <ProductAddOnsClient productId={productId} />
              </div>
            )}
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
