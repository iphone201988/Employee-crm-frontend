
import { useState, useEffect, useMemo } from "react";
import { Search, Filter, ChevronDown, ArrowUpDown, ArrowUp, ArrowDown, ChevronLeft, ChevronRight, RotateCcw, RefreshCw, ArrowLeft, Plus, X, Trash2, Edit2, Import } from "lucide-react";
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
    jobType: string;
    jobTypeId: string;
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

const SUMMARY_STATIC_COLUMNS = 8;

const renderSummaryLabelCells = (label: string, className = '') => {
    return Array.from({ length: SUMMARY_STATIC_COLUMNS }).map((_, index) => (
        <td
            key={`${label}-static-${index}`}
            className={`px-3 py-2 ${index === SUMMARY_STATIC_COLUMNS - 1 ? `text-sm font-semibold text-right text-[#381980] ${className}` : ''}`}
        >
            {index === SUMMARY_STATIC_COLUMNS - 1 ? label : ''}
        </td>
    ));
};

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
    const [timesheetSortField, setTimesheetSortField] = useState<'ref' | 'client' | 'job' | 'jobType' | 'category' | 'description' | 'rate' | null>(null);
    const [timesheetSortDirection, setTimesheetSortDirection] = useState<'asc' | 'desc' | null>(null);
    const [timesheetRows, setTimesheetRows] = useState<TimesheetRow[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [hasChanges, setHasChanges] = useState(false);
    // Track raw input strings for time fields to allow free-form editing
    const [timeInputs, setTimeInputs] = useState<Record<string, string>>({});

    // Extract URL parameters for specific timesheet viewing (prefer props over URL params)
    const timesheetId = propTimesheetId || searchParams.get('timesheetId');
    const userId = propUserId || searchParams.get('userId');

    // Track current week for query and navigation
    const [currentWeek, setCurrentWeek] = useState(() => propCurrentWeek ?? getCurrentWeekRange());

    // Track the original week when timesheetId is first loaded
    const [originalTimesheetWeek, setOriginalTimesheetWeek] = useState<{ weekStart: string; weekEnd: string } | null>(null);
    const [trackedTimesheetId, setTrackedTimesheetId] = useState<string | null>(null);

    // Set original week when timesheetId is first provided or when it changes, reset when timesheetId is cleared
    useEffect(() => {
        if (timesheetId) {
            // If timesheetId changed, reset and set new original week
            if (trackedTimesheetId !== timesheetId) {
                setTrackedTimesheetId(timesheetId);
                setOriginalTimesheetWeek({
                    weekStart: currentWeek.weekStart,
                    weekEnd: currentWeek.weekEnd
                });
            }
        } else {
            // Reset when timesheetId is cleared
            setTrackedTimesheetId(null);
            setOriginalTimesheetWeek(null);
        }
    }, [timesheetId, currentWeek.weekStart, currentWeek.weekEnd, trackedTimesheetId]);

    // Memoize query parameters to prevent unnecessary re-queries
    // Only include timesheetId if we're still on the original week
    const queryParams = useMemo(() => {
        const isOnOriginalWeek = originalTimesheetWeek &&
            currentWeek.weekStart === originalTimesheetWeek.weekStart &&
            currentWeek.weekEnd === originalTimesheetWeek.weekEnd;

    return {
            weekStart: currentWeek.weekStart,
            weekEnd: currentWeek.weekEnd,
            timesheetId: (timesheetId && isOnOriginalWeek) ? timesheetId : undefined,
            userId: userId || undefined,
        };
    }, [currentWeek.weekStart, currentWeek.weekEnd, timesheetId, userId, originalTimesheetWeek]);

    const { data: currentUser }: any = useGetCurrentUserQuery();

    const {
        data: timesheetData,
        isLoading: isTimesheetLoading,
        error: timesheetError,
        refetch: refetchTimesheet
    } = useGetTimesheetQuery(queryParams);

    // useEffect(() => {
    //     console.log('MyTimeSheet: useGetTimesheetQuery called with:', {
    //         weekStart: queryParams.weekStart,
    //         weekEnd: queryParams.weekEnd,
    //         timesheetId: queryParams.timesheetId,
    //         userId: queryParams.userId,
    //         isLoading: isTimesheetLoading,
    //         hasData: !!timesheetData
    //     });
    // }, [queryParams.weekStart, queryParams.weekEnd, queryParams.timesheetId, queryParams.userId, isTimesheetLoading, timesheetData]);

    // Mutations
    const [addTimesheet] = useAddTimesheetMutation();
    const [changeTimesheetStatus, { isLoading: isSubmittingStatus }] = useChangeTimesheetStatusMutation();

    // Extract data from API response
    const timesheet = timesheetData?.data;

    // console.debug('timesheet===========', timesheet);

    // Do not reset originalTimesheetWeek from fetched data to avoid arg toggling
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
    const jobTypes = dropdownOptions?.jobCategories || [];
    const categories = dropdownOptions?.timeCategories || [];

    // Function to get filtered jobs based on selected client
    const getFilteredJobs = (clientId: string) => {
        if (!clientId) return jobs;
        return jobs.filter(job => job.clientId === clientId);
    };

    // Function to check if a row is a duplicate
    const isDuplicateRow = (rowIndex: number) => {
        const row = timesheetRows[rowIndex];
        if (!row || !row.clientId || !row.jobId) return false;

        const entryKey = `${row.clientId}-${row.jobId}-${row.jobTypeId || ''}-${row.category}-${row.billable}`;

        // Check if this combination appears more than once
        let count = 0;
        for (let i = 0; i < timesheetRows.length; i++) {
            const otherRow = timesheetRows[i];
            if (otherRow && otherRow.clientId && otherRow.jobId) {
                const otherEntryKey = `${otherRow.clientId}-${otherRow.jobId}-${otherRow.jobTypeId || ''}-${otherRow.category}-${otherRow.billable}`;
                if (otherEntryKey === entryKey) {
                    count++;
                }
            }
        }

        return count > 1;
    };

    // Convert time entries to rows when data loads
    useEffect(() => {
        if (timesheet?.timeEntries && clients.length > 0 && jobs.length > 0 && categories.length > 0 && jobTypes.length > 0) {
            const convertedRows = convertTimeEntriesToRows(
                timesheet.timeEntries,
                clients,
                jobs,
                jobTypes,
                categories
            );
            // Convert to TimesheetRow format with clientId and jobId
            const timesheetRows = convertedRows.map(row => ({
                ...row,
                clientId: row.clientId || '',
                jobId: row.jobId || '',
                jobType: row.jobType || '',
                jobTypeId: row.jobTypeId || ''
            }));
            setTimesheetRows(timesheetRows);
            setHasChanges(false);
            // Clear raw input state when new data loads
            setTimeInputs({});
        }
    }, [timesheet?.timeEntries, clients, jobs, jobTypes, categories]);

    // When no data comes back for the selected week, clear the table rows
    useEffect(() => {
        const noEntries = !isTimesheetLoading && (!timesheet || !timesheet.timeEntries || timesheet.timeEntries.length === 0);
        if (noEntries) {
            setTimesheetRows([]);
            setHasChanges(false);
            // Clear raw input state when rows are cleared
            setTimeInputs({});
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
        if (!clients.length || !jobs.length || !categories.length || !jobTypes.length) return null;
        const timeEntries = convertRowsToTimeEntries(
            timesheetRows,
            clients,
            jobs,
            jobTypes,
            categories,
            currentWeek.weekStart,
            billableRate
        );

        // Precompute totals and build dailySummary aligned by offset from weekStart
        const totals = calculateTotals(timesheetRows);
        const dailySummary = dayKeys.map((key, offset) => {
            const cap = weeklyCapacitySeconds[key];
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
                variance: total - cap,
            };
        });

        const totalCapacity = Object.values(weeklyCapacitySeconds).reduce((sum, val) => sum + val, 0);
        const totalLoggedSeconds = hoursToSeconds(totals.logged.total);

        const payload = {
            weekStart: currentWeek.weekStart,
            weekEnd: currentWeek.weekEnd,
            status: 'draft' as const,
            timeEntries,
            dailySummary,
            totalBillable: hoursToSeconds(totals.billable.total),
            totalNonBillable: hoursToSeconds(totals.nonBillable.total),
            totalLogged: totalLoggedSeconds,
            totalCapacity,
            totalVariance: totalLoggedSeconds - totalCapacity,
            userId: userId || currentUser?._id,
        };
        return payload;
    };

    // Save timesheet changes
    const handleSaveChanges = async () => {
        if (!clients.length || !jobs.length || !categories.length) return;

        setIsLoading(true);
        try {
            // Check for duplicate entries (same client, job, jobType, category, and billable value)
            const duplicateEntries = [];
            const seenEntries = new Set();

            for (let i = 0; i < timesheetRows.length; i++) {
                const row = timesheetRows[i];
                const entryKey = `${row.clientId}-${row.jobId}-${row.jobTypeId || ''}-${row.category}-${row.billable}`;

                if (seenEntries.has(entryKey)) {
                    duplicateEntries.push({
                        rowIndex: i + 1,
                        client: row.client,
                        job: row.job,
                        jobType: row.jobType,
                        category: row.category,
                        billable: row.billable ? 'Yes' : 'No'
                    });
                } else {
                    seenEntries.add(entryKey);
                }
            }

            if (duplicateEntries.length > 0) {
                const duplicateDetails = duplicateEntries.map(entry =>
                    `Row ${entry.rowIndex}: ${entry.client} - ${entry.job} - ${entry.jobType || 'No Job Type'} - ${entry.category} (Billable: ${entry.billable})`
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
        if (clients.length === 0 || jobs.length === 0  || jobTypes.length === 0) {
            toast.error('Job is not assigned to you yet.');
            return;
        }

        const newId = `temp-${Date.now()}`;

        const newRow: TimesheetRow = {
            id: newId,
            ref: '',
            client: '',
            clientId: '',
            job: '',
            jobId: '',
            jobType: '',
            jobTypeId: '',
            category: '',
            description: "",
        billable: true,
            rate: billableRate.toFixed(2),
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
        if (updates.hours) {
            // Update hours without any day limit validation
            setTimesheetRows(rows => rows.map(r => r.id === rowId ? { ...r, hours: { ...r.hours, ...(updates.hours as any) } } : r));
            setHasChanges(true);
            return;
        }

        setTimesheetRows(rows => rows.map(r => r.id === rowId ? { ...r, ...updates } : r));
        setHasChanges(true);
    };

    const sanitizeRateInput = (value: string) => {
        if (!value) return '';
        const cleaned = value.replace(/[^0-9.]/g, '');
        if (!cleaned) return '';
        const [integerPart, ...decimalParts] = cleaned.split('.');
        const decimals = decimalParts.join('');
        let normalized = decimalParts.length > 0 ? `${integerPart}.${decimals}` : integerPart;
        if (normalized.startsWith('.')) {
            normalized = `0${normalized}`;
        }
        return normalized;
    };

    const formatRateToTwoDecimals = (value: string) => {
        const numericValue = parseFloat(value);
        if (isNaN(numericValue)) {
            return billableRate.toFixed(2);
        }
        return numericValue.toFixed(2);
    };

    const handleRateInputChange = (rowId: string, value: string) => {
        const sanitized = sanitizeRateInput(value);
        updateRow(rowId, { rate: sanitized });
    };

    const handleRateInputBlur = (rowId: string, value: string) => {
        const formatted = formatRateToTwoDecimals(value);
        updateRow(rowId, { rate: formatted });
    };

    const handleTimesheetSort = (field: 'ref' | 'client' | 'job' | 'jobType' | 'category' | 'description' | 'rate') => {
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

    const getTimesheetSortIcon = (field: 'ref' | 'client' | 'job' | 'jobType' | 'category' | 'description' | 'rate') => {
        if (timesheetSortField !== field) return <ArrowUpDown className="w-3 h-3 opacity-50" />;
        if (timesheetSortDirection === 'asc') return <ArrowUp className="w-3 h-3" />;
        if (timesheetSortDirection === 'desc') return <ArrowDown className="w-3 h-3" />;
        return <ArrowUpDown className="w-3 h-3 opacity-50" />;
    };

    // Helper functions for flexible time input editing
    const getTimeInputKey = (rowId: string, day: string) => `${rowId}-${day}`;

    const getTimeInputValue = (rowId: string, day: string, hoursValue: number): string => {
        const key = getTimeInputKey(rowId, day);
        // If there's raw input, use it; otherwise format the value
        if (timeInputs[key] !== undefined) {
            return timeInputs[key];
        }
        // Format the stored value
        if (hoursValue === 0) return "";
        return secondsToTime(hoursToSeconds(hoursValue));
    };

    const handleTimeFocus = (rowId: string, day: string, hoursValue: number) => {
        const key = getTimeInputKey(rowId, day);
        // If no raw input exists, initialize it with formatted value
        if (timeInputs[key] === undefined) {
            const formatted = hoursValue === 0 ? "" : secondsToTime(hoursToSeconds(hoursValue));
            setTimeInputs(prev => ({ ...prev, [key]: formatted }));
        }
    };

    const handleTimeChange = (rowId: string, day: string, value: string) => {
        const key = getTimeInputKey(rowId, day);
        // Store the raw input string
        setTimeInputs(prev => ({ ...prev, [key]: value }));

        // Parse and update the row value in real-time for summary card updates
        let parsedSeconds = 0;
        if (value.trim() !== "") {
            // Handle various formats: "3", "3:00", "03:00:00", "3:30", etc.
            parsedSeconds = timeToSeconds(value);
        }

        // Convert to hours and update the row immediately
        const hoursValue = parsedSeconds / 3600;
        const currentRow = timesheetRows.find(r => r.id === rowId);
        if (currentRow) {
            updateRow(rowId, {
                hours: {
                    ...currentRow.hours,
                    [day]: hoursValue
                }
            });
        }
    };

    const handleTimeBlur = (rowId: string, day: string) => {
        const key = getTimeInputKey(rowId, day);

        // Get current raw value from state and parse it
        const rawValue = timeInputs[key] || "";
        let parsedSeconds = 0;
        if (rawValue.trim() !== "") {
            // Handle various formats: "3", "3:00", "03:00:00", "3:30", etc.
            parsedSeconds = timeToSeconds(rawValue);
        }

        // Convert to hours and update the row
        const hoursValue = parsedSeconds / 3600;
        const currentRow = timesheetRows.find(r => r.id === rowId);
        if (currentRow) {
            updateRow(rowId, {
                hours: {
                    ...currentRow.hours,
                    [day]: hoursValue
                }
            });
        }

        // Clear the raw input so it will be formatted on next render
        setTimeInputs(prev => {
            const next = { ...prev };
            delete next[key];
            return next;
        });
    };

    // Helper to check if timesheet can be edited
    const canEditTimesheet = useMemo(() => {
        if (!timesheet?.status) return true; // No timesheet yet, allow editing
        return timesheet.status === 'draft' || timesheet.status === 'rejected';
    }, [timesheet?.status]);

    // Calculate totals using memoized function
    const totals = useMemo(() => calculateTotals(timesheetRows), [timesheetRows]);

    // Get week days dynamically
    const weekDays = useMemo(() => {
        if (timesheet?.weekStart && timesheet?.weekEnd) {
            return getWeekDays(timesheet.weekStart, timesheet.weekEnd);
        }
        return getWeekDays(currentWeek.weekStart, currentWeek.weekEnd);
    }, [timesheet?.weekStart, timesheet?.weekEnd, currentWeek.weekStart, currentWeek.weekEnd]);

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

    const dayKeys = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const;

    const weeklyCapacitySeconds = useMemo(() => {
        const schedule = timesheetData?.weeklyCapacity;
        const defaultWeekday = hoursToSeconds(8);
        return {
            mon: schedule?.mon ?? defaultWeekday,
            tue: schedule?.tue ?? defaultWeekday,
            wed: schedule?.wed ?? defaultWeekday,
            thu: schedule?.thu ?? defaultWeekday,
            fri: schedule?.fri ?? defaultWeekday,
            sat: schedule?.sat ?? defaultWeekday,
            sun: schedule?.sun ?? defaultWeekday,
        };
    }, [timesheetData?.weeklyCapacity]);

    // Calculate daily summary from timesheetRows
    const dailySummary = useMemo(() => {
        // If API has dailySummary and no rows, use it but override capacity from schedule
        if (timesheet?.dailySummary && timesheetRows.length === 0) {
            const apiSummary = getDailySummaryData(timesheet.dailySummary);
            dayKeys.forEach(day => {
                const capacityHours = secondsToHours(weeklyCapacitySeconds[day]);
                apiSummary[day].capacity = capacityHours;
                apiSummary[day].variance = capacityHours - apiSummary[day].logged;
            });
            return apiSummary;
        }

        // Calculate from current rows
        const summary = dayKeys.reduce((acc, day) => {
            acc[day] = {
                billable: 0,
                nonBillable: 0,
                logged: 0,
                capacity: secondsToHours(weeklyCapacitySeconds[day]),
                variance: 0,
            };
            return acc;
        }, {} as Record<typeof dayKeys[number], { billable: number; nonBillable: number; logged: number; capacity: number; variance: number }>);

        // Sum up hours from all rows for each day
        timesheetRows.forEach(row => {
            dayKeys.forEach(day => {
                const hours = row.hours[day] || 0;

                summary[day].logged += hours;
                if (row.billable) {
                    summary[day].billable += hours;
                } else {
                    summary[day].nonBillable += hours;
                }
            });
        });

        // Calculate variance for each day
        dayKeys.forEach(day => {
            summary[day].variance = summary[day].logged - summary[day].capacity;
        });

        return summary;
    }, [timesheetRows, timesheet?.dailySummary, weeklyCapacitySeconds]);

    // Calculate totals from dailySummary for summary rows
    const summaryTotals = useMemo(() => {
        let totalBillable = 0;
        let totalNonBillable = 0;
        let totalLogged = 0;
        let totalCapacity = 0;
        let totalVariance = 0;

        dayKeys.forEach(day => {
            const dayData = dailySummary[day];
            totalBillable += dayData.billable;
            totalNonBillable += dayData.nonBillable;
            totalLogged += dayData.logged;
            totalCapacity += dayData.capacity;
            totalVariance += dayData.variance;
        });

        return {
            billable: hoursToSeconds(totalBillable),
            nonBillable: hoursToSeconds(totalNonBillable),
            logged: hoursToSeconds(totalLogged),
            capacity: hoursToSeconds(totalCapacity),
            variance: hoursToSeconds(totalVariance),
        };
    }, [dailySummary]);

    // Determine if variance should be green (logged > capacity, i.e., variance is negative)
    const isVariancePositive = useMemo(() => {
        return summaryTotals.logged > summaryTotals.capacity;
    }, [summaryTotals.logged, summaryTotals.capacity]);

    // Helper function to format variance (handles negative values)
    const formatVariance = (varianceHours: number): string => {
        const varianceSeconds = hoursToSeconds(Math.abs(varianceHours));
        const formatted = formatSeconds(varianceSeconds);
        // If variance is negative (logged > capacity), show as positive with indication
        // If variance is positive (logged < capacity), show as is
        return varianceHours < 0 ? `+${formatted}` : formatted;
    };

    // Calculate real-time totals in seconds from current rows
    const realTimeTotals = useMemo(() => {
        // Calculate total capacity from weekly schedule
        const totalCapacitySeconds = Object.values(weeklyCapacitySeconds).reduce((sum, val) => sum + val, 0);

        // If there are rows, use calculated totals (convert hours to seconds)
        if (timesheetRows.length > 0) {
            const loggedSeconds = hoursToSeconds(totals.logged.total);
            return {
                billable: hoursToSeconds(totals.billable.total),
                nonBillable: hoursToSeconds(totals.nonBillable.total),
                logged: loggedSeconds,
                variance: loggedSeconds - totalCapacitySeconds,
                capacity: totalCapacitySeconds
            };
        }
        // When no entries exist, variance should equal capacity (100%)
        const hasNoEntries = !timesheet?.timeEntries || timesheet.timeEntries.length === 0;
        return {
            billable: summaryTotals.billable,
            nonBillable: summaryTotals.nonBillable,
            logged: summaryTotals.logged,
            variance: hasNoEntries ? -summaryTotals.capacity : (summaryTotals.logged - summaryTotals.capacity),
            capacity: summaryTotals.capacity
        };
    }, [timesheetRows.length, totals, weeklyCapacitySeconds, summaryTotals, timesheet?.timeEntries]);

    // Calculate real-time totals for percentage calculations (in hours)
    const realTimeTotalsHours = useMemo(() => {
        const totalCapacityHours = secondsToHours(Object.values(weeklyCapacitySeconds).reduce((sum, val) => sum + val, 0));

        if (timesheetRows.length > 0) {
            return {
                billable: totals.billable.total,
                nonBillable: totals.nonBillable.total,
                logged: totals.logged.total,
                variance: totals.logged.total - totalCapacityHours,
                capacity: totalCapacityHours
            };
        }
        // When no entries exist, variance should equal capacity (100%)
        const hasNoEntries = !timesheet?.timeEntries || timesheet.timeEntries.length === 0;
        return {
            billable: secondsToHours(summaryTotals.billable),
            nonBillable: secondsToHours(summaryTotals.nonBillable),
            logged: secondsToHours(summaryTotals.logged),
            variance: hasNoEntries ? -totalCapacityHours : secondsToHours(summaryTotals.logged - summaryTotals.capacity),
            capacity: totalCapacityHours
        };
    }, [timesheetRows.length, totals, weeklyCapacitySeconds, summaryTotals, timesheet?.timeEntries]);

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

    // Keep the displayed week in sync with the loaded timesheet
    useEffect(() => {
        if (timesheet?.weekStart && timesheet?.weekEnd) {
            const timesheetWeekStart = new Date(timesheet.weekStart);
            const timesheetWeekEnd = new Date(timesheet.weekEnd);
            if (
                Math.abs(timesheetWeekStart.getTime() - new Date(currentWeek.weekStart).getTime()) > 1000 ||
                Math.abs(timesheetWeekEnd.getTime() - new Date(currentWeek.weekEnd).getTime()) > 1000
            ) {
                const alignedWeek = {
                    weekStart: timesheetWeekStart.toISOString(),
                    weekEnd: timesheetWeekEnd.toISOString()
                };
                setCurrentWeek(alignedWeek);
                onWeekChange?.(alignedWeek.weekStart, alignedWeek.weekEnd);
            }
        }
    }, [timesheet?.weekStart, timesheet?.weekEnd]);

    const getIsoWeekNumber = (date: Date) => {
        const target = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
        const dayNum = target.getUTCDay() || 7;
        target.setUTCDate(target.getUTCDate() + 4 - dayNum);
        const yearStart = new Date(Date.UTC(target.getUTCFullYear(), 0, 1));
        return Math.ceil((((target.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
    };

    // Format week dates for display
    const weekDisplay = useMemo(() => {
        const startDate = new Date(currentWeek.weekStart);
        const endDate = new Date(currentWeek.weekEnd);
        const weekNumber = getIsoWeekNumber(startDate);

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
            <div className={`grid grid-cols-1 sm:grid-cols-[auto_1fr_240px] items-center p-4 sm:p-6 bg-card rounded-lg border gap-4 ${
                (!timesheet?.timeEntries || timesheet.timeEntries.length === 0) && timesheetRows.length === 0 
                    ? 'border-red-500 border-2' 
                    : (timesheet?.status === 'approved' || /^auto\s*approved$/i.test(timesheet?.status || ''))
                        ? 'border-green-500 border-2'
                        : timesheet?.status === 'draft'
                        ? 'border-green-500 border-2'
                        : timesheet?.status === 'reviewed'
                        ? 'border-green-500 border-2'
                        : timesheet?.status === 'rejected'
                        ? 'border-red-700 border-2'
                        : ''
            }`}>
                <div className="flex items-center gap-4">
                    <Avatar className="w-10 h-10 sm:w-12 sm:h-12">
                        <AvatarImage src={import.meta.env.VITE_BACKEND_BASE_URL + userAvatarUrl || (currentUser as any)?.avatarUrl || "/lovable-uploads/69927594-4747-4d86-a60e-64c607e67d1f.png"} />
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
                <div className="flex items-center justify-center gap-2 order-3 sm:order-2">
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
                <div className="flex justify-end order-2 sm:order-3 w-full">
                    <div className="w-full sm:w-[180px] sm:min-w-[180px] flex justify-end">
                       
                        {(!timesheet?.timeEntries || timesheet.timeEntries.length === 0) && timesheetRows.length === 0 ? (
                            <Button
                                variant="outline"
                                className="bg-red-600 text-white border-red-600 hover:bg-red-700 text-sm w-full sm:w-[180px] sm:min-w-[180px] !h-10 whitespace-nowrap"
                                disabled
                            >
                                Not Started
                            </Button>
                        ) : timesheet?.status === 'draft' ? (
                            <Button
                                variant="outline"
                                className="text-green-600 border-green-600 border-2 hover:bg-green-50 text-sm w-full sm:w-[180px] sm:min-w-[180px] !h-10 whitespace-nowrap"
                                onClick={async () => {
                                    try {
                                        if (!timesheet?._id) return;
                                        await changeTimesheetStatus({ status: 'reviewed', timeSheetId: timesheet._id }).unwrap();
                                        await refetchTimesheet();
                                    } catch (e) {
                                        console.error('Failed to submit timesheet for approval', e);
                                    }
                                }}
                                disabled={isSubmittingStatus || hasChanges}
                            >
                                {isSubmittingStatus ? 'Submitting...' : 'Submit for Review'}
                    </Button>
                        ) : timesheet?.status === 'rejected' ? (
                            <Button
                                variant="outline"
                                className="bg-red-700 text-white border-red-700 hover:bg-red-800 text-sm w-full sm:w-[180px] sm:min-w-[180px] !h-10 whitespace-nowrap"
                                onClick={async () => {
                                    try {
                                        if (!timesheet?._id) return;
                                        // First save any changes if there are any
                                        if (hasChanges) {
                                            await handleSaveChanges();
                                        }
                                        // Then submit for approval
                                        await changeTimesheetStatus({ status: 'reviewed', timeSheetId: timesheet._id }).unwrap();
                                        await refetchTimesheet();
                                    } catch (e) {
                                        console.error('Failed to resubmit timesheet for approval', e);
                                    }
                                }}
                                disabled={isSubmittingStatus || isLoading}
                            >
                                {isSubmittingStatus || isLoading ? 'Resubmitting...' : 'Resubmit for Approval'}
                            </Button>
                        ) : /^approved$/i.test(timesheet?.status || '') || /^auto\s*approved$/i.test(timesheet?.status || '') ? (
                            <Button
                                variant="outline"
                                className="bg-green-600 text-white border-green-600 hover:bg-green-700 text-sm w-full sm:w-[180px] sm:min-w-[180px] !h-10 whitespace-nowrap"
                                disabled
                            >
                                {/^auto\s*approved$/i.test(timesheet?.status || '') ? 'Auto Approved' : 'Approved'}
                            </Button>
                        ) : timesheet?.status === 'reviewed' ? (
                            <Button
                                variant="outline"
                                className="text-green-600 border-green-600 border-2 hover:bg-green-50 text-sm w-full sm:w-[180px] sm:min-w-[180px] !h-10 whitespace-nowrap"
                                disabled
                            >
                                Submitted For Review
                            </Button>
                        ) : timesheet?.status ? (
                            <div className="flex items-center px-3 py-1 border rounded text-sm w-full sm:w-[180px] sm:min-w-[180px] !h-10 justify-end sm:justify-center">
                                {timesheet?.status === 'submitted' && <span className="text-amber-600">Submitted</span>}
                            </div>
                        ) : null}
                    </div>
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
                                {formatSeconds(realTimeTotals.billable)}
                            </div>
                            <div className="text-xs sm:text-sm text-muted-foreground">
                                ({realTimeTotalsHours.logged > 0 ? (realTimeTotalsHours.billable / realTimeTotalsHours.logged * 100).toFixed(1) : 0}%)
                            </div>
                        </div>
                        <p className="text-sm text-muted-foreground">Billable</p>
                    </CardContent>
                </Card>
                <Card className="h-full">
                    <CardContent className="p-4">
                        <div className="flex items-baseline gap-2">
                            <div className="text-2xl font-bold !text-[#381980]">
                                {formatSeconds(realTimeTotals.nonBillable)}
                            </div>
                            <div className="text-xs sm:text-sm text-muted-foreground">
                                ({realTimeTotalsHours.logged > 0 ? (realTimeTotalsHours.nonBillable / realTimeTotalsHours.logged * 100).toFixed(1) : 0}%)
                            </div>
                        </div>
                        <p className="text-sm text-muted-foreground">Non-Billable</p>
                    </CardContent>
                </Card>
                <Card className="h-full">
                    <CardContent className="p-4">
                        <div className="flex items-baseline gap-2">
                            <div className="text-2xl font-bold !text-[#381980]">
                                {formatSeconds(realTimeTotals.logged)}
                            </div>
                            <div className="text-xs sm:text-sm text-muted-foreground">
                                ({realTimeTotalsHours.capacity > 0 ? ((realTimeTotalsHours.logged / realTimeTotalsHours.capacity) * 100).toFixed(1) : '0.0'}%)
                            </div>
                        </div>
                        <p className="text-sm text-muted-foreground">Total Logged</p>
                    </CardContent>
                </Card>
                <Card className="h-full">
                    <CardContent className="p-4">
                        <div className="flex items-baseline gap-2">
                            <div className="text-2xl font-bold !text-[#381980]">
                                {formatSeconds(realTimeTotals.variance)}
                            </div>
                            <div className="text-xs sm:text-sm text-muted-foreground">
                                ({realTimeTotalsHours.capacity > 0 ? ((realTimeTotalsHours.variance / realTimeTotalsHours.capacity) * 100).toFixed(1) : '100.0'}%)
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
                        disabled={isLoading || !canEditTimesheet}
                    >
                        <Plus className="w-4 h-4" />
                        New Row
                    </Button>
                    <Button
                        variant="outline"
                        className="flex items-center justify-center gap-2 text-primary border-primary hover:bg-primary/10 h-9 text-sm"
                        onClick={handleSaveChanges}
                        disabled={!hasChanges || isLoading || !canEditTimesheet}
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
                                You have duplicate time entries with the same client, job, job type, category, and billable status.
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
                            <tr className="!text-[#381980] bg-[#edecf4]">
                                <th className="text-left px-2 sm:px-3 py-3 text-xs font-medium text-muted-foreground w-20 sm:w-24">
                                    <button className="flex items-center gap-1 sm:gap-2 hover:text-foreground transition-colors" onClick={() => handleTimesheetSort('ref')}>
                                        <span className="hidden sm:inline !text-[#381980] w-20  ">CLIENT REF</span>
                                        <span className="sm:hidden">REF</span>
                                        {getTimesheetSortIcon('ref')}
                                    </button>
                                </th>
                                <th className="text-left px-2 sm:px-3 py-2 text-xs font-medium text-muted-foreground w-24 sm:w-32">
                                    <button className="flex items-center gap-1 sm:gap-2 hover:text-foreground transition-colors" onClick={() => handleTimesheetSort('client')}>
                                        <span className="hidden sm:inline !text-[#381980] whitespace-nowrap">CLIENT NAME</span>
                                        <span className="sm:hidden">CLIENT</span>
                                        {getTimesheetSortIcon('client')}
                                    </button>
                                </th>
                                <th className="text-left px-2 sm:px-3 py-2 text-xs font-medium text-muted-foreground w-32 sm:w-40">
                                    <button className="flex items-center gap-1 sm:gap-2 hover:text-foreground transition-colors" onClick={() => handleTimesheetSort('job')}>
                                        <span className="hidden sm:inline !text-[#381980] whitespace-nowrap">JOB NAME</span>
                                        <span className="sm:hidden">JOB</span>
                                        {getTimesheetSortIcon('job')}
                                    </button>
                                </th>
                                <th className="text-left px-2 sm:px-3 py-2 text-xs font-medium text-muted-foreground w-24 sm:w-32">
                                    <button className="flex items-center gap-1 sm:gap-2 hover:text-foreground transition-colors" onClick={() => handleTimesheetSort('jobType')}>
                                        <span className="hidden sm:inline !text-[#381980] whitespace-nowrap">JOB TYPE</span>
                                        <span className="sm:hidden">TYPE</span>
                                        {getTimesheetSortIcon('jobType')}
                                    </button>
                                </th>
                                <th className="text-left px-2 sm:px-3 py-2 text-xs font-medium text-muted-foreground w-20 sm:w-24">
                                    <button className="flex items-center gap-1 sm:gap-2 hover:text-foreground transition-colors" onClick={() => handleTimesheetSort('category')}>
                                        <span className="hidden sm:inline !text-[#381980] whitespace-nowrap">TIME PURPOSE</span>
                                        <span className="sm:hidden">CAT</span>
                                        {getTimesheetSortIcon('category')}
                                    </button>
                                </th>
                                <th className="text-left px-2 sm:px-3 py-2 text-xs font-medium text-muted-foreground w-36 sm:w-48">
                                    <button className="flex items-center gap-1 sm:gap-2 hover:text-foreground transition-colors" onClick={() => handleTimesheetSort('description')}>
                                        <span className="hidden sm:inline !text-[#381980]">DESCRIPTION</span>
                                        <span className="sm:hidden">DESC</span>
                                        {getTimesheetSortIcon('description')}
                                    </button>
                                </th>
                                <th className="text-center px-2 sm:px-3 py-2 text-xs font-medium text-muted-foreground w-16 sm:w-20 !text-[#381980]">BILLABLE</th>
                                <th className="text-left px-2 sm:px-3 py-2 text-xs font-medium text-muted-foreground w-36 sm:w-16 !text-[#381980]">
                                    <button className="w-36 flex items-center gap-1 sm:gap-2 hover:text-foreground transition-colors !text-[#381980]" onClick={() => handleTimesheetSort('rate')}>
                                        BILLABLE RATE
                                        {getTimesheetSortIcon('rate')}
                                    </button>
                                </th>
                                {weekDays.slice(1, 6).map((day, index) => (
                                    <th key={day.key} className="text-center whitespace-nowrap px-1 sm:px-3 py-2 text-xs font-medium text-muted-foreground w-12 sm:w-16 !text-[#381980]">
                                        {day.label} {day.date}
                                    </th>
                                ))}
                                {!hideWeekend && weekDays.slice(6).map((day, index) => (
                                    <th key={day.key} className="text-center whitespace-nowrap px-1 sm:px-3 py-2 text-xs font-medium text-muted-foreground w-12 sm:w-16 !text-[#381980]">
                                        {day.label} {day.date}
                                    </th>
                                ))}
                                {!hideWeekend && weekDays.slice(0, 1).map((day, index) => (
                                    <th key={day.key} className="text-center whitespace-nowrap px-1 sm:px-3 py-2 text-xs font-medium text-muted-foreground w-12 sm:w-16 !text-[#381980]">
                                        {day.label} {day.date}
                                    </th>
                                ))}
                                <th className="text-right whitespace-nowrap px-1 sm:px-3 py-2 text-xs font-medium text-muted-foreground w-8 sm:w-12"></th>
                            </tr>
                        </thead>
                        <tbody>
                            {timesheetRows.sort((a, b) => {
                                if (!timesheetSortField || !timesheetSortDirection) return 0;

                                if (timesheetSortField === 'rate') {
                                    const aRate = parseFloat(a.rate || '0');
                                    const bRate = parseFloat(b.rate || '0');
                                    if (timesheetSortDirection === 'asc') {
                                        return aRate - bRate;
                                    }
                                    return bRate - aRate;
                                }

                                if (timesheetSortField === 'jobType') {
                                    const aValue = a.jobType || '';
                                    const bValue = b.jobType || '';
                                    if (timesheetSortDirection === 'asc') {
                                        return aValue.localeCompare(bValue);
                                    }
                                    return bValue.localeCompare(aValue);
                                }

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
                                                    {row.client || 'Select client'} <ChevronDown className="ml-1 w-3 h-3" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent>
                                                {clients.map(client => <DropdownMenuItem key={client._id} onClick={() => {
                                                    // Get filtered jobs for the selected client
                                                    const filteredJobs = getFilteredJobs(client._id);
                                                    const firstJob = filteredJobs[0];
                                                    const firstCategory = categories[0];
                                                    const firstJobType = jobTypes[0];
                                                    updateRow(row.id, {
                                                        client: client.name,
                                                        clientId: client._id,
                                                        ref: client.clientRef || 'N/A',
                                                        // Reset job to first available job for this client
                                                        job: firstJob ? firstJob.name : '',
                                                        jobId: firstJob ? firstJob._id : '',
                                                        // Reset job type
                                                        jobType: firstJobType ? firstJobType.name : '',
                                                        jobTypeId: firstJobType ? firstJobType._id : '',
                                                        // Default category (enabled after client selection)
                                                        category: firstCategory ? firstCategory.name : '',
                                                        // Update rate if billable and job type has a rate
                                                        rate: row.billable && firstJobType?.rate !== null && firstJobType?.rate !== undefined 
                                                            ? firstJobType.rate.toFixed(2) 
                                                            : row.billable ? billableRate.toFixed(2) : row.rate
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
                                                <Button variant="ghost" size="sm" className="text-left p-0 h-8 font-normal w-full justify-start" disabled={!row.clientId}>
                                                    {row.job || 'Select job'} <ChevronDown className="ml-1 w-3 h-3" />
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
                                <td className="px-3 py-2 text-sm">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="sm" className="text-left p-0 h-8 font-normal w-full justify-start" disabled={!row.jobId}>
                                                {row.jobType || 'Select job type'} <ChevronDown className="ml-1 w-3 h-3" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent>
                                            {jobTypes.map(jobType => <DropdownMenuItem key={jobType._id} onClick={() => {
                                                const updates: Partial<TimesheetRow> = {
                                                    jobType: jobType.name,
                                                    jobTypeId: jobType._id
                                                };
                                                // Update rate based on job type rate if billable
                                                if (row.billable) {
                                                    if (jobType.rate !== null && jobType.rate !== undefined) {
                                                        updates.rate = jobType.rate.toFixed(2);
                                                    } else {
                                                        // Use default billableRate if no rate set for this job type
                                                        updates.rate = billableRate.toFixed(2);
                                                    }
                                                }
                                                updateRow(row.id, updates);
                                            }}>
                                                {jobType.name}
                                            </DropdownMenuItem>)}
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </td>
                                <td className="px-3 py-2">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="sm" className="text-left p-0 h-8 font-normal" disabled={!row.clientId}>
                                                <span className={`px-2 py-1 text-xs rounded whitespace-nowrap flex items-center ${row.category === 'Client Work' ? 'bg-blue-100 text-blue-800' : row.category === 'Admin' ? 'bg-green-100 text-green-800' : row.category === 'Training' ? 'bg-orange-100 text-orange-800' : row.category === 'Meeting' ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800'}`}>
                                                        {row.category || 'Select category'} <ChevronDown className="ml-1 w-3 h-3" />
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
                                            const updates: Partial<TimesheetRow> = { billable: checked };
                                            if (checked) {
                                                // If jobType is selected, use its rate, otherwise use current rate or default
                                                if (row.jobTypeId) {
                                                    const selectedJobType = jobTypes.find(jt => jt._id === row.jobTypeId);
                                                    if (selectedJobType?.rate !== null && selectedJobType?.rate !== undefined) {
                                                        updates.rate = selectedJobType.rate.toFixed(2);
                                                    } else {
                                                        updates.rate = billableRate.toFixed(2);
                                                    }
                                                } else {
                                                    updates.rate = formatRateToTwoDecimals(row.rate || billableRate.toString());
                                                }
                                            } else {
                                                updates.rate = '';
                                            }
                                            updateRow(row.id, updates);
                                    }} />
                                </td>
                                <td className="px-3 py-2 text-sm">
                                        {row.billable ? (
                                            <div className="flex items-center gap-0.5 text-sm">
                                                <span className="text-muted-foreground">€</span>
                                                <Input
                                                    type="text"
                                                    inputMode="decimal"
                                                    value={row.rate ?? ''}
                                                    onChange={(e) => handleRateInputChange(row.id, e.target.value)}
                                                    onBlur={(e) => handleRateInputBlur(row.id, e.target.value)}
                                                    placeholder="0.00"
                                                    className="w-16 bg-transparent border-none p-0 text-center focus-visible:ring-0 focus-visible:outline-none"
                                                />
                                            </div>
                                        ) : (
                                            <span className="text-xs text-muted-foreground">—</span>
                                        )}
                                </td>
                                    <td className="px-3 py-2 text-center text-sm ">
                                        <Input
                                            type="text"
                                            value={getTimeInputValue(row.id, 'mon', row.hours.mon)}
                                            onChange={e => handleTimeChange(row.id, 'mon', e.target.value)}
                                            onFocus={() => handleTimeFocus(row.id, 'mon', row.hours.mon)}
                                            onBlur={() => handleTimeBlur(row.id, 'mon')}
                                            placeholder="hh:mm:ss"
                                            className="w-20  text-center border border-input p-1 h-8 bg-background text-sm rounded"
                                        />
                                </td>
                                <td className="px-3 py-2 text-center text-sm">
                                        <Input
                                            type="text"
                                            value={getTimeInputValue(row.id, 'tue', row.hours.tue)}
                                            onChange={e => handleTimeChange(row.id, 'tue', e.target.value)}
                                            onFocus={() => handleTimeFocus(row.id, 'tue', row.hours.tue)}
                                            onBlur={() => handleTimeBlur(row.id, 'tue')}
                                            placeholder="hh:mm:ss"
                                            className="w-20 text-center border border-input p-1 h-8 bg-background text-sm rounded"
                                        />
                                </td>
                                <td className="px-3 py-2 text-center text-sm">
                                        <Input
                                            type="text"
                                            value={getTimeInputValue(row.id, 'wed', row.hours.wed)}
                                            onChange={e => handleTimeChange(row.id, 'wed', e.target.value)}
                                            onFocus={() => handleTimeFocus(row.id, 'wed', row.hours.wed)}
                                            onBlur={() => handleTimeBlur(row.id, 'wed')}
                                            placeholder="hh:mm:ss"
                                            className="w-20 text-center border border-input p-1 h-8 bg-background text-sm rounded"
                                        />
                                </td>
                                <td className="px-3 py-2 text-center text-sm">
                                        <Input
                                            type="text"
                                            value={getTimeInputValue(row.id, 'thu', row.hours.thu)}
                                            onChange={e => handleTimeChange(row.id, 'thu', e.target.value)}
                                            onFocus={() => handleTimeFocus(row.id, 'thu', row.hours.thu)}
                                            onBlur={() => handleTimeBlur(row.id, 'thu')}
                                            placeholder="hh:mm:ss"
                                            className="w-20 text-center border border-input p-1 h-8 bg-background text-sm rounded"
                                        />
                                </td>
                                <td className="px-3 py-2 text-center text-sm">
                                        <Input
                                            type="text"
                                            value={getTimeInputValue(row.id, 'fri', row.hours.fri)}
                                            onChange={e => handleTimeChange(row.id, 'fri', e.target.value)}
                                            onFocus={() => handleTimeFocus(row.id, 'fri', row.hours.fri)}
                                            onBlur={() => handleTimeBlur(row.id, 'fri')}
                                            placeholder="hh:mm:ss"
                                            className="w-20 text-center border border-input p-1 h-8 bg-background text-sm rounded"
                                        />
                                </td>
                                {!hideWeekend && <td className="px-3 py-2 text-center text-sm">
                                        <Input
                                            type="text"
                                            value={getTimeInputValue(row.id, 'sat', row.hours.sat)}
                                            onChange={e => handleTimeChange(row.id, 'sat', e.target.value)}
                                            onFocus={() => handleTimeFocus(row.id, 'sat', row.hours.sat)}
                                            onBlur={() => handleTimeBlur(row.id, 'sat')}
                                            placeholder="hh:mm:ss"
                                            className="w-20 text-center border border-input p-1 h-8 bg-background text-sm rounded"
                                        />
                                </td>}
                                {!hideWeekend && <td className="px-3 py-2 text-center text-sm">
                                        <Input
                                            type="text"
                                            value={getTimeInputValue(row.id, 'sun', row.hours.sun)}
                                            onChange={e => handleTimeChange(row.id, 'sun', e.target.value)}
                                            onFocus={() => handleTimeFocus(row.id, 'sun', row.hours.sun)}
                                            onBlur={() => handleTimeBlur(row.id, 'sun')}
                                            placeholder="hh:mm:ss"
                                            className="w-20 text-center border border-input p-1 h-8 bg-background text-sm rounded"
                                        />
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
                                {renderSummaryLabelCells('BILLABLE')}
                                {weekDays.slice(1, 6).map((day, index) => (
                                    <td key={day.key} className="px-3 py-2 text-center text-sm font-normal whitespace-nowrap ">
                                        <div className=" bg-[#f8f4fb] border border-[#e4e4e7] rounded-sm px-1 py-1">
                                            {formatSeconds(hoursToSeconds(dailySummary[day.key as keyof typeof dailySummary].billable))}
                                        </div>
                                    </td>
                                ))}
                                {!hideWeekend && weekDays.slice(6).map((day, index) => (
                                    <td key={day.key} className="px-3 py-2 text-center text-sm font-normal whitespace-nowrap">
                                        <div className=" bg-[#f8f4fb] border border-[#e4e4e7] rounded-sm px-1 py-1">

                                        {formatSeconds(hoursToSeconds(dailySummary[day.key as keyof typeof dailySummary].billable))}
                                        </div>
                                    </td>
                                ))}
                                {!hideWeekend && weekDays.slice(0, 1).map((day, index) => (
                                    <td key={day.key} className="px-3 py-2 text-center text-sm font-normal whitespace-nowrap">
                                        <div className=" bg-[#f8f4fb] border border-[#e4e4e7] rounded-sm px-1 py-1">

                                        {formatSeconds(hoursToSeconds(dailySummary[day.key as keyof typeof dailySummary].billable))}
                                        </div>
                                    </td>
                                ))}
                                <td className="px-3 py-2 text-center text-sm font-normal whitespace-nowrap w-20 min-w-[80px]">
                                    <div className=" bg-[#f8f4fb] border border-[#e4e4e7] rounded-sm px-1 py-1">

                                    {formatSeconds(summaryTotals.billable)}
                                    </div>
                                    </td>
                            </tr>
                            <tr className="bg-gray-50">
                                {renderSummaryLabelCells('NON BILLABLE')}
                                {weekDays.slice(1, 6).map((day, index) => (
                                    <td key={day.key} className="px-3 py-2 text-center text-sm font-normal whitespace-nowrap">
                                        <div className=" bg-[#f8f4fb] border border-[#e4e4e7] rounded-sm px-1 py-1">

                                        {formatSeconds(hoursToSeconds(dailySummary[day.key as keyof typeof dailySummary].nonBillable))}
                                        </div>
                                    </td>
                                ))}
                                {!hideWeekend && weekDays.slice(6).map((day, index) => (
                                    <td key={day.key} className="px-3 py-2 text-center text-sm font-normal whitespace-nowrap">
                                        <div className=" bg-[#f8f4fb] border border-[#e4e4e7] rounded-sm px-1 py-1">

                                        {formatSeconds(hoursToSeconds(dailySummary[day.key as keyof typeof dailySummary].nonBillable))}
                                        </div>
                                    </td>
                                ))}
                                {!hideWeekend && weekDays.slice(0, 1).map((day, index) => (
                                    <td key={day.key} className="px-3 py-2 text-center text-sm font-normal whitespace-nowrap">
                                        <div className=" bg-[#f8f4fb] border border-[#e4e4e7] rounded-sm px-1 py-1">

                                        {formatSeconds(hoursToSeconds(dailySummary[day.key as keyof typeof dailySummary].nonBillable))}
                                        </div>
                                    </td>
                                ))}
                                <td className="px-3 py-2 text-center text-sm font-normal whitespace-nowrap w-20 min-w-[80px]">
                                    <div className=" bg-[#f8f4fb] border border-[#e4e4e7] rounded-sm px-1 py-1">

                                    {formatSeconds(summaryTotals.nonBillable)}
                                    </div>
                                    </td>
                            </tr>
                            <tr className="bg-blue-50">
                                {renderSummaryLabelCells('LOGGED')}
                                {weekDays.slice(1, 6).map((day, index) => (
                                    <td key={day.key} className="px-3 py-2 text-center text-sm font-normal whitespace-nowrap">
                                        <div className=" bg-[#f8f4fb] border border-[#e4e4e7] rounded-sm px-1 py-1">

                                        {formatSeconds(hoursToSeconds(dailySummary[day.key as keyof typeof dailySummary].logged))}
                                        </div>
                                    </td>
                                ))}
                                {!hideWeekend && weekDays.slice(6).map((day, index) => (
                                    <td key={day.key} className="px-3 py-2 text-center text-sm font-normal whitespace-nowrap">
                                        <div className=" bg-[#f8f4fb] border border-[#e4e4e7] rounded-sm px-1 py-1">

                                        {formatSeconds(hoursToSeconds(dailySummary[day.key as keyof typeof dailySummary].logged))}
                                        </div>
                                    </td>
                                ))}
                                {!hideWeekend && weekDays.slice(0, 1).map((day, index) => (
                                    <td key={day.key} className="px-3 py-2 text-center text-sm font-normal whitespace-nowrap">
                                        <div className=" bg-[#f8f4fb] border border-[#e4e4e7] rounded-sm px-1 py-1">

                                        {formatSeconds(hoursToSeconds(dailySummary[day.key as keyof typeof dailySummary].logged))}
                                        </div>
                                    </td>
                                ))}
                                <td className="px-3 py-2 text-center text-sm font-normal whitespace-nowrap w-20 min-w-[80px]">
                                    <div className=" bg-[#f8f4fb] border border-[#e4e4e7] rounded-sm px-1 py-1">

                                    {formatSeconds(summaryTotals.logged)}
                                    </div>
                                    </td>
                            </tr>
                            <tr className="bg-gray-100">
                                {renderSummaryLabelCells('CAPACITY')}
                                {weekDays.slice(1, 6).map((day, index) => (
                                    <td key={day.key} className="px-3 py-2 text-center text-sm font-normal whitespace-nowrap">
                                        <div className=" bg-[#f8f4fb] border border-[#e4e4e7] rounded-sm px-1 py-1">

                                        {formatSeconds(hoursToSeconds(dailySummary[day.key as keyof typeof dailySummary].capacity))}
                                        </div>
                                    </td>
                                ))}
                                {!hideWeekend && weekDays.slice(6).map((day, index) => (
                                    <td key={day.key} className="px-3 py-2 text-center text-sm font-normal whitespace-nowrap">
                                        <div className=" bg-[#f8f4fb] border border-[#e4e4e7] rounded-sm px-1 py-1">

                                        {formatSeconds(hoursToSeconds(dailySummary[day.key as keyof typeof dailySummary].capacity))}
                                        </div>
                                    </td>
                                ))}
                                {!hideWeekend && weekDays.slice(0, 1).map((day, index) => (
                                    <td key={day.key} className="px-3 py-2 text-center text-sm font-normal whitespace-nowrap">
                                        <div className=" bg-[#f8f4fb] border border-[#e4e4e7] rounded-sm px-1 py-1">

                                        {formatSeconds(hoursToSeconds(dailySummary[day.key as keyof typeof dailySummary].capacity))}
                                        </div>
                                    </td>
                                ))}
                                <td className="px-3 py-2 text-center text-sm font-normal whitespace-nowrap w-20 min-w-[80px]">
                                    <div className=" bg-[#f8f4fb] border border-[#e4e4e7] rounded-sm px-1 py-1">

                                    {formatSeconds(summaryTotals.capacity)}
                                    </div>
                                    </td>
                            </tr>
                            <tr className={isVariancePositive ? "bg-green-50" : "bg-red-50"}>
                                {renderSummaryLabelCells('VARIANCE', isVariancePositive ? '' : '')}
                                {weekDays.slice(1, 6).map((day, index) => {
                                    const dayData = dailySummary[day.key as keyof typeof dailySummary];
                                    const dayVariancePositive = dayData.logged > dayData.capacity;
                                    return (
                                        <td key={day.key} className={`px-3 py-2 text-center text-sm font-normal whitespace-nowrap ${dayVariancePositive ? 'bg-green-100' : ''}`}>
                                            <div className=" bg-[#f8f4fb] border border-[#e4e4e7] rounded-sm px-1 py-1">

                                            {formatVariance(dayData.variance)}
                                            </div>
                                        </td>
                                    );
                                })}
                                {!hideWeekend && weekDays.slice(6).map((day, index) => {
                                    const dayData = dailySummary[day.key as keyof typeof dailySummary];
                                    const dayVariancePositive = dayData.logged > dayData.capacity;
                                    return (
                                        <td key={day.key} className={`px-3 py-2 text-center text-sm font-normal whitespace-nowrap ${dayVariancePositive ? 'bg-green-100' : ''}`}>
                                            <div className=" bg-[#f8f4fb] border border-[#e4e4e7] rounded-sm px-1 py-1">

                                            {formatVariance(dayData.variance)}
                                            </div>
                                        </td>
                                    );
                                })}
                                {!hideWeekend && weekDays.slice(0, 1).map((day, index) => {
                                    const dayData = dailySummary[day.key as keyof typeof dailySummary];
                                    const dayVariancePositive = dayData.logged > dayData.capacity;
                                    return (
                                        <td key={day.key} className={`px-3 py-2 text-center text-sm font-normal whitespace-nowrap ${dayVariancePositive ? 'bg-green-100' : ''}`}>
                                            <div className=" bg-[#f8f4fb] border border-[#e4e4e7] rounded-sm px-1 py-1">

                                            {formatVariance(dayData.variance)}
                                            </div>
                                        </td>
                                    );
                                })}
                                <td className="px-3 py-2 text-center text-sm font-normal whitespace-nowrap w-20 min-w-[80px]">
                                    <div className=" bg-[#f8f4fb] border border-[#e4e4e7] rounded-sm px-1 py-1">

                                    {formatVariance(secondsToHours(summaryTotals.variance))}
                                    </div>
                                    </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}
