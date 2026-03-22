// Force dynamic rendering — auth pages call auth() and getSiteMetadata() (Prisma)
// which must never be prerendered. Without this, the nightly build fails with
// ECONNREFUSED when the DB is unavailable at build time.
export const dynamic = "force-dynamic";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
