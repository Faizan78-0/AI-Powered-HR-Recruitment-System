import ChatBot from "@/components/UI/ChatBot";
import LoadingSpinner from "@/components/UI/LoadingSpinner";
import JobLayout from "@/components/UI/JobLayout";
import TopBar from "@/components/UI/TopBar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen w-full bg-gray-50 dark:bg-black overflow-hidden">
      <JobLayout />

      <div className="flex flex-col flex-1 min-w-0 h-full relative">
        <TopBar />

        <main className="flex-1 overflow-y-auto p-6 lg:p-10 custom-scrollbar">
          <div className="max-w-350 mx-auto w-full">{children}</div>
        </main>
        <ChatBot />
      </div>
    </div>
  );
}
