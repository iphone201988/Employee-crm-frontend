import { useEffect, useMemo, useState } from "react";
import { Search, Filter, ChevronDown, ArrowUpDown, ArrowUp, ArrowDown, ChevronLeft, ChevronRight, RotateCcw, RefreshCw, ArrowLeft, Plus, X, Trash2, Edit2, Check, Save } from "lucide-react";
import { useDeleteTimesheetsMutation } from "@/store/timesheetApi";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuCheckboxItem } from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { MyTimeSheet } from "@/components/TimeDashboard/MyTimeSheet";
import CustomTabs from "@/components/Tabs";
import { getCurrentWeekRange, formatSeconds } from "@/utils/timesheetUtils";
type SortField = 'name' | 'department' | 'capacity' | 'logged' | 'variance' | 'submitted';
type SortDirection = 'asc' | 'desc' | null;
import { usePermissionTabs } from "@/hooks/usePermissionTabs";
import AllTimeLogsTab from "@/components/AllTimeLogsTab";
import MyTimeLogs from "@/components/MyTimeLogs";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useGetTabAccessQuery, useLazyGetTabAccessQuery, useGetCurrentUserQuery } from "@/store/authApi";
import { useGetDropdownOptionsQuery } from "@/store/teamApi";
import { useGetNotesQuery, useAddNoteMutation, useUpdateNoteMutation, Note } from "@/store/notesApi";
import { toast } from 'sonner';
import Avatars from "@/components/Avatars";
import { useSearchParams } from "react-router-dom";
import { Clock } from "lucide-react";

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
  user?: { _id: string; name: string; email: string; departmentId?: string, avatarUrl?: string };
  submissionStatus?: string;
  entriesCount?: number;
  notes?: Note[];
  notesCount?: number;
};

type ApiResponse = {
  success: boolean;
  message: string;
  data: ApiTimesheet[];
  pagination?: { currentPage: number; totalPages: number; totalItems: number; limit: number };
  summary?: { totalTeam: number; forReview: number; rejected: number; approved: number; autoApproved?: number; draft: number; totalHours?: number; totalBillableHours?: number };
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
  displayStatus: string;
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
}, {
  id: "myTimeLogs",
  label: "My Time Logs"
}];
export function TimesheetDashboard() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [timeFilter, setTimeFilter] = useState<'daily' | 'weekly' | 'monthly' | 'yearly'>('yearly');
  const handleTimeFilterChange = (newFilter: string) => {
    setTimeFilter(newFilter as 'daily' | 'weekly' | 'monthly' | 'yearly');
    setCurrentPeriodOffset(0); // Reset period offset when filter changes
  };
  // Get current user data
  const { data: currentUserData } = useGetCurrentUserQuery<any>();
  const currentUser = currentUserData?.data;
  const isCompanyRole = currentUser?.role === 'company';
  const autoApproveTimesheets = currentUser?.settings?.[0]?.autoApproveTimesheets || false;

  // Get URL parameters
  const timesheetId = searchParams.get('timesheetId');
  const userId = searchParams.get('userId');

  // Filter tabs based on user role and conditions
  const filteredTabs = useMemo(() => {
    let filtered = [...tabs];

    // Hide "My Time Logs" tab for company role users
    if (isCompanyRole) {
      filtered = filtered.filter(tab => tab.id !== 'myTimeLogs');
    }

    // For company role users, only show "My Timesheet" tab if timesheetId exists in URL
    if (isCompanyRole) {
      const myTimesheetTab = filtered.find(tab => tab.id === 'myTimesheet');
      if (myTimesheetTab && !timesheetId) {
        filtered = filtered.filter(tab => tab.id !== 'myTimesheet');
      }
    }

    return filtered;
  }, [isCompanyRole, timesheetId]);

  const [activeTab, setActiveTab] = useState("");
  const { visibleTabs, isLoading, isError } = usePermissionTabs(filteredTabs);

  const [activeFilter, setActiveFilter] = useState("allTimesheets");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDepartments, setSelectedDepartments] = useState<string[]>([]);
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  // Keep current name-based filters for display, but track IDs to be used with APIs
  const [selectedTeamIds, setSelectedTeamIds] = useState<Set<string>>(new Set());
  const [selectedDepartmentIds, setSelectedDepartmentIds] = useState<Set<string>>(new Set());
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [apiPagination, setApiPagination] = useState<{ currentPage: number; totalPages: number; totalItems: number; limit: number; totalRecords?: number } | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [deleteTimesheets, { isLoading: isDeleting }] = useDeleteTimesheetsMutation();
  
  // Check if user has bulk delete timesheets permission
  const canBulkDelete = currentUserData?.data?.permissions?.bulkDeleteTimesheets || currentUserData?.data?.permissions?.bulkDeleteLogs || false;
  const [hideWeekend, setHideWeekend] = useState(false);
  const [timesheetSortField, setTimesheetSortField] = useState<'ref' | 'client' | 'job' | 'category' | 'description' | 'rate' | null>(null);
  const [timesheetSortDirection, setTimesheetSortDirection] = useState<'asc' | 'desc' | null>(null);
  const [showNotesDialog, setShowNotesDialog] = useState(false);
  const [selectedTimesheetId, setSelectedTimesheetId] = useState<string | null>(null);
  const [selectedTimesheetName, setSelectedTimesheetName] = useState<string>('');
  const [newNote, setNewNote] = useState('');

  const teamFilterActive = selectedTeamIds.size > 0;
  const departmentFilterActive = selectedDepartmentIds.size > 0;
  const statusFilterActive = selectedStatuses.length > 0;

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
  const [currentPeriodOffset, setCurrentPeriodOffset] = useState(0);
  
  // Calculate date range based on filter type and period offset
  const getDateRange = useMemo(() => {
    const now = new Date();
    let startDate: Date;
    let endDate: Date;
    
    if (timeFilter === 'daily') {
      const targetDate = new Date(now);
      targetDate.setDate(now.getDate() + currentPeriodOffset);
      targetDate.setHours(0, 0, 0, 0);
      startDate = new Date(targetDate);
      endDate = new Date(targetDate);
      endDate.setHours(23, 59, 59, 999);
    } else if (timeFilter === 'weekly') {
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - now.getDay() + 1 + currentPeriodOffset * 7);
      startOfWeek.setHours(0, 0, 0, 0);
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      endOfWeek.setHours(23, 59, 59, 999);
      startDate = startOfWeek;
      endDate = endOfWeek;
    } else if (timeFilter === 'monthly') {
      const d = new Date(now.getFullYear(), now.getMonth() + currentPeriodOffset, 1);
      d.setHours(0, 0, 0, 0);
      startDate = new Date(d);
      endDate = new Date(d.getFullYear(), d.getMonth() + 1, 0);
      endDate.setHours(23, 59, 59, 999);
    } else {
      // Yearly
      const year = now.getFullYear() + currentPeriodOffset;
      startDate = new Date(year, 0, 1);
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(year, 11, 31);
      endDate.setHours(23, 59, 59, 999);
    }
    
    return {
      start: startDate.toISOString(),
      end: endDate.toISOString()
    };
  }, [timeFilter, currentPeriodOffset]);
  
  const fetchTimesheets = useMemo(() => {
    return async (page: number) => {
      const controller = new AbortController();
      try {
        setIsFetching(true);
        setFetchError(null);
        const token = localStorage.getItem('userToken');
        const params = new URLSearchParams();
        params.set('page', String(page));
        params.set('limit', String(limit));
        // filters
        if (searchQuery) params.set('search', searchQuery);
        // status preference: dropdown selection wins, else active tab badge
        const statusFromDropdown = selectedStatuses[0];
        const statusFromTab = activeFilter !== 'allTimesheets' ? activeFilter : '';
        const statusKey = (statusFromDropdown || statusFromTab);
        const statusLabelMap: Record<string, string> = {
          'approved': 'approved',
          'review': 'reviewed',
          'rejected': 'rejected',
          'not-submitted': 'draft',
          'autoApproved': 'autoApproved',
        };
        if (statusKey) params.set('status', statusLabelMap[statusKey] || statusKey);
        // Add date range based on time filter
        if (activeTab === 'allTimesheets') {
          params.set('weekStart', getDateRange.start);
          params.set('weekEnd', getDateRange.end);
        }
        if (selectedTeamIds.size > 0) params.set('userId', Array.from(selectedTeamIds).join(','));
        if (selectedDepartmentIds.size > 0) params.set('departmentId', Array.from(selectedDepartmentIds).join(','));

        const url = `${import.meta.env.VITE_API_URL}/timesheet/all${params ? `?${params}` : ''}`;
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
        console.log('res=============', json);
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
  }, [limit, searchQuery, selectedStatuses, activeFilter, getDateRange, activeTab, selectedTeamIds, selectedDepartmentIds]);

  useEffect(() => {
    if (activeTab === 'allTimesheets') {
      fetchTimesheets(currentPage);
    }
  }, [fetchTimesheets, currentPage, activeTab, limit]);
  
  // Refetch when filter or period changes (only for allTimesheets tab)
  useEffect(() => {
    if (activeTab === 'allTimesheets') {
      setCurrentPage(1); // Reset to first page when filter changes
    }
  }, [timeFilter, currentPeriodOffset, activeTab]);

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
      const raw = t?.submissionStatus || '';
      const displayStatus = /auto\s*approved/i.test(raw)
        ? 'Auto Approved'
        : /approved/i.test(raw)
          ? 'Approved'
          : /review/i.test(raw)
            ? 'For Review'
            : /reject/i.test(raw)
              ? 'Rejected'
              : 'Not Submitted';
      return {
        id: t?._id,
        userId: t?.userId || '',
        name,
        avatarUrl: t?.user?.avatarUrl || '',
        department,
        capacitySec,
        loggedSec,
        varianceSec,
        status,
        displayStatus,
        notes: Number(t?.notesCount || (Array.isArray(t?.notes) ? t.notes.length : 0)),
        notesData: Array.isArray(t?.notes) ? t.notes : [],
        submitted: status === 'not-submitted' ? '-' : new Date(t?.weekEnd || Date.now()).toLocaleDateString(),
        avatar: ''
      } as const;
    });
  }, [apiTimesheets, departmentMap]);

  const statusCounts = useMemo(() => {
    const total = tableData.length;
    const approved = apiSummary?.approved ?? tableData.filter(i => i.status === 'approved').length;
    const autoApproved = apiSummary?.autoApproved ?? 0;
    const notSubmitted = apiSummary?.draft ?? tableData.filter(i => i.status === 'not-submitted').length;
    return { total, approved, autoApproved, allTimesheets: total, notSubmitted } as const;
  }, [tableData, apiSummary]);
  // Handle URL parameters for timesheet viewing
  useEffect(() => {
    const tabFromUrl = searchParams.get('tab');

    if (tabFromUrl === 'myTimesheet' && timesheetId && userId) {
      setActiveTab('myTimesheet');
    }
  }, [searchParams, timesheetId, userId]);

  useEffect(() => {
    console.log('TimesheetDashboard: useEffect triggered with visibleTabs:', visibleTabs.length, 'activeTab:', activeTab);
    if (visibleTabs.length > 0 && !visibleTabs.some(tab => tab.id === activeTab)) {
      console.log('TimesheetDashboard: Setting activeTab to first visible tab:', visibleTabs[0].id);
      setActiveTab(visibleTabs[0].id);
    }
    getTabAccess(activeTab).unwrap();
  }, [visibleTabs, activeTab]);
  const toggleSelect = (id: string, checked: boolean) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (checked) next.add(id); else next.delete(id);
      return next;
    });
  };

  const toggleSelectAllVisible = (checked: boolean, items: any[]) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      items.forEach(item => { if (checked) next.add(item.id); else next.delete(item.id); });
      return next;
    });
  };

  const handleDeleteSelected = async () => {
    if (selectedIds.size === 0) return;
    try {
      await deleteTimesheets({ timesheetIds: Array.from(selectedIds) }).unwrap();
      setSelectedIds(new Set());
      // Refetch timesheets after deletion
      if (activeTab === 'allTimesheets' && fetchTimesheets) {
        await fetchTimesheets(currentPage);
      }
      toast.success('Timesheets deleted successfully');
    } catch (e: any) {
      console.error('Failed to delete timesheets', e);
      toast.error(e?.data?.message || 'Failed to delete timesheets');
    }
  };

  const handleRefresh = () => {
    // Reset all filters and regenerate data
    setSearchQuery("");
    setSelectedDepartments([]);
    setSelectedStatuses([]);
    setSelectedTeamIds(new Set());
    setSelectedDepartmentIds(new Set());
    setSelectedIds(new Set());
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
  const totalItems = apiPagination?.totalItems || apiPagination?.totalRecords || filteredData.length;
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
  const formatVariance = (varianceSec: number) => {
    const formattedTime = formatSeconds(Math.abs(varianceSec));
    if (varianceSec < 0) {
      return <span className="text-red-600">-{formattedTime}</span>;
    } else if (varianceSec > 0) {
      return <span className="text-green-600">+{formattedTime}</span>;
    } else {
      return <span>{formattedTime}</span>;
    }
  };
  const periodInfo = useMemo(() => {
    const now = new Date();
    const formatDate = (date: Date) => date.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
    if (timeFilter === 'daily') {
      const targetDate = new Date();
      targetDate.setDate(now.getDate() + currentPeriodOffset);
      return { label: formatDate(targetDate) };
    }
    if (timeFilter === 'weekly') {
      const startOfWeek = new Date();
      startOfWeek.setDate(now.getDate() - now.getDay() + 1 + currentPeriodOffset * 7);
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      return { label: `${formatDate(startOfWeek)} to ${formatDate(endOfWeek)}` };
    }
    if (timeFilter === 'monthly') {
      const d = new Date(now.getFullYear(), now.getMonth() + currentPeriodOffset, 1);
      return { label: d.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' }) };
    }
    // Yearly
    return { label: `${now.getFullYear() + currentPeriodOffset}` };
  }, [timeFilter, currentPeriodOffset]);

  const handlePeriodChange = (direction: 'prev' | 'next') => {
    setCurrentPeriodOffset(prev => direction === 'prev' ? prev - 1 : prev + 1);
  };

  return <div className="flex-1 p-6 bg-background max-lg:p-0">
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
              {statusCounts.notSubmitted}
            </div>
            <p className="text-sm text-muted-foreground">Not Submitted</p>
          </CardContent>
        </Card>
        <Card className="h-full">
          <CardContent className="p-4">
            <div className="text-2xl font-bold !text-[#381980]">
              {statusCounts.autoApproved}
            </div>
            <p className="text-sm text-muted-foreground">Auto-Approved</p>
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

    {
      activeTab === "allTimesheets" && (
        <div className="flex items-center justify-between gap-4 mb-3">
          <div className="flex items-center gap-1 bg-muted rounded-md p-1">
            <Button variant={timeFilter === 'daily' ? 'default' : 'ghost'} size="sm" onClick={() => handleTimeFilterChange('daily')}>Daily</Button>
            <Button variant={timeFilter === 'weekly' ? 'default' : 'ghost'} size="sm" onClick={() => handleTimeFilterChange('weekly')}>Weekly</Button>
            <Button variant={timeFilter === 'monthly' ? 'default' : 'ghost'} size="sm" onClick={() => handleTimeFilterChange('monthly')}>Monthly</Button>
            <Button variant={timeFilter === 'yearly' ? 'default' : 'ghost'} size="sm" onClick={() => handleTimeFilterChange('yearly')}>Yearly</Button>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="h-8 w-8 p-0" onClick={() => handlePeriodChange('prev')}><ChevronLeft className="h-4 w-4" /></Button>
            <span className="text-sm font-medium whitespace-nowrap">{periodInfo.label}</span>
            <Button variant="outline" size="sm" className="h-8 w-8 p-0" onClick={() => handlePeriodChange('next')}><ChevronRight className="h-4 w-4" /></Button>
          </div>
        </div>
      )
    }


    {/* Filter Badges - Only show in allTimesheets tab */}
    {activeTab === "allTimesheets" && <div className="flex flex-col sm:flex-row gap-2 mb-3">
      <div className="flex items-center gap-3 mt-4  w-max p-[6px] rounded-sm pl-4 max-md:flex-col">
        <p className='text-[#381980] font-semibold text-[14px]'>Filter by:</p>
        <div className="flex gap-0">
          <button
            onClick={() => setActiveFilter("allTimesheets")}
            className={`px-4 py-2 text-sm font-medium transition-colors  ${activeFilter === "allTimesheets"
              ? 'bg-[#381980] text-white rounded-l-full'
              : 'bg-transparent text-[#71717A] '
              }`}
          >
            All Timesheets
          </button>
          {/* <button
            onClick={() => setActiveFilter("not-submitted")}
            className={`px-4 py-2 text-sm font-medium transition-colors  ${activeFilter === "not-submitted"
              ? 'bg-[#381980] text-white'
              : 'bg-transparent text-[#71717A] '
              }`}
          >
            Not Submitted
          </button> */}
          {autoApproveTimesheets && (
            <button
              onClick={() => setActiveFilter("autoApproved")}
              className={`px-4 py-2 text-sm font-medium transition-colors  ${activeFilter === "autoApproved"
                ? 'bg-[#381980] text-white'
                : 'bg-transparent text-[#71717A] '
                }`}
            >
              Auto-Approve
            </button>
          )}
          {!autoApproveTimesheets && (
            <>
              <button
                onClick={() => setActiveFilter("review")}
                className={`px-4 py-2 text-sm font-medium transition-colors  ${activeFilter === "review"
                  ? 'bg-[#381980] text-white'
                  : 'bg-transparent text-[#71717A] '
                  }`}
              >
                For Review
              </button>
              <button
                onClick={() => setActiveFilter("rejected")}
                className={`px-4 py-2 text-sm font-medium transition-colors  ${activeFilter === "rejected"
                  ? 'bg-[#381980] text-white'
                  : 'bg-transparent text-[#71717A] '
                  }`}
              >
                Rejected
              </button>
              <button
                onClick={() => setActiveFilter("approved")}
                className={`px-4 py-2 text-sm font-medium transition-colors  ${activeFilter === "approved"
                  ? 'bg-[#381980] text-white rounded-r-full'
                  : 'bg-transparent text-[#71717A] '
                  }`}
              >
                Approved
              </button>
            </>
          )}
        </div>
      </div>
    </div>}

    {/* Search and Filters - Only show in allTimesheets tab */}
    {activeTab === "allTimesheets" && (
      <div className="p-[6px] rounded-sm bg-[#E7E5F2] flex justify-between items-center mb-3">
        <div className="flex flex-wrap items-end gap-2">
          <div className="relative flex-1 w-full max-w-[200px]">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Search..." 
              className="pl-10 w-[200px] bg-white text-[#381980] font-semibold placeholder:text-[#381980]" 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Popover>
              <PopoverTrigger asChild>
                <button className={`w-32 h-10 text-[#381980] font-semibold rounded-md px-3 flex items-center justify-between ${teamFilterActive ? 'bg-gray-200 border border-black' : 'bg-white border border-input'}`}>
                  <span className="truncate text-[14px]">Team Name</span>
                  <ChevronDown className="w-4 h-4" />
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-56 p-2" align="start">
                <div className="max-h-64 overflow-auto">
                  <div
                    className={`px-2 py-1.5 rounded-[4px] cursor-pointer ${selectedTeamIds.size === 0 ? 'bg-[#5f46b9] text-white' : 'hover:bg-[#5f46b9] hover:text-white'}`}
                    onClick={() => setSelectedTeamIds(new Set())}
                  >
                    All
                  </div>
                  {(teamOptions as any[]).map((t) => {
                    const active = selectedTeamIds.has(t._id);
                    return (
                      <div
                        key={t._id}
                        className={`flex items-center justify-between px-2 py-1.5 rounded-[4px] cursor-pointer ${active ? 'bg-[#5f46b9] text-white' : 'hover:bg-[#5f46b9] hover:text-white'}`}
                        onClick={() => {
                          setSelectedTeamIds(prev => {
                            const next = new Set(prev);
                            if (next.has(t._id)) next.delete(t._id); else next.add(t._id);
                            return next;
                          });
                        }}
                      >
                        <span className="truncate">{t.name}</span>
                        {active && <Check className="w-4 h-4" />}
                      </div>
                    );
                  })}
                </div>
              </PopoverContent>
            </Popover>
          </div>
          <div className="space-y-2">
            <Popover>
              <PopoverTrigger asChild>
                <button className={`w-32 h-10 text-[#381980] font-semibold rounded-md px-3 flex items-center justify-between ${departmentFilterActive ? 'bg-gray-200 border border-black' : 'bg-white border border-input'}`}>
                  <span className="truncate text-[14px]">Department</span>
                  <ChevronDown className="w-4 h-4" />
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-56 p-2" align="start">
                <div className="max-h-64 overflow-auto">
                  <div
                    className={`px-2 py-1.5 rounded-[4px] cursor-pointer ${selectedDepartmentIds.size === 0 ? 'bg-[#5f46b9] text-white' : 'hover:bg-[#5f46b9] hover:text-white'}`}
                    onClick={() => setSelectedDepartmentIds(new Set())}
                  >
                    All
                  </div>
                  {(departmentOptions as any[]).map((dept) => {
                    const active = selectedDepartmentIds.has(dept._id);
                    return (
                      <div
                        key={dept._id}
                        className={`flex items-center justify-between px-2 py-1.5 rounded-[4px] cursor-pointer ${active ? 'bg-[#5f46b9] text-white' : 'hover:bg-[#5f46b9] hover:text-white'}`}
                        onClick={() => {
                          setSelectedDepartmentIds(prev => {
                            const next = new Set(prev);
                            if (next.has(dept._id)) {
                              next.delete(dept._id);
                              setSelectedDepartments(prev => prev.filter(d => d !== dept.name));
                            } else {
                              next.add(dept._id);
                              setSelectedDepartments(prev => [...prev, dept.name]);
                            }
                            return next;
                          });
                        }}
                      >
                        <span className="truncate">{dept.name}</span>
                        {active && <Check className="w-4 h-4" />}
                      </div>
                    );
                  })}
                </div>
              </PopoverContent>
            </Popover>
          </div>
          <div className="space-y-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className={`text-xs sm:text-sm w-32 h-10 rounded-md px-3 flex items-center justify-between ${statusFilterActive ? 'bg-gray-200 border-black' : 'bg-white border border-input'} text-[#381980] font-semibold`}>
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
          </div>
          <div className="space-y-2">
            <Button
              variant="outline"
              className="bg-[#381980] w-[42px] rounded-sm text-primary-foreground p-2 hover:bg-primary/90 !text-[#fff]"
              onClick={handleRefresh}
            >
              <RefreshCw className="w-3 h-3 sm:w-4 sm:h-4" />
            </Button>
          </div>
        </div>
        {canBulkDelete && (
          <div className="space-y-2">
            <Button
              onClick={handleDeleteSelected}
              disabled={isDeleting || selectedIds.size === 0}
              className='bg-[#381980] w-[42px] rounded-sm text-primary-foreground p-2 hover:bg-primary/90 !text-[#fff] flex items-center justify-center'
            >
              <Trash2 size={16} />
            </Button>
          </div>
        )}
      </div>
    )}

    {/* Data Table - Only show in allTimesheets tab */}
    {activeTab === "allTimesheets" && <>
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className='bg-[#E7E5F2]'>
                <TableRow className="border-b border-border bg-muted/50 text-[#381980]">
                  {canBulkDelete && (
                    <TableHead className="p-3 text-foreground h-12 text-[#381980]">
                      <input 
                        type="checkbox" 
                        onChange={(e) => toggleSelectAllVisible(e.target.checked, filteredData)} 
                      />
                    </TableHead>
                  )}
                  <TableHead className="p-3 text-foreground h-12 text-[#381980] whitespace-nowrap">
                    <button className="flex items-center gap-1 sm:gap-2 hover:text-foreground transition-colors" onClick={() => handleSort('name')}>
                      <span className="hidden sm:inline">TEAM NAME</span>
                      <span className="sm:hidden">NAME</span>
                      {getSortIcon('name')}
                    </button>
                  </TableHead>
                  <TableHead className="p-3 text-foreground h-12 text-[#381980] whitespace-nowrap">
                    <button className="flex items-center gap-1 sm:gap-2 hover:text-foreground transition-colors" onClick={() => handleSort('department')}>
                      <span className="hidden sm:inline">DEPARTMENT</span>
                      <span className="sm:hidden">DEPT</span>
                      {getSortIcon('department')}
                    </button>
                  </TableHead>
                  <TableHead className="p-3 text-foreground h-12 text-[#381980] whitespace-nowrap">
                    <button className="flex items-center gap-1 sm:gap-2 hover:text-foreground transition-colors" onClick={() => handleSort('capacity')}>
                      CAPACITY
                      {getSortIcon('capacity')}
                    </button>
                  </TableHead>
                  <TableHead className="p-3 text-foreground h-12 text-[#381980] whitespace-nowrap">
                    <button className="flex items-center gap-1 sm:gap-2 hover:text-foreground transition-colors" onClick={() => handleSort('logged')}>
                      LOGGED
                      {getSortIcon('logged')}
                    </button>
                  </TableHead>
                  <TableHead className="p-3 text-foreground h-12 text-[#381980] whitespace-nowrap">
                    <button className="flex items-center gap-1 sm:gap-2 hover:text-foreground transition-colors" onClick={() => handleSort('variance')}>
                      VARIANCE
                      {getSortIcon('variance')}
                    </button>
                  </TableHead>
                  <TableHead className="p-3 text-foreground h-12 text-[#381980] whitespace-nowrap">STATUS</TableHead>
                  <TableHead className="p-3 text-foreground h-12 text-[#381980] whitespace-nowrap">NOTES</TableHead>
                  <TableHead className="p-3 text-foreground h-12 text-[#381980] whitespace-nowrap">
                    <button className="flex items-center gap-1 sm:gap-2 hover:text-foreground transition-colors" onClick={() => handleSort('submitted')}>
                      SUBMITTED
                      {getSortIcon('submitted')}
                    </button>
                  </TableHead>
                  <TableHead className="p-3 text-foreground h-12 text-[#381980] whitespace-nowrap">ACTIONS</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isFetching && (
                  <TableRow>
                    <TableCell colSpan={canBulkDelete ? 10 : 9} className="p-4 text-sm text-center">
                      Loading timesheets...
                    </TableCell>
                  </TableRow>
                )}
                {fetchError && !isFetching && (
                  <TableRow>
                    <TableCell colSpan={canBulkDelete ? 10 : 9} className="p-4 text-sm text-red-600 text-center">
                      {fetchError}
                    </TableCell>
                  </TableRow>
                )}
                {!isFetching && !fetchError && filteredData.map((item: any) => (
                  <TableRow key={item.id} className="border-b border-border transition-colors h-12">
                    {canBulkDelete && (
                      <TableCell className="p-4">
                        <input 
                          type="checkbox" 
                          checked={selectedIds.has(item.id)} 
                          onChange={(e) => toggleSelect(item.id, e.target.checked)} 
                        />
                      </TableCell>
                    )}
                    <TableCell className="p-4">
                      <div className="flex items-center gap-2 sm:gap-3">
                        <Avatar className="w-6 h-6 sm:w-8 sm:h-8 flex-shrink-0">
                          <AvatarImage src={import.meta.env.VITE_BACKEND_BASE_URL + item.avatarUrl || ''} />
                          <AvatarFallback className="text-xs">{item.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                        </Avatar>
                        <span className="text-sm sm:text-base text-foreground truncate">{item.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="p-4 text-sm text-muted-foreground">{item.department || '-'}</TableCell>
                    <TableCell className="p-4 text-sm text-foreground">{formatSeconds(item.capacitySec)}</TableCell>
                    <TableCell className="p-4 text-sm text-foreground">{formatSeconds(item.loggedSec)}</TableCell>
                    <TableCell className="p-4 text-sm text-foreground">{formatVariance(item.varianceSec)}</TableCell>
                    <TableCell className="p-4">
                      <StatusBadge status={item.status}>
                        {item.displayStatus}
                      </StatusBadge>
                    </TableCell>
                    <TableCell className="p-4 text-sm text-muted-foreground">
                      <Button
                        variant="outline"
                        size="sm"
                        className={`text-xs ${item.notes > 0 ? 'bg-blue-50 text-blue-700 hover:bg-blue-100' : 'text-muted-foreground hover:bg-muted'}`}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setSelectedTimesheetId(item.id);
                          setSelectedTimesheetName(item.name);
                          setShowNotesDialog(true);
                        }}
                      >
                        {item.notes || 0}
                      </Button>
                    </TableCell>
                    <TableCell className="p-4 text-sm text-muted-foreground">{item.submitted}</TableCell>
                    <TableCell className="p-4">
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
                        {item.status === "not-submitted" && <Button variant="outline" size="sm" className="text-xs">Remind</Button>}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Pagination Controls */}
      {apiPagination && apiPagination.totalPages > 0 && (
        <div className="space-y-4 mt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Show:</span>
              <select 
                value={limit} 
                onChange={(e) => { 
                  setCurrentPage(1); 
                  setLimit(Number(e.target.value)); 
                }} 
                className="border border-gray-300 rounded px-2 py-1 text-sm" 
                disabled={isFetching}
              >
                <option value={5}>5 per page</option>
                <option value={10}>10 per page</option>
                <option value={20}>20 per page</option>
                <option value={50}>50 per page</option>
              </select>
            </div>
            <div className="text-sm text-gray-500">
              Showing {totalItems > 0 ? ((currentPage - 1) * (apiPagination.limit || limit)) + 1 : 0} to {Math.min(currentPage * (apiPagination.limit || limit), totalItems)} of {totalItems} timesheets
            </div>
          </div>
          {apiPagination.totalPages > 1 && (
            <div className="flex justify-center items-center gap-2">
              <Button 
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))} 
                disabled={currentPage === 1 || isFetching} 
                variant="outline" 
                size="sm"
              >
                <ChevronLeft className="h-4 w-4" /> Previous
              </Button>
              <Button 
                onClick={() => setCurrentPage(p => p + 1)} 
                disabled={currentPage >= apiPagination.totalPages || isFetching} 
                variant="outline" 
                size="sm"
              >
                Next <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      )}
    </>}

    {/* My Timesheets Tab Content */}
    {activeTab === "myTimesheet" && (
      <>
        {/* {console.log('TimesheetDashboard: Rendering MyTimeSheet with activeTab:', activeTab, 'currentWeek:', currentWeek)} */}
        <MyTimeSheet
          currentWeek={currentWeek}
          onWeekChange={handleWeekChange}
          timesheetId={timesheetId || undefined}
          userId={userId || undefined}
        />
      </>
    )}

    {/* Time Logs Tab Content */}
    {activeTab === "timeLogs" && <AllTimeLogsTab />}

    {/* My Time Logs Tab Content */}
    {activeTab === "myTimeLogs" && <MyTimeLogs />}

    {/* Notes Dialog */}
    <TimesheetNotesDialog
      timesheetId={selectedTimesheetId || ''}
      timesheetName={selectedTimesheetName}
      open={showNotesDialog && !!selectedTimesheetId}
      onOpenChange={(open) => {
        setShowNotesDialog(open);
        if (!open) {
          setSelectedTimesheetId(null);
          setSelectedTimesheetName('');
          // Refetch timesheets to update notes count
          fetchTimesheets(currentPage);
        }
      }}
      onClose={() => {
        setShowNotesDialog(false);
        setSelectedTimesheetId(null);
        setSelectedTimesheetName('');
        // Refetch timesheets to update notes count
        fetchTimesheets(currentPage);
      }}
    />
  </div>;
}

// Timesheet Notes Dialog Component
interface TimesheetNotesDialogProps {
  timesheetId: string;
  timesheetName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onClose: () => void;
}

const TimesheetNotesDialog = ({ timesheetId, timesheetName, open, onOpenChange, onClose }: TimesheetNotesDialogProps) => {
  const [newNote, setNewNote] = useState('');
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editingNoteText, setEditingNoteText] = useState('');
  
  // Fetch notes for this timesheet
  const { data: notesResponse, refetch: refetchNotes } = useGetNotesQuery(
    { timesheetId },
    { skip: !timesheetId || !open, refetchOnMountOrArgChange: true }
  );
  const [addNote, { isLoading: isAddingNote }] = useAddNoteMutation();
  const [updateNote, { isLoading: isUpdatingNote }] = useUpdateNoteMutation();
  
  const notes = notesResponse?.data || [];
  
  const handleAddNote = async () => {
    if (!newNote.trim() || !timesheetId) return;
    
    try {
      await addNote({
        note: newNote.trim(),
        timesheetId: timesheetId,
      }).unwrap();
      toast.success('Note added successfully');
      setNewNote('');
      refetchNotes();
    } catch (error: any) {
      toast.error(error?.data?.message || 'Failed to add note');
      console.error('Failed to add note:', error);
    }
  };

  const handleStartEdit = (note: Note) => {
    setEditingNoteId(note._id);
    setEditingNoteText(note.note);
  };

  const handleCancelEdit = () => {
    setEditingNoteId(null);
    setEditingNoteText('');
  };

  const handleSaveEdit = async () => {
    if (!editingNoteId || !editingNoteText.trim()) return;
    
    try {
      await updateNote({
        noteId: editingNoteId,
        note: editingNoteText.trim(),
      }).unwrap();
      toast.success('Note updated successfully');
      setEditingNoteId(null);
      setEditingNoteText('');
      refetchNotes();
    } catch (error: any) {
      toast.error(error?.data?.message || 'Failed to update note');
      console.error('Failed to update note:', error);
    }
  };

  // Reset states when dialog closes
  useEffect(() => {
    if (!open) {
      setNewNote('');
      setEditingNoteId(null);
      setEditingNoteText('');
    }
  }, [open]);
  
  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString() + ' at ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Notes for {timesheetName}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-4">
          {/* Add Note Section */}
          <div className="grid gap-2">
            <div className="flex gap-2">
              <Textarea 
                placeholder="Enter your note here..." 
                value={newNote} 
                onChange={e => setNewNote(e.target.value)} 
                className="min-h-[80px]" 
              />
              <Button 
                onClick={handleAddNote} 
                disabled={!newNote.trim() || isAddingNote} 
                size="sm" 
                className="h-fit"
              >
                <Plus className="h-4 w-4 mr-1" />
                {isAddingNote ? 'Adding...' : 'Add'}
              </Button>
            </div>
          </div>

          <Separator />

          {/* Notes List */}
          <div className="grid gap-2">
            <div className="min-h-[200px] max-h-[400px] overflow-y-auto">
              {Array.isArray(notes) && notes.length > 0 ? (
                <div className="space-y-4">
                  {notes.map((note, index) => (
                    <div key={note._id} className="relative pl-6 pb-4">
                      {index < notes.length - 1 && (
                        <div className="absolute left-2 top-6 bottom-0 w-0.5 bg-border"></div>
                      )}
                      <div className="absolute left-0 top-1 w-4 h-4 bg-primary rounded-full border-2 border-background"></div>
                      <div className="bg-muted rounded-lg p-3">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Clock className="h-3 w-3 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground">
                              {formatTimestamp(note.createdAt)} by {note.createdBy?.name || 'Unknown'}
                            </span>
                          </div>
                          {editingNoteId === note._id ? (
                            <div className="flex items-center gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0"
                                onClick={handleSaveEdit}
                                disabled={isUpdatingNote || !editingNoteText.trim()}
                              >
                                <Save className="h-3 w-3 text-green-600" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0"
                                onClick={handleCancelEdit}
                                disabled={isUpdatingNote}
                              >
                                <X className="h-3 w-3 text-red-600" />
                              </Button>
                            </div>
                          ) : (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0"
                              onClick={() => handleStartEdit(note)}
                            >
                              <Edit2 className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                            </Button>
                          )}
                        </div>
                        {editingNoteId === note._id ? (
                          <Textarea
                            value={editingNoteText}
                            onChange={(e) => setEditingNoteText(e.target.value)}
                            className="min-h-[80px] text-sm"
                            disabled={isUpdatingNote}
                          />
                        ) : (
                          <p className="text-sm">{note.note}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <span className="text-muted-foreground">No notes yet. Add your first note above.</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

