"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { RiSunLine, RiMoonLine, RiComputerLine } from "react-icons/ri";

const ThemeSwitcher = () => {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  const current = theme === "system" ? resolvedTheme : theme;

  const options = [
    { name: "Light", icon: <RiSunLine />, value: "light" },
    { name: "Dark", icon: <RiMoonLine />, value: "dark" },
    { name: "System", icon: <RiComputerLine />, value: "system" },
  ];

  return (
    <div className="fixed top-4 right-4 z-50">
      {/* Main button */}
      <button
        onClick={() => setOpen(!open)}
        className="p-3 rounded-full   transition flex items-center justify-center cursor-pointer shadow-md"
      >
        {current === "dark" ? <RiMoonLine size={20} /> : <RiSunLine size={20} />}
      </button>

      {/* Dropdown */}
      {open && (
        <div className="mt-2 w-44 flex flex-col bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg shadow-lg">
          {options.map((opt) => (
            <button
              key={opt.value}
              onClick={() => {
                setTheme(opt.value);
                setOpen(false);
              }}
              className="flex items-center gap-2 px-4 py-2 text-sm text-gray-900 dark:text-gray-100  dark:hover:bg-gray-700 cursor-pointer transition"
            >
              {opt.icon} {opt.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default ThemeSwitcher;
