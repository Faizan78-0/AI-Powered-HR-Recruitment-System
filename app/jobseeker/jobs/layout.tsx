import ChatBot from "@/components/UI/ChatBot";
import LoadingSpinner from "@/components/UI/LoadingSpinner";
import JobLayout from "@/components/UI/JobLayout"
import TopBar from "@/components/UI/TopBar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // h-screen locks the height to the viewport
    // overflow-hidden prevents the body from scrolling
    <div className="flex h-screen w-full bg-gray-50 dark:bg-black overflow-hidden">
      
      {/* 1. Sidebar: Fixed width, won't shrink */}
      <JobLayout />

      {/* 2. Main Wrapper: flex-1 takes up remaining space */}
      <div className="flex flex-col flex-1 min-w-0 h-full relative">
        
        {/* 3. TopBar: Fixed at the top of the content area */}
        <TopBar />

        {/* 4. Scrollable Content: This is the only part that moves */}
        <main className="flex-1 overflow-y-auto p-6 lg:p-10 custom-scrollbar">
          <div className="max-w-350 mx-auto w-full">
            {children}
          </div>
        </main>
        < ChatBot />
        
      </div>
    </div>
  );
}