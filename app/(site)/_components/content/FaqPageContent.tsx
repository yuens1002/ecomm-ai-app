"use client";

import { useState, useMemo } from "react";
import { Search, ChevronDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { FaqAccordionItem } from "./FaqAccordionItem";
import {
  FAQ_CATEGORIES,
  FaqItemBlock,
  FaqCategoryId,
} from "@/lib/blocks/schemas";
import { DynamicIcon } from "@/components/shared/icons/DynamicIcon";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface FaqPageContentProps {
  faqItems: FaqItemBlock[];
  className?: string;
}

/**
 * Public FAQ page content with search and category filtering
 * Groups FAQ items by category with interactive accordions
 */
export function FaqPageContent({
  faqItems,
  className = "",
}: FaqPageContentProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<
    FaqCategoryId | "all"
  >("all");
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set()
  );

  // Toggle all items in a category
  const toggleCategoryExpand = (categoryId: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(categoryId)) {
        next.delete(categoryId);
      } else {
        next.add(categoryId);
      }
      return next;
    });
  };

  // Get categories that have FAQ items
  const categoriesWithItems = useMemo(() => {
    const categoryIds = new Set(
      faqItems.map((item) => item.content.category || "general")
    );
    return FAQ_CATEGORIES.filter((cat) => categoryIds.has(cat.id));
  }, [faqItems]);

  // Filter FAQ items based on search and category
  const filteredItems = useMemo(() => {
    return faqItems.filter((item) => {
      // Category filter
      if (
        selectedCategory !== "all" &&
        item.content.category !== selectedCategory
      ) {
        return false;
      }

      // Search filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesQuestion = item.content.question
          .toLowerCase()
          .includes(query);
        const matchesAnswer = item.content.answer.toLowerCase().includes(query);
        return matchesQuestion || matchesAnswer;
      }

      return true;
    });
  }, [faqItems, selectedCategory, searchQuery]);

  // Group filtered items by category
  const groupedItems = useMemo(() => {
    const groups: Record<string, FaqItemBlock[]> = {};

    filteredItems.forEach((item) => {
      const categoryId = item.content.category || "general";
      if (!groups[categoryId]) {
        groups[categoryId] = [];
      }
      groups[categoryId].push(item);
    });

    // Sort by category order in FAQ_CATEGORIES
    const sortedGroups: {
      category: (typeof FAQ_CATEGORIES)[number];
      items: FaqItemBlock[];
    }[] = [];
    FAQ_CATEGORIES.forEach((cat) => {
      if (groups[cat.id]?.length) {
        sortedGroups.push({ category: cat, items: groups[cat.id] });
      }
    });

    return sortedGroups;
  }, [filteredItems]);

  return (
    <div className={`mx-auto px-4 sm:px-8 ${className}`}>
      {/* Search and Filter Bar */}
      <div className="pt-6 pb-4 space-y-4">
        {/* Search Input */}
        <div className="relative max-w-md mx-auto">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search FAQs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Category Filter - Dropdown on mobile, buttons on sm+ */}
        {categoriesWithItems.length > 1 && (
          <>
            {/* Mobile: dropdown */}
            <div className="sm:hidden">
              <Select
                value={selectedCategory}
                onValueChange={(value) => setSelectedCategory(value as FaqCategoryId | "all")}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Filter by category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categoriesWithItems.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {/* Desktop: buttons */}
            <div className="hidden sm:flex flex-wrap justify-center gap-2">
              <Button
                variant={selectedCategory === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory("all")}
              >
                All
              </Button>
              {categoriesWithItems.map((cat) => (
                <Button
                  key={cat.id}
                  variant={selectedCategory === cat.id ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory(cat.id)}
                  className="gap-2"
                >
                  <DynamicIcon name={cat.icon} className="h-4 w-4" />
                  {cat.label}
                </Button>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Results Count */}
      {searchQuery && (
        <p className="text-sm text-muted-foreground text-center mt-4">
          {filteredItems.length} result{filteredItems.length !== 1 ? "s" : ""}{" "}
          found
          {selectedCategory !== "all" &&
            ` in ${FAQ_CATEGORIES.find((c) => c.id === selectedCategory)?.label}`}
        </p>
      )}

      {/* No Results */}
      {filteredItems.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">
            No FAQs found matching your search.
          </p>
          {searchQuery && (
            <Button
              variant="link"
              onClick={() => {
                setSearchQuery("");
                setSelectedCategory("all");
              }}
            >
              Clear filters
            </Button>
          )}
        </div>
      )}

      {/* Grouped FAQ Items */}
      <div className="space-y-8 mt-8">
        {groupedItems.map(({ category, items }) => {
          const isExpanded = expandedCategories.has(category.id);
          return (
            <div key={category.id} className="space-y-3">
              {/* Category Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <DynamicIcon
                    name={category.icon}
                    className="h-5 w-5 text-primary"
                  />
                  <h3 className="text-lg font-semibold">{category.label}</h3>
                  <span className="text-sm text-muted-foreground">
                    ({items.length})
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => toggleCategoryExpand(category.id)}
                  className="gap-1 text-muted-foreground hover:text-foreground"
                >
                  <ChevronDown
                    className={`h-4 w-4 transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`}
                  />
                  {isExpanded ? "Collapse All" : "Expand All"}
                </Button>
              </div>

              {/* FAQ Items in Category */}
              <div className="space-y-2">
                {items.map((item) => (
                  <FaqAccordionItem
                    key={item.id}
                    question={item.content.question}
                    answer={item.content.answer}
                    isInteractive
                    forceOpen={isExpanded}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
