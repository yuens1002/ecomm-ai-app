"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";

interface FooterAccountLinksProps {
  isAdmin?: boolean;
}

export default function FooterAccountLinks({ isAdmin = false }: FooterAccountLinksProps) {
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
          {isAdmin && (
            <li>
              <Link
                href="/admin"
                className="text-sm hover:underline hover:text-primary transition-colors"
              >
                Admin Dashboard
              </Link>
            </li>
          )}
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
