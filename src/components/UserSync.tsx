"use client";

import { useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { createUser, getUserByClerkId } from "@/services/users";

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

          // Check if user exists in database
          const existingUser = await getUserByClerkId(user.id);

          // If user doesn't exist, create it
          if (!existingUser) {
            console.log("Creating user in database...");
            await createUser({
              clerkId: user.id,
              email: primaryEmail,
              firstName: user.firstName || undefined,
              lastName: user.lastName || undefined,
            });
            console.log("User successfully synchronized");
          } else {
            console.log("User already exists in database");
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
