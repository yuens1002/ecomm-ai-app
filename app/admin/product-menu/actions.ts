"use server";

import { z } from "zod";
import {
  createCategoryLabelSchema,
  updateCategoryLabelSchema,
  createCategorySchema,
} from "@/lib/schemas/category";

// Utility to perform a JSON fetch with robust error mapping (no TS types, Zod handles validation at call sites)
async function jsonFetch(input: RequestInfo | URL, init?: RequestInit) {
  try {
    const res = await fetch(input, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...(init?.headers || {}),
      },
      cache: "no-store",
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      const msg = (body?.error as string) || `Request failed (${res.status})`;
      return { ok: false, error: msg, details: body?.details };
    }
    return { ok: true, data: body };
  } catch (err) {
    const message = (err instanceof Error && err.message) ? err.message : "Network error";
    return { ok: false, error: message };
  }
}

// Labels
export async function listLabels() {
  return jsonFetch("/api/admin/category-labels");
}

export async function createLabel(input: unknown) {
  const parsed = createCategoryLabelSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Validation failed", details: parsed.error.issues };
  }
  return jsonFetch("/api/admin/category-labels", {
    method: "POST",
    body: JSON.stringify(parsed.data),
  });
}

export async function updateLabel(id: unknown, input: unknown) {
  const idParsed = z.string().min(1).safeParse(id);
  const bodyParsed = updateCategoryLabelSchema.safeParse(input);
  if (!idParsed.success) return { ok: false, error: "Invalid id" };
  if (!bodyParsed.success) return { ok: false, error: "Validation failed", details: bodyParsed.error.issues };
  return jsonFetch(`/api/admin/category-labels/${idParsed.data}`, {
    method: "PUT",
    body: JSON.stringify(bodyParsed.data),
  });
}

export async function deleteLabel(id: unknown) {
  const idParsed = z.string().min(1).safeParse(id);
  if (!idParsed.success) return { ok: false, error: "Invalid id" };
  return jsonFetch(`/api/admin/category-labels/${idParsed.data}`, {
    method: "DELETE",
  });
}

export async function reorderLabels(labelIds: unknown) {
  const arr = z.array(z.string()).safeParse(labelIds);
  if (!arr.success) {
    return { ok: false, error: "labelIds must be an array of strings" };
  }
  return jsonFetch("/api/admin/category-labels/reorder", {
    method: "POST",
    body: JSON.stringify({ labelIds: arr.data }),
  });
}

// Category assignments within a label
export async function attachCategory(labelId: unknown, categoryId: unknown) {
  const parsed = z.object({ labelId: z.string(), categoryId: z.string() }).safeParse({ labelId, categoryId });
  if (!parsed.success) {
    return { ok: false, error: "Invalid labelId or categoryId" };
  }
  return jsonFetch(`/api/admin/category-labels/${parsed.data.labelId}/attach`, {
    method: "POST",
    body: JSON.stringify({ categoryId: parsed.data.categoryId }),
  });
}

export async function detachCategory(labelId: unknown, categoryId: unknown) {
  const parsed = z.object({ labelId: z.string(), categoryId: z.string() }).safeParse({ labelId, categoryId });
  if (!parsed.success) {
    return { ok: false, error: "Invalid labelId or categoryId" };
  }
  return jsonFetch(`/api/admin/category-labels/${parsed.data.labelId}/detach`, {
    method: "POST",
    body: JSON.stringify({ categoryId: parsed.data.categoryId }),
  });
}

export async function reorderCategoriesInLabel(labelId: unknown, categoryIds: unknown) {
  const parsed = z.object({ labelId: z.string(), categoryIds: z.array(z.string()) }).safeParse({ labelId, categoryIds });
  if (!parsed.success) {
    return { ok: false, error: "Invalid labelId or categoryIds" };
  }
  return jsonFetch(`/api/admin/category-labels/${parsed.data.labelId}/reorder-categories`, {
    method: "POST",
    body: JSON.stringify({ categoryIds: parsed.data.categoryIds }),
  });
}

// Categories
export async function listCategories() {
  return jsonFetch("/api/admin/categories");
}

export async function createCategory(input: unknown) {
  const parsed = createCategorySchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Validation failed", details: parsed.error.issues };
  }
  return jsonFetch("/api/admin/categories", {
    method: "POST",
    body: JSON.stringify(parsed.data),
  });
}

// Convenience bundle for initial load
export async function listMenuData() {
  const [labels, categories] = await Promise.all([listLabels(), listCategories()]);
  if (!labels.ok) return labels;
  if (!categories.ok) return categories;
  const LabelsPayload = z.object({ labels: z.array(z.any()) });
  const CategoriesPayload = z.object({ categories: z.array(z.any()) });
  const lp = LabelsPayload.safeParse(labels.data);
  const cp = CategoriesPayload.safeParse(categories.data);
  return {
    ok: true,
    data: {
      labels: lp.success ? lp.data.labels : (Array.isArray(labels.data) ? labels.data : []),
      categories: cp.success ? cp.data.categories : (Array.isArray(categories.data) ? categories.data : []),
    },
  };
}
