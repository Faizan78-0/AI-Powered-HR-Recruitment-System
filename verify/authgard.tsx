"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    // 1. Check if the 'token' cookie exists in the browser
    const hasToken = document.cookie
      .split("; ")
      .find((row) => row.startsWith("token="));

    if (!hasToken) {
      // 2. No token? Send them to login
      router.replace("/login");
    } else {
      // 3. Token found! Let them in
      setIsAuthorized(true);
    }
  }, [router]);

  // Show a loading state while checking to prevent content flashing
  if (!isAuthorized) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Loading secure session...</p>
      </div>
    );
  }

  return <>{children}</>;
}