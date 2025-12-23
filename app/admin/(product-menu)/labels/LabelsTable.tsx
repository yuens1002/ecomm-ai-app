"use client";

import type { MenuCategory, MenuLabel } from "../types/menu";
import { useEffect, useState, useMemo, Fragment } from "react";
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
} from "@/components/ui/alert-dialog";
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
  ArrowDownUp,
  GripVertical,
  Check,
  X,
  MoreVertical,
  Layers,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  DynamicIcon,
  COMMON_PAGE_ICONS,
} from "@/components/app-components/DynamicIcon";
import { IconPicker } from "@/components/app-components/IconPicker";
import { updateCategoryLabelSchema } from "@/app/admin/(product-menu)/types/category";
import { useProductMenuMutations } from "../hooks/useProductMenuMutations";

const ICON_SUGGESTIONS = ["", ...COMMON_PAGE_ICONS];

interface LabelsTableProps {
  labels: MenuLabel[];
  categories: MenuCategory[];
}

export function LabelsTable({ labels, categories }: LabelsTableProps) {
  const [editingLabelId, setEditingLabelId] = useState<string | null>(null);
  const [editingIconForLabelId, setEditingIconForLabelId] = useState<
    string | null
  >(null);
  const [labelDraft, setLabelDraft] = useState({
    name: "",
    icon: "",
    isVisible: true,
  });
  const [insertingAfterId, setInsertingAfterId] = useState<string | null>(null);
  const [isAddLabelDialogOpen, setIsAddLabelDialogOpen] = useState(false);
  const [autoOrderLabels, setAutoOrderLabels] = useState<Set<string>>(
    new Set(labels.filter((l) => l.autoOrder).map((l) => l.id))
  );
  const [deletingLabelId, setDeletingLabelId] = useState<string | null>(null);
  const [dragLabelId, setDragLabelId] = useState<string | null>(null);
  const [dragCategory, setDragCategory] = useState<{
    labelId: string;
    categoryId: string;
  } | null>(null);

  const { toast } = useToast();
  const mutations = useProductMenuMutations();

  useEffect(() => {
    setAutoOrderLabels(
      new Set(labels.filter((l) => l.autoOrder).map((l) => l.id))
    );
  }, [labels]);

  const labelMap = useMemo(
    () => new Map(labels.map((l) => [l.id, l])),
    [labels]
  );

  function startEditLabel(label: MenuLabel) {
    setEditingLabelId(label.id);
    setLabelDraft({
      name: label.name,
      icon: label.icon || "",
      isVisible: label.isVisible,
    });
    setInsertingAfterId(null);
  }

  function resetLabelDraft() {
    setEditingLabelId(null);
    setInsertingAfterId(null);
    setLabelDraft({
      name: "",
      icon: "",
      isVisible: true,
    });
  }

  function openAddLabelDialog() {
    resetLabelDraft();
    setIsAddLabelDialogOpen(true);
  }

  async function saveIconOnly(labelId: string, icon: string) {
    const res = await mutations.updateLabel(labelId, { icon: icon || null });
    if (!res.ok) {
      toast({
        title: "Error",
        description: res.error || "Failed to update icon",
        variant: "destructive",
      });
      return;
    }
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
      const res = await mutations.updateLabel(labelId, {
        name: labelDraft.name.trim(),
        icon: labelDraft.icon || null,
        isVisible: labelDraft.isVisible,
      });
      if (!res.ok) {
        toast({
          title: "Error",
          description: res.error || "Failed to update label",
          variant: "destructive",
        });
        return;
      }
    } else {
      const res = await mutations.createLabel({
        name: labelDraft.name.trim(),
        icon: labelDraft.icon || null,
        afterLabelId: afterId || null,
      });
      if (!res.ok) {
        toast({
          title: "Error",
          description: res.error || "Failed to create label",
          variant: "destructive",
        });
        return;
      }
    }

    resetLabelDraft();
    setIsAddLabelDialogOpen(false);
  }

  async function deleteLabel(id: string) {
    const res = await mutations.deleteLabel(id);
    if (!res.ok) {
      toast({
        title: "Error",
        description: res.error || "Failed to delete label",
        variant: "destructive",
      });
      return;
    }
    toast({
      title: "Deleted",
      description: "Label removed",
    });
    setDeletingLabelId(null);
  }

  async function toggleLabelVisibility(
    labelId: string,
    field: "isVisible",
    extra?: Record<string, boolean>
  ) {
    const label = labels.find((l) => l.id === labelId);
    if (!label) return;

    const currentValue = label[field] === true ? true : false;
    const body: Record<string, unknown> = {
      [field]: extra?.[field] ?? !currentValue,
      ...extra,
    };

    const validation = updateCategoryLabelSchema.safeParse(body);
    if (!validation.success) {
      toast({
        title: "Validation error",
        description: "Invalid visibility settings",
        variant: "destructive",
      });
      return;
    }

    const res = await mutations.updateLabel(labelId, validation.data);
    if (!res.ok) {
      toast({
        title: "Error",
        description: res.error || "Failed to update label visibility",
        variant: "destructive",
      });
    }
  }

  async function handleLabelDrop(targetId: string) {
    if (!dragLabelId || dragLabelId.includes(":")) return;
    if (dragLabelId === targetId) return;
    const ordered = reorderList(labels, dragLabelId, targetId);
    await mutations.reorderLabels(ordered.map((l) => l.id));
    setDragLabelId(null);
  }

  async function handleCategoryReorder(
    labelId: string,
    dragId: string,
    targetId: string
  ) {
    const label = labelMap.get(labelId);
    if (!label || dragId === targetId) return;
    const updatedCats = reorderList(label.categories, dragId, targetId);
    await mutations.reorderCategoriesInLabel(
      labelId,
      updatedCats.map((c) => c.id)
    );
  }

  async function attachCategory(labelId: string, categoryId: string) {
    await mutations.attachCategory(labelId, categoryId);
  }

  async function detachCategory(labelId: string, categoryId: string) {
    await mutations.detachCategory(labelId, categoryId);
  }

  async function autoSortLabel(labelId: string) {
    await mutations.autoSortCategoriesInLabel(labelId);
  }

  async function toggleAutoOrder(labelId: string, enabled: boolean) {
    try {
      const response = await mutations.updateLabel(labelId, {
        autoOrder: enabled,
      });

      if (!response.ok)
        throw new Error(response.error || "Failed to update auto-order");

      setAutoOrderLabels((prev) => {
        const next = new Set(prev);
        if (enabled) {
          next.add(labelId);
        } else {
          next.delete(labelId);
        }
        return next;
      });

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

  if (labels.length === 0) {
    return (
      <div className="rounded-md border p-6 text-center space-y-4">
        <div className="flex flex-col items-center gap-2">
          <div className="flex items-center gap-2 text-sm font-medium">
            Group categories with labels to show on product menu
          </div>
          <p className="text-sm text-muted-foreground">
            Give the label a name (icon optional). You can reorder labels and
            their categories, and a category can belong to multiple labels.
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
            <Button type="button" variant="outline" onClick={resetLabelDraft}>
              Clear
            </Button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button
          onClick={openAddLabelDialog}
          size="sm"
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Add label
        </Button>
      </div>

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
                        <DynamicIcon name={label.icon} className="h-5 w-5" />
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
                        <DropdownMenuSubContent>
                          <DropdownMenuCheckboxItem
                            onSelect={(event) => event.preventDefault()}
                            checked={label.isVisible}
                            onCheckedChange={() =>
                              toggleLabelVisibility(label.id, "isVisible", {
                                isVisible: !label.isVisible,
                              })
                            }
                          >
                            Visible
                          </DropdownMenuCheckboxItem>
                        </DropdownMenuSubContent>
                      </DropdownMenuSub>
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
                              const isAttached = (label.categories ?? []).some(
                                (lc) => lc.id === cat.id
                              );
                              return (
                                <DropdownMenuCheckboxItem
                                  key={cat.id}
                                  onSelect={(event) => event.preventDefault()}
                                  checked={isAttached}
                                  onCheckedChange={async (checked) => {
                                    if (checked) {
                                      await attachCategory(label.id, cat.id);
                                    } else {
                                      await detachCategory(label.id, cat.id);
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
                      <DropdownMenuItem
                        className="flex items-center gap-2 text-destructive"
                        onClick={() => setDeletingLabelId(label.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
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
            <div className="space-y-4">
              <div>
                <label htmlFor="label-name" className="text-sm font-medium">
                  Label name <span className="text-destructive">*</span>
                </label>
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
              </div>

              <div>
                <label htmlFor="label-icon" className="text-sm font-medium">
                  Icon (optional)
                </label>
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
              </div>
            </div>

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
