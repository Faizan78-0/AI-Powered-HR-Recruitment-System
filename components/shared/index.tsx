"use client";
import { cn, APP_CFG, JOB_CFG, IV_CFG, initials } from "@/lib/validations";
import type { ApplicationStatus, JobStatus, InterviewStatus } from "@/types";
import { useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useUser } from "@/context/userContext";

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
// export const Spinner = ({ className }: { className?: string }) => (
//   <div className={cn("flex items-center justify-center py-12", className)}>
//     <div className="w-8 h-8 border-2 border-gray-200 border-t-indigo-600 rounded-full animate-spin" />
//   </div>
// );
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

// ── Recruiter Shell ──────────────────────────────────────────────────────────
// const RNAV: { href: string; label: string; icon: string; badge?: string }[] = [
//   {
//     href: "/recruiter/dashboard",
//     label: "Dashboard",
//     icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6",
//   },
//   {
//     href: "/recruiter/jobs",
//     label: "Jobs",
//     icon: "M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z",
//   },
//   {
//     href: "/recruiter/candidates",
//     label: "Candidates",
//     icon: "M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z",
//   },
//   {
//     href: "/recruiter/applications",
//     label: "Applications",
//     icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z",
//   },
//   {
//     href: "/recruiter/interviews",
//     label: "Interviews",
//     icon: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z",
//   },
//   {
//     href: "/recruiter/departments",
//     label: "Departments",
//     icon: "M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4",
//   },
//   {
//     href: "/recruiter/resume-analyzer",
//     label: "Resume Analyzer",
//     icon: "M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z",
//     badge: "AI",
//   },
//   {
//     href: "/recruiter/settings",
//     label: "Settings",
//     icon: "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z",
//   },
// ];

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
  const { user, } = useUser();
  return (
    <div className="flex h-screen bg-slate-100">
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
            {/* <div>
              <p
                className="text-white font-bold text-sm"
                style={{ fontFamily: "Plus Jakarta Sans" }}
              >
                HR-Recruiter
              </p>
              <p className="text-indigo-400 text-xs">Recruiter Portal</p>
            </div> */}
          </div>
        </div>
        {/* <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {RNAV.map((item) => {
            const on = path === item.href || path.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all",
                  on
                    ? "bg-white text-indigo-700 shadow-sm font-semibold"
                    : "text-slate-400 hover:bg-white/10 hover:text-white"
                )}
              >
                <span className={on ? "text-indigo-600" : "text-indigo-500"}>
                  <RIcon path={item.icon} />
                </span>
                <span className="flex-1">{item.label}</span>
                {item.badge && (
                  <span className="px-1.5 py-0.5 bg-indigo-500 text-white text-xs font-bold rounded-md leading-none">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav> */}
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
                  {user.recruiterProfile?.company || "Recruiter"}
                </p>
              </div>
              {/* <button
                onClick={}
                className="text-indigo-500 hover:text-red-400 transition-colors"
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
                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                  />
                </svg>
              </button> */}
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

// ── Job Seeker Shell ─────────────────────────────────────────────────────────
// const JSNAV = [
//   {
//     href: "/jobseeker/dashboard",
//     label: "Dashboard",
//     icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6",
//   },
//   {
//     href: "/jobseeker/jobs",
//     label: "Browse Jobs",
//     icon: "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z",
//   },
//   {
//     href: "/jobseeker/applications",
//     label: "My Applications",
//     icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z",
//   },
//   {
//     href: "/jobseeker/profile",
//     label: "My Profile",
//     icon: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z",
//   },
//   {
//     href: "/jobseeker/settings",
//     label: "Settings",
//     icon: "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z",
//   },
// ];

// export function JSShell({
//   children,
//   title,
//   actions,
// }: {
//   children: React.ReactNode;
//   title?: string;
//   actions?: React.ReactNode;
// }) {
//   const path = usePathname();
//   const { user, logout } = useAuth();
//   return (
//     <div className="flex h-screen bg-slate-100">
//       <aside className="fixed left-0 top-0 h-full w-60 bg-violet-950 flex flex-col z-30">
//         <div className="px-4 py-5 border-b border-violet-900">
//           <div className="flex items-center gap-3">
//             <div className="w-8 h-8 bg-violet-500 rounded-xl flex items-center justify-center shadow-lg shadow-violet-900/50">
//               <svg
//                 className="w-4 h-4 text-white"
//                 fill="none"
//                 stroke="currentColor"
//                 viewBox="0 0 24 24"
//               >
//                 <path
//                   strokeLinecap="round"
//                   strokeLinejoin="round"
//                   strokeWidth={2}
//                   d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
//                 />
//               </svg>
//             </div>
//             <div>
//               <p
//                 className="text-white font-bold text-sm"
//                 style={{ fontFamily: "Plus Jakarta Sans" }}
        //       >
        //         HR-Recruiter
        //       </p>
        //       <p className="text-violet-400 text-xs">Job Seeker Portal</p>
        //     </div>
        //   </div>
        // </div>
        // <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        //   {JSNAV.map((item) => {
        //     const on = path === item.href || path.startsWith(item.href + "/");
        //     return (
        //       <Link
        //         key={item.href}
        //         href={item.href}
        //         className={cn(
        //           "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all",
        //           on
        //             ? "bg-white text-violet-700 shadow-sm font-semibold"
        //             : "text-slate-400 hover:bg-white/10 hover:text-white"
        //         )}
        //       >
        //         <span className={on ? "text-violet-600" : "text-violet-500"}>
        //           <RIcon path={item.icon} />
        //         </span>
        //         {item.label}
        //       </Link>
        //     );
        //   })}
        // </nav>
        // {user && (
        //   <div className="px-3 py-4 border-t border-violet-900">
        //     <div className="flex items-center gap-3 px-2">
        //       <div className="w-8 h-8 bg-violet-500 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
        //         {initials(user.name)}
        //       </div>
        //       <div className="flex-1 min-w-0">
        //         <p className="text-white text-sm font-medium truncate">
        //           {user.name}
        //         </p>
        //         <p className="text-violet-400 text-xs truncate">
        //           {user.jobSeekerProfile?.headline || "Job Seeker"}
        //         </p>
        //       </div>
        //       <button
        //         onClick={logout}
        //         className="text-violet-500 hover:text-red-400 transition-colors"
        //       >
        //         <svg
        //           className="w-4 h-4"
        //           fill="none"
        //           stroke="currentColor"
        //           viewBox="0 0 24 24"
        //         >
                  {/* <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                  />
                </svg>
              </button>
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
} */}