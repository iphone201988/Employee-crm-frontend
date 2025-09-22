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
  Pencil, // Import the Pencil icon for editing
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useLogoutMutation } from "@/store/authApi";
import { useAuthContext } from "@/context/AuthContext";
import { useGetCurrentUserQuery, useUpdateProfileImageMutation } from '../store/authApi';
import { useRef, ChangeEvent } from "react"; // Import React hooks

const navigation = [
  { name: "Time", icon: Clock, href: "/" },
  { name: "WIP & Debtors", icon: FileText, href: "/wip-debtors" },
  { name: "Clients", icon: Users, href: "/clients" },
  { name: "Jobs", icon: Briefcase, href: "/jobs" },
  { name: "Expenses", icon: CreditCard, href: "/expenses" },
  { name: "Reports", icon: BarChart3, href: "/reports" },
  { name: "Team", icon: UserCheck, href: "/team" },
  { name: "Settings", icon: Settings, href: "/settings" },
];

export interface SidebarProps {
  onClose?: () => void;
}

export function Sidebar({ onClose }: SidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { clearCredentials } = useAuthContext();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- HOOKS ---
  const [logout, { isLoading: isLoggingOut }] = useLogoutMutation();
  const { data: user }: any = useGetCurrentUserQuery();
  const [updateProfileImage, { isLoading: isUploading }] = useUpdateProfileImageMutation();
  
  const loggedInUser = user?.data;

  // --- EVENT HANDLERS ---
  const handleLogout = async () => {
    // Note: The API call to '/logout' is prepared but not executed here.
    // To execute, you would call `await logout().unwrap();`
    clearCredentials();
    navigate('/login');
    onClose?.();
  };

  const handleAvatarClick = () => {
    // Trigger the hidden file input when the edit icon is clicked
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      // Call the mutation to upload the file
      await updateProfileImage(file).unwrap();
      // Optionally: show a success toast message
    } catch (error) {
      console.error('Failed to update profile image:', error);
      // Optionally: show an error toast message
    }
  };

  return (
    <div className="flex h-screen w-64 flex-col justify-between bg-sidebar">
      <div>
        <div className="flex items-center gap-3 p-6 border-b border-sidebar-border">
          {/* --- AVATAR WITH EDIT ICON --- */}
          <div className="relative">
            <Avatar className="w-8 h-8">
              <AvatarImage
                src={
                  loggedInUser?.avatarUrl
                    ? `${import.meta.env.VITE_BACKEND_BASE_URL}${loggedInUser.avatarUrl}`
                    : undefined
                }
              />
              <AvatarFallback>
                {loggedInUser?.name
                  ? loggedInUser.name.charAt(0).toUpperCase()
                  : "U"}
              </AvatarFallback>
            </Avatar>
            {/* Edit button positioned over the avatar */}
            <button
              onClick={handleAvatarClick}
              disabled={isUploading}
              className="absolute -bottom-1 -right-1 flex items-center justify-center w-5 h-5 bg-sidebar-accent rounded-full border-2 border-sidebar text-sidebar-accent-foreground hover:bg-sidebar-accent/80 transition-colors"
              aria-label="Update profile image"
            >
              <Pencil className="w-3 h-3" />
            </button>
            {/* Hidden file input */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
              accept="image/png, image/jpeg, image/gif"
            />
          </div>
          <span className="text-sidebar-foreground font-medium">{loggedInUser?.name}</span>
        </div>

        {/* --- NAVIGATION --- */}
        <nav className="flex-1 px-4 py-6 space-y-2">
          {navigation.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.href;

            return (
              <Link
                key={item.name}
                to={item.href}
                onClick={onClose}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${isActive
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

      {/* --- LOGOUT BUTTON --- */}
      <div className="px-4 py-6">
        <button
          onClick={handleLogout}
          disabled={isLoggingOut}
          className="flex w-full items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50"
        >
          <LogOut className="w-5 h-5" />
          {isLoggingOut ? 'Logging out...' : 'Logout'}
        </button>
      </div>
    </div>
  );
}
