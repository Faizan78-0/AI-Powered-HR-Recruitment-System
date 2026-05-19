"use client";
import React, { useState, useRef, useEffect } from "react";
import { Bell, Mail, Smartphone, MessageSquare, Settings2 } from "lucide-react";

export default function NotificationSettings() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Trigger */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`relative p-2 rounded-full transition-all duration-200 ${
          isOpen 
            ? "bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400" 
            : "text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
        }`}
      >
        <Bell size={22} />
        <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 border-2 border-white dark:border-gray-950 rounded-full"></span>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-3 w-80 md:w-96 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-xl z-50 overflow-hidden transform origin-top-right transition-all">
          <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center">
            <h3 className="font-bold text-gray-900 dark:text-white">Quick Settings</h3>
            <button className="text-xs text-blue-600 font-semibold hover:underline">Mark all read</button>
          </div>

          <div className="max-h-[400px] overflow-y-auto">
            <QuickToggle label="New Applications" icon={<Mail size={16} />} defaultActive={true} />
            <QuickToggle label="Interview Reminders" icon={<Smartphone size={16} />} defaultActive={true} />
            <QuickToggle label="Candidate Messages" icon={<MessageSquare size={16} />} defaultActive={false} />
          </div>

          <div className="p-3 bg-gray-50 dark:bg-gray-800/50 text-center">
            <button className="text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-blue-600 flex items-center justify-center gap-2 w-full">
              <Settings2 size={14} />
              View All Preferences
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function QuickToggle({ label, icon, defaultActive }: { label: string; icon: React.ReactNode; defaultActive: boolean }) {
  const [active, setActive] = useState(defaultActive);

  return (
    <div className="flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg text-gray-600 dark:text-gray-300">
          {icon}
        </div>
        <span className="text-sm font-medium text-gray-700 dark:text-gray-200">{label}</span>
      </div>
      <button 
        onClick={() => setActive(!active)}
        className={`w-10 h-5 rounded-full relative transition-colors ${active ? "bg-emerald-500" : "bg-gray-300 dark:bg-gray-600"}`}
      >
        <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${active ? "left-6" : "left-1"}`} />
      </button>
    </div>
  );
}