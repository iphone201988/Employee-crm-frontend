
import { Users, FileText, Table, Receipt, User, TrendingDown, Clock, FileX, BarChart3, Settings, ChevronRight, Bell, CreditCard, AlertCircle, Briefcase } from "lucide-react"
import { NavLink, useLocation, useNavigate } from "react-router-dom"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { getProfileImage, getUserInitials } from '@/utils/profiles'
import { useNotifications } from '@/context/NotificationsContext'


import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar"

const mainItems = [
  { title: "Time", url: "/?tab=time", icon: Clock },
  { title: "WIP & Debtors", url: "/?tab=debtors", icon: Receipt },
  { title: "Clients", url: "/?tab=client-information", icon: User },
  { title: "Jobs", url: "/?tab=jobs", icon: Briefcase },
  { title: "Expenses", url: "/?tab=expenses-log", icon: CreditCard },
  { title: "Reports", url: "/?tab=reports", icon: BarChart3 },
  { title: "Team", url: "/?tab=team", icon: Users },
  { title: "Settings", url: "/?tab=settings", icon: Settings },
]


export function AppSidebar() {
  const { state } = useSidebar()
  const location = useLocation()
  const navigate = useNavigate()
    const { unreadCount } = useNotifications() 
  const currentTab = new URLSearchParams(location.search).get('tab') || 'team'
  
  // Define isActive function first
  const isActive = (tabName: string) => currentTab === tabName.split('=')[1]

  const getNavCls = (isActive: boolean) =>
    isActive ? "bg-accent text-accent-foreground font-medium" : "hover:bg-accent/50"

  const handleNotificationClick = () => {
    navigate('/?tab=notifications')
  }

  return (
    <Sidebar collapsible="icon">
      <div className="p-4 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          {state === "expanded" && (
            <div className="flex items-center gap-3 flex-1">
              <Avatar className="h-8 w-8">
                <AvatarImage src="/lovable-uploads/6185f556-d3d8-40f4-963d-e90c9d305e4b.png" />
                <AvatarFallback>NK</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h2 className="text-sm font-medium text-white">Niall Kelly</h2>
              </div>
            </div>
          )}
          <button
            onClick={handleNotificationClick}
            className="relative p-1 hover:bg-accent rounded ml-auto"
          >
            <Bell className="h-4 w-4 text-muted-foreground hover:text-foreground" />
            {unreadCount > 0 && (
              <Badge className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center text-xs bg-destructive hover:bg-destructive">
                {unreadCount}
              </Badge>
            )}
          </button>
        </div>
      </div>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      className={getNavCls(isActive(item.url))}
                    >
                      <item.icon className="h-4 w-4" />
                      {state === "expanded" && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  )
}
