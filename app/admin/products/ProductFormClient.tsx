"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Save } from "lucide-react";

interface Category {
  id: string;
  name: string;
  label: string | null;
}

interface ProductFormClientProps {
  productId?: string; // If undefined, it's a new product
}

export default function ProductFormClient({
  productId,
}: ProductFormClientProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(!!productId);
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);

  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    description: "",
    roastLevel: "MEDIUM",
    isOrganic: false,
    isFeatured: false,
    categoryIds: [] as string[],
  });

  useEffect(() => {
    fetchCategories();
    if (productId) {
      fetchProduct(productId);
    }
  }, [productId]);

  const fetchCategories = async () => {
    try {
      const response = await fetch("/api/admin/categories");
      if (response.ok) {
        const data = await response.json();
        setCategories(data.categories);
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  const fetchProduct = async (id: string) => {
    try {
      const response = await fetch(`/api/admin/products/${id}`);
      if (!response.ok) throw new Error("Failed to fetch product");
      const data = await response.json();
      const p = data.product;
      setFormData({
        name: p.name,
        slug: p.slug,
        description: p.description || "",
        roastLevel: p.roastLevel,
        isOrganic: p.isOrganic,
        isFeatured: p.isFeatured,
        categoryIds: p.categoryIds || [],
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
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData((prev) => ({ ...prev, [name]: checked }));
  };

  const handleCategoryChange = (categoryId: string, checked: boolean) => {
    setFormData((prev) => {
      if (checked) {
        return { ...prev, categoryIds: [...prev.categoryIds, categoryId] };
      } else {
        return {
          ...prev,
          categoryIds: prev.categoryIds.filter((id) => id !== categoryId),
        };
      }
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const url = productId
        ? `/api/admin/products/${productId}`
        : "/api/admin/products/new"; // Need to implement create route

      const method = productId ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error("Failed to save product");

      toast({
        title: "Success",
        description: "Product saved successfully",
      });

      router.push("/admin/products");
      router.refresh();
    } catch (error) {
      console.error("Error:", error);
      toast({
        title: "Error",
        description: "Failed to save product",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
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
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center mb-6">
        <Button variant="ghost" onClick={() => router.back()} className="mr-4">
          <ArrowLeft className="h-4 w-4 mr-2" /> Back
        </Button>
        <h1 className="text-2xl font-bold">
          {productId ? "Edit Product" : "New Product"}
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>

            <div>
              <Label htmlFor="slug">Slug</Label>
              <Input
                id="slug"
                name="slug"
                value={formData.slug}
                onChange={handleChange}
                required
              />
            </div>

            <div>
              <Label htmlFor="roastLevel">Roast Level</Label>
              <Select
                value={formData.roastLevel}
                onValueChange={(value) =>
                  setFormData((prev) => ({ ...prev, roastLevel: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select roast level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="LIGHT">Light</SelectItem>
                  <SelectItem value="MEDIUM">Medium</SelectItem>
                  <SelectItem value="DARK">Dark</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center space-x-4 pt-4">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="isOrganic"
                  name="isOrganic"
                  checked={formData.isOrganic}
                  onChange={handleCheckboxChange}
                  className="h-4 w-4 rounded border-gray-300"
                />
                <Label htmlFor="isOrganic">Organic</Label>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="isFeatured"
                  name="isFeatured"
                  checked={formData.isFeatured}
                  onChange={handleCheckboxChange}
                  className="h-4 w-4 rounded border-gray-300"
                />
                <Label htmlFor="isFeatured">Featured</Label>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                className="h-32"
              />
            </div>

            <div className="border p-4 rounded-md">
              <h3 className="font-medium mb-3">Categories</h3>
              {Object.entries(categoriesByLabel).map(([label, cats]) => (
                <div key={label} className="mb-4 last:mb-0">
                  <h4 className="text-sm font-semibold text-muted-foreground mb-2 uppercase tracking-wider">
                    {label}
                  </h4>
                  <div className="grid grid-cols-2 gap-2">
                    {cats.map((cat) => (
                      <div key={cat.id} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id={`cat-${cat.id}`}
                          checked={formData.categoryIds.includes(cat.id)}
                          onChange={(e) =>
                            handleCategoryChange(cat.id, e.target.checked)
                          }
                          className="h-4 w-4 rounded border-gray-300"
                        />
                        <label
                          htmlFor={`cat-${cat.id}`}
                          className="text-sm cursor-pointer"
                        >
                          {cat.name}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <Button type="submit" disabled={saving}>
            {saving ? "Saving..." : "Save Product"}
            <Save className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </form>
    </div>
  );
}
