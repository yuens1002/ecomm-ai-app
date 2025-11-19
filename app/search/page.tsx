import { Suspense } from "react";
import SearchResults from "./SearchResults";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export const metadata = {
  title: "Search Products | Artisan Roast",
  description: "Search for specialty coffee products",
};

export default function SearchPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Link href="/">
          <Button variant="ghost" size="sm" className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Button>
        </Link>
        <h1 className="text-3xl font-bold">Search Products</h1>
      </div>

      <Suspense fallback={<SearchLoadingSkeleton />}>
        <SearchResults />
      </Suspense>
    </div>
  );
}

function SearchLoadingSkeleton() {
  return (
    <div className="space-y-4">
      <div className="h-10 bg-secondary rounded-md animate-pulse w-full max-w-md" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="space-y-3">
            <div className="h-64 bg-secondary rounded-lg animate-pulse" />
            <div className="h-4 bg-secondary rounded animate-pulse w-3/4" />
            <div className="h-4 bg-secondary rounded animate-pulse w-1/2" />
          </div>
        ))}
      </div>
    </div>
  );
}
