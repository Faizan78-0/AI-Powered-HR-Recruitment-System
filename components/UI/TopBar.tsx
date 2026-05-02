"use client";
import React, { useEffect } from "react";
import { useUser } from "@/context/userContext";
import { LuChevronDown, LuBell } from "react-icons/lu"; // Added LuBell
import Link from "next/link"; // For navigation

export default function TopBar() {
  const { user, userProfile, isCheckingAuth } = useUser();

  useEffect(() => {
    if (!user) {
      userProfile();
    }
  }, [userProfile, user]);

  if (isCheckingAuth && !user) {
    return <div className="h-16 border-b border-gray-200 dark:border-gray-800 animate-pulse bg-gray-50 dark:bg-gray-900 w-full" />;
  }

  return (
    <header className="h-16 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 flex items-center justify-between px-8 sticky top-0 z-30 transition-colors duration-300">
      <div className="flex-1" /> {/* Spacer */}
      
      <div className="flex items-center gap-2 sm:gap-5">
        
        {/* Notification Icon */}
        <button className="relative p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors group">
          <LuBell className="w-5 h-5 group-hover:text-blue-600 dark:group-hover:text-blue-400" />
          {/* Notification Badge Dot */}
          <span className="absolute top-2 right-2.5 w-2 h-2 bg-red-500 border-2 border-white dark:border-gray-950 rounded-full"></span>
        </button>

        {user ? (
          /* Profile Link - Redirects to /profile */
          <Link href="./setting" className="flex items-center gap-3 cursor-pointer group hover:bg-gray-50 dark:hover:bg-gray-900 p-1.5 rounded-xl transition-all duration-200 border border-transparent hover:border-gray-200 dark:hover:border-gray-800">
            
            {/* Profile Image / Avatar Container */}
            <div className="w-9 h-9 rounded-full bg-blue-600 dark:bg-blue-500 flex items-center justify-center font-bold overflow-hidden shadow-sm ring-2 ring-white dark:ring-gray-900">
              {user.imageUrl ? (
                <img 
                  src={user.imageUrl} 
                  className="w-full h-full object-cover" 
                  alt={user.Name} 
                />
              ) : (
                <span className="text-white text-sm">
                  {user.Name?.substring(0, 2).toUpperCase() || "U"}
                </span>
              )}
            </div>

            {/* User Info */}
            <div className="hidden sm:block">
              <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 leading-tight group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                {user.Name}
              </p>
              <p className="text-[11px] font-medium text-gray-500 dark:text-gray-400 capitalize">
                {user.role}
              </p>
            </div>
            
            <LuChevronDown className="text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors" />
          </Link>
        ) : (
          <a 
            href="/yz/login" 
            className="text-sm font-bold text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors"
          >
            Login
          </a>
        )}
      </div>
    </header>
  );
}