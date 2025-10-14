import {
  Clock,
  FileText,
  Users,
  Briefcase,
  CreditCard,
  BarChart3,
  UserCheck,
  Settings,
  LogOut,
  Pencil,
  GroupIcon,
  ArrowLeft,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useLogoutMutation } from "@/store/authApi";
import { useAuthContext } from "@/context/AuthContext";
import { useSuperAdminContext } from "@/context/SuperAdminContext";
import {
  useGetCurrentUserQuery,
  useUpdateProfileImageMutation,
} from "../store/authApi";
import { useRef, ChangeEvent, useMemo } from "react";
import { store } from "@/store/store";
import { authApi } from "@/store/authApi";
import { categoryApi } from "@/store/categoryApi";
import { teamApi } from "@/store/teamApi";
import { clientApi } from "@/store/clientApi";
import { jobApi } from "@/store/jobApi";
import { companiesApi } from "@/store/companiesApi";
import { timesheetApi } from "@/store/timesheetApi";

const baseNavigation = [
  { name: "Time", icon: Clock, href: "/" },
  { name: "WIP & Debtors", icon: FileText, href: "/wip-debtors" },
  { name: "Clients", icon: Users, href: "/clients" },
  { name: "Jobs", icon: Briefcase, href: "/jobs" },
  { name: "Expenses", icon: CreditCard, href: "/expenses" },
  { name: "Reports", icon: BarChart3, href: "/reports" },
  { name: "Team", icon: UserCheck, href: "/team" },
  { name: "Companies Accounts", icon: GroupIcon, href: "/business-accounts" },
  { name: "Settings", icon: Settings, href: "/settings" },
];

export interface SidebarProps {
  onClose?: () => void;
}

export function Sidebar({ onClose }: SidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { clearCredentials } = useAuthContext();
  const { isSuperAdminMode, switchBackToSuperAdmin, isAccessingCompany }:any = useSuperAdminContext();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [logout, { isLoading: isLoggingOut }] = useLogoutMutation();
  const { data: user }: any = useGetCurrentUserQuery();
  const [updateProfileImage, { isLoading: isUploading }] =
    useUpdateProfileImageMutation();

  const loggedInUser = user?.data;
  const logdInUserRole = loggedInUser?.role;

  // Corrected filtering logic
  const filteredNavigation = useMemo(() => {
    const isUserSuperAdmin = logdInUserRole === "superAdmin";

    // If the user is a superAdmin and in super admin mode, only show these specific tabs
    if (isUserSuperAdmin && isSuperAdminMode) {
      const superAdminTabs = ["Companies Accounts"];
      return baseNavigation.filter((item) =>
        superAdminTabs.includes(item.name)
      );
    }

    // Otherwise, for regular users or when accessing company, filter out admin tabs and apply other rules
    const reportTabPermission = loggedInUser?.features?.reports;
    const adminOnlyTabs = ["Companies Accounts"];

    return baseNavigation.filter((item) => {
      // Exclude admin-only tabs for non-admins or when accessing company
      if (adminOnlyTabs.includes(item.name)) {
        return false;
      }

      // Special rule for the "Reports" tab
      if (item.name === "Reports") {
        return !!reportTabPermission;
      }

      // Otherwise, show the item
      return true;
    });
  }, [logdInUserRole, loggedInUser?.features?.reports, isSuperAdminMode]);

  const handleLogout = async () => {
    try {
      // Call logout API first
      await logout().unwrap();
    } catch (error) {
      console.error('Logout API call failed:', error);
      // Continue with local cleanup even if API call fails
    }

    // Clear all RTK Query caches
    store.dispatch(authApi.util.resetApiState());
    store.dispatch(categoryApi.util.resetApiState());
    store.dispatch(teamApi.util.resetApiState());
    store.dispatch(clientApi.util.resetApiState());
    store.dispatch(jobApi.util.resetApiState());
    store.dispatch(companiesApi.util.resetApiState());
    store.dispatch(timesheetApi.util.resetApiState());

    // Clear all localStorage items
    localStorage.clear();

    // Clear context states
    clearCredentials();

    // Navigate to login and close sidebar
    navigate("/login");
    onClose?.();

    // Reload the page to ensure complete state reset
    window.location.reload();
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      await updateProfileImage(file).unwrap();
    } catch (error) {
      console.error("Failed to update profile image:", error);
    }
  };

  return (
    <div className="flex h-screen w-64 flex-col justify-between bg-sidebar">
      <div>
        <div className="flex items-center gap-3 p-6 border-b border-sidebar-border">
          <div className="relative">
            <Avatar className="w-8 h-8">
              <AvatarImage
                src={
                  loggedInUser?.avatarUrl
                    ? `${import.meta.env.VITE_BACKEND_BASE_URL}${
                        loggedInUser.avatarUrl
                      }`
                    : undefined
                }
              />
              <AvatarFallback>
                {loggedInUser?.name
                  ? loggedInUser.name.charAt(0).toUpperCase()
                  : "U"}
              </AvatarFallback>
            </Avatar>
            <button
              onClick={handleAvatarClick}
              disabled={isUploading}
              className="absolute -bottom-1 -right-1 flex items-center justify-center w-5 h-5 bg-sidebar-accent rounded-full border-2 border-sidebar text-sidebar-accent-foreground hover:bg-sidebar-accent/80 transition-colors"
              aria-label="Update profile image"
            >
              <Pencil className="w-3 h-3" />
            </button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
              accept="image/png, image/jpeg, image/gif"
            />
          </div>
          <span className="text-sidebar-foreground font-medium">
            {loggedInUser?.name}
          </span>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-2">
          {filteredNavigation.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.href;

            return (
              <Link
                key={item.name}
                to={item.href}
                onClick={onClose}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50"
                }`}
              >
                <Icon className="w-5 h-5" />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="px-4 py-6 space-y-2">
        {isAccessingCompany && (
          <button
            onClick={() => {
              switchBackToSuperAdmin();
              navigate("/business-accounts");
              onClose?.();
            }}
            className="flex w-full items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50"
          >
            <ArrowLeft className="w-5 h-5" />
            Go Back to Super Admin
          </button>
        )}
        <button
          onClick={handleLogout}
          disabled={isLoggingOut}
          className="flex w-full items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50"
        >
          <LogOut className="w-5 h-5" />
          {isLoggingOut ? "Logging out..." : "Logout"}
        </button>
      </div>
    </div>
  );
}
