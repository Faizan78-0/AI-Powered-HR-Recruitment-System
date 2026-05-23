"use client";
import React, { createContext, useContext, useState, useCallback } from "react";
import { User } from "@/types/index";

// interface User {
//   recruiterProfile: any;
//   Name: string;
//   role: string;
//   imageUrl?: string;
// }

interface UserContextType {
  user: User | null;
  isCheckingAuth: boolean;
  userProfile: () => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  const userProfile = useCallback(async () => {
    setIsCheckingAuth(true);
    try {
      // Use absolute path starting with /
      const response = await fetch("/api/auth/bx/user-profile", {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });

      if (response.ok) {
        const data = await response.json();
        setUser(data);
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error("Failed to fetch profile:", error);
      setUser(null);
    } finally {
      setIsCheckingAuth(false);
    }
  }, []);

  return (
    <UserContext.Provider value={{ user, isCheckingAuth, userProfile }}>
      {children}
    </UserContext.Provider>
  );
}

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) throw new Error("useUser must be used within a UserProvider");
  return context;
};
