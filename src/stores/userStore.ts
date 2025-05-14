import { create } from "zustand";
import { persist } from "zustand/middleware";

type UserRole = "USER" | "ADMIN" | "ARTIST";
type UserStatus = "ACTIVE" | "PENDING" | "BLOCKED";

interface UserState {
  // User data
  id: string | null;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  role: UserRole | null;
  status: UserStatus | null;

  // Auth state
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  // Permissions
  canCreateEvents: boolean;

  // Actions
  loadUserData: () => Promise<void>;
  clearUserData: () => void;
}

export const useUserStore = create<UserState>()(
  persist(
    (set, _) => ({
      // Initial state
      id: null,
      firstName: null,
      lastName: null,
      email: null,
      role: null,
      status: null,

      isAuthenticated: false,
      isLoading: false,
      error: null,

      canCreateEvents: false,

      // Load user data from the API endpoint
      loadUserData: async () => {
        // If already loading, prevent duplicate requests
        if (useUserStore.getState().isLoading) {
          console.log("Already loading user data, skipping duplicate request");
          return;
        }

        set({ isLoading: true, error: null });
        console.log("Store: Loading user data from API");

        try {
          // Add timestamp to prevent caching
          const timestamp = new Date().getTime();
          const response = await fetch(`/api/user?t=${timestamp}`, {
            credentials: "include", // Ensure cookies are sent with the request
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || "Error fetching user data");
          }

          const userData = await response.json();

          if (userData) {
            set({
              id: userData.id,
              firstName: userData.firstName,
              lastName: userData.lastName,
              email: userData.email,
              role: userData.role as UserRole,
              status: userData.status as UserStatus,
              isAuthenticated: true,
              canCreateEvents: userData.canCreateEvents,
              isLoading: false,
            });
          } else {
            set({
              isAuthenticated: false,
              error: "No user data received",
              canCreateEvents: false,
              isLoading: false,
            });
          }
        } catch (error: unknown) {
          console.error("Store: Error loading user data:", error);
          set({
            error: error instanceof Error ? error.message : "Error loading user data",
            isAuthenticated: false,
            canCreateEvents: false,
            isLoading: false,
          });
        }
      },

      // Clear user data (on logout)
      clearUserData: () => {
        set({
          id: null,
          firstName: null,
          lastName: null,
          email: null,
          role: null,
          status: null,
          isAuthenticated: false,
          error: null,
          canCreateEvents: false,
          isLoading: false,
        });
      },
    }),
    {
      name: "user-storage", // name of the item in localStorage
      partialize: (state) => ({
        // Only persist these fields
        id: state.id,
        firstName: state.firstName,
        lastName: state.lastName,
        email: state.email,
        role: state.role,
        status: state.status,
        isAuthenticated: state.isAuthenticated,
        canCreateEvents: state.canCreateEvents,
      }),
    }
  )
);

// Hook to check if user can create events
export const useCanCreateEvents = () => {
  const canCreateEvents = useUserStore((state) => state.canCreateEvents);
  return canCreateEvents;
};

// Hook to get user authentication status
export const useIsAuthenticated = () => {
  const isAuthenticated = useUserStore((state) => state.isAuthenticated);
  return isAuthenticated;
};

// Hook to get user loading status
export const useIsLoadingUser = () => {
  const isLoading = useUserStore((state) => state.isLoading);
  return isLoading;
};
