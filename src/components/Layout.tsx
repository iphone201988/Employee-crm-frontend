import { Sidebar } from "@/components/Sidebar";
import { ReactNode, useState } from "react";
import { Menu, X } from "lucide-react";
import CompanyAccessBanner from "./CompanyAccessBanner";

interface LayoutProps {
  children: ReactNode;
}

export const Layout = ({ children }: LayoutProps) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState<Boolean>(false);

  const toggleSidebar = ():void => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const closeSidebar = () => {
    setIsSidebarOpen(false);
  };

  return (
    <div className="flex h-screen bg-background">
      <button
        onClick={toggleSidebar}
        className="fixed top-4 left-4 z-50 lg:hidden p-2 rounded-md bg-sidebar text-sidebar-foreground hover:bg-sidebar-accent transition-colors"
        aria-label="Toggle sidebar"
      >
        {isSidebarOpen ? (
          <X className="w-6 h-6" />
        ) : (
          <Menu className="w-6 h-6" />
        )}
      </button>

      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={closeSidebar}
        />
      )}

      <div
        className={`
          fixed lg:static inset-y-0 left-0 z-50
          transform transition-transform duration-300 ease-in-out
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0
        `}
      >
        <Sidebar onClose={closeSidebar} />
      </div>
      <main className="flex-1 h-screen overflow-y-auto p-6 lg:ml-0">
        <CompanyAccessBanner />
        {children}
      </main>
    </div>
  );
};
