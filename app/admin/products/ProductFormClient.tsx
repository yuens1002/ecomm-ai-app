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
import ProductVariantsClient from "./ProductVariantsClient";
import { PRODUCT_TYPES, ROAST_LEVELS } from "@/lib/productEnums";

interface Category {
  id: string;
  name: string;
  label: string | null;
}

interface ProductFormClientProps {
  productId?: string; // If undefined, it's a new product
  onClose?: () => void;
  onSaved?: (id: string) => void;
  productType?: ProductType;
}

const formSchema = z.object({
  name: z.string().min(1, "Name is required"),
  slug: z.string().min(1, "Slug is required"),
  description: z.string().optional(),
  imageUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  weight: z.union([
    z.coerce.number().int().positive("Weight must be greater than zero"),
    z.literal("").transform(() => undefined as unknown as number),
    z.undefined(),
  ]),
  isOrganic: z.boolean().default(false),
  isFeatured: z.boolean().default(false),
  categoryIds: z.array(z.string()).default([]),
  productType: z.enum(PRODUCT_TYPES).default(PRODUCT_TYPES[0]),
  roastLevel: z.enum(ROAST_LEVELS).default("MEDIUM"),
  origin: z.string().optional(),
  variety: z.string().optional(),
  altitude: z.string().optional(),
  tastingNotes: z.string().optional(),
});

type ProductFormValues = z.infer<typeof formSchema>;

export default function ProductFormClient({
  productId,
  onSaved,
  productType = ProductType.COFFEE,
}: ProductFormClientProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(!!productId);
  const [categories, setCategories] = useState<Category[]>([]);
  const [originalName, setOriginalName] = useState<string>("");

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      slug: "",
      description: "",
      imageUrl: "",
      weight: undefined,
      isOrganic: false,
      isFeatured: false,
      categoryIds: [],
      productType,
      roastLevel: "MEDIUM",
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
          weight: p.weight ?? undefined,
          isOrganic: p.isOrganic,
          isFeatured: p.isFeatured,
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
        weight: isCoffee ? (data.weight ?? undefined) : data.weight,
        origin: isCoffee ? toList(data.origin) : [],
        tastingNotes: isCoffee ? toList(data.tastingNotes) : [],
        variety: isCoffee ? data.variety : "",
        altitude: isCoffee ? data.altitude : "",
        roastLevel: isCoffee ? data.roastLevel : null,
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

  // Group categories by label
  const categoriesByLabel = categories.reduce(
    (acc, cat) => {
      const label = cat.label || "Uncategorized";
      if (!acc[label]) acc[label] = [];
      acc[label].push(cat);
      return acc;
    },
    {} as Record<string, Category[]>
  );

  if (loading) return <div>Loading...</div>;

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="space-y-1.5">
          <CardTitle>{productId ? "Edit Product" : "New Product"}</CardTitle>
          <CardDescription>
            {productId ? originalName : "Create a new product"}
            <div className="text-xs text-muted-foreground">
              Fill out the details for your product and add variants.
              <br />
              Tip: keep weight units consistent across your catalog; shipping
              estimates rely on the weight values you enter.
            </div>
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

      <CardContent className="pt-3">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Left Column: Base Info */}
              <FieldGroup>
                <div className="text-xs font-semibold uppercase text-muted-foreground">
                  {productType === ProductType.COFFEE ? "Coffee" : "Merch"}{" "}
                  Product
                </div>
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field, fieldState }) => (
                    <Field>
                      <FieldLabel>Name</FieldLabel>
                      <Input {...field} />
                      <FieldError errors={[fieldState.error]} />
                    </Field>
                  )}
                />

                <FormField
                  control={form.control}
                  name="slug"
                  render={({ field, fieldState }) => (
                    <Field>
                      <FieldLabel>Slug</FieldLabel>
                      <Input {...field} readOnly className="bg-muted" />
                      <FieldError errors={[fieldState.error]} />
                    </Field>
                  )}
                />

                <FormField
                  control={form.control}
                  name="imageUrl"
                  render={({ field, fieldState }) => (
                    <Field>
                      <FieldLabel>Image URL</FieldLabel>
                      <Input {...field} placeholder="https://..." />
                      <FieldError errors={[fieldState.error]} />
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

              {/* Right Column: Details */}
              <FieldGroup>
                <FormField
                  control={form.control}
                  name="weight"
                  render={({ field, fieldState }) => (
                    <Field>
                      <FieldLabel>Shipping weight (grams)</FieldLabel>
                      <Input
                        type="number"
                        min={1}
                        step={1}
                        value={
                          typeof field.value === "number" ||
                          typeof field.value === "string"
                            ? field.value
                            : ""
                        }
                        onChange={(e) =>
                          field.onChange(
                            e.target.value === "" ? "" : Number(e.target.value)
                          )
                        }
                        onBlur={field.onBlur}
                        name={field.name}
                        ref={field.ref}
                      />
                      <FieldError errors={[fieldState.error]} />
                    </Field>
                  )}
                />

                {productType === ProductType.COFFEE && (
                  <FormField
                    control={form.control}
                    name="roastLevel"
                    render={({ field, fieldState }) => (
                      <Field>
                        <FieldLabel>Roast Level</FieldLabel>
                        <Select
                          value={field.value}
                          onValueChange={(val) => field.onChange(val)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {ROAST_LEVELS.map((level) => (
                              <SelectItem key={level} value={level}>
                                {level.replace("_", " ")}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FieldError errors={[fieldState.error]} />
                      </Field>
                    )}
                  />
                )}

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field, fieldState }) => (
                    <Field>
                      <FieldLabel>Description</FieldLabel>
                      <Textarea {...field} className="h-32" />
                      <FieldError errors={[fieldState.error]} />
                    </Field>
                  )}
                />

                <FieldGroup>
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
                          <FieldLabel>Organic</FieldLabel>
                          <FieldDescription>
                            This product is organic certified.
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
                </FieldGroup>

                {productType === ProductType.COFFEE && (
                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="origin"
                      render={({ field, fieldState }) => (
                        <Field>
                          <FieldLabel>Origin(s)</FieldLabel>
                          <Input
                            {...field}
                            placeholder="e.g., Colombia, Ethiopia"
                          />
                          <FieldDescription>
                            Comma-separated list used for coffee origin chips.
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
                          <Input {...field} placeholder="e.g., Bourbon" />
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
                          <FieldError errors={[fieldState.error]} />
                        </Field>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="tastingNotes"
                      render={({ field, fieldState }) => (
                        <Field>
                          <FieldLabel>Tasting Notes</FieldLabel>
                          <Input
                            {...field}
                            placeholder="e.g., Chocolate, Caramel"
                          />
                          <FieldDescription>
                            Comma-separated list for notes shown on product
                            pages.
                          </FieldDescription>
                          <FieldError errors={[fieldState.error]} />
                        </Field>
                      )}
                    />
                  </div>
                )}
              </FieldGroup>
            </div>

            {/* Bottom Section: Categories & Variants */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Categories */}
              <div className="border p-4 rounded-md h-full">
                <h3 className="font-medium mb-6">Categories</h3>
                <FormField
                  control={form.control}
                  name="categoryIds"
                  render={({ fieldState }) => (
                    <Field>
                      {Object.entries(categoriesByLabel).map(
                        ([label, cats], index) => (
                          <div key={label}>
                            {index > 0 && <Separator className="my-6" />}
                            <h4 className="text-sm font-medium mb-3">
                              {label}
                            </h4>
                            <div className="flex flex-row flex-wrap gap-4">
                              {cats.map((cat) => (
                                <FormField
                                  key={cat.id}
                                  control={form.control}
                                  name="categoryIds"
                                  render={({ field }) => {
                                    return (
                                      <Field
                                        key={cat.id}
                                        orientation="horizontal"
                                        className="w-auto"
                                      >
                                        <Checkbox
                                          checked={field.value?.includes(
                                            cat.id
                                          )}
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
                                    );
                                  }}
                                />
                              ))}
                            </div>
                          </div>
                        )
                      )}
                      <FieldError errors={[fieldState.error]} />
                    </Field>
                  )}
                />
              </div>

              {/* Variants */}
              <div className="border p-4 rounded-md h-full">
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
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
