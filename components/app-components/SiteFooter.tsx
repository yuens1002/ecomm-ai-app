/**
 * The site-wide footer. This is a simple Server Component
 * as it contains no interactive client-side logic.
 */
export default function SiteFooter() {
  return (
    <footer className="bg-secondary text-secondary-foreground">
      <div className="container mx-auto px-4 md:px-8 py-8 text-center">
        <p className="text-sm text-text-muted">
          &copy; {new Date().getFullYear()} Artisan Roast. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
