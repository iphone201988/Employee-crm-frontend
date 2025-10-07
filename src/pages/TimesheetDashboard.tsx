import { useEffect, useMemo, useState } from "react";
import { Search, Filter, ChevronDown, ArrowUpDown, ArrowUp, ArrowDown, ChevronLeft, ChevronRight, RotateCcw, RefreshCw, ArrowLeft, Plus, X, Trash2, Edit2 } from "lucide-react";
import { StatusBadge, FilterBadge } from "@/components/StatusBadge";
import { WeekNavigation } from "@/components/WeekNavigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuCheckboxItem } from "@/components/ui/dropdown-menu";
import { DashboardCard, DashboardGrid } from "@/components/ui/dashboard-card";
import { MyTimeSheet } from "@/components/TimeDashboard/MyTimeSheet";
import CustomTabs from "@/components/Tabs";
import { getCurrentWeekRange } from "@/utils/timesheetUtils";
type SortField = 'name' | 'department' | 'capacity' | 'logged' | 'variance' | 'submitted';
type SortDirection = 'asc' | 'desc' | null;
import { usePermissionTabs } from "@/hooks/usePermissionTabs";
import AllTimeLogsTab from "@/components/AllTimeLogsTab";
import { Card, CardContent } from "@/components/ui/card";
import { useGetTabAccessQuery, useLazyGetTabAccessQuery } from "@/store/authApi";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@radix-ui/react-tooltip";
import { useGetDropdownOptionsQuery } from "@/store/teamApi";
import Avatars from "@/components/Avatars";
import { useSearchParams } from "react-router-dom";
type ApiTimesheet = {
  _id: string;
  userId: string;
  weekStart: string;
  weekEnd: string;
  status: string;
  totalBillable: number;
  totalNonBillable: number;
  totalLogged: number;
  totalCapacity: number;
  totalVariance: number;
  user?: { _id: string; name: string; email: string; departmentId?: string };
  submissionStatus?: string;
  entriesCount?: number;
};

type ApiResponse = {
  success: boolean;
  message: string;
  data: ApiTimesheet[];
  pagination?: { currentPage: number; totalPages: number; totalItems: number; limit: number };
  summary?: { totalTeam: number; forReview: number; rejected: number; approved: number; draft: number; totalHours?: number; totalBillableHours?: number };
};

type TableItem = {
  id: string;
  name: string;
  department: string;
  capacitySec: number;
  loggedSec: number;
  varianceSec: number;
  status: 'approved' | 'review' | 'rejected' | 'not-submitted';
  notes: number;
  submitted: string;
  avatar?: string;
};

const normalizeSubmissionStatus = (status?: string): TableItem['status'] => {
  const s = (status || '').toLowerCase();
  if (s.includes('approved')) return 'approved';
  if (s.includes('review')) return 'review';
  if (s.includes('reject')) return 'rejected';
  return 'not-submitted';
};

const formatSecondsToHHMM = (seconds: number) => {
  const totalMinutes = Math.max(0, Math.floor(seconds / 60));
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
};
const tabs = [{
  id: "myTimesheet",
  label: "My Timesheets"
}, {
  id: "allTimesheets",
  label: "All Timesheets"
}, {
  id: "timeLogs",
  label: "All Time Logs"
}];
export function TimesheetDashboard() {
  const [searchParams, setSearchParams] = useSearchParams();
  
  const [activeTab, setActiveTab] = useState("");
  const { visibleTabs, isLoading, isError } = usePermissionTabs(tabs);
  const [activeFilter, setActiveFilter] = useState("allTimesheets");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDepartments, setSelectedDepartments] = useState<string[]>([]);
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  // Keep current name-based filters for display, but track IDs to be used with APIs
  const [selectedTeamIds, setSelectedTeamIds] = useState<string[]>([]);
  const [selectedDepartmentIds, setSelectedDepartmentIds] = useState<string[]>([]);
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [apiPagination, setApiPagination] = useState<{ currentPage: number; totalPages: number; totalItems: number; limit: number } | null>(null);
  const [hideWeekend, setHideWeekend] = useState(false);
  const [timesheetSortField, setTimesheetSortField] = useState<'ref' | 'client' | 'job' | 'category' | 'description' | 'rate' | null>(null);
  const [timesheetSortDirection, setTimesheetSortDirection] = useState<'asc' | 'desc' | null>(null);

  // Week navigation state
  const [currentWeek, setCurrentWeek] = useState(() => getCurrentWeekRange());

  // Week change handler
  const handleWeekChange = (weekStart: string, weekEnd: string) => {
    setCurrentWeek({ weekStart, weekEnd });
  };

  // Handle View Timesheet button click
  const handleViewTimesheet = (timesheetId: string, userId: string) => {
    setSearchParams({
      timesheetId,
      userId,
      tab: 'myTimesheet'
    });
    setActiveTab('myTimesheet');
  };

  // Fetch all filter dropdown options (teams, departments, etc.)
  const { data: allFilterOptions } = useGetDropdownOptionsQuery('all');

  // console.log('clientNames=============', clientNames?.data?.clients);

  const [timesheetRows, setTimesheetRows] = useState([{
    id: 1,
    ref: "JOH-23",
    client: "John Kelly",
    job: "VAT (01/01/2025 - 28/02/2025)",
    category: "Client Work",
    description: "Get info on employees",
    billable: true,
    rate: "€100.00",
    hours: {
      mon: 0.15,
      tue: 0,
      wed: 0,
      thu: 0,
      fri: 0,
      sat: 0,
      sun: 0
    }
  }, {
    id: 2,
    ref: "DAY-22",
    client: "David Owens",
    job: "VAT (01/01/2025 - 28/02/2025)",
    category: "Client Work",
    description: "Phone call to discuss ac...",
    billable: true,
    rate: "€100.00",
    hours: {
      mon: 0.15,
      tue: 0,
      wed: 0,
      thu: 0,
      fri: 0,
      sat: 0,
      sun: 0
    }
  }, {
    id: 3,
    ref: "JAK-21",
    client: "Jakob Rogers",
    job: "Annual Returns - 2024",
    category: "Client Work",
    description: "VAT calculations",
    billable: true,
    rate: "€100.00",
    hours: {
      mon: 1.00,
      tue: 0,
      wed: 0,
      thu: 0,
      fri: 0,
      sat: 0,
      sun: 0
    }
  }, {
    id: 4,
    ref: "MAR-24",
    client: "Mary Duffy",
    job: "Payroll - W5 2025",
    category: "Client Work",
    description: "Meeting with John",
    billable: true,
    rate: "€100.00",
    hours: {
      mon: 1.00,
      tue: 0,
      wed: 0,
      thu: 0,
      fri: 0,
      sat: 0,
      sun: 0
    }
  }, {
    id: 5,
    ref: "DAV-18",
    client: "David Owens",
    job: "Audit - 2024",
    category: "Client Work",
    description: "Get info on employees",
    billable: true,
    rate: "€100.00",
    hours: {
      mon: 0,
      tue: 1.00,
      wed: 0,
      thu: 0,
      fri: 0,
      sat: 0,
      sun: 0
    }
  }]);


  const [currentTabsUsersData, setCurrentTabsUsersData] = useState()

  const [getTabAccess, { data: currentTabsUsers }] = useLazyGetTabAccessQuery()

  useEffect(() => {
    getTabAccess(activeTab).unwrap();
  }, [])

  
  // const { data: currentTabsUsers }: any = useGetTabAccessQuery(activeTab);
  // Fetch all timesheets for the table
  const [apiTimesheets, setApiTimesheets] = useState<ApiTimesheet[]>([]);
  const [apiSummary, setApiSummary] = useState<ApiResponse['summary'] | undefined>();
  const [isFetching, setIsFetching] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const fetchTimesheets = useMemo(() => {
    return async (page: number) => {
      const controller = new AbortController();
      try {
        setIsFetching(true);
        setFetchError(null);
        const token = localStorage.getItem('userToken');
        const params = new URLSearchParams();
        params.set('page', String(page));
        params.set('limit', String(itemsPerPage));
        // filters
        if (searchQuery) params.set('search', searchQuery);
        // status preference: dropdown selection wins, else active tab badge
        const statusFromDropdown = selectedStatuses[0];
        const statusFromTab = activeFilter !== 'allTimesheets' ? activeFilter : '';
        const statusKey = (statusFromDropdown || statusFromTab);
        const statusLabelMap: Record<string, string> = {
          'approved': 'Approved',
          'review': 'For Review',
          'rejected': 'Rejected',
          'not-submitted': 'Not Submitted',
        };
        if (statusKey) params.set('status', statusLabelMap[statusKey] || statusKey);
        if (currentWeek?.weekStart) params.set('weekStart', currentWeek.weekStart);
        if (currentWeek?.weekEnd) params.set('weekEnd', currentWeek.weekEnd);
        if (selectedTeamIds[0]) params.set('userId', selectedTeamIds[0]);
        if (selectedDepartmentIds[0]) params.set('departmentId', selectedDepartmentIds[0]);

        const url = `${import.meta.env.VITE_API_URL}/timesheet/all?${params.toString()}`;
        const res = await fetch(url, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { 'authorization': `Bearer ${token}` } : {}),
            'ngrok-skip-browser-warning': '69420'
          },
          signal: controller.signal,
        });
        if (!res.ok) throw new Error(`Failed to fetch timesheets (${res.status})`);
        const json: ApiResponse = await res.json();
        setApiTimesheets(json?.data || []);
        setApiSummary(json?.summary);
        if (json?.pagination) setApiPagination(json.pagination);
      } catch (e: any) {
        if (e?.name !== 'AbortError') setFetchError(e?.message || 'Failed to fetch');
      } finally {
        setIsFetching(false);
      }
      return () => controller.abort();
    };
  }, [itemsPerPage, searchQuery, selectedStatuses, activeFilter, currentWeek?.weekStart, currentWeek?.weekEnd, selectedTeamIds, selectedDepartmentIds]);

  useEffect(() => {
    fetchTimesheets(currentPage);
  }, [fetchTimesheets, currentPage]);

  // Build department map for display
  const departmentOptions = allFilterOptions?.data?.departments || [];
  const departmentMap = useMemo(() => {
    const map: Record<string, string> = {};
    (departmentOptions as any[]).forEach((d: any) => { if (d?._id) map[d._id] = d?.name || ''; });
    return map;
  }, [departmentOptions]);

  // Transform API -> table rows
  const tableData = useMemo(() => {
    return (apiTimesheets || []).map((t) => {
      const name = t?.user?.name || '—';
      const department = t?.user?.departmentId ? (departmentMap[t.user.departmentId] || '') : '';
      const capacitySec = Number(t?.totalCapacity || 0);
      const loggedSec = Number(t?.totalLogged || 0);
      const varianceSec = Math.max(0, capacitySec - loggedSec);
      const status = normalizeSubmissionStatus(t?.submissionStatus);
      return {
        id: t?._id,
        userId: t?.userId || '',
        name,
        department,
        capacitySec,
        loggedSec,
        varianceSec,
        status,
        notes: Number(t?.entriesCount || 0),
        submitted: status === 'not-submitted' ? '-' : new Date(t?.weekEnd || Date.now()).toLocaleDateString(),
        avatar: ''
      } as const;
    });
  }, [apiTimesheets, departmentMap]);

  const statusCounts = useMemo(() => {
    const total = tableData.length;
    const approved = apiSummary?.approved ?? tableData.filter(i => i.status === 'approved').length;
    const forReview = apiSummary?.forReview ?? tableData.filter(i => i.status === 'review').length;
    const rejected = apiSummary?.rejected ?? tableData.filter(i => i.status === 'rejected').length;
    const notSubmitted = apiSummary?.draft ?? tableData.filter(i => i.status === 'not-submitted').length;
    return { total, forReview, rejected, approved, allTimesheets: total, notSubmitted };
  }, [tableData, apiSummary]);
  // Handle URL parameters for timesheet viewing
  useEffect(() => {
    const tabFromUrl = searchParams.get('tab');
    const timesheetId = searchParams.get('timesheetId');
    const userId = searchParams.get('userId');
    
    if (tabFromUrl === 'myTimesheet' && timesheetId && userId) {
      setActiveTab('myTimesheet');
    }
  }, [searchParams]);

  useEffect(() => {
    console.log('TimesheetDashboard: useEffect triggered with visibleTabs:', visibleTabs.length, 'activeTab:', activeTab);
    if (visibleTabs.length > 0 && !visibleTabs.some(tab => tab.id === activeTab)) {
      console.log('TimesheetDashboard: Setting activeTab to first visible tab:', visibleTabs[0].id);
      setActiveTab(visibleTabs[0].id);
    }
    getTabAccess(activeTab).unwrap();
  }, [visibleTabs, activeTab]);
  const handleRefresh = () => {
    // Reset all filters and regenerate data
    setSearchQuery("");
    setSelectedDepartments([]);
    setSelectedStatuses([]);
    setSortField(null);
    setSortDirection(null);
    setCurrentPage(1);
    setActiveFilter("allTimesheets");
    fetchTimesheets(1);
  };
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      if (sortDirection === 'asc') {
        setSortDirection('desc');
      } else if (sortDirection === 'desc') {
        setSortField(null);
        setSortDirection(null);
      } else {
        setSortDirection('asc');
      }
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };
  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return <ArrowUpDown className="w-3 h-3 opacity-50" />;
    if (sortDirection === 'asc') return <ArrowUp className="w-3 h-3" />;
    if (sortDirection === 'desc') return <ArrowDown className="w-3 h-3" />;
    return <ArrowUpDown className="w-3 h-3 opacity-50" />;
  };

  const handleTimesheetSort = (field: 'ref' | 'client' | 'job' | 'category' | 'description' | 'rate') => {
    if (timesheetSortField === field) {
      if (timesheetSortDirection === 'asc') {
        setTimesheetSortDirection('desc');
      } else if (timesheetSortDirection === 'desc') {
        setTimesheetSortField(null);
        setTimesheetSortDirection(null);
      } else {
        setTimesheetSortDirection('asc');
      }
    } else {
      setTimesheetSortField(field);
      setTimesheetSortDirection('asc');
    }
  };

  const getTimesheetSortIcon = (field: 'ref' | 'client' | 'job' | 'category' | 'description' | 'rate') => {
    if (timesheetSortField !== field) return <ArrowUpDown className="w-3 h-3 opacity-50" />;
    if (timesheetSortDirection === 'asc') return <ArrowUp className="w-3 h-3" />;
    if (timesheetSortDirection === 'desc') return <ArrowDown className="w-3 h-3" />;
    return <ArrowUpDown className="w-3 h-3 opacity-50" />;
  };

  // Sort current page data (server provides filtered/paginated set)
  const filteredData = [...tableData].sort((a, b) => {
    if (!sortField || !sortDirection) return 0;
    let aValue = a[sortField];
    let bValue = b[sortField];

    // Normalize time-based fields to seconds for sorting
    if (sortField === 'logged') {
      aValue = (a as any).loggedSec;
      bValue = (b as any).loggedSec;
    }
    if (sortField === 'variance') {
      aValue = (a as any).varianceSec;
      bValue = (b as any).varianceSec;
    }

    // Handle string comparison
    if (typeof aValue === 'string' && typeof bValue === 'string') {
      aValue = aValue.toLowerCase();
      bValue = bValue.toLowerCase();
    }
    if (sortDirection === 'asc') {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });

  // Pagination (from API)
  const totalPages = apiPagination?.totalPages || 1;
  const totalItems = apiPagination?.totalItems || filteredData.length;
  const currentLimit = apiPagination?.limit || itemsPerPage;
  const startItem = (currentPage - 1) * currentLimit + 1;
  const endItem = Math.min(currentPage * currentLimit, totalItems);
  // Dynamic filter sources
  const teamOptions = allFilterOptions?.data?.teams || [];
  const statuses = ["approved", "review", "rejected", "not-submitted"] as const;
  const formatTime = (seconds: number) => formatSecondsToHHMM(seconds);
  const calculateTotals = () => {
    const billable = {
      mon: 0,
      tue: 0,
      wed: 0,
      thu: 0,
      fri: 0,
      sat: 0,
      sun: 0,
      total: 0
    };
    const nonBillable = {
      mon: 0,
      tue: 0,
      wed: 0,
      thu: 0,
      fri: 0,
      sat: 0,
      sun: 0,
      total: 0
    };
    const logged = {
      mon: 0,
      tue: 0,
      wed: 0,
      thu: 0,
      fri: 0,
      sat: 0,
      sun: 0,
      total: 0
    };
    timesheetRows.forEach(row => {
      const days = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const;
      days.forEach(day => {
        const hours = row.hours[day] || 0;
        if (row.billable) {
          billable[day] += hours;
        } else {
          nonBillable[day] += hours;
        }
        logged[day] += hours;
      });
    });

    // Calculate totals
    billable.total = Object.values(billable).slice(0, -1).reduce((sum, val) => sum + val, 0);
    nonBillable.total = Object.values(nonBillable).slice(0, -1).reduce((sum, val) => sum + val, 0);
    logged.total = Object.values(logged).slice(0, -1).reduce((sum, val) => sum + val, 0);
    return {
      billable,
      nonBillable,
      logged
    };
  };
  const totals = calculateTotals();
  const formatVariance = (timeObj: any) => {
    const formattedTime = formatTime(timeObj);
    if (timeObj.total < 0) {
      return <span className="text-red-600">-{formattedTime}</span>;
    } else if (timeObj.total > 0) {
      return <span className="text-green-600">+{formattedTime}</span>;
    } else {
      return <span>{formattedTime}</span>;
    }
  };

  return <div className="flex-1 p-6 bg-background">
    {/* Header */}
    <div className="mb-6">

      <Avatars activeTab={activeTab} title={"Time"} />


      {/* Tabs */}
      <CustomTabs tabs={visibleTabs} activeTab={activeTab} setActiveTab={setActiveTab} />
    </div>

    {/* Date Range Navigation - Show in allTimesheets and myTimesheet tabs */}
    {/* {(activeTab === "allTimesheets" || activeTab === "myTimesheet") && <div className="mb-3">
      <WeekNavigation onWeekChange={handleWeekChange} />
    </div>} */}

    {activeTab === '' && <div>YOU HAVE NO ACCESS</div>}

    {/* Status Summary Cards - Only show in allTimesheets tab */}
    {activeTab === "allTimesheets" && (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-3">
        <Card className="h-full">
          <CardContent className="p-4">
            <div className="text-2xl font-bold !text-[#381980]">
              {statusCounts.total}
            </div>
            <p className="text-sm text-muted-foreground">Total Team</p>
          </CardContent>
        </Card>
        <Card className="h-full">
          <CardContent className="p-4">
            <div className="text-2xl font-bold !text-[#381980]">
              {statusCounts.forReview}
            </div>
            <p className="text-sm text-muted-foreground">For Review</p>
          </CardContent>
        </Card>
        <Card className="h-full">
          <CardContent className="p-4">
            <div className="text-2xl font-bold !text-[#381980]">
              {statusCounts.rejected}
            </div>
            <p className="text-sm text-muted-foreground">Rejected</p>
          </CardContent>
        </Card>
        <Card className="h-full">
          <CardContent className="p-4">
            <div className="text-2xl font-bold !text-[#381980]">
              {statusCounts.approved}
            </div>
            <p className="text-sm text-muted-foreground">Approved</p>
          </CardContent>
        </Card>
      </div>
    )}


    {/* Filter Badges - Only show in allTimesheets tab */}
    {activeTab === "allTimesheets" && <div className="flex flex-col sm:flex-row gap-2 mb-3">
      <div className="flex bg-muted/30 rounded-full p-1 overflow-x-auto">
        <button onClick={() => setActiveFilter("allTimesheets")} className={`inline-flex items-center gap-2 px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium transition-colors rounded-full whitespace-nowrap flex-shrink-0 ${activeFilter === "allTimesheets" ? "bg-primary text-primary-foreground" : "bg-background text-muted-foreground hover:bg-muted/50"}`}>
          All Timesheets
          <span className={`px-1.5 py-0.5 rounded-full text-xs font-medium ${activeFilter === "allTimesheets" ? "bg-primary-foreground/20 text-primary-foreground" : "bg-muted-foreground/20 text-muted-foreground"}`}>{statusCounts.allTimesheets}</span>
        </button>
      </div>

      <div className="flex bg-muted/30 rounded-full p-1 overflow-x-auto">
        <button onClick={() => setActiveFilter("not-submitted")} className={`inline-flex items-center gap-2 px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium transition-colors rounded-l-full whitespace-nowrap flex-shrink-0 ${activeFilter === "not-submitted" ? "bg-primary text-primary-foreground" : "bg-background text-muted-foreground hover:bg-muted/50"}`}>
          Not Submitted
          <span className={`px-1.5 py-0.5 rounded-full text-xs font-medium ${activeFilter === "not-submitted" ? "bg-primary-foreground/20 text-primary-foreground" : "bg-muted-foreground/20 text-muted-foreground"}`}>{statusCounts.notSubmitted}</span>
        </button>

        <button onClick={() => setActiveFilter("review")} className={`inline-flex items-center gap-2 px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium transition-colors whitespace-nowrap flex-shrink-0 ${activeFilter === "review" ? "bg-primary text-primary-foreground" : "bg-background text-muted-foreground hover:bg-muted/50"}`}>
          For Review
          <span className={`px-1.5 py-0.5 rounded-full text-xs font-medium ${activeFilter === "review" ? "bg-primary-foreground/20 text-primary-foreground" : "bg-muted-foreground/20 text-muted-foreground"}`}>{statusCounts.forReview}</span>
        </button>

        <button onClick={() => setActiveFilter("rejected")} className={`inline-flex items-center gap-2 px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium transition-colors whitespace-nowrap flex-shrink-0 ${activeFilter === "rejected" ? "bg-primary text-primary-foreground" : "bg-background text-muted-foreground hover:bg-muted/50"}`}>
          Rejected
          <span className={`px-1.5 py-0.5 rounded-full text-xs font-medium ${activeFilter === "rejected" ? "bg-primary-foreground/20 text-primary-foreground" : "bg-muted-foreground/20 text-muted-foreground"}`}>{statusCounts.rejected}</span>
        </button>

        <button onClick={() => setActiveFilter("approved")} className={`inline-flex items-center gap-2 px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium transition-colors rounded-r-full whitespace-nowrap flex-shrink-0 ${activeFilter === "approved" ? "bg-primary text-primary-foreground" : "bg-background text-muted-foreground hover:bg-muted/50"}`}>
          Approved
          <span className={`px-1.5 py-0.5 rounded-full text-xs font-medium ${activeFilter === "approved" ? "bg-primary-foreground/20 text-primary-foreground" : "bg-muted-foreground/20 text-muted-foreground"}`}>{statusCounts.approved}</span>
        </button>
      </div>
    </div>}

    {/* Search and Filters - Only show in allTimesheets tab */}
    {activeTab === "allTimesheets" && <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 mb-3">
      <div className="relative flex-1 max-w-sm">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Search..." className="pl-10 bg-white" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
      </div>

      <div className="flex flex-wrap gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="bg-white text-xs sm:text-sm">
              <span className="hidden sm:inline">Team Name</span>
              <span className="sm:hidden">Team</span>
              <ChevronDown className="ml-1 sm:ml-2 w-3 h-3 sm:w-4 sm:h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            {(teamOptions as any[]).map((t) => (
              <DropdownMenuCheckboxItem
                key={t._id}
                checked={selectedTeamIds.includes(t._id)}
                onCheckedChange={(checked) => {
                  if (checked) {
                    setSelectedTeamIds([...selectedTeamIds, t._id]);
                  } else {
                    setSelectedTeamIds(selectedTeamIds.filter(id => id !== t._id));
                  }
                }}
              >
                {t.name}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="bg-white text-xs sm:text-sm">
              <span className="hidden sm:inline">Department</span>
              <span className="sm:hidden">Dept</span>
              <ChevronDown className="ml-1 sm:ml-2 w-3 h-3 sm:w-4 sm:h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            {(departmentOptions as any[]).map((dept) => (
              <DropdownMenuCheckboxItem
                key={dept._id}
                checked={selectedDepartmentIds.includes(dept._id)}
                onCheckedChange={(checked) => {
                  if (checked) {
                    setSelectedDepartmentIds([...selectedDepartmentIds, dept._id]);
                    setSelectedDepartments([...selectedDepartments, dept.name]);
                  } else {
                    setSelectedDepartmentIds(selectedDepartmentIds.filter(id => id !== dept._id));
                    setSelectedDepartments(selectedDepartments.filter(d => d !== dept.name));
                  }
                }}
              >
                {dept.name}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="bg-white text-xs sm:text-sm">
              Status
              <ChevronDown className="ml-1 sm:ml-2 w-3 h-3 sm:w-4 sm:h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            {statuses.map(status => <DropdownMenuCheckboxItem key={status} checked={selectedStatuses.includes(status)} onCheckedChange={checked => {
              if (checked) {
                setSelectedStatuses([...selectedStatuses, status]);
              } else {
                setSelectedStatuses(selectedStatuses.filter(s => s !== status));
              }
            }}>
              {status.charAt(0).toUpperCase() + status.slice(1).replace('-', ' ')}
            </DropdownMenuCheckboxItem>)}
          </DropdownMenuContent>
        </DropdownMenu>

        <Button variant="outline" size="sm" className="bg-primary text-primary-foreground p-2 hover:bg-primary/90" onClick={handleRefresh}>
          <RefreshCw className="w-3 h-3 sm:w-4 sm:h-4" />
        </Button>
      </div>
    </div>}

    {/* Data Table - Only show in allTimesheets tab */}
    {activeTab === "allTimesheets" && <>
      <div className="bg-card rounded-lg border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px]">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left px-2 sm:px-4 py-3 text-xs sm:text-sm font-medium text-muted-foreground min-w-[120px]">
                  <button className="flex items-center gap-1 sm:gap-2 hover:text-foreground transition-colors" onClick={() => handleSort('name')}>
                    <span className="hidden sm:inline">TEAM NAME</span>
                    <span className="sm:hidden">NAME</span>
                    {getSortIcon('name')}
                  </button>
                </th>
                <th className="text-left px-2 sm:px-4 py-3 text-xs sm:text-sm font-medium text-muted-foreground min-w-[100px]">
                  <button className="flex items-center gap-1 sm:gap-2 hover:text-foreground transition-colors" onClick={() => handleSort('department')}>
                    <span className="hidden sm:inline">DEPARTMENT</span>
                    <span className="sm:hidden">DEPT</span>
                    {getSortIcon('department')}
                  </button>
                </th>
                <th className="text-left px-2 sm:px-4 py-3 text-xs sm:text-sm font-medium text-muted-foreground min-w-[80px]">
                  <button className="flex items-center gap-1 sm:gap-2 hover:text-foreground transition-colors" onClick={() => handleSort('capacity')}>
                    CAPACITY
                    {getSortIcon('capacity')}
                  </button>
                </th>
                <th className="text-left px-2 sm:px-4 py-3 text-xs sm:text-sm font-medium text-muted-foreground min-w-[80px]">
                  <button className="flex items-center gap-1 sm:gap-2 hover:text-foreground transition-colors" onClick={() => handleSort('logged')}>
                    LOGGED
                    {getSortIcon('logged')}
                  </button>
                </th>
                <th className="text-left px-2 sm:px-4 py-3 text-xs sm:text-sm font-medium text-muted-foreground min-w-[80px]">
                  <button className="flex items-center gap-1 sm:gap-2 hover:text-foreground transition-colors" onClick={() => handleSort('variance')}>
                    VARIANCE
                    {getSortIcon('variance')}
                  </button>
                </th>
                <th className="text-left px-2 sm:px-4 py-3 text-xs sm:text-sm font-medium text-muted-foreground min-w-[100px]">STATUS</th>
                <th className="text-left px-2 sm:px-4 py-3 text-xs sm:text-sm font-medium text-muted-foreground min-w-[60px]">NOTES</th>
                <th className="text-left px-2 sm:px-4 py-3 text-xs sm:text-sm font-medium text-muted-foreground min-w-[100px]">
                  <button className="flex items-center gap-1 sm:gap-2 hover:text-foreground transition-colors" onClick={() => handleSort('submitted')}>
                    SUBMITTED
                    {getSortIcon('submitted')}
                  </button>
                </th>
                <th className="text-left px-2 sm:px-4 py-3 text-xs sm:text-sm font-medium text-muted-foreground min-w-[150px]">ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {isFetching && <tr><td className="px-4 py-6 text-sm" colSpan={9}>Loading timesheets...</td></tr>}
              {fetchError && !isFetching && <tr><td className="px-4 py-6 text-sm text-red-600" colSpan={9}>{fetchError}</td></tr>}
              {!isFetching && !fetchError && filteredData.map(item => <tr key={item.id} className="border-t border-border hover:bg-muted/25">
                <td className="px-2 sm:px-4 py-2">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <Avatar className="w-6 h-6 sm:w-8 sm:h-8 flex-shrink-0">
                      <AvatarImage src={item.avatar || ''} />
                      <AvatarFallback className="text-xs">{item.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                    </Avatar>
                    <span className="text-sm sm:text-base text-foreground truncate">{item.name}</span>
                  </div>
                </td>
                <td className="px-2 sm:px-4 py-2 text-xs sm:text-sm text-muted-foreground">{item.department || '-'}</td>
                <td className="px-2 sm:px-4 py-2 text-xs sm:text-sm text-foreground">{formatTime(item.capacitySec)}</td>
                <td className="px-2 sm:px-4 py-2 text-xs sm:text-sm text-foreground">{formatTime(item.loggedSec)}</td>
                <td className="px-2 sm:px-4 py-2 text-xs sm:text-sm text-foreground">{formatVariance(item.varianceSec)}</td>
                <td className="px-2 sm:px-4 py-2">
                  <StatusBadge status={item.status}>
                    {item.status === "approved" && "Approved"}
                    {item.status === "review" && "For Review"}
                    {item.status === "rejected" && "Rejected"}
                    {item.status === "not-submitted" && "Not Submitted"}
                  </StatusBadge>
                </td>
                <td className="px-2 sm:px-4 py-2 text-xs sm:text-sm text-muted-foreground">
                  {item.notes > 0 ? item.notes : "-"}
                </td>
                <td className="px-2 sm:px-4 py-2 text-xs sm:text-sm text-muted-foreground">{item.submitted}</td>
                <td className="px-2 sm:px-4 py-2">
                  <div className="flex flex-col sm:flex-row gap-1">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="text-xs"
                      onClick={() => handleViewTimesheet(item.id, item.userId)}
                    >
                      <span className="hidden sm:inline">View Timesheet</span>
                      <span className="sm:hidden">View</span>
                    </Button>
                    {item.status === "review" && <Button variant="outline" size="sm" className="text-xs">
                      Remind
                    </Button>}
                  </div>
                </td>
              </tr>)}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination - API-based */}
      {totalItems > currentLimit && <div className="flex flex-col sm:flex-row items-center justify-between px-4 py-3 mt-1 gap-2">
        <div className="text-xs sm:text-sm text-muted-foreground text-center sm:text-left">
          Showing {startItem} to {endItem} of {totalItems} results
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1} className="text-xs sm:text-sm">
            <ChevronLeft className="w-3 h-3 sm:w-4 sm:h-4" />
            <span className="hidden sm:inline ml-1">Previous</span>
          </Button>
          <Button variant="outline" size="sm" onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages} className="text-xs sm:text-sm">
            <span className="hidden sm:inline mr-1">Next</span>
            <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4" />
          </Button>
        </div>
      </div>}
    </>}

    {/* My Timesheets Tab Content */}
    {activeTab === "myTimesheet" && (
      <>
        {/* {console.log('TimesheetDashboard: Rendering MyTimeSheet with activeTab:', activeTab, 'currentWeek:', currentWeek)} */}
        <MyTimeSheet 
          currentWeek={currentWeek} 
          onWeekChange={handleWeekChange}
          timesheetId={searchParams.get('timesheetId') || undefined}
          userId={searchParams.get('userId') || undefined}
        />
      </>
    )}

    {/* Time Logs Tab Content */}
    {activeTab === "timeLogs" && <AllTimeLogsTab />}
  </div>;
}

