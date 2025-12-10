"use client";

import { useState, useEffect, useCallback, useMemo, Fragment } from "react";
import { useRouter } from "next/navigation";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Pencil,
  Trash2,
  Plus,
  GripVertical,
  Check,
  X,
  Sparkles,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DynamicIcon,
  COMMON_PAGE_ICONS,
} from "@/components/app-components/DynamicIcon";

type Category = {
  id: string;
  name: string;
  slug: string;
  order: number;
  labels: Array<{
    id: string;
    name: string;
    icon: string | null;
    order: number;
  }>;
  _count?: {
    products: number;
  };
};

type LabelRow = {
  id: string;
  name: string;
  icon: string | null;
  order: number;
  categories: Array<{ id: string; name: string; slug: string; order: number }>;
};

const ICON_SUGGESTIONS = ["", ...COMMON_PAGE_ICONS];

export default function CategoryManagementClient() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [labels, setLabels] = useState<LabelRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("groups");

  // Category form state
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [categoryForm, setCategoryForm] = useState({
    name: "",
    slug: "",
    labelIds: [] as string[],
  });

  // Label inline edit/add state
  const [editingLabelId, setEditingLabelId] = useState<string | null>(null);
  const [labelDraft, setLabelDraft] = useState({ name: "", icon: "" });
  const [insertingAfterId, setInsertingAfterId] = useState<string | null>(null);

  const { toast } = useToast();
  const router = useRouter();

  const fetchData = useCallback(async () => {
    try {
      const [catRes, labelRes] = await Promise.all([
        fetch("/api/admin/categories"),
        fetch("/api/admin/category-labels"),
      ]);

      if (!catRes.ok || !labelRes.ok) throw new Error("Failed fetch");

      const catData = await catRes.json();
      const labelData = await labelRes.json();

      setCategories(catData.categories || []);
      setLabels(labelData.labels || []);
    } catch {
      toast({
        title: "Error",
        description: "Failed to load categories or labels",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const labelMap = useMemo(
    () => new Map(labels.map((l) => [l.id, l])),
    [labels]
  );

  // Category CRUD
  function openCategoryDialog(category?: Category) {
    if (category) {
      setEditingCategory(category);
      setCategoryForm({
        name: category.name,
        slug: category.slug,
        labelIds: category.labels.map((l) => l.id),
      });
    } else {
      setEditingCategory(null);
      setCategoryForm({ name: "", slug: "", labelIds: [] });
    }
    setIsDialogOpen(true);
  }

  function onCategoryNameChange(e: React.ChangeEvent<HTMLInputElement>) {
    const name = e.target.value;
    setCategoryForm((prev) => ({
      ...prev,
      name,
      slug: editingCategory
        ? prev.slug
        : name.toLowerCase().replace(/\s+/g, "-"),
    }));
  }

  async function saveCategory(e: React.FormEvent) {
    e.preventDefault();
    const url = editingCategory
      ? `/api/admin/categories/${editingCategory.id}`
      : "/api/admin/categories";
    const method = editingCategory ? "PUT" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(categoryForm),
    });

    if (!res.ok) {
      toast({
        title: "Error",
        description: "Failed to save category",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Success",
      description: `Category ${editingCategory ? "updated" : "created"}`,
    });
    setIsDialogOpen(false);
    fetchData();
    router.refresh();
  }

  async function deleteCategory(id: string) {
    if (!confirm("Are you sure you want to delete this category?")) return;
    const res = await fetch(`/api/admin/categories/${id}`, {
      method: "DELETE",
    });
    if (!res.ok) {
      toast({
        title: "Error",
        description: "Failed to delete category",
        variant: "destructive",
      });
      return;
    }
    toast({ title: "Deleted", description: "Category removed" });
    fetchData();
    router.refresh();
  }

  // Label helpers
  function startEditLabel(label: LabelRow) {
    setEditingLabelId(label.id);
    setLabelDraft({ name: label.name, icon: label.icon || "" });
    setInsertingAfterId(null);
  }

  function startInsertAfter(labelId: string) {
    setInsertingAfterId(labelId);
    setEditingLabelId(null);
    setLabelDraft({ name: "", icon: "" });
  }

  function resetLabelDraft() {
    setEditingLabelId(null);
    setInsertingAfterId(null);
    setLabelDraft({ name: "", icon: "" });
  }

  async function saveLabel(labelId?: string, afterId?: string | null) {
    if (!labelDraft.name.trim()) {
      toast({
        title: "Name required",
        description: "Label name cannot be empty",
        variant: "destructive",
      });
      return;
    }

    if (labelId) {
      const res = await fetch(`/api/admin/category-labels/${labelId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: labelDraft.name.trim(),
          icon: labelDraft.icon || null,
        }),
      });
      if (!res.ok) {
        toast({
          title: "Error",
          description: "Failed to update label",
          variant: "destructive",
        });
        return;
      }
    } else {
      const res = await fetch(`/api/admin/category-labels`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: labelDraft.name.trim(),
          icon: labelDraft.icon || null,
          afterLabelId: afterId || null,
        }),
      });
      if (!res.ok) {
        toast({
          title: "Error",
          description: "Failed to create label",
          variant: "destructive",
        });
        return;
      }
    }

    resetLabelDraft();
    fetchData();
  }

  async function deleteLabel(id: string) {
    if (!confirm("Delete this label? Categories will move to Unassigned."))
      return;
    const res = await fetch(`/api/admin/category-labels/${id}`, {
      method: "DELETE",
    });
    if (!res.ok) {
      toast({
        title: "Error",
        description: "Failed to delete label",
        variant: "destructive",
      });
      return;
    }
    fetchData();
  }

  // Reorder labels via HTML drag
  const [dragLabelId, setDragLabelId] = useState<string | null>(null);
  const [dragCategory, setDragCategory] = useState<{
    labelId: string;
    categoryId: string;
  } | null>(null);

  async function handleLabelDrop(targetId: string) {
    if (!dragLabelId || dragLabelId.includes(":")) return; // ignore when dragging category pills
    if (dragLabelId === targetId) return;
    const ordered = reorderList(labels, dragLabelId, targetId);
    setLabels(ordered);
    setDragLabelId(null);
    await fetch(`/api/admin/category-labels/reorder`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ labelIds: ordered.map((l) => l.id) }),
    });
  }

  // Reorder categories within a label
  async function handleCategoryReorder(
    labelId: string,
    dragId: string,
    targetId: string
  ) {
    const label = labelMap.get(labelId);
    if (!label || dragId === targetId) return;
    const updatedCats = reorderList(label.categories, dragId, targetId);
    const nextLabels = labels.map((l) =>
      l.id === labelId ? { ...l, categories: updatedCats } : l
    );
    setLabels(nextLabels);
    await fetch(`/api/admin/category-labels/${labelId}/reorder-categories`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ categoryIds: updatedCats.map((c) => c.id) }),
    });
  }

  async function attachCategory(labelId: string, categoryId: string) {
    await fetch(`/api/admin/category-labels/${labelId}/attach`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ categoryId }),
    });
    fetchData();
  }

  async function detachCategory(labelId: string, categoryId: string) {
    await fetch(`/api/admin/category-labels/${labelId}/detach`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ categoryId }),
    });
    fetchData();
  }

  async function autoSortLabel(labelId: string) {
    await fetch(`/api/admin/category-labels/${labelId}/auto-sort`, {
      method: "POST",
    });
    fetchData();
  }

  if (isLoading) return <div>Loading...</div>;

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="groups">Groups</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
        </TabsList>

        <TabsContent value="groups" className="space-y-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order</TableHead>
                <TableHead>Label</TableHead>
                <TableHead>Icon</TableHead>
                <TableHead>Categories</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {labels.map((label) => (
                <Fragment key={label.id}>
                  <TableRow
                    draggable
                    onDragStart={() => setDragLabelId(label.id)}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={() => handleLabelDrop(label.id)}
                    className="align-top"
                  >
                    <TableCell className="w-10">
                      <GripVertical className="h-4 w-4 text-muted-foreground" />
                    </TableCell>
                    <TableCell className="w-64">
                      {editingLabelId === label.id ? (
                        <div className="flex items-center gap-2">
                          <Input
                            value={labelDraft.name}
                            onChange={(e) =>
                              setLabelDraft({
                                ...labelDraft,
                                name: e.target.value,
                              })
                            }
                            placeholder="Label name"
                            autoFocus
                          />
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => saveLabel(label.id)}
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={resetLabelDraft}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <button
                          className="text-left font-medium hover:underline"
                          onClick={() => startEditLabel(label)}
                        >
                          {label.name}
                        </button>
                      )}
                    </TableCell>
                    <TableCell className="w-48">
                      {editingLabelId === label.id ? (
                        <div className="flex items-center gap-2">
                          <Input
                            list={`icon-suggestions-${label.id}`}
                            value={labelDraft.icon}
                            onChange={(e) =>
                              setLabelDraft({
                                ...labelDraft,
                                icon: e.target.value,
                              })
                            }
                            placeholder="Icon name (optional)"
                          />
                          {labelDraft.icon ? (
                            <DynamicIcon
                              name={labelDraft.icon}
                              className="h-5 w-5"
                            />
                          ) : (
                            <span className="text-xs text-muted-foreground">
                              None
                            </span>
                          )}
                          <datalist id={`icon-suggestions-${label.id}`}>
                            {ICON_SUGGESTIONS.map((icon) => (
                              <option
                                key={`${label.id}-${icon || "none"}`}
                                value={icon}
                              />
                            ))}
                          </datalist>
                        </div>
                      ) : label.icon ? (
                        <DynamicIcon name={label.icon} className="h-5 w-5" />
                      ) : (
                        <span className="text-xs text-muted-foreground">
                          None
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-2">
                        {label.categories.map((cat) => (
                          <div
                            key={cat.id}
                            draggable
                            onDragStart={(e) => {
                              e.stopPropagation();
                              setDragCategory({
                                labelId: label.id,
                                categoryId: cat.id,
                              });
                            }}
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={(e) => {
                              e.preventDefault();
                              if (
                                dragCategory &&
                                dragCategory.labelId === label.id
                              ) {
                                handleCategoryReorder(
                                  label.id,
                                  dragCategory.categoryId,
                                  cat.id
                                );
                              }
                              setDragCategory(null);
                            }}
                            className="inline-flex items-center gap-2 rounded-full bg-secondary px-3 py-1 text-sm"
                          >
                            {cat.name}
                            <button
                              className="text-muted-foreground hover:text-destructive"
                              onClick={(e) => {
                                e.stopPropagation();
                                detachCategory(label.id, cat.id);
                              }}
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                      <div className="mt-2 flex items-center gap-2">
                        <select
                          className="h-9 rounded-md border bg-background px-2 text-sm"
                          value=""
                          onChange={(e) => {
                            if (!e.target.value) return;
                            attachCategory(label.id, e.target.value);
                          }}
                        >
                          <option value="">Add category</option>
                          {categories
                            .filter(
                              (cat) =>
                                !label.categories.some((lc) => lc.id === cat.id)
                            )
                            .map((cat) => (
                              <option
                                key={`${label.id}-${cat.id}`}
                                value={cat.id}
                              >
                                {cat.name}
                              </option>
                            ))}
                        </select>
                      </div>
                    </TableCell>
                    <TableCell className="text-right space-x-2 whitespace-nowrap">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => autoSortLabel(label.id)}
                        className="inline-flex items-center gap-1"
                      >
                        <Sparkles className="h-4 w-4" />
                        Auto
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => startInsertAfter(label.id)}
                      >
                        <Plus className="h-4 w-4 mr-1" /> Add
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => deleteLabel(label.id)}
                        className="text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>

                  {insertingAfterId === label.id && (
                    <TableRow key={`${label.id}-new`}>
                      <TableCell />
                      <TableCell colSpan={4}>
                        <div className="flex items-center gap-3">
                          <Input
                            placeholder="New label name"
                            value={labelDraft.name}
                            onChange={(e) =>
                              setLabelDraft({
                                ...labelDraft,
                                name: e.target.value,
                              })
                            }
                            autoFocus
                          />
                          <Input
                            list={`icon-suggestions-new-${label.id}`}
                            placeholder="Icon name (optional)"
                            value={labelDraft.icon}
                            onChange={(e) =>
                              setLabelDraft({
                                ...labelDraft,
                                icon: e.target.value,
                              })
                            }
                          />
                          {labelDraft.icon ? (
                            <DynamicIcon
                              name={labelDraft.icon}
                              className="h-5 w-5"
                            />
                          ) : (
                            <span className="text-xs text-muted-foreground">
                              None
                            </span>
                          )}
                          <datalist id={`icon-suggestions-new-${label.id}`}>
                            {ICON_SUGGESTIONS.map((icon) => (
                              <option
                                key={`${label.id}-new-${icon || "none"}`}
                                value={icon}
                              />
                            ))}
                          </datalist>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => saveLabel(undefined, label.id)}
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={resetLabelDraft}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </Fragment>
              ))}
            </TableBody>
          </Table>
        </TabsContent>

        <TabsContent value="categories" className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => openCategoryDialog()}>
              <Plus className="mr-2 h-4 w-4" /> Add Category
            </Button>
          </div>
          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Slug</TableHead>
                  <TableHead>Labels</TableHead>
                  <TableHead>Products</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categories.map((category) => (
                  <TableRow key={category.id}>
                    <TableCell className="font-medium">
                      {category.name}
                    </TableCell>
                    <TableCell>{category.slug}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-2">
                        {category.labels.map((label) => (
                          <Badge key={label.id} variant="secondary">
                            {label.name}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>{category._count?.products || 0}</TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openCategoryDialog(category)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive"
                        onClick={() => deleteCategory(category.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingCategory ? "Edit Category" : "Add Category"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={saveCategory} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={categoryForm.name}
                onChange={onCategoryNameChange}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="slug">Slug</Label>
              <Input
                id="slug"
                value={categoryForm.slug}
                onChange={(e) =>
                  setCategoryForm({ ...categoryForm, slug: e.target.value })
                }
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Labels</Label>
              <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto p-2 border rounded-md">
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
                    {label.icon ? (
                      <DynamicIcon name={label.icon} className="h-4 w-4" />
                    ) : null}
                    <span>{label.name}</span>
                  </label>
                ))}
              </div>
            </div>
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

// Utility: reorder array moving dragId before targetId
function reorderList<T extends { id: string }>(
  list: T[],
  dragId: string,
  targetId: string
): T[] {
  const copy = [...list];
  const from = copy.findIndex((i) => i.id === dragId);
  const to = copy.findIndex((i) => i.id === targetId);
  if (from === -1 || to === -1) return list;
  const [item] = copy.splice(from, 1);
  copy.splice(to, 0, item);
  return copy.map((item, idx) => ({ ...item, order: idx }) as T);
}
