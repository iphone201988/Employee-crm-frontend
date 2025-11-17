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
  Bell,
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
import { useRef, ChangeEvent, useMemo, useState } from "react";
import { useLazyGetNotificationsQuery, useMarkNotificationAsReadMutation, Notification } from "@/store/notificationApi";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
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
  const { data: user, refetch: refetchUser }: any = useGetCurrentUserQuery(undefined, {
    // Refetch user data every 30 seconds to check for new notifications
    pollingInterval: 30000,
  });
  const [updateProfileImage, { isLoading: isUploading }] =
    useUpdateProfileImageMutation();
  const [getNotifications, { data: notificationsData, isLoading: isLoadingNotifications }] = useLazyGetNotificationsQuery();
  const [markNotificationAsRead] = useMarkNotificationAsReadMutation();
  const [showNotifications, setShowNotifications] = useState(false);

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
          <div className="flex items-center gap-2 flex-1">
            <span className="text-sidebar-foreground font-medium">
              {loggedInUser?.name}
            </span>
            {/* Bell icon - only show for users (not company role) */}
            {loggedInUser?.role !== 'company' && (
              <Popover open={showNotifications} onOpenChange={(open) => {
                setShowNotifications(open);
                if (open) {
                  getNotifications();
                }
              }}>
                <PopoverTrigger asChild>
                  <button
                    className="relative p-1 bg-white hover:bg-sidebar-accent/50 rounded ml-auto"
                    onClick={() => {
                      setShowNotifications(true);
                      getNotifications();
                    }}
                  >
                    <Bell className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                    {(loggedInUser?.newNotification) && (
                      <span className="absolute -top-1 -right-1 h-3 w-3 bg-red-600 rounded-full border-2 border-white shadow-sm"></span>
                    )}
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-80 p-0" align="start">
                  <div className="p-4 border-b">
                    <h3 className="font-semibold text-sm">Notifications</h3>
                  </div>
                  <div className="max-h-96 overflow-y-auto">
                    {isLoadingNotifications ? (
                      <div className="p-4 text-center text-sm text-muted-foreground">
                        Loading notifications...
                      </div>
                    ) : notificationsData?.data?.notifications?.length === 0 ? (
                      <div className="p-4 text-center text-sm text-muted-foreground">
                        No notifications
                      </div>
                    ) : (
                      <div className="divide-y">
                        {notificationsData?.data?.notifications?.map((notification: Notification) => (
                          <div
                            key={notification._id}
                            className={`p-4 cursor-pointer hover:bg-muted/50 transition-colors ${!notification.isRead ? 'bg-blue-50/50' : ''}`}
                            onClick={async () => {
                              if (!notification.isRead) {
                                try {
                                  await markNotificationAsRead(notification._id).unwrap();
                                } catch (error) {
                                  console.error('Failed to mark notification as read', error);
                                }
                              }
                            }}
                          >
                            <div className="flex items-start gap-3">
                              <div className="flex-1">
                                <p className="text-sm font-medium">{notification.title}</p>
                                <p className="text-xs text-muted-foreground mt-1">{notification.message}</p>
                                <p className="text-xs text-muted-foreground mt-1">
                                  {new Date(notification.createdAt).toLocaleDateString('en-US', {
                                    month: 'short',
                                    day: 'numeric',
                                    year: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </p>
                              </div>
                              {!notification.isRead && (
                                <span className="h-2 w-2 bg-blue-500 rounded-full mt-1 flex-shrink-0"></span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </PopoverContent>
              </Popover>
            )}
          </div>
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
