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
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Pencil,
  Trash2,
  Plus,
  Eye,
  Layers,
  ArrowDownUp,
  GripVertical,
  Check,
  X,
  Sparkles,
  TriangleAlert,
  MoreVertical,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { IconPicker } from "@/components/app-components/IconPicker";
import {
  DynamicIcon,
  COMMON_PAGE_ICONS,
} from "@/components/app-components/DynamicIcon";
import { Field, FieldContent, FieldGroup } from "@/components/ui/field";
import { FormHeading } from "@/components/ui/app/FormHeading";
import { generateSlug } from "@/hooks/useSlugGenerator";
import {
  updateCategoryLabelSchema,
  updateCategorySchema,
} from "@/lib/schemas/category";

type Category = {
  id: string;
  name: string;
  slug: string;
  order: number;
  isVisible: boolean;
  showInHeaderMenu: boolean;
  showInMobileMenu: boolean;
  showInFooterMenu: boolean;
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
  isVisible: boolean;
  autoOrder: boolean;
  showInHeaderMenu: boolean;
  showInMobileMenu: boolean;
  showInFooterMenu: boolean;
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
    isVisible: true,
    showInHeaderMenu: true,
    showInMobileMenu: true,
    showInFooterMenu: true,
  });

  // Label inline edit/add state
  const [editingLabelId, setEditingLabelId] = useState<string | null>(null);
  const [editingIconForLabelId, setEditingIconForLabelId] = useState<
    string | null
  >(null);
  const [labelDraft, setLabelDraft] = useState({
    name: "",
    icon: "",
    isVisible: true,
    showInHeaderMenu: true,
    showInMobileMenu: true,
    showInFooterMenu: true,
  });
  const [insertingAfterId, setInsertingAfterId] = useState<string | null>(null);
  const [isAddLabelDialogOpen, setIsAddLabelDialogOpen] = useState(false);
  const [autoOrderLabels, setAutoOrderLabels] = useState<Set<string>>(
    new Set()
  );
  const [deletingLabelId, setDeletingLabelId] = useState<string | null>(null);

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

      // Initialize autoOrderLabels from database
      const autoOrderSet = new Set<string>();
      labelData.labels?.forEach((label: { id: string; autoOrder: boolean }) => {
        if (label.autoOrder) {
          autoOrderSet.add(label.id);
        }
      });
      setAutoOrderLabels(autoOrderSet);
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

  const placementParentState = useMemo(() => {
    const placements = [
      categoryForm.showInHeaderMenu,
      categoryForm.showInMobileMenu,
      categoryForm.showInFooterMenu,
    ];
    const allOn = placements.every(Boolean);
    const anyOn = placements.some(Boolean);
    return allOn ? true : anyOn ? "indeterminate" : false;
  }, [
    categoryForm.showInHeaderMenu,
    categoryForm.showInMobileMenu,
    categoryForm.showInFooterMenu,
  ]);

  // Category CRUD
  function openCategoryDialog(category?: Category) {
    if (category) {
      setEditingCategory(category);
      setCategoryForm({
        name: category.name,
        slug: category.slug,
        labelIds: category.labels.map((l) => l.id),
        isVisible: category.isVisible,
        showInHeaderMenu: category.showInHeaderMenu,
        showInMobileMenu: category.showInMobileMenu,
        showInFooterMenu: category.showInFooterMenu,
      });
    } else {
      setEditingCategory(null);
      setCategoryForm({
        name: "",
        slug: "",
        labelIds: [],
        isVisible: true,
        showInHeaderMenu: true,
        showInMobileMenu: true,
        showInFooterMenu: true,
      });
    }
    setIsDialogOpen(true);
  }

  function onCategoryNameChange(e: React.ChangeEvent<HTMLInputElement>) {
    const name = e.target.value;
    setCategoryForm((prev) => ({
      ...prev,
      name,
      slug: editingCategory ? prev.slug : generateSlug(name),
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
    setLabelDraft({
      name: label.name,
      icon: label.icon || "",
      isVisible: label.isVisible,
      showInHeaderMenu: label.showInHeaderMenu,
      showInMobileMenu: label.showInMobileMenu,
      showInFooterMenu: label.showInFooterMenu,
    });
    setInsertingAfterId(null);
  }

  function _startInsertAfter(labelId: string) {
    setInsertingAfterId(labelId);
    setEditingLabelId(null);
    setLabelDraft({
      name: "",
      icon: "",
      isVisible: true,
      showInHeaderMenu: true,
      showInMobileMenu: true,
      showInFooterMenu: true,
    });
  }

  function resetLabelDraft() {
    setEditingLabelId(null);
    setInsertingAfterId(null);
    setLabelDraft({
      name: "",
      icon: "",
      isVisible: true,
      showInHeaderMenu: true,
      showInMobileMenu: true,
      showInFooterMenu: true,
    });
  }

  function openAddLabelDialog() {
    resetLabelDraft();
    setIsAddLabelDialogOpen(true);
  }

  async function saveIconOnly(labelId: string, icon: string) {
    const res = await fetch(`/api/admin/category-labels/${labelId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        icon: icon || null,
      }),
    });
    if (!res.ok) {
      toast({
        title: "Error",
        description: "Failed to update icon",
        variant: "destructive",
      });
      return;
    }
    fetchData();
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
          isVisible: labelDraft.isVisible,
          showInHeaderMenu: labelDraft.showInHeaderMenu,
          showInMobileMenu: labelDraft.showInMobileMenu,
          showInFooterMenu: labelDraft.showInFooterMenu,
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
    setIsAddLabelDialogOpen(false);
    fetchData();
  }

  async function deleteLabel(id: string) {
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
    toast({
      title: "Deleted",
      description: "Label removed",
    });
    setDeletingLabelId(null);
    fetchData();
  }

  // Toggle visibility for labels and categories
  async function toggleLabelVisibility(
    labelId: string,
    field: keyof Pick<
      LabelRow,
      "isVisible" | "showInHeaderMenu" | "showInMobileMenu" | "showInFooterMenu"
    >,
    extra?: Record<string, boolean>
  ) {
    const label = labels.find((l) => l.id === labelId);
    if (!label) return;

    const currentValue = label[field] === true ? true : false;
    const body: Record<string, unknown> = {
      [field]: extra?.[field] ?? !currentValue,
      ...extra,
    };

    // Validate with schema
    const validation = updateCategoryLabelSchema.safeParse(body);
    if (!validation.success) {
      toast({
        title: "Validation error",
        description: "Invalid visibility settings",
        variant: "destructive",
      });
      return;
    }

    const res = await fetch(`/api/admin/category-labels/${labelId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(validation.data),
    });

    if (!res.ok) {
      toast({
        title: "Error",
        description: "Failed to update label visibility",
        variant: "destructive",
      });
      return;
    }
    fetchData();
  }

  async function toggleCategoryVisibility(
    categoryId: string,
    field: keyof Pick<
      Category,
      "isVisible" | "showInHeaderMenu" | "showInMobileMenu" | "showInFooterMenu"
    >,
    extra?: Record<string, boolean>
  ) {
    const category = categories.find((c) => c.id === categoryId);
    if (!category) return;

    const currentValue = category[field] === true ? true : false;
    const body: Record<string, unknown> = {
      [field]: extra?.[field] ?? !currentValue,
      ...extra,
    };

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

    const res = await fetch(`/api/admin/categories/${categoryId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(validation.data),
    });

    if (!res.ok) {
      toast({
        title: "Error",
        description: "Failed to update category visibility",
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

  async function toggleAutoOrder(labelId: string, enabled: boolean) {
    try {
      const response = await fetch(`/api/admin/category-labels/${labelId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ autoOrder: enabled }),
      });

      if (!response.ok) throw new Error("Failed to update auto-order");

      // Update local state
      setAutoOrderLabels((prev) => {
        const next = new Set(prev);
        if (enabled) {
          next.add(labelId);
        } else {
          next.delete(labelId);
        }
        return next;
      });

      // If enabling, trigger auto-sort immediately
      if (enabled) {
        await autoSortLabel(labelId);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update auto-order setting",
        variant: "destructive",
      });
    }
  }

  if (isLoading) return <div>Loading...</div>;

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="groups">Labels</TabsTrigger>
            <TabsTrigger value="categories">Categories</TabsTrigger>
          </TabsList>
          {activeTab === "groups" && (
            <Button
              onClick={openAddLabelDialog}
              size="sm"
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Add label
            </Button>
          )}
        </div>

        <TabsContent value="groups" className="space-y-4">
          {labels.length === 0 ? (
            <div className="rounded-md border p-6 text-center space-y-4">
              <div className="flex flex-col items-center gap-2">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Sparkles className="h-4 w-4 text-muted-foreground" />
                  Group categories with labels to show on product menu
                </div>
                <p className="text-sm text-muted-foreground">
                  Give the label a name (icon optional). You can reorder labels
                  and their categories, and a category can belong to multiple
                  labels.
                </p>
              </div>
              <form
                className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center"
                onSubmit={(e) => {
                  e.preventDefault();
                  saveLabel();
                }}
              >
                <Input
                  className="w-full sm:w-56"
                  placeholder="Label name"
                  value={labelDraft.name}
                  onChange={(e) =>
                    setLabelDraft({
                      ...labelDraft,
                      name: e.target.value,
                    })
                  }
                  autoFocus
                />
                <div className="flex w-full items-center justify-center gap-2 sm:w-64">
                  <Input
                    className="w-full"
                    list="icon-suggestions-empty"
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
                    <DynamicIcon name={labelDraft.icon} className="h-5 w-5" />
                  ) : (
                    <span className="text-xs text-muted-foreground">None</span>
                  )}
                  <datalist id="icon-suggestions-empty">
                    {ICON_SUGGESTIONS.map((icon) => (
                      <option key={`empty-${icon || "none"}`} value={icon} />
                    ))}
                  </datalist>
                </div>
                <div className="flex gap-2">
                  <Button type="submit" className="flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    Add label
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={resetLabelDraft}
                  >
                    Clear
                  </Button>
                </div>
              </form>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10"></TableHead>
                  <TableHead>Icon</TableHead>
                  <TableHead>Label</TableHead>
                  <TableHead>Categories</TableHead>
                  <TableHead className="w-10" />
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
                        <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab active:cursor-grabbing" />
                      </TableCell>
                      <TableCell className="w-48">
                        {editingIconForLabelId === label.id ? (
                          <IconPicker
                            value={labelDraft.icon}
                            onValueChange={async (value) => {
                              await saveIconOnly(label.id, value);
                              setEditingIconForLabelId(null);
                              resetLabelDraft();
                            }}
                            onOpenChange={(open) => {
                              if (!open) {
                                setEditingIconForLabelId(null);
                                resetLabelDraft();
                              }
                            }}
                            defaultOpen={true}
                            placeholder="Pick an icon or none..."
                            className="w-full"
                          />
                        ) : (
                          <button
                            className="flex items-center gap-2 hover:opacity-70"
                            onClick={() => {
                              setEditingIconForLabelId(label.id);
                              setLabelDraft({
                                ...labelDraft,
                                name: label.name,
                                icon: label.icon || "",
                              });
                            }}
                          >
                            {label.icon ? (
                              <DynamicIcon
                                name={label.icon}
                                className="h-5 w-5"
                              />
                            ) : (
                              <span className="text-xs text-muted-foreground">
                                None
                              </span>
                            )}
                          </button>
                        )}
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
                            className="flex items-center gap-2 hover:bg-accent rounded px-2 py-1 -ml-2"
                            onClick={() => startEditLabel(label)}
                          >
                            <Pencil className="h-3 w-3 text-muted-foreground" />
                            <span className="font-medium">{label.name}</span>
                          </button>
                        )}
                      </TableCell>
                      <TableCell className="min-h-12">
                        <div className="flex flex-wrap gap-2">
                          {(label.categories ?? []).map((cat) => {
                            const isAutoOrder = autoOrderLabels.has(label.id);
                            return (
                              <div
                                key={cat.id}
                                draggable={!isAutoOrder}
                                onDragStart={(e) => {
                                  if (isAutoOrder) {
                                    e.preventDefault();
                                    return;
                                  }
                                  e.stopPropagation();
                                  setDragCategory({
                                    labelId: label.id,
                                    categoryId: cat.id,
                                  });
                                }}
                                onDragOver={(e) => {
                                  if (!isAutoOrder) e.preventDefault();
                                }}
                                onDrop={(e) => {
                                  if (isAutoOrder) return;
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
                                className={`inline-flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1 text-sm ${
                                  isAutoOrder ? "" : "cursor-move"
                                }`}
                              >
                                {!isAutoOrder && (
                                  <GripVertical className="h-3 w-3 text-muted-foreground cursor-grab active:cursor-grabbing" />
                                )}
                                <span>{cat.name}</span>
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
                            );
                          })}
                        </div>
                      </TableCell>
                      <TableCell className="text-right align-top">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              aria-label="Label actions"
                            >
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-60">
                            <DropdownMenuLabel>Label</DropdownMenuLabel>
                            <DropdownMenuItem
                              className="flex items-center gap-2"
                              onClick={() => startEditLabel(label)}
                            >
                              <Pencil className="h-4 w-4" />
                              Rename
                            </DropdownMenuItem>
                            <DropdownMenuSub>
                              <DropdownMenuSubTrigger className="flex items-center gap-2">
                                <Eye className="h-4 w-4" />
                                Visibility
                              </DropdownMenuSubTrigger>
                              <DropdownMenuSubContent className="w-48">
                                <DropdownMenuCheckboxItem
                                  onSelect={(event) => event.preventDefault()}
                                  checked={label.isVisible}
                                  onCheckedChange={() =>
                                    toggleLabelVisibility(
                                      label.id,
                                      "isVisible",
                                      {
                                        isVisible: !label.isVisible,
                                        showInHeaderMenu: !label.isVisible,
                                        showInMobileMenu: !label.isVisible,
                                        showInFooterMenu: !label.isVisible,
                                      }
                                    )
                                  }
                                >
                                  Show all
                                </DropdownMenuCheckboxItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuCheckboxItem
                                  onSelect={(event) => event.preventDefault()}
                                  checked={label.showInHeaderMenu}
                                  onCheckedChange={() =>
                                    toggleLabelVisibility(
                                      label.id,
                                      "showInHeaderMenu"
                                    )
                                  }
                                >
                                  Header
                                </DropdownMenuCheckboxItem>
                                <DropdownMenuCheckboxItem
                                  onSelect={(event) => event.preventDefault()}
                                  checked={label.showInMobileMenu}
                                  onCheckedChange={() =>
                                    toggleLabelVisibility(
                                      label.id,
                                      "showInMobileMenu"
                                    )
                                  }
                                >
                                  Mobile
                                </DropdownMenuCheckboxItem>
                                <DropdownMenuCheckboxItem
                                  onSelect={(event) => event.preventDefault()}
                                  checked={label.showInFooterMenu}
                                  onCheckedChange={() =>
                                    toggleLabelVisibility(
                                      label.id,
                                      "showInFooterMenu"
                                    )
                                  }
                                >
                                  Footer
                                </DropdownMenuCheckboxItem>
                              </DropdownMenuSubContent>
                            </DropdownMenuSub>
                            <DropdownMenuItem
                              className="flex items-center gap-2 text-destructive"
                              onClick={() => setDeletingLabelId(label.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuLabel>Category</DropdownMenuLabel>
                            <DropdownMenuItem
                              className="flex items-center justify-between gap-2"
                              onSelect={(event) => event.preventDefault()}
                            >
                              <div className="flex items-center gap-2">
                                <ArrowDownUp className="h-4 w-4" />
                                <span>Auto order</span>
                              </div>
                              <Switch
                                checked={autoOrderLabels.has(label.id)}
                                onCheckedChange={(checked) =>
                                  toggleAutoOrder(label.id, checked)
                                }
                              />
                            </DropdownMenuItem>
                            <DropdownMenuSub>
                              <DropdownMenuSubTrigger className="flex items-center gap-2">
                                <Layers className="h-4 w-4" />
                                Group
                              </DropdownMenuSubTrigger>
                              <DropdownMenuSubContent className="max-h-64 overflow-y-auto">
                                {categories.length === 0 ? (
                                  <div className="px-2 py-1.5 text-sm text-muted-foreground">
                                    No categories available
                                  </div>
                                ) : (
                                  categories.map((cat) => {
                                    const isAttached = (
                                      label.categories ?? []
                                    ).some((lc) => lc.id === cat.id);
                                    return (
                                      <DropdownMenuCheckboxItem
                                        key={cat.id}
                                        onSelect={(event) =>
                                          event.preventDefault()
                                        }
                                        checked={isAttached}
                                        onCheckedChange={async (checked) => {
                                          if (checked) {
                                            await attachCategory(
                                              label.id,
                                              cat.id
                                            );
                                          } else {
                                            await detachCategory(
                                              label.id,
                                              cat.id
                                            );
                                          }
                                        }}
                                      >
                                        {cat.name}
                                      </DropdownMenuCheckboxItem>
                                    );
                                  })
                                )}
                              </DropdownMenuSubContent>
                            </DropdownMenuSub>
                          </DropdownMenuContent>
                        </DropdownMenu>
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
          )}
        </TabsContent>

        <TabsContent value="categories" className="space-y-4">
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
                      <TableCell className="font-medium">
                        {category.name}
                      </TableCell>
                      <TableCell>{category.slug}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Switch
                            aria-label="Toggle category visibility"
                            checked={category.isVisible}
                            onCheckedChange={(checked) =>
                              toggleCategoryVisibility(
                                category.id,
                                "isVisible",
                                { isVisible: checked === true }
                              )
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
                      <TableCell>{category._count?.products || 0}</TableCell>
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
                                Products assigned to this category will stay
                                live but lose the link to it.
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
        </TabsContent>
      </Tabs>

      <Dialog
        open={isAddLabelDialogOpen}
        onOpenChange={setIsAddLabelDialogOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Label</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              saveLabel();
            }}
            className="space-y-6"
          >
            <FieldGroup>
              <Field>
                <FormHeading htmlFor="label-name" label="Label name" required />
                <FieldContent>
                  <Input
                    id="label-name"
                    value={labelDraft.name}
                    onChange={(e) =>
                      setLabelDraft({
                        ...labelDraft,
                        name: e.target.value,
                      })
                    }
                    placeholder="Enter label name"
                    autoFocus
                    required
                  />
                </FieldContent>
              </Field>

              <Field>
                <FormHeading htmlFor="label-icon" label="Icon (optional)" />
                <FieldContent>
                  <IconPicker
                    value={labelDraft.icon}
                    onValueChange={(value) =>
                      setLabelDraft({
                        ...labelDraft,
                        icon: value,
                      })
                    }
                    placeholder="Pick an icon or none..."
                  />
                </FieldContent>
              </Field>
            </FieldGroup>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsAddLabelDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit">Add</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={!!deletingLabelId}
        onOpenChange={() => setDeletingLabelId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <TriangleAlert className="h-4 w-4" />
              Delete label?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Categories once grouped with{" "}
              <span className="font-medium">
                {deletingLabelId
                  ? labels.find((l) => l.id === deletingLabelId)?.name ||
                    "this label"
                  : "this label"}
              </span>{" "}
              will be detached.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90"
              onClick={() => {
                if (deletingLabelId) deleteLabel(deletingLabelId);
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingCategory ? "Edit Category" : "Add Category"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={saveCategory} className="space-y-6">
            <FieldGroup>
              <Field>
                <FormHeading htmlFor="name" label="Name" required />
                <FieldContent>
                  <Input
                    id="name"
                    value={categoryForm.name}
                    onChange={onCategoryNameChange}
                    required
                  />
                </FieldContent>
              </Field>

              <Field>
                <FormHeading htmlFor="slug" label="Slug" required />
                <FieldContent>
                  <Input
                    id="slug"
                    value={categoryForm.slug}
                    onChange={(e) =>
                      setCategoryForm({ ...categoryForm, slug: e.target.value })
                    }
                    required
                  />
                </FieldContent>
              </Field>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Category labels</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {labels.length === 0 ? (
                    <div className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
                      No labels yet. Add labels in the Labels tab.
                    </div>
                  ) : (
                    <div
                      className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto p-2 border rounded-md"
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
                          {label.icon ? (
                            <DynamicIcon
                              name={label.icon}
                              className="h-4 w-4"
                            />
                          ) : null}
                          <span>{label.name}</span>
                        </label>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Visibility</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Field orientation="vertical">
                    <FormHeading label="Placements" />
                    <FieldContent className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Checkbox
                          id="cat-visible"
                          checked={placementParentState}
                          onCheckedChange={(checked) => {
                            const next = checked === true;
                            setCategoryForm((prev) => ({
                              ...prev,
                              isVisible: next,
                              showInHeaderMenu: next,
                              showInMobileMenu: next,
                              showInFooterMenu: next,
                            }));
                          }}
                        />
                        <label
                          htmlFor="cat-visible"
                          className="text-sm cursor-pointer"
                        >
                          All placements
                        </label>
                      </div>
                      <div className="ml-6 space-y-2">
                        <div className="flex items-center gap-2">
                          <Checkbox
                            id="cat-header"
                            checked={categoryForm.showInHeaderMenu}
                            onCheckedChange={(checked) => {
                              setCategoryForm((prev) => {
                                const next = checked === true;
                                const updated = {
                                  ...prev,
                                  showInHeaderMenu: next,
                                };
                                const any =
                                  next ||
                                  updated.showInMobileMenu ||
                                  updated.showInFooterMenu;
                                return {
                                  ...updated,
                                  isVisible: any,
                                };
                              });
                            }}
                          />
                          <label
                            htmlFor="cat-header"
                            className="text-sm cursor-pointer"
                          >
                            Header menu
                          </label>
                        </div>
                        <div className="flex items-center gap-2">
                          <Checkbox
                            id="cat-mobile"
                            checked={categoryForm.showInMobileMenu}
                            onCheckedChange={(checked) => {
                              setCategoryForm((prev) => {
                                const next = checked === true;
                                const updated = {
                                  ...prev,
                                  showInMobileMenu: next,
                                };
                                const any =
                                  updated.showInHeaderMenu ||
                                  next ||
                                  updated.showInFooterMenu;
                                return {
                                  ...updated,
                                  isVisible: any,
                                };
                              });
                            }}
                          />
                          <label
                            htmlFor="cat-mobile"
                            className="text-sm cursor-pointer"
                          >
                            Mobile menu
                          </label>
                        </div>
                        <div className="flex items-center gap-2">
                          <Checkbox
                            id="cat-footer"
                            checked={categoryForm.showInFooterMenu}
                            onCheckedChange={(checked) => {
                              setCategoryForm((prev) => {
                                const next = checked === true;
                                const updated = {
                                  ...prev,
                                  showInFooterMenu: next,
                                };
                                const any =
                                  updated.showInHeaderMenu ||
                                  updated.showInMobileMenu ||
                                  next;
                                return {
                                  ...updated,
                                  isVisible: any,
                                };
                              });
                            }}
                          />
                          <label
                            htmlFor="cat-footer"
                            className="text-sm cursor-pointer"
                          >
                            Footer menu
                          </label>
                        </div>
                      </div>
                    </FieldContent>
                  </Field>
                </CardContent>
              </Card>
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
