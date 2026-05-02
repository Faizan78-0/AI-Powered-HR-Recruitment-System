"use client";
import React, { useEffect, useState } from "react";
import { LuTrendingUp, LuBriefcase, LuUsers, LuClock } from "react-icons/lu";
import Link from "next/link"; // Added this
import LoadingSpinner from "@/components/UI/LoadingSpinner";

export default  function DashboardOverview() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        // Fixed: Removed the extra slash from the path
        const response = await fetch("/api/recruiter/jobs");
        const jobs = await response.json();

        setData({
          stats: {
            activeJobs: jobs.length || 0,
            newCandidates: 0,
            interviews: 0,
            hireRate: 0,
          },
          applications: [],
        });
      } catch (error) {
        console.error("Dashboard fetch error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const stats = [
    {
      label: "Active Jobs",
      value: data?.stats?.activeJobs ?? "0",
      icon: <LuBriefcase />,
      color: "text-blue-600 cursor-pointer",
      bg: "bg-blue-100",
      path: "./jobs", // Update paths based on your actual routes
    },
    {
      label: "New Candidates",
      value: data?.stats?.newCandidates ?? "0",
      icon: <LuUsers />,
      color: "text-purple-600",
      bg: "bg-purple-100",
      path: "./candidates",
    },
    {
      label: "Interviews",
      value: data?.stats?.interviews ?? "0",
      icon: <LuClock />,
      color: "text-orange-600",
      bg: "bg-orange-100",
      path: "./interviews",
    },
    {
      label: "Hire Rate",
      value: data?.stats?.hireRate ?? "0%",
      icon: <LuTrendingUp />,
      color: "text-green-600",
      bg: "bg-green-100",
    },
  ];

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-8 p-4 sm:p-0">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <Link key={i} href={stat.path || "#"} className="block group">
            <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm transition-all hover:shadow-md hover:border-blue-400 dark:hover:border-blue-900 cursor-pointer">
              <div
                className={`w-12 h-12 ${stat.bg} ${stat.color} rounded-xl flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform`}
              >
                {stat.icon}
              </div>
              <p className="text-gray-500 text-sm font-medium">{stat.label}</p>
              <h3 className="text-2xl font-bold mt-1 dark:text-white">
                {stat.value}
              </h3>
            </div>
          </Link>
        ))}
      </div>

      {/* Recent Activity Table */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden shadow-sm cursor-pointer">
        <div className="p-6 border-b border-gray-100 dark:border-gray-800">
          <h2 className="text-lg font-bold dark:text-white">
            Recent Applications
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 dark:bg-gray-800/50 text-gray-500 text-sm">
              <tr>
                <th className="px-6 py-4">Candidate</th>
                <th className="px-6 py-4">Job Role</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Applied</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {data?.applications?.map((app: any) => (
                <tr
                  key={app.id}
                  className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors"
                >
                  <td className="px-6 py-4 font-medium dark:text-gray-200">
                    {app.candidateName}
                  </td>
                  <td className="px-6 py-4 text-gray-600 dark:text-gray-400">
                    {app.jobRole}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        app.status === "Hired"
                          ? "bg-green-100 text-green-700"
                          : "bg-yellow-100 text-yellow-700"
                      }`}
                    >
                      {app.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-500 text-sm">
                    {new Date(app.appliedAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
