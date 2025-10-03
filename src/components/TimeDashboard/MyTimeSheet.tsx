
import { useState, useEffect, useMemo } from "react";
import { Search, Filter, ChevronDown, ArrowUpDown, ArrowUp, ArrowDown, ChevronLeft, ChevronRight, RotateCcw, RefreshCw, ArrowLeft, Plus, X, Trash2, Edit2 } from "lucide-react";
import { StatusBadge, FilterBadge } from "@/components/StatusBadge";
import { WeekNavigation } from "@/components/WeekNavigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuCheckboxItem } from "@/components/ui/dropdown-menu";
import { DashboardCard, DashboardGrid } from "@/components/ui/dashboard-card";
import { Card, CardContent } from "../ui/card";
import { useGetTimesheetQuery, useAddTimesheetMutation, useUpdateTimesheetMutation } from "@/store/timesheetApi";
import { useGetCurrentUserQuery } from "@/store/authApi";
import { 
  formatHours, 
  parseTimeInput, 
  getCurrentWeekRange, 
  convertTimeEntriesToRows, 
  calculateTotals, 
  convertRowsToTimeEntries,
  getDailySummaryData,
  minutesToHours
} from "@/utils/timesheetUtils";

// Types for timesheet rows
interface TimesheetRow {
  id: string;
  ref: string;
  client: string;
  job: string;
  category: string;
  description: string;
  billable: boolean;
  rate: string;
  hours: {
    mon: number;
    tue: number;
    wed: number;
    thu: number;
    fri: number;
    sat: number;
    sun: number;
  };
}

interface MyTimeSheetProps {
  currentWeek?: { weekStart: string; weekEnd: string };
  onWeekChange?: (weekStart: string, weekEnd: string) => void;
}

export const MyTimeSheet = ({ currentWeek: propCurrentWeek, onWeekChange }: MyTimeSheetProps = {}) => {
    const [hideWeekend, setHideWeekend] = useState(false);
    const [timesheetSortField, setTimesheetSortField] = useState<'ref' | 'client' | 'job' | 'category' | 'description' | 'rate' | null>(null);
    const [timesheetSortDirection, setTimesheetSortDirection] = useState<'asc' | 'desc' | null>(null);
    const [timesheetRows, setTimesheetRows] = useState<TimesheetRow[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [hasChanges, setHasChanges] = useState(false);

    // Use prop current week or fallback to default
    const currentWeek =  getCurrentWeekRange();
    //  console.log("currentWeek============", currentWeek);
    // Get current user
    const { data: currentUser } = useGetCurrentUserQuery();

    // Get timesheet data for current week
    const { 
        data: timesheetData, 
        isLoading: isTimesheetLoading, 
        error: timesheetError,
        refetch: refetchTimesheet 
    } = useGetTimesheetQuery({
        weekStart: currentWeek.weekStart,
        weekEnd: currentWeek.weekEnd,
    });

    // Mutations
    const [addTimesheet] = useAddTimesheetMutation();
    const [updateTimesheet] = useUpdateTimesheetMutation();

    // Extract data from API response
    const timesheet = timesheetData?.data;
    const dropdownOptions = timesheetData?.dropdoenOptionals;
    const billableRate = timesheetData?.billableRate || 35;

    // Convert API data to dropdown options
    const clients = dropdownOptions?.clients || [];
    const jobs = dropdownOptions?.jobs || [];
    const categories = dropdownOptions?.jobCategories || [];
    const rates = [`€${billableRate.toFixed(2)}`];

    // Convert time entries to rows when data loads
    useEffect(() => {
        if (timesheet?.timeEntries && clients.length > 0 && jobs.length > 0 && categories.length > 0) {
            const convertedRows = convertTimeEntriesToRows(
                timesheet.timeEntries,
                clients,
                jobs,
                categories
            );
            setTimesheetRows(convertedRows);
            setHasChanges(false);
        }
    }, [timesheet?.timeEntries, clients, jobs, categories]);

    // Handle week change - delegate to parent if provided
    const handleWeekChange = (weekStart: string, weekEnd: string) => {
        if (onWeekChange) {
            onWeekChange(weekStart, weekEnd);
        }
        setHasChanges(false);
    };

    // Save timesheet changes
    const handleSaveChanges = async () => {
        if (!timesheet || !clients.length || !jobs.length || !categories.length) return;
        
        setIsLoading(true);
        try {
            const timeEntries = convertRowsToTimeEntries(
                timesheetRows,
                clients,
                jobs,
                categories,
                currentWeek.weekStart
            );

            if (timesheet._id) {
                // Update existing timesheet
                await updateTimesheet({
                    timesheetId: timesheet._id,
                    timeEntries,
                }).unwrap();
            } else {
                // Create new timesheet
                await addTimesheet({
                    weekStart: currentWeek.weekStart,
                    weekEnd: currentWeek.weekEnd,
                    timeEntries,
                }).unwrap();
            }
            
            setHasChanges(false);
            await refetchTimesheet();
        } catch (error) {
            console.error('Error saving timesheet:', error);
            alert('Error saving timesheet. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    // Add new row
    const handleAddRow = () => {
        if (clients.length === 0 || jobs.length === 0 || categories.length === 0) {
            alert('Please wait for data to load before adding a new row.');
            return;
        }

        const newId = `temp-${Date.now()}`;
        const generateClientRef = (clientName: string) => {
            const firstThreeLetters = clientName.substring(0, 3).toUpperCase();
            const year = new Date().getFullYear().toString().slice(-2);
            return `${firstThreeLetters}-${year}`;
        };

        const newRow: TimesheetRow = {
            id: newId,
            ref: generateClientRef(clients[0].name),
            client: clients[0].name,
            job: jobs[0].name,
            category: categories[0].name,
            description: "",
            billable: true,
            rate: `€${billableRate.toFixed(2)}`,
            hours: {
                mon: 0,
                tue: 0,
                wed: 0,
                thu: 0,
                fri: 0,
                sat: 0,
                sun: 0
            }
        };

        setTimesheetRows([...timesheetRows, newRow]);
        setHasChanges(true);
    };

    // Delete row
    const handleDeleteRow = (rowId: string) => {
        setTimesheetRows(rows => rows.filter(r => r.id !== rowId));
        setHasChanges(true);
    };

    // Update row data
    const updateRow = (rowId: string, updates: Partial<TimesheetRow>) => {
        setTimesheetRows(rows => 
            rows.map(r => r.id === rowId ? { ...r, ...updates } : r)
        );
        setHasChanges(true);
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
    // Calculate totals using memoized function
    const totals = useMemo(() => calculateTotals(timesheetRows), [timesheetRows]);

    // Get daily summary data from API
    const dailySummary = useMemo(() => {
        if (timesheet?.dailySummary) {
            return getDailySummaryData(timesheet.dailySummary);
        }
        return {
            mon: { billable: 0, nonBillable: 0, logged: 0, capacity: 0, variance: 0 },
            tue: { billable: 0, nonBillable: 0, logged: 0, capacity: 0, variance: 0 },
            wed: { billable: 0, nonBillable: 0, logged: 0, capacity: 0, variance: 0 },
            thu: { billable: 0, nonBillable: 0, logged: 0, capacity: 0, variance: 0 },
            fri: { billable: 0, nonBillable: 0, logged: 0, capacity: 0, variance: 0 },
            sat: { billable: 0, nonBillable: 0, logged: 0, capacity: 0, variance: 0 },
            sun: { billable: 0, nonBillable: 0, logged: 0, capacity: 0, variance: 0 },
        };
    }, [timesheet?.dailySummary]);

    // Format week dates for display
    const weekDisplay = useMemo(() => {
        const startDate = new Date(currentWeek.weekStart);
        const endDate = new Date(currentWeek.weekEnd);
        const weekNumber = Math.ceil((startDate.getTime() - new Date(startDate.getFullYear(), 0, 1).getTime()) / (7 * 24 * 60 * 60 * 1000));
        
        return {
            start: startDate.toLocaleDateString('en-GB'),
            end: endDate.toLocaleDateString('en-GB'),
            weekNumber
        };
    }, [currentWeek]);

    // Show loading state
    if (isTimesheetLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-muted-foreground">Loading timesheet data...</p>
                </div>
            </div>
        );
    }

    // Show error state
    if (timesheetError) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-center">
                    <p className="text-red-500 mb-4">Error loading timesheet data</p>
                    <Button onClick={() => refetchTimesheet()}>Retry</Button>
                </div>
            </div>
        );
    }
    return (
        <div className="space-y-6">
            {/* Header with Profile and Actions */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 sm:p-6 bg-card rounded-lg border gap-4">
                <div className="flex items-center gap-4">
                    <Avatar className="w-10 h-10 sm:w-12 sm:h-12">
                        <AvatarImage src={(currentUser as any)?.avatarUrl || "/lovable-uploads/69927594-4747-4d86-a60e-64c607e67d1f.png"} />
                        <AvatarFallback>
                            {currentUser?.name?.split(' ').map(n => n[0]).join('') || 'JS'}
                        </AvatarFallback>
                    </Avatar>
                    <div>
                        <h2 className="text-lg sm:text-xl font-semibold text-foreground">
                            {currentUser?.name || 'John Smith'}
                        </h2>
                    </div>
                </div>
                <div className="flex items-center justify-center flex-1">
                    <p className="text-sm sm:text-base text-muted-foreground font-medium text-center sm:text-left">
                        {weekDisplay.start} to {weekDisplay.end} - Week {weekDisplay.weekNumber}
                    </p>
                </div>
                <div className="flex gap-2 w-full sm:w-auto">
                    <Button 
                        variant="outline" 
                        className="text-green-600 border-green-600 hover:bg-green-50 flex-1 sm:flex-none text-sm" 
                        onClick={() => {
                            alert('Timesheet submitted for approval!');
                        }}
                        disabled={timesheet?.status === 'submitted' || timesheet?.status === 'approved'}
                    >
                        {timesheet?.status === 'submitted' ? 'Submitted' : 
                         timesheet?.status === 'approved' ? 'Approved' : 'Submit for Approval'}
                    </Button>
                </div>
            </div>

            {/* Summary Cards */}
            {/* <DashboardGrid columns={4}>
                <DashboardCard
                    title="Billable"
                    value={
                        <div className="flex items-center gap-2">
                            <span>{formatHours(totals.billable.total)}</span>
                            <span className="text-xs sm:text-sm text-muted-foreground">
                                ({totals.logged.total > 0 ? (totals.billable.total / totals.logged.total * 100).toFixed(1) : 0}%)
                            </span>
                        </div>
                    }
                    valueColor="text-[#381980]"
                />
                <DashboardCard
                    title="Non-Billable"
                    value={
                        <div className="flex items-center gap-2">
                            <span>{formatHours(totals.nonBillable.total)}</span>
                            <span className="text-xs sm:text-sm text-muted-foreground">
                                ({totals.logged.total > 0 ? (totals.nonBillable.total / totals.logged.total * 100).toFixed(1) : 0}%)
                            </span>
                        </div>
                    }
                    valueColor="text-[#381980]"
                />
                <DashboardCard
                    title="Total Logged"
                    value={
                        <div className="flex items-center gap-2">
                            <span>{formatHours(totals.logged.total)}</span>
                            <span className="text-xs sm:text-sm text-muted-foreground">
                                ({(totals.logged.total / 40 * 100).toFixed(1)}%)
                            </span>
                        </div>
                    }
                    valueColor="text-[#381980]"
                />
                <DashboardCard
                    title="Variance"
                    value={
                        <div className="flex items-center gap-2">
                            <span>{formatHours(40 - totals.logged.total)}</span>
                            <span className="text-xs sm:text-sm text-muted-foreground">
                                ({((40 - totals.logged.total) / 40 * 100).toFixed(1)}%)
                            </span>
                        </div>
                    }
                    valueColor="text-[#381980]"
                />
            </DashboardGrid> */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="h-full">
                    <CardContent className="p-4">
                        <div className="flex items-baseline gap-2">
                            <div className="text-2xl font-bold !text-[#381980]">
                                {formatHours(totals.billable.total)}
                            </div>
                            <div className="text-xs sm:text-sm text-muted-foreground">
                                ({totals.logged.total > 0 ? (totals.billable.total / totals.logged.total * 100).toFixed(1) : 0}%)
                            </div>
                        </div>
                        <p className="text-sm text-muted-foreground">Billable</p>
                    </CardContent>
                </Card>
                <Card className="h-full">
                    <CardContent className="p-4">
                        <div className="flex items-baseline gap-2">
                            <div className="text-2xl font-bold !text-[#381980]">
                                {formatHours(totals.nonBillable.total)}
                            </div>
                            <div className="text-xs sm:text-sm text-muted-foreground">
                                ({totals.logged.total > 0 ? (totals.nonBillable.total / totals.logged.total * 100).toFixed(1) : 0}%)
                            </div>
                        </div>
                        <p className="text-sm text-muted-foreground">Non-Billable</p>
                    </CardContent>
                </Card>
                <Card className="h-full">
                    <CardContent className="p-4">
                        <div className="flex items-baseline gap-2">
                            <div className="text-2xl font-bold !text-[#381980]">
                                {formatHours(totals.logged.total)}
                            </div>
                            <div className="text-xs sm:text-sm text-muted-foreground">
                                ({(totals.logged.total / 40 * 100).toFixed(1)}%)
                            </div>
                        </div>
                        <p className="text-sm text-muted-foreground">Total Logged</p>
                    </CardContent>
                </Card>
                <Card className="h-full">
                    <CardContent className="p-4">
                        <div className="flex items-baseline gap-2">
                            <div className="text-2xl font-bold !text-[#381980]">
                                {formatHours(40 - totals.logged.total)}
                            </div>
                            <div className="text-xs sm:text-sm text-muted-foreground">
                                ({((40 - totals.logged.total) / 40 * 100).toFixed(1)}%)
                            </div>
                        </div>
                        <p className="text-sm text-muted-foreground">Variance</p>
                    </CardContent>
                </Card>
            </div>



            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                    <Button 
                        variant="outline" 
                        className="text-green-600 border-green-600 hover:bg-green-50 h-9 text-sm"
                        disabled={timesheet?.status === 'approved' || timesheet?.status === 'rejected'}
                    >
                        Approve
                    </Button>
                    <Button 
                        variant="outline" 
                        className="text-red-600 border-red-600 hover:bg-red-50 h-9 text-sm"
                        disabled={timesheet?.status === 'approved' || timesheet?.status === 'rejected'}
                    >
                        Reject
                    </Button>
                </div>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                    <div className="flex items-center justify-between sm:justify-start gap-2">
                        <span className="text-sm text-muted-foreground">Hide Weekend</span>
                        <Switch checked={hideWeekend} onCheckedChange={setHideWeekend} />
                    </div>
                    <Button 
                        variant="outline" 
                        className="flex items-center justify-center gap-2 text-primary border-primary hover:bg-primary/10 h-9 text-sm" 
                        onClick={handleAddRow}
                        disabled={isLoading}
                    >
                        <Plus className="w-4 h-4" />
                        New Row
                    </Button>
                    <Button 
                        variant="outline" 
                        className="flex items-center justify-center gap-2 text-primary border-primary hover:bg-primary/10 h-9 text-sm"
                        onClick={handleSaveChanges}
                        disabled={!hasChanges || isLoading}
                    >
                        {isLoading ? (
                            <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                                Saving...
                            </>
                        ) : (
                            <>
                                <RefreshCw className="w-4 h-4" />
                                Save Changes
                            </>
                        )}
                    </Button>
                </div>
            </div>

            {/* Detailed Timesheet Table */}
            <div className="bg-card rounded-lg border overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[1200px]">
                        <thead className="bg-muted/50">
                            <tr>
                                <th className="text-left px-2 sm:px-3 py-2 text-xs font-medium text-muted-foreground w-20 sm:w-24">
                                    <button className="flex items-center gap-1 sm:gap-2 hover:text-foreground transition-colors" onClick={() => handleTimesheetSort('ref')}>
                                        <span className="hidden sm:inline">CLIENT REF</span>
                                        <span className="sm:hidden">REF</span>
                                        {getTimesheetSortIcon('ref')}
                                    </button>
                                </th>
                                <th className="text-left px-2 sm:px-3 py-2 text-xs font-medium text-muted-foreground w-24 sm:w-32">
                                    <button className="flex items-center gap-1 sm:gap-2 hover:text-foreground transition-colors" onClick={() => handleTimesheetSort('client')}>
                                        <span className="hidden sm:inline">CLIENT NAME</span>
                                        <span className="sm:hidden">CLIENT</span>
                                        {getTimesheetSortIcon('client')}
                                    </button>
                                </th>
                                <th className="text-left px-2 sm:px-3 py-2 text-xs font-medium text-muted-foreground w-32 sm:w-40">
                                    <button className="flex items-center gap-1 sm:gap-2 hover:text-foreground transition-colors" onClick={() => handleTimesheetSort('job')}>
                                        <span className="hidden sm:inline">JOB NAME</span>
                                        <span className="sm:hidden">JOB</span>
                                        {getTimesheetSortIcon('job')}
                                    </button>
                                </th>
                                <th className="text-left px-2 sm:px-3 py-2 text-xs font-medium text-muted-foreground w-20 sm:w-24">
                                    <button className="flex items-center gap-1 sm:gap-2 hover:text-foreground transition-colors" onClick={() => handleTimesheetSort('category')}>
                                        <span className="hidden sm:inline">CATEGORY</span>
                                        <span className="sm:hidden">CAT</span>
                                        {getTimesheetSortIcon('category')}
                                    </button>
                                </th>
                                <th className="text-left px-2 sm:px-3 py-2 text-xs font-medium text-muted-foreground w-32 sm:w-48">
                                    <button className="flex items-center gap-1 sm:gap-2 hover:text-foreground transition-colors" onClick={() => handleTimesheetSort('description')}>
                                        <span className="hidden sm:inline">DESCRIPTION</span>
                                        <span className="sm:hidden">DESC</span>
                                        {getTimesheetSortIcon('description')}
                                    </button>
                                </th>
                                <th className="text-center px-2 sm:px-3 py-2 text-xs font-medium text-muted-foreground w-16 sm:w-20">BILLABLE</th>
                                <th className="text-left px-2 sm:px-3 py-2 text-xs font-medium text-muted-foreground w-12 sm:w-16">
                                    <button className="flex items-center gap-1 sm:gap-2 hover:text-foreground transition-colors" onClick={() => handleTimesheetSort('rate')}>
                                        RATE
                                        {getTimesheetSortIcon('rate')}
                                    </button>
                                </th>
                                <th className="text-center px-1 sm:px-3 py-2 text-xs font-medium text-muted-foreground w-12 sm:w-16">MON 23</th>
                                <th className="text-center px-1 sm:px-3 py-2 text-xs font-medium text-muted-foreground w-12 sm:w-16">TUE 24</th>
                                <th className="text-center px-1 sm:px-3 py-2 text-xs font-medium text-muted-foreground w-12 sm:w-16">WED 25</th>
                                <th className="text-center px-1 sm:px-3 py-2 text-xs font-medium text-muted-foreground w-12 sm:w-16">THU 26</th>
                                <th className="text-center px-1 sm:px-3 py-2 text-xs font-medium text-muted-foreground w-12 sm:w-16">FRI 27</th>
                                {!hideWeekend && <th className="text-center px-1 sm:px-3 py-2 text-xs font-medium text-muted-foreground w-12 sm:w-16">SAT 28</th>}
                                {!hideWeekend && <th className="text-center px-1 sm:px-3 py-2 text-xs font-medium text-muted-foreground w-12 sm:w-16">SUN 29</th>}
                                <th className="text-right px-1 sm:px-3 py-2 text-xs font-medium text-muted-foreground w-8 sm:w-12"></th>
                            </tr>
                        </thead>
                        <tbody>
                            {timesheetRows.sort((a, b) => {
                                if (!timesheetSortField || !timesheetSortDirection) return 0;
                                let aValue = a[timesheetSortField];
                                let bValue = b[timesheetSortField];

                                if (typeof aValue === 'string' && typeof bValue === 'string') {
                                    aValue = aValue.toLowerCase();
                                    bValue = bValue.toLowerCase();
                                }

                                if (timesheetSortDirection === 'asc') {
                                    return aValue > bValue ? 1 : -1;
                                } else {
                                    return aValue < bValue ? 1 : -1;
                                }
                            }).map(row => <tr key={row.id} className="border-t border-border hover:bg-muted/25">
                                <td className="px-3 py-2 text-sm text-left text-muted-foreground">{row.ref}</td>
                                <td className="px-3 py-2 text-sm">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="sm" className="text-left p-0 h-8 font-normal w-full justify-start">
                                                {row.client} <ChevronDown className="ml-1 w-3 h-3" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent>
                                            {clients.map(client => <DropdownMenuItem key={client._id} onClick={() => {
                                                const generateClientRef = (clientName: string) => {
                                                    const firstThreeLetters = clientName.substring(0, 3).toUpperCase();
                                                    const year = new Date().getFullYear().toString().slice(-2);
                                                    return `${firstThreeLetters}-${year}`;
                                                };
                                                updateRow(row.id, {
                                                    client: client.name,
                                                    ref: generateClientRef(client.name)
                                                });
                                            }}>
                                                {client.name}
                                            </DropdownMenuItem>)}
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </td>
                                <td className="px-3 py-2 text-sm">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="sm" className="text-left p-0 h-8 font-normal w-full justify-start">
                                                {row.job} <ChevronDown className="ml-1 w-3 h-3" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent>
                                            {jobs.map(job => <DropdownMenuItem key={job._id} onClick={() => {
                                                updateRow(row.id, {
                                                    job: job.name
                                                });
                                            }}>
                                                {job.name}
                                            </DropdownMenuItem>)}
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </td>
                                <td className="px-3 py-2">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="sm" className="text-left p-0 h-8 font-normal">
                                                <span className={`px-2 py-1 text-xs rounded whitespace-nowrap flex items-center ${row.category === 'Client Work' ? 'bg-blue-100 text-blue-800' : row.category === 'Admin' ? 'bg-green-100 text-green-800' : row.category === 'Training' ? 'bg-orange-100 text-orange-800' : row.category === 'Meeting' ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800'}`}>
                                                    {row.category} <ChevronDown className="ml-1 w-3 h-3" />
                                                </span>
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent>
                                            {categories.map(category => <DropdownMenuItem key={category._id} onClick={() => {
                                                updateRow(row.id, {
                                                    category: category.name
                                                });
                                            }}>
                                                {category.name}
                                            </DropdownMenuItem>)}
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </td>
                                <td className="px-3 py-2 text-sm">
                                    <Input value={row.description} onChange={e => {
                                        updateRow(row.id, {
                                            description: e.target.value
                                        });
                                    }} className="border border-input p-1 h-8 bg-background text-sm rounded" placeholder="Add description..." />
                                </td>
                                <td className="px-3 py-2 text-center">
                                    <Switch checked={row.billable} onCheckedChange={checked => {
                                        updateRow(row.id, {
                                            billable: checked
                                        });
                                    }} />
                                </td>
                                <td className="px-3 py-2 text-sm">
                                    {row.billable ? <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="sm" className="text-left p-0 h-8 font-normal">
                                                {row.rate} <ChevronDown className="ml-1 w-3 h-3" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent>
                                            {rates.map(rate => <DropdownMenuItem key={rate} onClick={() => {
                                                updateRow(row.id, {
                                                    rate
                                                });
                                            }}>
                                                {rate}
                                            </DropdownMenuItem>)}
                                        </DropdownMenuContent>
                                    </DropdownMenu> : null}
                                </td>
                                <td className="px-3 py-2 text-center text-sm">
                                    <Input type="text" value={row.hours.mon === 0 ? "" : formatHours(row.hours.mon)} onChange={e => {
                                        const timeStr = e.target.value;
                                        const value = parseTimeInput(timeStr);
                                        updateRow(row.id, {
                                            hours: {
                                                ...row.hours,
                                                mon: value
                                            }
                                        });
                                    }} placeholder="" className="w-16 text-center border border-input p-1 h-8 bg-background text-sm rounded" />
                                </td>
                                <td className="px-3 py-2 text-center text-sm">
                                    <Input type="text" value={row.hours.tue === 0 ? "" : formatHours(row.hours.tue)} onChange={e => {
                                        const timeStr = e.target.value;
                                        const value = parseTimeInput(timeStr);
                                        updateRow(row.id, {
                                            hours: {
                                                ...row.hours,
                                                tue: value
                                            }
                                        });
                                    }} placeholder="" className="w-16 text-center border border-input p-1 h-8 bg-background text-sm rounded" />
                                </td>
                                <td className="px-3 py-2 text-center text-sm">
                                    <Input type="text" value={row.hours.wed === 0 ? "" : formatHours(row.hours.wed)} onChange={e => {
                                        const timeStr = e.target.value;
                                        const value = parseTimeInput(timeStr);
                                        updateRow(row.id, {
                                            hours: {
                                                ...row.hours,
                                                wed: value
                                            }
                                        });
                                    }} placeholder="" className="w-16 text-center border border-input p-1 h-8 bg-background text-sm rounded" />
                                </td>
                                <td className="px-3 py-2 text-center text-sm">
                                    <Input type="text" value={row.hours.thu === 0 ? "" : formatHours(row.hours.thu)} onChange={e => {
                                        const timeStr = e.target.value;
                                        const value = parseTimeInput(timeStr);
                                        updateRow(row.id, {
                                            hours: {
                                                ...row.hours,
                                                thu: value
                                            }
                                        });
                                    }} placeholder="" className="w-16 text-center border border-input p-1 h-8 bg-background text-sm rounded" />
                                </td>
                                <td className="px-3 py-2 text-center text-sm">
                                    <Input type="text" value={row.hours.fri === 0 ? "" : formatHours(row.hours.fri)} onChange={e => {
                                        const timeStr = e.target.value;
                                        const value = parseTimeInput(timeStr);
                                        updateRow(row.id, {
                                            hours: {
                                                ...row.hours,
                                                fri: value
                                            }
                                        });
                                    }} placeholder="" className="w-16 text-center border border-input p-1 h-8 bg-background text-sm rounded" />
                                </td>
                                {!hideWeekend && <td className="px-3 py-2 text-center text-sm">
                                    <Input type="text" value={row.hours.sat === 0 ? "" : formatHours(row.hours.sat)} onChange={e => {
                                        const timeStr = e.target.value;
                                        const value = parseTimeInput(timeStr);
                                        updateRow(row.id, {
                                            hours: {
                                                ...row.hours,
                                                sat: value
                                            }
                                        });
                                    }} placeholder="" className="w-16 text-center border border-input p-1 h-8 bg-background text-sm rounded" />
                                </td>}
                                {!hideWeekend && <td className="px-3 py-2 text-center text-sm">
                                    <Input type="text" value={row.hours.sun === 0 ? "" : formatHours(row.hours.sun)} onChange={e => {
                                        const timeStr = e.target.value;
                                        const value = parseTimeInput(timeStr);
                                        updateRow(row.id, {
                                            hours: {
                                                ...row.hours,
                                                sun: value
                                            }
                                        });
                                    }} placeholder="" className="w-16 text-center border border-input p-1 h-8 bg-background text-sm rounded" />
                                </td>}
                                <td className="px-3 py-2 text-right">
                                    <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-700" onClick={() => {
                                        handleDeleteRow(row.id);
                                    }}>
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </td>
                            </tr>)}
                        </tbody>
                        {/* Summary rows */}
                        <tbody className="border-t-2 border-border">
                            <tr className="bg-blue-50">
                                <td colSpan={7} className="px-3 py-2 text-sm font-normal text-right">BILLABLE</td>
                                <td className="px-3 py-2 text-center text-sm font-normal">{formatHours(dailySummary.mon.billable)}</td>
                                <td className="px-3 py-2 text-center text-sm font-normal">{formatHours(dailySummary.tue.billable)}</td>
                                <td className="px-3 py-2 text-center text-sm font-normal">{formatHours(dailySummary.wed.billable)}</td>
                                <td className="px-3 py-2 text-center text-sm font-normal">{formatHours(dailySummary.thu.billable)}</td>
                                <td className="px-3 py-2 text-center text-sm font-normal">{formatHours(dailySummary.fri.billable)}</td>
                                {!hideWeekend && <td className="px-3 py-2 text-center text-sm font-normal">{formatHours(dailySummary.sat.billable)}</td>}
                                {!hideWeekend && <td className="px-3 py-2 text-center text-sm font-normal">{formatHours(dailySummary.sun.billable)}</td>}
                                <td className="px-3 py-2 text-center text-sm font-normal">{formatHours(totals.billable.total)}</td>
                            </tr>
                            <tr className="bg-gray-50">
                                <td colSpan={7} className="px-3 py-2 text-sm font-normal text-right">NON BILLABLE</td>
                                <td className="px-3 py-2 text-center text-sm font-normal">{formatHours(dailySummary.mon.nonBillable)}</td>
                                <td className="px-3 py-2 text-center text-sm font-normal">{formatHours(dailySummary.tue.nonBillable)}</td>
                                <td className="px-3 py-2 text-center text-sm font-normal">{formatHours(dailySummary.wed.nonBillable)}</td>
                                <td className="px-3 py-2 text-center text-sm font-normal">{formatHours(dailySummary.thu.nonBillable)}</td>
                                <td className="px-3 py-2 text-center text-sm font-normal">{formatHours(dailySummary.fri.nonBillable)}</td>
                                {!hideWeekend && <td className="px-3 py-2 text-center text-sm font-normal">{formatHours(dailySummary.sat.nonBillable)}</td>}
                                {!hideWeekend && <td className="px-3 py-2 text-center text-sm font-normal">{formatHours(dailySummary.sun.nonBillable)}</td>}
                                <td className="px-3 py-2 text-center text-sm font-normal">{formatHours(totals.nonBillable.total)}</td>
                            </tr>
                            <tr className="bg-blue-50">
                                <td colSpan={7} className="px-3 py-2 text-sm font-normal text-right">LOGGED</td>
                                <td className="px-3 py-2 text-center text-sm font-normal">{formatHours(dailySummary.mon.logged)}</td>
                                <td className="px-3 py-2 text-center text-sm font-normal">{formatHours(dailySummary.tue.logged)}</td>
                                <td className="px-3 py-2 text-center text-sm font-normal">{formatHours(dailySummary.wed.logged)}</td>
                                <td className="px-3 py-2 text-center text-sm font-normal">{formatHours(dailySummary.thu.logged)}</td>
                                <td className="px-3 py-2 text-center text-sm font-normal">{formatHours(dailySummary.fri.logged)}</td>
                                {!hideWeekend && <td className="px-3 py-2 text-center text-sm font-normal">{formatHours(dailySummary.sat.logged)}</td>}
                                {!hideWeekend && <td className="px-3 py-2 text-center text-sm font-normal">{formatHours(dailySummary.sun.logged)}</td>}
                                <td className="px-3 py-2 text-center text-sm font-normal">{formatHours(totals.logged.total)}</td>
                            </tr>
                            <tr className="bg-gray-100">
                                <td colSpan={7} className="px-3 py-2 text-sm font-normal text-right">CAPACITY</td>
                                <td className="px-3 py-2 text-center text-sm font-normal">{formatHours(dailySummary.mon.capacity)}</td>
                                <td className="px-3 py-2 text-center text-sm font-normal">{formatHours(dailySummary.tue.capacity)}</td>
                                <td className="px-3 py-2 text-center text-sm font-normal">{formatHours(dailySummary.wed.capacity)}</td>
                                <td className="px-3 py-2 text-center text-sm font-normal">{formatHours(dailySummary.thu.capacity)}</td>
                                <td className="px-3 py-2 text-center text-sm font-normal">{formatHours(dailySummary.fri.capacity)}</td>
                                {!hideWeekend && <td className="px-3 py-2 text-center text-sm font-normal">{formatHours(dailySummary.sat.capacity)}</td>}
                                {!hideWeekend && <td className="px-3 py-2 text-center text-sm font-normal">{formatHours(dailySummary.sun.capacity)}</td>}
                                <td className="px-3 py-2 text-center text-sm font-normal">{formatHours(totals.logged.total > 0 ? totals.logged.total : 40)}</td>
                            </tr>
                            <tr className="bg-red-50">
                                <td colSpan={7} className="px-3 py-2 text-sm font-normal text-right">VARIANCE</td>
                                <td className="px-3 py-2 text-center text-sm font-normal">{formatHours(dailySummary.mon.variance)}</td>
                                <td className="px-3 py-2 text-center text-sm font-normal">{formatHours(dailySummary.tue.variance)}</td>
                                <td className="px-3 py-2 text-center text-sm font-normal">{formatHours(dailySummary.wed.variance)}</td>
                                <td className="px-3 py-2 text-center text-sm font-normal">{formatHours(dailySummary.thu.variance)}</td>
                                <td className="px-3 py-2 text-center text-sm font-normal">{formatHours(dailySummary.fri.variance)}</td>
                                {!hideWeekend && <td className="px-3 py-2 text-center text-sm font-normal">{formatHours(dailySummary.sat.variance)}</td>}
                                {!hideWeekend && <td className="px-3 py-2 text-center text-sm font-normal">{formatHours(dailySummary.sun.variance)}</td>}
                                <td className="px-3 py-2 text-center text-sm font-normal">{formatHours(40 - totals.logged.total)}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}
