// components/Layout.tsx
import { Sidebar } from "@/components/Sidebar";
import { ReactNode } from "react";

interface LayoutProps {
  children: ReactNode;
}

export const Layout = ({ children }: LayoutProps) => {
  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <main className="flex-1 h-screen overflow-y-auto">
        {children}
      </main>
    </div>
  );
};
