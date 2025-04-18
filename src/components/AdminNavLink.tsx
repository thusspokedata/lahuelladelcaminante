"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Shield } from "lucide-react";

export function AdminNavLink() {
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    // Check if the user is an administrator
    const checkAdmin = async () => {
      try {
        const response = await fetch("/api/auth/check-admin");
        if (response.ok) {
          const data = await response.json();
          setIsAdmin(data.isAdmin);
        }
      } catch (error) {
        console.error("Error checking admin role:", error);
      }
    };

    checkAdmin();
  }, []);

  // Don't render anything if not an administrator
  if (!isAdmin) return null;

  return (
    <Link href="/admin/users">
      <Button variant="outline" className="flex items-center gap-2">
        <Shield size={16} />
        <span>Admin</span>
      </Button>
    </Link>
  );
}
