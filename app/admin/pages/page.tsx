import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Plus, FileText, Eye, EyeOff, Calendar, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Manage Pages - Admin",
  description: "Manage informational pages for your store.",
};

async function getPages() {
  const pages = await prisma.page.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      parent: {
        select: { title: true },
      },
      children: {
        select: { id: true },
      },
    },
  });

  return pages;
}

export default async function AdminPagesPage() {
  const pages = await getPages();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Pages</h1>
          <p className="text-muted-foreground mt-2">
            Manage informational pages for your store
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild>
            <Link href="/admin/pages/new">
              <Plus className="mr-2 h-4 w-4" />
              New Page
            </Link>
          </Button>
        </div>
      </div>

      {/* Pages Table */}
      {pages.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border bg-muted/30 p-12 text-center">
          <FileText className="mb-4 h-12 w-12 text-muted-foreground" />
          <h2 className="mb-2 text-xl font-semibold">No pages yet</h2>
          <p className="mb-4 text-sm text-muted-foreground">
            Create your first informational page to get started.
          </p>
          <Button asChild>
            <Link href="/admin/pages/new">
              <Plus className="mr-2 h-4 w-4" />
              Create Page
            </Link>
          </Button>
        </div>
      ) : (
        <div className="rounded-lg border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead>Parent</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pages.map((page) => (
                <TableRow key={page.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{page.title}</span>
                      {page.generatedBy === "ai" && (
                        <Badge variant="secondary" className="gap-1">
                          <Sparkles className="h-3 w-3" />
                          AI
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <code className="rounded bg-muted px-2 py-1 text-xs">
                      /{page.slug}
                    </code>
                  </TableCell>
                  <TableCell>
                    {page.parent ? (
                      <span className="text-sm text-muted-foreground">
                        {page.parent.title}
                      </span>
                    ) : (
                      <span className="text-sm text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {page.isPublished ? (
                        <>
                          <Eye className="h-4 w-4 text-green-600" />
                          <span className="text-sm text-green-600">
                            Published
                          </span>
                        </>
                      ) : (
                        <>
                          <EyeOff className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">
                            Draft
                          </span>
                        </>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      {new Date(page.createdAt).toLocaleDateString()}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      {page.isPublished && (
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/pages/${page.slug}`} target="_blank">
                            <Eye className="h-4 w-4" />
                          </Link>
                        </Button>
                      )}
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/admin/pages/edit/${page.id}`}>Edit</Link>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
