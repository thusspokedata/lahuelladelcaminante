"use client";

import { useEffect, useState, useRef } from "react";
import { useUserStore } from "@/stores/userStore";
import { useAuth, useUser } from "@clerk/nextjs";

interface UserProviderProps {
  children: React.ReactNode;
}

interface WindowWithDebug extends Window {
  __userDebug?: string;
}

export function UserProvider({ children }: UserProviderProps) {
  const { isLoaded: isClerkLoaded, isSignedIn } = useAuth();
  const { user } = useUser();
  const { loadUserData, clearUserData } = useUserStore();
  const [debugMessage, setDebugMessage] = useState<string>("Initializing");

  // Reference to track if we've already tried to load user data
  const hasAttemptedDataLoad = useRef(false);

  useEffect(() => {
    // Only attempt to load user data if Clerk is loaded
    if (!isClerkLoaded) {
      setDebugMessage("Clerk not loaded yet");
      return;
    }

    // Prevent multiple load attempts
    if (hasAttemptedDataLoad.current) {
      return;
    }

    if (isSignedIn && user) {
      // User is authenticated with Clerk, load extended user data
      setDebugMessage(`Trying to load user data for ${user.id}`);
      hasAttemptedDataLoad.current = true;

      loadUserData()
        .then(() => setDebugMessage("User data loaded"))
        .catch((err) => setDebugMessage(`Error loading user data: ${err.message}`));
    } else if (isClerkLoaded) {
      // User is not authenticated, clear any stored data
      setDebugMessage("User not authenticated, clearing data");
      hasAttemptedDataLoad.current = true;
      clearUserData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isClerkLoaded, isSignedIn]); // Remove user, loadUserData, and clearUserData from dependencies

  // For debugging purposes only - remove in production
  if (typeof window !== "undefined") {
    (window as WindowWithDebug).__userDebug = debugMessage;
  }

  return <>{children}</>;
}

export default UserProvider;
