"use client";
import { cn, APP_CFG, JOB_CFG, IV_CFG, initials } from "@/lib/validations";
import type { ApplicationStatus, JobStatus, InterviewStatus } from "@/types";
import { useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useUser } from "@/context/userContext";
import userProfile from "@/lib/userProfile";

export const AppBadge = ({ status }: { status: ApplicationStatus }) => {
  const c = APP_CFG[status];
  return <span className={cn("badge", c.bg, c.color)}>{c.label}</span>;
};
export const JobBadge = ({ status }: { status: JobStatus }) => {
  const c = JOB_CFG[status];
  return <span className={cn("badge", c.bg, c.color)}>{c.label}</span>;
};
export const IVBadge = ({ status }: { status: InterviewStatus }) => {
  const c = IV_CFG[status];
  return <span className={cn("badge", c.bg, c.color)}>{c.label}</span>;
};
export const Stars = ({ value, max = 5 }: { value: number; max?: number }) => (
  <div className="flex gap-0.5">
    {Array.from({ length: max }).map((_, i) => (
      <svg
        key={i}
        className={cn(
          "w-3.5 h-3.5",
          i < value ? "text-yellow-400" : "text-gray-200"
        )}
        fill="currentColor"
        viewBox="0 0 20 20"
      >
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
      </svg>
    ))}
  </div>
);

export const Empty = ({
  title,
  desc,
  action,
}: {
  title: string;
  desc?: string;
  action?: React.ReactNode;
}) => (
  <div className="flex flex-col items-center justify-center py-16 text-center px-4">
    <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center mb-4 text-gray-400">
      <svg
        className="w-7 h-7"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
        />
      </svg>
    </div>
    <h3 className="text-gray-900 font-semibold">{title}</h3>
    {desc && <p className="text-gray-500 text-sm mt-1 max-w-xs">{desc}</p>}
    {action && <div className="mt-4">{action}</div>}
  </div>
);
export const StatCard = ({
  label,
  value,
  icon,
  color = "blue",
  sub,
}: {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  color?: "blue" | "green" | "purple" | "orange" | "teal" | "violet" | "indigo";
  sub?: string;
}) => {
  const clrs = {
    blue: "bg-blue-50 text-blue-600",
    green: "bg-green-50 text-green-600",
    purple: "bg-purple-50 text-purple-600",
    orange: "bg-orange-50 text-orange-600",
    teal: "bg-teal-50 text-teal-600",
    violet: "bg-violet-50 text-violet-600",
    indigo: "bg-indigo-50 text-indigo-600",
  };
  return (
    <div className="card p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500 font-medium">{label}</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{value}</p>
          {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
        </div>
        <div
          className={cn(
            "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
            clrs[color]
          )}
        >
          {icon}
        </div>
      </div>
    </div>
  );
};
export function Modal({
  open,
  onClose,
  title,
  children,
  size = "md",
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
}) {
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (open) document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  }, [open, onClose]);
  if (!open) return null;
  const w = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-2xl",
    xl: "max-w-4xl",
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <div
        className={cn(
          "relative w-full bg-white rounded-2xl shadow-2xl fu max-h-[92vh] flex flex-col",
          w[size]
        )}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-900">{title}</h2>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>
      </div>
    </div>
  );
}
export function Confirm({
  open,
  onClose,
  onConfirm,
  title,
  message,
  loading,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  loading?: boolean;
}) {
  return (
    <Modal open={open} onClose={onClose} title={title} size="sm">
      <p className="text-sm text-gray-600 mb-5">{message}</p>
      <div className="flex gap-3">
        <button onClick={onClose} className="btn-secondary flex-1">
          Cancel
        </button>
        <button
          onClick={onConfirm}
          disabled={loading}
          className="btn-danger flex-1"
        >
          {loading ? "Deleting…" : "Delete"}
        </button>
      </div>
    </Modal>
  );
}

function RIcon({ path }: { path: string }) {
  return (
    <svg
      className="w-5 h-5"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.8}
        d={path}
      />
    </svg>
  );
}

export function RShell({
  children,
  title,
  actions,
}: {
  children: React.ReactNode;
  title?: string;
  actions?: React.ReactNode;
}) {
  const path = usePathname();
  const { user } = useUser();
  return (
    <div className="flex h-screen bg-white text-black dark:bg-gray-900 dark:text-white transition-colors duration-200">
      <aside className="fixed left-0 top-0 h-full w-60 bg-indigo-950 flex flex-col z-30">
        <div className="px-4 py-5 border-b border-indigo-900">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-indigo-500 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-900/50">
              <svg
                className="w-4 h-4 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
            </div>
          </div>
        </div>

        {user && (
          <div className="px-3 py-4 border-t border-indigo-900">
            <div className="flex items-center gap-3 px-2">
              <div className="w-8 h-8 bg-indigo-500 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                {initials(user.Name)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-medium truncate">
                  {user.Name}
                </p>
                <p className="text-indigo-400 text-xs truncate">
                  {user.role}
                </p>
              </div>
            </div>
          </div>
        )}
      </aside>
      <main className="flex-1 ml-60 flex flex-col min-h-screen overflow-auto">
        {(title || actions) && (
          <header className="sticky top-0 z-20 bg-white/80 backdrop-blur border-b border-gray-100 px-6 py-4">
            <div className="flex items-center justify-between">
              <h1
                className="text-lg font-bold text-gray-900"
                style={{ fontFamily: "Plus Jakarta Sans" }}
              >
                {title}
              </h1>
              {actions && <div className="flex gap-3">{actions}</div>}
            </div>
          </header>
        )}
        <div className="flex-1 p-6 fu">{children}</div>
      </main>
    </div>
  );
}