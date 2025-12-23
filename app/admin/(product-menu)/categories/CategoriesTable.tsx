"use client";

import type { MenuCategory, MenuLabel } from "../types/menu";
import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Pencil, Trash2, Plus, TriangleAlert, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Field, FieldContent, FieldGroup } from "@/components/ui/field";
import { FormHeading } from "@/components/ui/app/FormHeading";
import { NameSlugField } from "@/components/app-components/NameSlugField";
import { updateCategorySchema } from "@/app/admin/(product-menu)/types/category";
import { useProductMenuMutations } from "../hooks/useProductMenuMutations";

interface CategoriesTableProps {
  categories: MenuCategory[];
  labels: MenuLabel[];
}

export function CategoriesTable({ categories, labels }: CategoriesTableProps) {
  const { toast } = useToast();
  const mutations = useProductMenuMutations();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<MenuCategory | null>(
    null
  );
  const [categoryForm, setCategoryForm] = useState({
    name: "",
    slug: "",
    labelIds: [] as string[],
    isVisible: true,
  });

  function openCategoryDialog(category?: MenuCategory) {
    if (category) {
      setEditingCategory(category);
      setCategoryForm({
        name: category.name,
        slug: category.slug,
        labelIds: category.labels.map((l) => l.id),
        isVisible: category.isVisible,
      });
    } else {
      setEditingCategory(null);
      setCategoryForm({
        name: "",
        slug: "",
        labelIds: [],
        isVisible: true,
      });
    }
    setIsDialogOpen(true);
  }

  // Name/Slug handled by NameSlugField component

  async function saveCategory(e: React.FormEvent) {
    e.preventDefault();
    const res = editingCategory
      ? await mutations.updateCategory(editingCategory.id, categoryForm)
      : await mutations.createCategory(categoryForm);

    if (!res.ok) {
      toast({
        title: "Error",
        description: res.error || "Failed to save category",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Success",
      description: `Category ${editingCategory ? "updated" : "created"}`,
    });
    setIsDialogOpen(false);
  }

  async function deleteCategory(id: string) {
    const res = await mutations.deleteCategory(id);
    if (!res.ok) {
      toast({
        title: "Error",
        description: res.error || "Failed to delete category",
        variant: "destructive",
      });
      return;
    }
    toast({ title: "Deleted", description: "Category removed" });
  }

  async function toggleCategoryVisibility(
    categoryId: string,
    checked: boolean
  ) {
    const body = { isVisible: checked };

    // Validate with schema
    const validation = updateCategorySchema.safeParse(body);
    if (!validation.success) {
      toast({
        title: "Validation error",
        description: "Invalid visibility settings",
        variant: "destructive",
      });
      return;
    }

    const res = await mutations.updateCategory(categoryId, validation.data);

    if (!res.ok) {
      toast({
        title: "Error",
        description: res.error || "Failed to update visibility",
        variant: "destructive",
      });
    }
  }

  return (
    <div className="space-y-4">
      {categories.length === 0 ? (
        <div className="rounded-md border p-6 text-center space-y-4">
          <div className="flex flex-col items-center gap-2">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Sparkles className="h-4 w-4 text-muted-foreground" />
              Create your first category
            </div>
            <p className="text-sm text-muted-foreground">
              Categories group products for menus and navigation. Add one to
              start attaching products and labels.
            </p>
          </div>
          <div className="flex justify-center">
            <Button
              onClick={() => openCategoryDialog()}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Add Category
            </Button>
          </div>
        </div>
      ) : (
        <>
          <div className="flex justify-end">
            <Button onClick={() => openCategoryDialog()}>
              <Plus className="mr-2 h-4 w-4" /> Add Category
            </Button>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead>Visibility</TableHead>
                <TableHead>Labels</TableHead>
                <TableHead>Products</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {categories.map((category) => (
                <TableRow key={category.id}>
                  <TableCell className="font-medium">{category.name}</TableCell>
                  <TableCell>{category.slug}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Switch
                        aria-label="Toggle category visibility"
                        checked={category.isVisible}
                        onCheckedChange={(checked) =>
                          toggleCategoryVisibility(category.id, checked)
                        }
                      />
                      <span className="text-xs text-muted-foreground">
                        {category.isVisible ? "Visible" : "Hidden"}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-2">
                      {category.labels.map((label) => (
                        <Badge key={label.id} variant="secondary">
                          {label.name}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>{category.productCount || 0}</TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openCategoryDialog(category)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle className="flex items-center gap-2 text-destructive">
                            <TriangleAlert className="h-4 w-4" />
                            Delete category?
                          </AlertDialogTitle>
                          <AlertDialogDescription>
                            Products assigned to this category will stay live
                            but lose the link to it.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            className="bg-destructive hover:bg-destructive/90"
                            onClick={() => deleteCategory(category.id)}
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingCategory ? "Edit Category" : "Add Category"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={saveCategory} className="space-y-6">
            <FieldGroup>
              <NameSlugField
                name={categoryForm.name}
                slug={categoryForm.slug}
                onChange={({ name, slug }) =>
                  setCategoryForm((prev) => ({ ...prev, name, slug }))
                }
              />

              {/* Slug display moved into NameSlugField */}

              <Field>
                <FormHeading label="Category labels" />
                <p className="text-xs text-muted-foreground">
                  Choose labels to group this category in the product menu.
                </p>
                <FieldContent className="space-y-3">
                  {labels.length === 0 ? (
                    <div className="rounded-md p-4 text-sm text-muted-foreground">
                      No labels yet. Add labels in the Labels tab.
                    </div>
                  ) : (
                    <div
                      className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto p-2"
                      aria-label="Existing labels"
                    >
                      {labels.map((label) => (
                        <label
                          key={label.id}
                          className="flex items-center gap-2 text-sm"
                        >
                          <Checkbox
                            checked={categoryForm.labelIds.includes(label.id)}
                            onCheckedChange={(checked) => {
                              setCategoryForm((prev) => {
                                const next = new Set(prev.labelIds);
                                if (checked) next.add(label.id);
                                else next.delete(label.id);
                                return { ...prev, labelIds: Array.from(next) };
                              });
                            }}
                          />
                          <span>{label.name}</span>
                        </label>
                      ))}
                    </div>
                  )}
                </FieldContent>
              </Field>

              <Field>
                <FormHeading label="Visibility" />
                <FieldContent>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="cat-visible"
                      checked={categoryForm.isVisible}
                      onCheckedChange={(checked) => {
                        setCategoryForm((prev) => ({
                          ...prev,
                          isVisible: checked === true,
                        }));
                      }}
                    />
                    <label
                      htmlFor="cat-visible"
                      className="text-sm cursor-pointer"
                    >
                      Visible in navigation
                    </label>
                  </div>
                </FieldContent>
              </Field>
            </FieldGroup>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit">Save</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
