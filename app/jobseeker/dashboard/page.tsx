"use client";

import React, { useEffect, useState } from "react";
import { LuTrendingUp, LuBriefcase, LuBookmark, } from "react-icons/lu";
import { LucideCheckCircle } from "lucide-react";
import Link from "next/link";
import LoadingSpinner from "@/components/UI/LoadingSpinner";

export default function JobSeekerDashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        // Fetching Job Seeker specific applications
        const response = await fetch("/api/jobseeker/jobs"); 
        const applications = await response.json();
        
        setData({
          stats: {
            appliedJobs: applications.length || 0,
            interviews: 0, // Placeholder for real data
            savedJobs: 0,
            matchRate: "",
          },
          recentApplications: applications.slice(0, 5) // Last 5 applications
        });
      } catch (error) {
        console.error("JobSeeker Dashboard fetch error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const stats = [
    {
      label: "Applied Jobs",
      value: data?.stats?.appliedJobs ?? "0",
      icon: <LuBriefcase />,
      color: "text-blue-600 cursor-pointer",
      bg: "bg-blue-100",
      path: "./jobs", 
    },
    {
      label: "Interviews",
      value: data?.stats?.interviews ?? "0",
      icon: <LucideCheckCircle />,
      color: "text-purple-600",
      bg: "bg-purple-100",
      path: "./interviews", 
    },
    {
      label: "Saved Jobs",
      value: data?.stats?.savedJobs ?? "0",
      icon: <LuBookmark />,
      color: "text-orange-600",
      bg: "bg-orange-100",
      path: "./saved",
    },
    {
      label: "Profile Match",
      value: data?.stats?.matchRate ?? "0%",
      icon: <LuTrendingUp />,
      color: "text-green-600",
      bg: "bg-green-100",
      path: "./profile",
    },
  ];

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-8 p-4 sm:p-0">
      {/* Stats Grid - Identical to Recruiter UI */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <Link 
            key={i} 
            href={stat.path || "#"} 
            className="block group"
          >
            <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm transition-all hover:shadow-md hover:border-blue-400 dark:hover:border-blue-900 cursor-pointer">
              <div className={`w-12 h-12 ${stat.bg} ${stat.color} rounded-xl flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform`}>
                {stat.icon}
              </div>
              <p className="text-gray-500 text-sm font-medium">{stat.label}</p>
              <h3 className="text-2xl font-bold mt-1 dark:text-white">{stat.value}</h3>
            </div>
          </Link>
        ))}
      </div>

      {/* Recent Applications Table - Identical to Recruiter UI */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden shadow-sm cursor-pointer">
        <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center">
          <h2 className="text-lg font-bold dark:text-white">My Recent Applications</h2>
          <Link href="./applications" className="text-sm text-blue-500 hover:underline">View All</Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 dark:bg-gray-800/50 text-gray-500 text-sm">
              <tr>
                <th className="px-6 py-4">Company</th>
                <th className="px-6 py-4">Position</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Applied On</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {data?.recentApplications?.length > 0 ? (
                data.recentApplications.map((app: any) => (
                  <tr
                    key={app.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors"
                  >
                    <td className="px-6 py-4 font-medium dark:text-gray-200">
                      {app.companyName || "N/A"}
                    </td>
                    <td className="px-6 py-4 text-gray-600 dark:text-gray-400">
                      {app.jobRole}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          app.status === "Interviewing"
                            ? "bg-blue-100 text-blue-700"
                            : app.status === "Accepted"
                            ? "bg-green-100 text-green-700"
                            : "bg-yellow-100 text-yellow-700"
                        }`}
                      >
                        {app.status || "Pending"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-500 text-sm">
                      {new Date(app.appliedAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-6 py-10 text-center text-gray-500">
                    No applications found. <Link href="/jobs" className="text-blue-500">Find jobs</Link>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
