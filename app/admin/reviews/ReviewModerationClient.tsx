"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  DataTable,
  DataTableActionBar,
  DataTablePageSizeSelector,
  DataTablePagination,
} from "@/app/admin/_components/data-table";
import type { ActionBarConfig } from "@/app/admin/_components/data-table/types";
import { Search, Filter } from "lucide-react";
import { useReviewsTable, type AdminReview } from "./hooks/useReviewsTable";
import { ReviewCard } from "./_components/ReviewCard";
import { useRef } from "react";

type StatusFilter = "all" | "PUBLISHED" | "FLAGGED" | "PENDING";

export default function ReviewModerationClient() {
  const [allReviews, setAllReviews] = useState<AdminReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const { toast } = useToast();

  // Dialogs
  const [flagDialogOpen, setFlagDialogOpen] = useState(false);
  const [replyDialogOpen, setReplyDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedReview, setSelectedReview] = useState<AdminReview | null>(
    null
  );
  const [flagReason, setFlagReason] = useState("");
  const [replyText, setReplyText] = useState("");

  // Scrollable tabs
  const tabsListRef = useRef<HTMLDivElement>(null);

  const fetchReviews = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/reviews");
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setAllReviews(data.reviews);
    } catch {
      toast({
        title: "Error",
        description: "Failed to load reviews",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  const filteredReviews = useMemo(
    () =>
      statusFilter === "all"
        ? allReviews
        : allReviews.filter((r) => r.status === statusFilter),
    [allReviews, statusFilter]
  );

  const handleFlag = useCallback((review: AdminReview) => {
    setSelectedReview(review);
    setFlagReason("");
    setFlagDialogOpen(true);
  }, []);

  const handleApprove = useCallback(
    async (review: AdminReview) => {
      try {
        const res = await fetch(`/api/admin/reviews/${review.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "approve" }),
        });
        if (!res.ok) throw new Error();
        toast({ title: "Review approved" });
        fetchReviews();
      } catch {
        toast({
          title: "Error",
          description: "Failed to approve review",
          variant: "destructive",
        });
      }
    },
    [fetchReviews, toast]
  );

  const handleReply = useCallback((review: AdminReview) => {
    setSelectedReview(review);
    setReplyText(review.adminResponse ?? "");
    setReplyDialogOpen(true);
  }, []);

  const handleDelete = useCallback((review: AdminReview) => {
    setSelectedReview(review);
    setDeleteDialogOpen(true);
  }, []);

  const confirmFlag = async () => {
    if (!selectedReview) return;
    try {
      const res = await fetch(`/api/admin/reviews/${selectedReview.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "flag", reason: flagReason }),
      });
      if (!res.ok) throw new Error();
      toast({ title: "Review flagged" });
      setFlagDialogOpen(false);
      fetchReviews();
    } catch {
      toast({
        title: "Error",
        description: "Failed to flag review",
        variant: "destructive",
      });
    }
  };

  const confirmReply = async () => {
    if (!selectedReview) return;
    try {
      const res = await fetch(`/api/admin/reviews/${selectedReview.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reply", response: replyText }),
      });
      if (!res.ok) throw new Error();
      toast({ title: "Reply saved" });
      setReplyDialogOpen(false);
      fetchReviews();
    } catch {
      toast({
        title: "Error",
        description: "Failed to save reply",
        variant: "destructive",
      });
    }
  };

  const confirmDelete = async () => {
    if (!selectedReview) return;
    try {
      const res = await fetch(`/api/admin/reviews/${selectedReview.id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error();
      toast({ title: "Review deleted" });
      setDeleteDialogOpen(false);
      fetchReviews();
    } catch {
      toast({
        title: "Error",
        description: "Failed to delete review",
        variant: "destructive",
      });
    }
  };

  const {
    table,
    searchQuery,
    setSearchQuery,
    activeFilter,
    setActiveFilter,
    filterConfigs,
    getActionItems,
  } = useReviewsTable({
    reviews: filteredReviews,
    onFlag: handleFlag,
    onApprove: handleApprove,
    onReply: handleReply,
    onDelete: handleDelete,
  });

  const actionBarConfig: ActionBarConfig = {
    left: [
      {
        type: "search",
        value: searchQuery,
        onChange: setSearchQuery,
        placeholder: "Search reviews...",
        collapse: { icon: Search },
      },
      {
        type: "filter",
        configs: filterConfigs,
        activeFilter,
        onFilterChange: setActiveFilter,
        collapse: { icon: Filter },
      },
    ],
    right: [
      {
        type: "recordCount",
        count: table.getFilteredRowModel().rows.length,
        label: "Reviews",
      },
      {
        type: "custom",
        content: (
          <div className="hidden lg:block">
            <DataTablePageSizeSelector table={table} />
          </div>
        ),
      },
      {
        type: "custom",
        content: (
          <div className="hidden md:block">
            <DataTablePagination table={table} />
          </div>
        ),
      },
    ],
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12 text-muted-foreground">
        Loading reviews...
      </div>
    );
  }

  return (
    <div>
      <Tabs
        value={statusFilter}
        onValueChange={(v) => setStatusFilter(v as StatusFilter)}
      >
        <TabsList
          ref={tabsListRef}
          className="flex overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden cursor-grab mb-4"
        >
          <TabsTrigger value="all" className="shrink-0">
            All
          </TabsTrigger>
          <TabsTrigger value="PUBLISHED" className="shrink-0">
            Published
          </TabsTrigger>
          <TabsTrigger value="FLAGGED" className="shrink-0">
            Flagged
          </TabsTrigger>
          <TabsTrigger value="PENDING" className="shrink-0">
            Pending
          </TabsTrigger>
        </TabsList>
      </Tabs>

      <DataTableActionBar config={actionBarConfig} />

      {/* Desktop table */}
      <div className="hidden md:block">
        <DataTable
          table={table}
          emptyMessage="No reviews found."
        />
      </div>

      {/* Mobile cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:hidden">
        {table.getFilteredRowModel().rows.length === 0 ? (
          <p className="text-center text-muted-foreground py-8 col-span-full">
            No reviews found.
          </p>
        ) : (
          table.getFilteredRowModel().rows.map((row) => (
            <ReviewCard
              key={row.original.id}
              review={row.original}
              actionItems={getActionItems(row.original)}
            />
          ))
        )}
      </div>

      {/* Flag Dialog */}
      <Dialog open={flagDialogOpen} onOpenChange={setFlagDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Flag Review</DialogTitle>
            <DialogDescription>
              This review will be shown on the storefront with a warning banner.
              Please provide a reason.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="Reason for flagging..."
            value={flagReason}
            onChange={(e) => setFlagReason(e.target.value)}
          />
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setFlagDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="default"
              className="bg-amber-600 hover:bg-amber-700"
              onClick={confirmFlag}
              disabled={!flagReason.trim()}
            >
              Flag Review
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reply Dialog */}
      <Dialog open={replyDialogOpen} onOpenChange={setReplyDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reply to Review</DialogTitle>
            <DialogDescription>
              Your response will be displayed publicly on the storefront below
              the review.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="Write your response..."
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            rows={4}
          />
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setReplyDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={confirmReply} disabled={!replyText.trim()}>
              Save Reply
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete AlertDialog */}
      <AlertDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Review</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this review. This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={confirmDelete}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
