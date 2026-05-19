"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LuLayoutDashboard,
  LuUsers,
  LuBriefcase,
  LuCalendarCheck,
  LuLogOut,
  LuChevronLeft,
  LuSettings, // Import Settings Icon
} from "react-icons/lu";

import {  useAuthStore } from "@/Authstore/store";
import toast from "react-hot-toast";
import { BsChat } from "react-icons/bs";
import { MdOutlineAssignmentInd } from "react-icons/md";
import {  ZapIcon } from "lucide-react";

interface MenuItem {
  name: string;
  path: string;
  icon: React.ReactNode;
}

const menuItems: MenuItem[] = [
  { name: "Overview", path: "./dashboard", icon: <LuLayoutDashboard /> },
  { name: "Jobs", path: "./jobs", icon: <LuBriefcase /> },
  { name: "Candidates", path: "./candidates", icon: <LuUsers /> },
  { name: "Interviews", path: "./interviews", icon: <LuCalendarCheck /> },
  { name: "Chats", path: "./chat", icon: <BsChat /> },
  {
    name: "Analyze Resume",
    path: "./analyze-resume",
    icon: <MdOutlineAssignmentInd />,
  },
];

export default function SideBar() {
  const pathname = usePathname();
  const router = useRouter();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { logout } = useAuthStore();

  const handleLogout = async () => {
    try {
      await logout();
      toast.success("Logout successfully");
      router.push("/");
    } catch (err) {
      toast.error("Logout failed");
    }
  };

  return (
    <aside
      className={`relative h-full bg-white dark:bg-gray-950 border-r border-gray-200 dark:border-gray-800 flex flex-col shrink-0 z-40 transition-all duration-300 ease-in-out ${
        isCollapsed ? "w-20" : "w-64"
      }`}
    >
      {/* Toggle Button */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-3 top-10 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-full p-1 text-gray-500 hover:text-blue-600 shadow-sm z-50 transition-transform cursor-pointer"
      >
        <LuChevronLeft
          className={`transition-transform duration-300 ${
            isCollapsed ? "rotate-180" : ""
          }`}
        />
      </button>

      {/* Logo Section */}
      <div
        className={`p-8 transition-all duration-300 ${
          isCollapsed ? "px-6" : "px-8"
        }`}
      >
        <div className="text-2xl font-black text-blue-600 tracking-tighter flex items-center gap-2">
        <ZapIcon width={40} height={40} />
          <span className="shrink-0">HR</span>
          {!isCollapsed && (
            <span className="animate-in fade-in duration-500">_RECRUITER</span>
          )}
        </div>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 px-4 space-y-1.5 overflow-y-auto custom-scrollbar">
        {menuItems.map((item) => {
          const isActive =
            item.path === "/dashboard"
              ? pathname === "/dashboard"
              : pathname.startsWith(item.path);
          return (
            <Link
              key={item.path}
              href={item.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group overflow-hidden ${
                isActive
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-500/20"
                  : "text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-900 hover:text-gray-900 dark:hover:text-white"
              }`}
            >
              <span
                className={`text-xl shrink-0 ${
                  isActive
                    ? "text-white"
                    : "text-gray-400 group-hover:text-blue-500"
                }`}
              >
                {item.icon}
              </span>
              <span
                className={`font-semibold text-sm whitespace-nowrap transition-opacity duration-300 ${
                  isCollapsed ? "opacity-0 w-0" : "opacity-100"
                }`}
              >
                {item.name}
              </span>
            </Link>
          );
        })}
      </nav>

      {/* Bottom Action Section (Settings & Logout) */}
      <div className="p-4 border-t border-gray-100 dark:border-gray-800 space-y-1">
        {/* Settings Link */}
        <Link
          href="./setting"
          className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group overflow-hidden ${
            pathname === "/setting"
              ? "bg-gray-100 dark:bg-gray-900 text-blue-600"
              : "text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-900"
          }`}
        >
          <LuSettings
            className={`text-xl shrink-0 ${
              pathname === "./settings"
                ? "text-blue-600"
                : "group-hover:text-blue-500"
            }`}
          />
          <span
            className={`font-semibold text-sm whitespace-nowrap transition-opacity duration-300 ${
              isCollapsed ? "opacity-0 w-0" : "opacity-100"
            }`}
          >
            Settings
          </span>
        </Link>

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-3 w-full text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-colors font-medium text-sm cursor-pointer overflow-hidden"
        >
          <LuLogOut className="text-xl shrink-0" />
          <span
            className={`transition-opacity duration-300 whitespace-nowrap ${
              isCollapsed ? "opacity-0 w-0" : "opacity-100"
            }`}
          >
            Logout
          </span>
        </button>
      </div>
    </aside>
  );
}
