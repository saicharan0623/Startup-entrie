"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";

/**
 * Wrap any page that requires login.
 * If adminOnly is true, also checks for admin role.
 */
export default function RequireAuth({
  children,
  adminOnly = false,
}: {
  children: React.ReactNode;
  adminOnly?: boolean;
}) {
  const { isLoggedIn, isAdmin } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoggedIn) {
      router.replace("/login");
      return;
    }
    if (adminOnly && !isAdmin) {
      router.replace("/dashboard");
    }
  }, [isLoggedIn, isAdmin, adminOnly, router]);

  if (!isLoggedIn) return null;
  if (adminOnly && !isAdmin) return null;

  return <>{children}</>;
}
