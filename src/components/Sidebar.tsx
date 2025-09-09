import { 
  Clock, 
  FileText, 
  Users, 
  Briefcase, 
  CreditCard, 
  BarChart3, 
  UserCheck, 
  Settings,
  LogOut // Import the LogOut icon
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useLogoutMutation } from "@/store/authApi"; // Adjust import path if needed
import { useAuthContext } from "@/context/AuthContext"; // Adjust import path if needed
import {useGetCurrentUserQuery} from '../store/authApi';
import { log } from "console";

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

export function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { clearCredentials } = useAuthContext();
  const [logout, { isLoading }] = useLogoutMutation();

  const { data: user }: any = useGetCurrentUserQuery();

  const logdinUser = user?.data;


  const handleLogout = async () => {
      clearCredentials();
      navigate('/login');
  };

  return (
    <div className="flex h-screen w-64 flex-col justify-between bg-sidebar">
      <div>
        {/* User profile section */}
        <div className="flex items-center gap-3 p-6 border-b border-sidebar-border">
          <Avatar className="w-8 h-8">
            <AvatarImage src={logdinUser?.avatarUrl ? logdinUser?.avatarUrl : "/lovable-uploads/avatar-icon-on-black-round-flat-symbol-vector-21698060.webp"} />
            {/* "/lovable-uploads/faf9d4db-b73b-4771-9b8a-fbf1d0e1c69a.png" */}
            <AvatarFallback>NK</AvatarFallback>
          </Avatar>
          <span className="text-sidebar-foreground font-medium">{logdinUser?.name}</span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-2">  
          {navigation.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.href;
            
            return (
              <Link
                key={item.name}
                to={item.href}
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

      {/* Logout Button Section */}
      <div className="px-4 py-6">
        <button
          onClick={handleLogout}
          disabled={isLoading}
          className="flex w-full items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50"
        >
          <LogOut className="w-5 h-5" />
          {isLoading ? 'Logging out...' : 'Logout'}
        </button>
      </div>
    </div>
  );
}
