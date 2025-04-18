"use client";

import { useEffect } from "react";
import { useUser } from "@clerk/nextjs";

export function UserSync() {
  const { isLoaded, isSignedIn, user } = useUser();

  useEffect(() => {
    if (isLoaded && isSignedIn && user) {
      const syncUser = async () => {
        try {
          // Get primary email
          const primaryEmail = user.primaryEmailAddress?.emailAddress;
          if (!primaryEmail) {
            console.warn("User without primary email");
            return;
          }

          // Call our API route to sync user
          const response = await fetch(`/api/sync-user`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              email: primaryEmail,
              firstName: user.firstName || undefined,
              lastName: user.lastName || undefined,
            }),
          });

          const data = await response.json();

          if (response.ok) {
            console.log(data.message);
          } else {
            console.error("Error syncing user:", data.error);
          }
        } catch (error) {
          console.error("Error synchronizing user:", error);
        }
      };

      syncUser();
    }
  }, [isLoaded, isSignedIn, user]);

  // This component doesn't render anything visible
  return null;
}
