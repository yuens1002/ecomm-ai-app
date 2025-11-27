"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";

export default function FooterAccountLinks() {
  const { data: session } = useSession();

  return (
    <>
      {session ? (
        <>
          <li>
            <Link
              href="/account"
              className="text-sm hover:underline hover:text-primary transition-colors"
            >
              My Account
            </Link>
          </li>
          <li>
            <Link
              href="/orders"
              className="text-sm hover:underline hover:text-primary transition-colors"
            >
              Order History
            </Link>
          </li>
          <li>
            <Link
              href="/api/auth/signout"
              className="text-sm hover:underline hover:text-primary transition-colors"
            >
              Sign Out
            </Link>
          </li>
        </>
      ) : (
        <li>
          <Link
            href="/auth/signin"
            className="text-sm hover:underline hover:text-primary transition-colors"
          >
            Sign In
          </Link>
        </li>
      )}
    </>
  );
}
