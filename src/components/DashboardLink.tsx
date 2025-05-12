"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { PendingUserModal } from "@/components/PendingUserModal";
import Link from "next/link";

export function DashboardLink() {
  const [userStatus, setUserStatus] = useState<string | null>(null);
  const [showPendingModal, setShowPendingModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkUserStatus = async () => {
      try {
        const response = await fetch("/api/auth/check-status");
        if (response.ok) {
          const data = await response.json();
          setUserStatus(data.status);
        }
      } catch (error) {
        console.error("Error checking user status:", error);
      } finally {
        setIsLoading(false);
      }
    };

    checkUserStatus();
  }, []);

  const handleDashboardClick = (e: React.MouseEvent) => {
    if (userStatus === "PENDING") {
      e.preventDefault();
      setShowPendingModal(true);
    }
  };

  if (isLoading) {
    // Don't show anything while loading to prevent UI flicker
    return null;
  }

  return (
    <>
      <Link href="/dashboard" onClick={handleDashboardClick}>
        <Button variant="outline">Dashboard</Button>
      </Link>

      <PendingUserModal open={showPendingModal} onOpenChange={setShowPendingModal} />
    </>
  );
}
