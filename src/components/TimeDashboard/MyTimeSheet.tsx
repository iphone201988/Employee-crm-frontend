
import { useState, useEffect, useMemo } from "react";
import { Search, Filter, ChevronDown, ArrowUpDown, ArrowUp, ArrowDown, ChevronLeft, ChevronRight, RotateCcw, RefreshCw, ArrowLeft, Plus, X, Trash2, Edit2 } from "lucide-react";
import { StatusBadge, FilterBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuCheckboxItem } from "@/components/ui/dropdown-menu";
import { DashboardCard, DashboardGrid } from "@/components/ui/dashboard-card";
import { Card, CardContent } from "../ui/card";
import { useGetTimesheetQuery, useAddTimesheetMutation, useChangeTimesheetStatusMutation } from "@/store/timesheetApi";
import { toast } from "sonner";
import { useGetCurrentUserQuery } from "@/store/authApi";
import { useSearchParams } from "react-router-dom";
import { 
  formatHours, 
  formatSeconds,
  secondsToTime,
  timeToSeconds,
  hoursToSeconds,
  parseTimeInput, 
  getCurrentWeekRange, 
  convertTimeEntriesToRows, 
  calculateTotals, 
  convertRowsToTimeEntries,
  getDailySummaryData,
  getWeekDays,
  secondsToHours
} from "@/utils/timesheetUtils";

// Types for timesheet rows
interface TimesheetRow {
  id: string;
  ref: string;
  client: string;
  clientId: string;
  job: string;
  jobId: string;
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
  timesheetId?: string;
  userId?: string;
}

export const MyTimeSheet = ({ currentWeek: propCurrentWeek, onWeekChange, timesheetId: propTimesheetId, userId: propUserId }: MyTimeSheetProps = {}) => {
    const [searchParams] = useSearchParams();
    
    // Debug component mount/unmount
    useEffect(() => {
        console.log('MyTimeSheet: Component mounted');
        return () => {
            console.log('MyTimeSheet: Component unmounted');
        };
    }, []);

    const [hideWeekend, setHideWeekend] = useState(false);
    const [timesheetSortField, setTimesheetSortField] = useState<'ref' | 'client' | 'job' | 'category' | 'description' | 'rate' | null>(null);
    const [timesheetSortDirection, setTimesheetSortDirection] = useState<'asc' | 'desc' | null>(null);
    const [timesheetRows, setTimesheetRows] = useState<TimesheetRow[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [hasChanges, setHasChanges] = useState(false);

    // Extract URL parameters for specific timesheet viewing (prefer props over URL params)
    const timesheetId = propTimesheetId || searchParams.get('timesheetId');
    const userId = propUserId || searchParams.get('userId');

    // Track current week for query and navigation
    const [currentWeek, setCurrentWeek] = useState(() => propCurrentWeek ?? getCurrentWeekRange());
    
    // Memoize query parameters to prevent unnecessary re-queries
    const queryParams = useMemo(() => ({
        weekStart: currentWeek.weekStart,
        weekEnd: currentWeek.weekEnd,
        timesheetId: timesheetId || undefined,
        userId: userId || undefined,
    }), [currentWeek.weekStart, currentWeek.weekEnd, timesheetId, userId]);

    const { data: currentUser }:any = useGetCurrentUserQuery();

    const { 
        data: timesheetData, 
        isLoading: isTimesheetLoading, 
        error: timesheetError,
        refetch: refetchTimesheet 
    } = useGetTimesheetQuery(queryParams);

    useEffect(() => {
        console.log('MyTimeSheet: useGetTimesheetQuery called with:', {
            weekStart: queryParams.weekStart,
            weekEnd: queryParams.weekEnd,
            timesheetId: queryParams.timesheetId,
            userId: queryParams.userId,
            isLoading: isTimesheetLoading,
            hasData: !!timesheetData
        });
    }, [queryParams.weekStart, queryParams.weekEnd, queryParams.timesheetId, queryParams.userId, isTimesheetLoading, timesheetData]);

    // Mutations
    const [addTimesheet] = useAddTimesheetMutation();
    const [changeTimesheetStatus, { isLoading: isSubmittingStatus }] = useChangeTimesheetStatusMutation();

    // Extract data from API response
    const timesheet = timesheetData?.data;
    console.log('timesheet============================', timesheet);
    const dropdownOptions = timesheetData?.dropdoenOptionals;
    const billableRate = timesheetData?.rate || 35;
    const userDisplayName = (timesheetData as any)?.name;
    const userAvatarUrl = (timesheetData as any)?.avatarUrl;

    const shouldShowApproveRejectButtons = useMemo(() => {
        const hasTimesheetId = !!timesheetId;

        const autoApproveDisabled = (currentUser as any)?.data?.settings?.[0]?.autoApproveTimesheets === false;

        const hasApprovePermission = (currentUser as any)?.data?.permissions?.approveTimesheets === true;

        const inReview = timesheet?.status === 'reviewed';

        return hasTimesheetId && autoApproveDisabled && hasApprovePermission;
    }, [timesheetId, currentUser]);

    // Convert API data to dropdown options
    const clients = dropdownOptions?.clients || [];
    const jobs = dropdownOptions?.jobs || [];
    const categories = dropdownOptions?.jobCategories || [];
    const rates = [`€${billableRate.toFixed(2)}`];

    // Function to get filtered jobs based on selected client
    const getFilteredJobs = (clientId: string) => {
        if (!clientId) return jobs;
        return jobs.filter(job => job.clientId === clientId);
    };

    // Function to check if a row is a duplicate
    const isDuplicateRow = (rowIndex: number) => {
        const row = timesheetRows[rowIndex];
        if (!row || !row.clientId || !row.jobId) return false;
        
        const entryKey = `${row.clientId}-${row.jobId}-${row.category}-${row.billable}`;
        
        // Check if this combination appears more than once
        let count = 0;
        for (let i = 0; i < timesheetRows.length; i++) {
            const otherRow = timesheetRows[i];
            if (otherRow && otherRow.clientId && otherRow.jobId) {
                const otherEntryKey = `${otherRow.clientId}-${otherRow.jobId}-${otherRow.category}-${otherRow.billable}`;
                if (otherEntryKey === entryKey) {
                    count++;
                }
            }
        }
        
        return count > 1;
    };

    // Convert time entries to rows when data loads
    useEffect(() => {
        if (timesheet?.timeEntries && clients.length > 0 && jobs.length > 0 && categories.length > 0) {
            const convertedRows = convertTimeEntriesToRows(
                timesheet.timeEntries,
                clients,
                jobs,
                categories
            );
            // Convert to TimesheetRow format with clientId and jobId
            const timesheetRows = convertedRows.map(row => ({
                ...row,
                clientId: row.clientId || '',
                jobId: row.jobId || ''
            }));
            setTimesheetRows(timesheetRows);
            setHasChanges(false);
        }
    }, [timesheet?.timeEntries, clients, jobs, categories]);

    // When no data comes back for the selected week, clear the table rows
    useEffect(() => {
        const noEntries = !isTimesheetLoading && (!timesheet || !timesheet.timeEntries || timesheet.timeEntries.length === 0);
        if (noEntries) {
            setTimesheetRows([]);
            setHasChanges(false);
        }
    }, [isTimesheetLoading, timesheet?.timeEntries, currentWeek.weekStart, currentWeek.weekEnd]);

    // Handle week change - delegate to parent if provided
    const handleWeekChange = (weekStart: string, weekEnd: string) => {
        if (onWeekChange) {
            onWeekChange(weekStart, weekEnd);
        }
        setHasChanges(false);
    };

    // Build full payload for API (times, summaries, totals in seconds)
    const buildPayload = () => {
        if (!clients.length || !jobs.length || !categories.length) return null;
        const timeEntries = convertRowsToTimeEntries(
            timesheetRows,
            clients,
            
            jobs,
            categories,
            currentWeek.weekStart
        );
        
        // Precompute totals and build dailySummary aligned by offset from weekStart
        const totals = calculateTotals(timesheetRows);
        const dayKeys = ['mon','tue','wed','thu','fri','sat','sun'] as const;
        const dailySummary = dayKeys.map((key, offset) => {
            const cap = hoursToSeconds(8);
            const total = hoursToSeconds((totals.logged as any)[key] || 0);
            const bill = hoursToSeconds((totals.billable as any)[key] || 0);
            const nonBill = hoursToSeconds((totals.nonBillable as any)[key] || 0);
            const dateObj = new Date(currentWeek.weekStart);
            dateObj.setDate(new Date(currentWeek.weekStart).getDate() + offset);
            return {
                date: dateObj.toISOString(),
                billable: bill,
                nonBillable: nonBill,
                totalLogged: total,
                capacity: cap,
                variance: cap - total,
            };
        });

        const payload = {
            weekStart: currentWeek.weekStart,
            weekEnd: currentWeek.weekEnd,
            status: 'draft' as const,
            timeEntries,
            dailySummary,
            totalBillable: hoursToSeconds(totals.billable.total),
            totalNonBillable: hoursToSeconds(totals.nonBillable.total),
            totalLogged: hoursToSeconds(totals.logged.total),
            totalCapacity: hoursToSeconds(40),
            totalVariance: hoursToSeconds(40 - totals.logged.total),
            userId: userId || currentUser?._id,
        };
        return payload;
    };

    // Save timesheet changes
    const handleSaveChanges = async () => {
        if ( !clients.length || !jobs.length || !categories.length) return;
        
        setIsLoading(true);
        try {
            // Check for duplicate entries (same client, job, category, and billable value)
            const duplicateEntries = [];
            const seenEntries = new Set();
            
            for (let i = 0; i < timesheetRows.length; i++) {
                const row = timesheetRows[i];
                const entryKey = `${row.clientId}-${row.jobId}-${row.category}-${row.billable}`;
                
                if (seenEntries.has(entryKey)) {
                    duplicateEntries.push({
                        rowIndex: i + 1,
                        client: row.client,
                        job: row.job,
                        category: row.category,
                        billable: row.billable ? 'Yes' : 'No'
                    });
                } else {
                    seenEntries.add(entryKey);
                }
            }
            
            if (duplicateEntries.length > 0) {
                const duplicateDetails = duplicateEntries.map(entry => 
                    `Row ${entry.rowIndex}: ${entry.client} - ${entry.job} - ${entry.category} (Billable: ${entry.billable})`
                ).join('\n');
                
                toast.error(`Duplicate time entries found:\n${duplicateDetails}\n\nPlease remove duplicates before saving.`);
                setIsLoading(false);
                return;
            }

            // Validate each row has at least one non-zero hour
            const hasEmptyRow = timesheetRows.some(row => {
                const hrs = row.hours;
                return (
                    (!hrs.mon || hrs.mon <= 0) &&
                    (!hrs.tue || hrs.tue <= 0) &&
                    (!hrs.wed || hrs.wed <= 0) &&
                    (!hrs.thu || hrs.thu <= 0) &&
                    (!hrs.fri || hrs.fri <= 0) &&
                    (!hrs.sat || hrs.sat <= 0) &&
                    (!hrs.sun || hrs.sun <= 0)
                );
            });
            if (timesheetRows.length > 0 && hasEmptyRow) {
                toast.error('Please add some hours in the timesheet for each row before saving.');
                setIsLoading(false);
                return;
            }

            const payload = buildPayload();
            if (!payload) throw new Error('Unable to build payload');
            await addTimesheet(payload).unwrap();
            
            setHasChanges(false);
            await refetchTimesheet();
        } catch (error) {
            console.error('Error saving timesheet:', error);
            toast.error('Error saving timesheet. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    // Add new row
    const handleAddRow = () => {
        if (clients.length === 0 || jobs.length === 0 || categories.length === 0) {
            toast.error('Job is not assigned to you yet.');
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
            clientId: clients[0]._id,
            job: jobs[0].name,
            jobId: jobs[0]._id,
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
        // Capacity enforcement: 8 hours per day (across all rows)
        const MAX_HOURS_PER_DAY = 8;
        const dayKeys: Array<keyof TimesheetRow['hours']> = ['mon','tue','wed','thu','fri','sat','sun'];

        if (updates.hours) {
            // Determine which day(s) are being updated
            const targetDays = dayKeys.filter(k => updates.hours && typeof updates.hours[k] === 'number');

            // Build next rows tentatively
            const nextRows = timesheetRows.map(r => r.id === rowId ? { ...r, hours: { ...r.hours, ...(updates.hours as any) } } : r);

            // For each affected day, compute total and validate
            for (const day of targetDays) {
                const totalForDay = nextRows.reduce((sum, r) => sum + (r.hours[day] || 0), 0);
                if (totalForDay > MAX_HOURS_PER_DAY) {
                    toast.error(`You cannot log more than ${MAX_HOURS_PER_DAY}:00 hours in a single day.`);
                    return; // Block the update
                }
            }

            setTimesheetRows(nextRows);
            setHasChanges(true);
            return;
        }

        setTimesheetRows(rows => rows.map(r => r.id === rowId ? { ...r, ...updates } : r));
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

    // Get week days dynamically
    const weekDays = useMemo(() => {
        if (timesheet?.weekStart && timesheet?.weekEnd) {
            return getWeekDays(timesheet.weekStart, timesheet.weekEnd);
        }
        return getWeekDays(currentWeek.weekStart, currentWeek.weekEnd);
    }, [timesheet?.weekStart, timesheet?.weekEnd, currentWeek]);

    // Get totals from API response (in seconds) or fallback to calculated totals
    const apiTotals = useMemo(() => {
        if (timesheet) {
            return {
                billable: secondsToHours(timesheet.totalBillable),
                nonBillable: secondsToHours(timesheet.totalNonBillable),
                logged: secondsToHours(timesheet.totalLogged),
                variance: secondsToHours(timesheet.totalVariance)
            };
        }
        return {
            billable: totals.billable.total,
            nonBillable: totals.nonBillable.total,
            logged: totals.logged.total,
            variance: 40 - totals.logged.total
        };
    }, [timesheet, totals]);

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

    // Helpers for week navigation
    const addDaysUTC = (iso: string, days: number) => {
        const d = new Date(iso);
        const dUTC = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
        dUTC.setUTCDate(dUTC.getUTCDate() + days);
        return dUTC.toISOString().split('T')[0] + 'T00:00:00.000Z';
    };

    const getWeekRangeFromStart = (weekStartISO: string) => {
        const start = new Date(weekStartISO);
        const startUTC = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate()));
        const endUTC = new Date(Date.UTC(startUTC.getUTCFullYear(), startUTC.getUTCMonth(), startUTC.getUTCDate() + 6, 23, 59, 59, 999));
        return { weekStart: startUTC.toISOString(), weekEnd: endUTC.toISOString() };
    };

    const thisWeek = getCurrentWeekRange();
    const canGoNextWeek = useMemo(() => {
        return new Date(currentWeek.weekStart).getTime() < new Date(thisWeek.weekStart).getTime();
    }, [currentWeek.weekStart, thisWeek.weekStart]);

    const goPrevWeek = () => {
        const prevStart = addDaysUTC(currentWeek.weekStart, -7);
        const range = getWeekRangeFromStart(prevStart);
        setCurrentWeek(range);
        onWeekChange?.(range.weekStart, range.weekEnd);
    };

    const goNextWeek = () => {
        if (!canGoNextWeek) return;
        const nextStart = addDaysUTC(currentWeek.weekStart, 7);
        const range = getWeekRangeFromStart(nextStart);
        if (new Date(range.weekStart).getTime() > new Date(thisWeek.weekStart).getTime()) return;
        setCurrentWeek(range);
        onWeekChange?.(range.weekStart, range.weekEnd);
    };

    // Format week dates for display
    const weekDisplay = useMemo(() => {
        const startDate = new Date(currentWeek.weekStart);
        const endDate = new Date(currentWeek.weekEnd);
        const weekNumber = Math.ceil((startDate.getTime() - new Date(startDate.getFullYear(), 0, 1).getTime()) / (7 * 24 * 60 * 60 * 1000));
        
        // Format dates as "Sep 29 - Oct 5 2025"
        const formatDate = (date: Date) => {
            const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            const month = monthNames[date.getMonth()];
            const day = date.getDate();
            const year = date.getFullYear();
            return `${month} ${day} ${year}`;
        };
        
        const startFormatted = formatDate(startDate);
        const endFormatted = formatDate(endDate);
        
        return {
            start: startFormatted,
            end: endFormatted,
            weekNumber,
            fullDisplay: `${startFormatted} - ${endFormatted} (Week ${weekNumber})`
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
                        <AvatarImage src={userAvatarUrl || (currentUser as any)?.avatarUrl || "/lovable-uploads/69927594-4747-4d86-a60e-64c607e67d1f.png"} />
                        <AvatarFallback>
                            {(userDisplayName || currentUser?.name || 'JS')?.split(' ').map((n: string) => n[0]).join('')}
                        </AvatarFallback>
                    </Avatar>
                    <div>
                        <h2 className="text-lg sm:text-xl font-semibold text-foreground">
                            {userDisplayName || currentUser?.name || 'John Smith'}
                        </h2>
                    </div>
                </div>
                <div className="flex items-center justify-center flex-1 gap-2">
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-8 px-2"
                        onClick={goPrevWeek}
                    >
                        <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <p className="text-sm sm:text-base text-muted-foreground font-medium text-center sm:text-left min-w-[220px]">
                        {weekDisplay.fullDisplay}
                    </p>
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-8 px-2"
                        onClick={goNextWeek}
                        disabled={!canGoNextWeek}
                    >
                        <ChevronRight className="w-4 h-4" />
                    </Button>
                </div>
                <div className="flex gap-2 w-full sm:w-auto">
                    {timesheet?.status === 'draft' ? (
                        <Button 
                            variant="outline" 
                            className="text-green-600 border-green-600 hover:bg-green-50 flex-1 sm:flex-none text-sm" 
                            onClick={async () => {
                                try {
                                    if (!timesheet?._id) return;
                                    await changeTimesheetStatus({ status: 'reviewed', timeSheetId: timesheet._id }).unwrap();
                                    await refetchTimesheet();
                                } catch (e) {
                                    console.error('Failed to submit timesheet for approval', e);
                                }
                            }}
                            disabled={isSubmittingStatus}
                        >
                            {isSubmittingStatus ? 'Submitting...' : 'Submit for Approval'}
                        </Button>
                    ) : (
                        <div className="flex items-center px-3 py-1 border rounded text-sm">
                            {timesheet?.status === 'submitted' && <span className="text-amber-600">Submitted</span>}
                            {/^auto\s*approved$/i.test(timesheet?.status || '') && <span className="text-green-600">Auto Approved</span>}
                            {/^approved$/i.test(timesheet?.status || '') && <span className="text-green-600">Approved</span>}
                            {/^rejected$/i.test(timesheet?.status || '') && <span className="text-red-600">Rejected</span>}
                            {!['submitted','approved','rejected'].includes((timesheet?.status || '').toLowerCase()) && (
                                <span className="text-muted-foreground">{timesheet?.status === "reviewed" && "Submitted For Approval"}</span>
                            )}
                        </div>
                    )}
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
                                {formatSeconds(timesheet?.totalBillable || 0)}
                            </div>
                            <div className="text-xs sm:text-sm text-muted-foreground">
                                ({apiTotals.logged > 0 ? (apiTotals.billable / apiTotals.logged * 100).toFixed(1) : 0}%)
                            </div>
                        </div>
                        <p className="text-sm text-muted-foreground">Billable</p>
                    </CardContent>
                </Card>
                <Card className="h-full">
                    <CardContent className="p-4">
                        <div className="flex items-baseline gap-2">
                            <div className="text-2xl font-bold !text-[#381980]">
                                {formatSeconds(timesheet?.totalNonBillable || 0)}
                            </div>
                            <div className="text-xs sm:text-sm text-muted-foreground">
                                ({apiTotals.logged > 0 ? (apiTotals.nonBillable / apiTotals.logged * 100).toFixed(1) : 0}%)
                            </div>
                        </div>
                        <p className="text-sm text-muted-foreground">Non-Billable</p>
                    </CardContent>
                </Card>
                <Card className="h-full">
                    <CardContent className="p-4">
                        <div className="flex items-baseline gap-2">
                            <div className="text-2xl font-bold !text-[#381980]">
                                {formatSeconds(timesheet?.totalLogged || 0)}
                            </div>
                            <div className="text-xs sm:text-sm text-muted-foreground">
                                ({(apiTotals.logged / 40 * 100).toFixed(1)}%)
                            </div>
                        </div>
                        <p className="text-sm text-muted-foreground">Total Logged</p>
                    </CardContent>
                </Card>
                <Card className="h-full">
                    <CardContent className="p-4">
                        <div className="flex items-baseline gap-2">
                            <div className="text-2xl font-bold !text-[#381980]">
                                {formatSeconds(timesheet?.totalVariance || 0)}
                            </div>
                            <div className="text-xs sm:text-sm text-muted-foreground">
                                ({((apiTotals.variance) / 40 * 100).toFixed(1)}%)
                            </div>
                        </div>
                        <p className="text-sm text-muted-foreground">Variance</p>
                    </CardContent>
                </Card>
            </div>



            {/* Action Buttons */}
            <div className={`flex flex-col sm:flex-row items-stretch sm:items-center gap-3 ${shouldShowApproveRejectButtons ? 'justify-between' : 'justify-end'}`}>
                {shouldShowApproveRejectButtons && (
                    <div className="flex items-center gap-2">
                        <Button 
                            variant="outline" 
                            className="text-green-600 border-green-600 hover:bg-green-50 h-9 text-sm"
                            disabled={isSubmittingStatus || timesheet?.status === 'approved' || timesheet?.status === 'rejected' || timesheet?.status !== 'reviewed'}
                            onClick={async () => {
                                try {
                                    if (!timesheet?._id) return;
                                    await changeTimesheetStatus({ status: 'approved', timeSheetId: timesheet._id }).unwrap();
                                    await refetchTimesheet();
                                } catch (e) {
                                    console.error('Failed to approve timesheet', e);
                                }
                            }}
                        >
                            {isSubmittingStatus ? 'Approving...' : 'Approve'}
                        </Button>
                        <Button 
                            variant="outline" 
                            className="text-red-600 border-red-600 hover:bg-red-50 h-9 text-sm"
                            disabled={isSubmittingStatus || timesheet?.status === 'approved' || timesheet?.status === 'rejected' || timesheet?.status !== 'reviewed'}
                            onClick={async () => {
                                try {
                                    if (!timesheet?._id) return;
                                    await changeTimesheetStatus({ status: 'rejected', timeSheetId: timesheet._id }).unwrap();
                                    await refetchTimesheet();
                                } catch (e) {
                                    console.error('Failed to reject timesheet', e);
                                }
                            }}
                        >
                            {isSubmittingStatus ? 'Rejecting...' : 'Reject'}
                        </Button>
                    </div>
                )}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                    <div className="flex items-center justify-between sm:justify-start gap-2">
                        <span className="text-sm text-muted-foreground">Hide Weekend</span>
                        <Switch checked={hideWeekend} onCheckedChange={setHideWeekend} />
                    </div>
                    <Button 
                        variant="outline" 
                        className="flex items-center justify-center gap-2 text-primary border-primary hover:bg-primary/10 h-9 text-sm" 
                        onClick={handleAddRow}
                        disabled={isLoading || (timesheet?.status && timesheet?.status !== 'draft')}
                    >
                        <Plus className="w-4 h-4" />
                        New Row
                    </Button>
                    <Button 
                        variant="outline" 
                        className="flex items-center justify-center gap-2 text-primary border-primary hover:bg-primary/10 h-9 text-sm"
                        onClick={handleSaveChanges}
                        disabled={!hasChanges || isLoading || (timesheet?.status && timesheet?.status !== 'draft')}
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

            {/* Duplicate Warning */}
            {timesheetRows.some((_, index) => isDuplicateRow(index)) && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                            <span className="text-white text-xs font-bold">!</span>
                        </div>
                        <div>
                            <h4 className="text-red-800 font-medium">Duplicate Entries Detected</h4>
                            <p className="text-red-600 text-sm">
                                You have duplicate time entries with the same client, job, category, and billable status. 
                                Please remove duplicates before saving.
                            </p>
                        </div>
                    </div>
                </div>
            )}

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
                                <th className="text-left px-2 sm:px-3 py-2 text-xs font-medium text-muted-foreground w-36 sm:w-48">
                                    <button className="flex items-center gap-1 sm:gap-2 hover:text-foreground transition-colors" onClick={() => handleTimesheetSort('description')}>
                                        <span className="hidden sm:inline">DESCRIPTION</span>
                                        <span className="sm:hidden">DESC</span>
                                        {getTimesheetSortIcon('description')}
                                    </button>
                                </th>
                                <th className="text-center px-2 sm:px-3 py-2 text-xs font-medium text-muted-foreground w-16 sm:w-20">BILLABLE</th>
                                <th className="text-left px-2 sm:px-3 py-2 text-xs font-medium text-muted-foreground w-36 sm:w-16">
                                    <button className="w-36 flex items-center gap-1 sm:gap-2 hover:text-foreground transition-colors" onClick={() => handleTimesheetSort('rate')}>
                                    BILLABLE RATE
                                        {getTimesheetSortIcon('rate')}
                                    </button>
                                </th>
                                {weekDays.slice(1, 6).map((day, index) => (
                                    <th key={day.key} className="text-center px-1 sm:px-3 py-2 text-xs font-medium text-muted-foreground w-12 sm:w-16">
                                        {day.label} {day.date}
                                    </th>
                                ))}
                                {!hideWeekend && weekDays.slice(6).map((day, index) => (
                                    <th key={day.key} className="text-center px-1 sm:px-3 py-2 text-xs font-medium text-muted-foreground w-12 sm:w-16">
                                        {day.label} {day.date}
                                    </th>
                                ))}
                                {!hideWeekend && weekDays.slice(0, 1).map((day, index) => (
                                    <th key={day.key} className="text-center px-1 sm:px-3 py-2 text-xs font-medium text-muted-foreground w-12 sm:w-16">
                                        {day.label} {day.date}
                                    </th>
                                ))}
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
                            }).map((row, rowIndex) => {
                                const isDuplicate = isDuplicateRow(rowIndex);
                                return <tr key={row.id} className={`border-t border-border hover:bg-muted/25 ${isDuplicate ? 'bg-red-50 border-red-200' : ''}`}>
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
                                                // Get filtered jobs for the selected client
                                                const filteredJobs = getFilteredJobs(client._id);
                                                const firstJob = filteredJobs[0];
                                                
                                                updateRow(row.id, {
                                                    client: client.name,
                                                    clientId: client._id,
                                                    ref: generateClientRef(client.name),
                                                    // Reset job to first available job for this client
                                                    job: firstJob ? firstJob.name : '',
                                                    jobId: firstJob ? firstJob._id : ''
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
                                            {getFilteredJobs(row.clientId).map(job => <DropdownMenuItem key={job._id} onClick={() => {
                                                updateRow(row.id, {
                                                    job: job.name,
                                                    jobId: job._id
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
                                    {billableRate ? <span className="text-sm">{'€'+billableRate}</span> : null}
                                </td>
                                <td className="px-3 py-2 text-center text-sm">
                                    <Input type="text" value={row.hours.mon === 0 ? "" : secondsToTime(hoursToSeconds(row.hours.mon))} onChange={e => {
                                        const timeStr = e.target.value;
                                        const value = timeToSeconds(timeStr) / 3600; // Convert seconds to hours
                                        updateRow(row.id, {
                                            hours: {
                                                ...row.hours,
                                                mon: value
                                            }
                                        });
                                    }} placeholder="HH:mm:ss" className="w-20 text-center border border-input p-1 h-8 bg-background text-sm rounded" />
                                </td>
                                <td className="px-3 py-2 text-center text-sm">
                                    <Input type="text" value={row.hours.tue === 0 ? "" : secondsToTime(hoursToSeconds(row.hours.tue))} onChange={e => {
                                        const timeStr = e.target.value;
                                        const value = timeToSeconds(timeStr) / 3600;
                                        updateRow(row.id, {
                                            hours: {
                                                ...row.hours,
                                                tue: value
                                            }
                                        });
                                    }} placeholder="HH:mm:ss" className="w-20 text-center border border-input p-1 h-8 bg-background text-sm rounded" />
                                </td>
                                <td className="px-3 py-2 text-center text-sm">
                                    <Input type="text" value={row.hours.wed === 0 ? "" : secondsToTime(hoursToSeconds(row.hours.wed))} onChange={e => {
                                        const timeStr = e.target.value;
                                        const value = timeToSeconds(timeStr) / 3600;
                                        updateRow(row.id, {
                                            hours: {
                                                ...row.hours,
                                                wed: value
                                            }
                                        });
                                    }} placeholder="HH:mm:ss" className="w-20 text-center border border-input p-1 h-8 bg-background text-sm rounded" />
                                </td>
                                <td className="px-3 py-2 text-center text-sm">
                                    <Input type="text" value={row.hours.thu === 0 ? "" : secondsToTime(hoursToSeconds(row.hours.thu))} onChange={e => {
                                        const timeStr = e.target.value;
                                        const value = timeToSeconds(timeStr) / 3600;
                                        updateRow(row.id, {
                                            hours: {
                                                ...row.hours,
                                                thu: value
                                            }
                                        });
                                    }} placeholder="HH:mm:ss" className="w-20 text-center border border-input p-1 h-8 bg-background text-sm rounded" />
                                </td>
                                <td className="px-3 py-2 text-center text-sm">
                                    <Input type="text" value={row.hours.fri === 0 ? "" : secondsToTime(hoursToSeconds(row.hours.fri))} onChange={e => {
                                        const timeStr = e.target.value;
                                        const value = timeToSeconds(timeStr) / 3600;
                                        updateRow(row.id, {
                                            hours: {
                                                ...row.hours,
                                                fri: value
                                            }
                                        });
                                    }} placeholder="HH:mm:ss" className="w-20 text-center border border-input p-1 h-8 bg-background text-sm rounded" />
                                </td>
                                {!hideWeekend && <td className="px-3 py-2 text-center text-sm">
                                    <Input type="text" value={row.hours.sat === 0 ? "" : secondsToTime(hoursToSeconds(row.hours.sat))} onChange={e => {
                                        const timeStr = e.target.value;
                                        const value = timeToSeconds(timeStr) / 3600;
                                        updateRow(row.id, {
                                            hours: {
                                                ...row.hours,
                                                sat: value
                                            }
                                        });
                                    }} placeholder="HH:mm:ss" className="w-20 text-center border border-input p-1 h-8 bg-background text-sm rounded" />
                                </td>}
                                {!hideWeekend && <td className="px-3 py-2 text-center text-sm">
                                    <Input type="text" value={row.hours.sun === 0 ? "" : secondsToTime(hoursToSeconds(row.hours.sun))} onChange={e => {
                                        const timeStr = e.target.value;
                                        const value = timeToSeconds(timeStr) / 3600;
                                        updateRow(row.id, {
                                            hours: {
                                                ...row.hours,
                                                sun: value
                                            }
                                        });
                                    }} placeholder="HH:mm:ss" className="w-20 text-center border border-input p-1 h-8 bg-background text-sm rounded" />
                                </td>}
                                <td className="px-3 py-2 text-right">
                                    <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-700" onClick={() => {
                                        handleDeleteRow(row.id);
                                    }}>
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </td>
                            </tr>;
                            })}
                        </tbody>
                        {/* Summary rows */}
                        <tbody className="border-t-2 border-border">
                            <tr className="bg-blue-50">
                                <td colSpan={7} className="px-3 py-2 text-sm font-normal text-right">BILLABLE</td>
                                {weekDays.slice(1, 6).map((day, index) => (
                                    <td key={day.key} className="px-3 py-2 text-center text-sm font-normal">
                                        {formatSeconds(hoursToSeconds(dailySummary[day.key as keyof typeof dailySummary].billable))}
                                    </td>
                                ))}
                                {!hideWeekend && weekDays.slice(6).map((day, index) => (
                                    <td key={day.key} className="px-3 py-2 text-center text-sm font-normal">
                                        {formatSeconds(hoursToSeconds(dailySummary[day.key as keyof typeof dailySummary].billable))}
                                    </td>
                                ))}
                                {!hideWeekend && weekDays.slice(0, 1).map((day, index) => (
                                    <td key={day.key} className="px-3 py-2 text-center text-sm font-normal">
                                        {formatSeconds(hoursToSeconds(dailySummary[day.key as keyof typeof dailySummary].billable))}
                                    </td>
                                ))}
                                <td className="px-3 py-2 text-center text-sm font-normal">{formatSeconds(timesheet?.totalBillable || 0)}</td>
                            </tr>
                            <tr className="bg-gray-50">
                                <td colSpan={7} className="px-3 py-2 text-sm font-normal text-right">NON BILLABLE</td>
                                {weekDays.slice(1, 6).map((day, index) => (
                                    <td key={day.key} className="px-3 py-2 text-center text-sm font-normal">
                                        {formatSeconds(hoursToSeconds(dailySummary[day.key as keyof typeof dailySummary].nonBillable))}
                                    </td>
                                ))}
                                {!hideWeekend && weekDays.slice(6).map((day, index) => (
                                    <td key={day.key} className="px-3 py-2 text-center text-sm font-normal">
                                        {formatSeconds(hoursToSeconds(dailySummary[day.key as keyof typeof dailySummary].nonBillable))}
                                    </td>
                                ))}
                                {!hideWeekend && weekDays.slice(0, 1).map((day, index) => (
                                    <td key={day.key} className="px-3 py-2 text-center text-sm font-normal">
                                        {formatSeconds(hoursToSeconds(dailySummary[day.key as keyof typeof dailySummary].nonBillable))}
                                    </td>
                                ))}
                                <td className="px-3 py-2 text-center text-sm font-normal">{formatSeconds(timesheet?.totalNonBillable || 0)}</td>
                            </tr>
                            <tr className="bg-blue-50">
                                <td colSpan={7} className="px-3 py-2 text-sm font-normal text-right">LOGGED</td>
                                {weekDays.slice(1, 6).map((day, index) => (
                                    <td key={day.key} className="px-3 py-2 text-center text-sm font-normal">
                                        {formatSeconds(hoursToSeconds(dailySummary[day.key as keyof typeof dailySummary].logged))}
                                    </td>
                                ))}
                                {!hideWeekend && weekDays.slice(6).map((day, index) => (
                                    <td key={day.key} className="px-3 py-2 text-center text-sm font-normal">
                                        {formatSeconds(hoursToSeconds(dailySummary[day.key as keyof typeof dailySummary].logged))}
                                    </td>
                                ))}
                                {!hideWeekend && weekDays.slice(0, 1).map((day, index) => (
                                    <td key={day.key} className="px-3 py-2 text-center text-sm font-normal">
                                        {formatSeconds(hoursToSeconds(dailySummary[day.key as keyof typeof dailySummary].logged))}
                                    </td>
                                ))}
                                <td className="px-3 py-2 text-center text-sm font-normal">{formatSeconds(timesheet?.totalLogged || 0)}</td>
                            </tr>
                            <tr className="bg-gray-100">
                                <td colSpan={7} className="px-3 py-2 text-sm font-normal text-right">CAPACITY</td>
                                {weekDays.slice(1, 6).map((day, index) => (
                                    <td key={day.key} className="px-3 py-2 text-center text-sm font-normal">
                                        {formatSeconds(hoursToSeconds(dailySummary[day.key as keyof typeof dailySummary].capacity))}
                                    </td>
                                ))}
                                {!hideWeekend && weekDays.slice(6).map((day, index) => (
                                    <td key={day.key} className="px-3 py-2 text-center text-sm font-normal">
                                        {formatSeconds(hoursToSeconds(dailySummary[day.key as keyof typeof dailySummary].capacity))}
                                    </td>
                                ))}
                                {!hideWeekend && weekDays.slice(0, 1).map((day, index) => (
                                    <td key={day.key} className="px-3 py-2 text-center text-sm font-normal">
                                        {formatSeconds(hoursToSeconds(dailySummary[day.key as keyof typeof dailySummary].capacity))}
                                    </td>
                                ))}
                                <td className="px-3 py-2 text-center text-sm font-normal">{formatSeconds(timesheet?.totalCapacity || 0)}</td>
                            </tr>
                            <tr className="bg-red-50">
                                <td colSpan={7} className="px-3 py-2 text-sm font-normal text-right">VARIANCE</td>
                                {weekDays.slice(1, 6).map((day, index) => (
                                    <td key={day.key} className="px-3 py-2 text-center text-sm font-normal">
                                        {formatSeconds(hoursToSeconds(dailySummary[day.key as keyof typeof dailySummary].variance))}
                                    </td>
                                ))}
                                {!hideWeekend && weekDays.slice(6).map((day, index) => (
                                    <td key={day.key} className="px-3 py-2 text-center text-sm font-normal">
                                        {formatSeconds(hoursToSeconds(dailySummary[day.key as keyof typeof dailySummary].variance))}
                                    </td>
                                ))}
                                {!hideWeekend && weekDays.slice(0, 1).map((day, index) => (
                                    <td key={day.key} className="px-3 py-2 text-center text-sm font-normal">
                                        {formatSeconds(hoursToSeconds(dailySummary[day.key as keyof typeof dailySummary].variance))}
                                    </td>
                                ))}
                                <td className="px-3 py-2 text-center text-sm font-normal">{formatSeconds(timesheet?.totalVariance || 0)}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}
