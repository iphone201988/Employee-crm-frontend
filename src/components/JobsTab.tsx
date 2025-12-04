import React, { useState, useMemo, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, ChevronLeft, ChevronRight, ChevronDown, ChevronUp, Search, Settings, X, RefreshCw, Check, ArrowUp, ArrowDown, ArrowUpDown } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { formatCurrency } from '@/lib/currency';
import ClientNameLink from '@/components/ClientNameLink';
import JobNameLink from '@/components/JobNameLink';
import { JobForm } from './JobForm';
import { useGetJobsQuery, useUpdateJobMutation, useCreateJobMutation, useDeleteJobMutation } from '@/store/jobApi';
import { useDebounce } from 'use-debounce';
import { toast } from 'sonner';
import { format } from 'path';
import { useGetDropdownOptionsQuery } from '@/store/teamApi';


// --- Type Definitions ---
type JobStatus = 'queued' | 'awaitingRecords' | 'inProgress' | 'withClient' | 'forApproval' | 'completed';
type Priority = 'low' | 'medium' | 'high' | 'urgent';


interface PopulatedUser {
    _id: string;
    name: string;
    email: string;
}


interface PopulatedJobType {
    _id: string;
    name: string;
}

interface TeamOption {
    _id: string;
    name: string;
}


interface Job {
    _id: string;
    name: string;
    clientId: PopulatedUser;
    jobTypeId: PopulatedJobType;
    jobManagerId: PopulatedUser;
    startDate: string;
    endDate: string;
    jobCost: number;
    teamMembers: PopulatedUser[];
    status: JobStatus;
    description: string;
    priority: Priority;
    actualCost?: number;
    wipBalance?: number;
    hoursLogged?: number;
}


// --- Constants & Helpers ---
const priorityColors = {
    low: 'bg-blue-100 text-blue-800',
    medium: 'bg-yellow-100 text-yellow-800',
    high: 'bg-orange-100 text-orange-800',
    urgent: 'bg-red-100 text-red-800'
};


const statusColors = {
    queued: 'bg-blue-100 text-blue-800',
    awaitingRecords: 'bg-purple-100 text-purple-800',
    inProgress: 'bg-green-100 text-green-800',
    withClient: 'bg-orange-100 text-orange-800',
    forApproval: 'bg-yellow-100 text-yellow-800',
    completed: 'bg-gray-100 text-gray-800'
};


const getUserInitials = (name: string): string => {
    if (!name) return '';
    const words = name.trim().split(' ').filter(Boolean);
    if (words.length === 0) return '';
    if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
    return (words[0][0] + (words[words.length - 1][0] || '')).toUpperCase();
};


// Function to generate a consistent color from a string (for chart dots)
const generateColorFromString = (str: string) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    const color = `hsl(${hash % 360}, 70%, 55%)`;
    return color;
};

const formatHoursToHHMMSS = (hours: number = 0) => {
    const totalSeconds = Math.max(0, Math.round(hours * 3600));
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
};


const JobsTab = () => {
    // --- State Management ---
    const [editingJob, setEditingJob] = useState<any | null>(null);
    const [viewingJob, setViewingJob] = useState<Job | null>(null);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [viewDialogOpen, setViewDialogOpen] = useState(false);
    const [settingsMenu, setSettingsMenu] = useState<{ jobId: string; x: number; y: number } | null>(null);


    // API Filters
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);
    const [statusFilter, setStatusFilter] = useState('');
    const [priorityFilter, setPriorityFilter] = useState('');
    const [jobTypeFilter, setJobTypeFilter] = useState('');
    const [selectedJobManagerIds, setSelectedJobManagerIds] = useState<Set<string>>(new Set());
    const [selectedTeamMemberIds, setSelectedTeamMemberIds] = useState<Set<string>>(new Set());
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearchTerm] = useDebounce(searchTerm, 500);
    const [dateFilter, setDateFilter] = useState<'daily' | 'weekly' | 'monthly' | 'yearly'>('yearly');
    const [currentPeriodOffset, setCurrentPeriodOffset] = useState(0);


    // UI State
    const [chartView, setChartView] = useState<'distribution' | 'jobTypes' | 'byStatus' | 'byJobManager' | 'wipPercentage'>('distribution');
    const [isReportCollapsed, setIsReportCollapsed] = useState(false);
    type SortField = 'jobName' | 'clientName' | 'jobType' | 'status' | 'jobManager' | 'jobFee' | 'wipBalance' | 'wipPercent' | 'loggedTime';
    type SortDirection = 'asc' | 'desc' | null;
    const [sortState, setSortState] = useState<{ field: SortField | null; direction: SortDirection }>({ field: null, direction: null });
    // --- API Hooks ---
    const jobManagerIdsCsv = useMemo(() => Array.from(selectedJobManagerIds).join(','), [selectedJobManagerIds]);
    const teamMemberIdsCsv = useMemo(() => Array.from(selectedTeamMemberIds).join(','), [selectedTeamMemberIds]);

    const jobsQueryArgs = useMemo(() => ({
        page,
        limit,
        status: statusFilter,
        priority: priorityFilter,
        jobTypeId: jobTypeFilter,
        search: debouncedSearchTerm,
        view: dateFilter,
        periodOffset: currentPeriodOffset,
        jobManagerIds: jobManagerIdsCsv || undefined,
        teamMemberIds: teamMemberIdsCsv || undefined
    }), [page, limit, statusFilter, priorityFilter, jobTypeFilter, debouncedSearchTerm, dateFilter, currentPeriodOffset, jobManagerIdsCsv, teamMemberIdsCsv]);

    const {
        data: apiData,
        isLoading,
        isError,
        isFetching
    } = useGetJobsQuery(jobsQueryArgs as any);


    const [createJob, { isLoading: isCreating }] = useCreateJobMutation();
    const [updateJob, { isLoading: isUpdating }] = useUpdateJobMutation();
    const [deleteJob, { isLoading: isDeleting }] = useDeleteJobMutation();
    // --- Data Extraction ---
    const {
        jobs,
        pagination,
        statusBreakdown,
        teamMemberStats,
        statusDistribution,
        jobManagerDistribution,
        wipFeeDistribution,
    } = useMemo(() => {
        const data = apiData?.data;
        return {
            jobs: data?.jobs || [],
            pagination: data?.pagination,
            statusBreakdown: data?.statusBreakdown || {},
            teamMemberStats: data?.teamMemberStats || [],
            statusDistribution: data?.statusDistribution || [],
            jobManagerDistribution: data?.jobManagerDistribution || [],
            wipFeeDistribution: data?.wipFeeDistribution || [],
        };
    }, [apiData]);

    const jobTypeCounts = apiData?.data?.jobTypeCounts || [];

    const sortedJobs = useMemo(() => {
        if (!sortState.field || !sortState.direction) return jobs;
        const sorted = [...jobs];
        sorted.sort((a: any, b: any) => {
            let aValue: any;
            let bValue: any;
            switch (sortState.field) {
                case 'jobName':
                    aValue = a.name;
                    bValue = b.name;
                    break;
                case 'clientName':
                    aValue = a.clientId?.name;
                    bValue = b.clientId?.name;
                    break;
                case 'jobType':
                    aValue = a.jobTypeId?.name;
                    bValue = b.jobTypeId?.name;
                    break;
                case 'status':
                    aValue = a.status;
                    bValue = b.status;
                    break;
                case 'jobManager':
                    aValue = a.jobManagerId?.name;
                    bValue = b.jobManagerId?.name;
                    break;
                case 'jobFee':
                    aValue = a.jobCost ?? 0;
                    bValue = b.jobCost ?? 0;
                    break;
                case 'wipBalance':
                    aValue = a.wipBalance ?? 0;
                    bValue = b.wipBalance ?? 0;
                    break;
                case 'wipPercent':
                    aValue = a.jobCost > 0 ? (a.wipBalance || 0) / a.jobCost : 0;
                    bValue = b.jobCost > 0 ? (b.wipBalance || 0) / b.jobCost : 0;
                    break;
                case 'loggedTime':
                    aValue = a.hoursLogged ?? 0;
                    bValue = b.hoursLogged ?? 0;
                    break;
                default:
                    aValue = '';
                    bValue = '';
            }
            if (typeof aValue === 'number' && typeof bValue === 'number') {
                return sortState.direction === 'asc' ? aValue - bValue : bValue - aValue;
            }
            const aStr = (aValue ?? '').toString().toLowerCase();
            const bStr = (bValue ?? '').toString().toLowerCase();
            const comparison = aStr.localeCompare(bStr);
            return sortState.direction === 'asc' ? comparison : -comparison;
        });
        return sorted;
    }, [jobs, sortState]);

    const jobTypeOptions = useMemo(() => {
        if (!jobTypeCounts || jobTypeCounts.length === 0) return [];
        return jobTypeCounts.map((jt: any) => ({
            id: jt._id,
            name: jt.name || 'Unnamed Job Type',
        }));
    }, [jobTypeCounts]);

    const { data: teamDropdownOptions } = useGetDropdownOptionsQuery('team');
    const teamOptions = (teamDropdownOptions?.data?.teams || []) as TeamOption[];

    const jobTypeFilterActive = Boolean(jobTypeFilter);
    const priorityFilterActive = Boolean(priorityFilter);
    const jobManagerFilterActive = selectedJobManagerIds.size > 0;
    const teamFilterActive = selectedTeamMemberIds.size > 0;
    const totalJobCount = pagination?.totalJobs ?? jobs.length;

    const toggleSelection = (
        value: string,
        setter: React.Dispatch<React.SetStateAction<Set<string>>>
    ) => {
        setter(prev => {
            const next = new Set(prev);
            if (next.has(value)) {
                next.delete(value);
            } else {
                next.add(value);
            }
            return next;
        });
    };

    const clearSelection = (setter: React.Dispatch<React.SetStateAction<Set<string>>>) => {
        setter(new Set());
    };

    // --- Dialog and Form Handlers ---
    const openAddDialog = () => {
        setEditingJob(null);
        setDialogOpen(true);
    };


    const openEditDialog = (job: Job) => {
        setEditingJob({
            id: job._id,
            jobName: job.name,
            clientId: job.clientId._id,
            clientName: job.clientId.name,
            jobTypeId: job.jobTypeId._id,
            jobManagerId: job.jobManagerId._id,
            startDate: job.startDate.split('T')[0],
            endDate: job.endDate.split('T')[0],
            estimatedCost: job.jobCost,
            team: job.teamMembers.map(tm => tm._id),
            status: job.status,
            priority: job.priority,
            description: job.description,
        });
        setDialogOpen(true);
    };


    const openViewDialog = (job: Job) => {
        setViewingJob(job);
        setViewDialogOpen(true);
    };


    const handleFormSubmit = async (formData: any) => {
        const payload = {
            name: formData.jobName,
            description: formData.description,
            clientId: formData.clientId,
            jobTypeId: formData.jobTypeId,
            jobManagerId: formData.jobManagerId,
            startDate: formData.startDate,
            endDate: formData.endDate,
            jobCost: formData.estimatedCost,
            teamMembers: formData.team,
            status: formData.status,
            priority: formData.priority,
        };


        try {
            console.log('Payload:', editingJob);
            if (editingJob && editingJob.id) {
                // Update existing job
                await updateJob({ jobId: editingJob.id, jobData: payload }).unwrap();
                toast.success("Job updated successfully!");
            } else {
                // Create new job
                await createJob(payload).unwrap();
                toast.success("Job created successfully!");
            }
            setDialogOpen(false);
        } catch (err) {
            console.error("Failed to save job:", err);
            const action = editingJob ? 'update' : 'create';
            // toast.error(`Failed to ${action} job. Please check the details and try again.`);
        }
    };


    const handleStatusTabChange = (status: string) => {
        setStatusFilter(status === 'all' ? '' : status);
        setPage(1);
    };

    const handleRefreshFilters = () => {
        setSearchTerm('');
        setJobTypeFilter('');
        setPriorityFilter('');
        clearSelection(setSelectedJobManagerIds);
        clearSelection(setSelectedTeamMemberIds);
        handleStatusTabChange('all');
    };

    useEffect(() => {
        setPage(1);
    }, [priorityFilter, jobTypeFilter, jobManagerIdsCsv, teamMemberIdsCsv]);

    useEffect(() => {
        setPage(1);
    }, [debouncedSearchTerm]);

    const handleSort = (field: SortField) => {
        setSortState(prev => {
            if (prev.field === field) {
                if (prev.direction === 'asc') return { field, direction: 'desc' };
                if (prev.direction === 'desc') return { field: null, direction: null };
                return { field, direction: 'asc' };
            }
            return { field, direction: 'asc' };
        });
    };

    const getSortIcon = (field: SortField) => {
        if (sortState.field !== field) return <ArrowUpDown className="h-3 w-3 opacity-50" />;
        if (sortState.direction === 'asc') return <ArrowUp className="h-3 w-3" />;
        if (sortState.direction === 'desc') return <ArrowDown className="h-3 w-3" />;
        return <ArrowUpDown className="h-3 w-3 opacity-50" />;
    };

    const handleTimeFilterChange = (newFilter: 'daily' | 'weekly' | 'monthly' | 'yearly') => {
        setDateFilter(newFilter);
        setCurrentPeriodOffset(0);
        setPage(1);
    };

    const handlePeriodChange = (direction: 'prev' | 'next') => {
        setCurrentPeriodOffset(prev => direction === 'prev' ? prev - 1 : prev + 1);
        setPage(1);
    };

    const periodInfo = useMemo(() => {
        const now = new Date();
        const formatDate = (date: Date) => date.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });

        if (dateFilter === 'daily') {
            const targetDate = new Date();
            targetDate.setDate(now.getDate() + currentPeriodOffset);
            return { label: formatDate(targetDate) };
        }
        if (dateFilter === 'weekly') {
            const startOfWeek = new Date();
            startOfWeek.setDate(now.getDate() - now.getDay() + 1 + currentPeriodOffset * 7);
            const endOfWeek = new Date(startOfWeek);
            endOfWeek.setDate(startOfWeek.getDate() + 6);
            const getWeekNumber = (d: Date) => {
                const onejan = new Date(d.getFullYear(), 0, 1);
                return Math.ceil((((d.getTime() - onejan.getTime()) / 86400000) + onejan.getDay() + 1) / 7);
            };
            return { label: `${formatDate(startOfWeek)} to ${formatDate(endOfWeek)} - Week ${getWeekNumber(startOfWeek)}` };
        }
        if (dateFilter === 'monthly') {
            const d = new Date(now.getFullYear(), now.getMonth() + currentPeriodOffset, 1);
            return { label: d.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' }) };
        }
        return { label: `${now.getFullYear() + currentPeriodOffset}` };
    }, [dateFilter, currentPeriodOffset]);


    const isLoadingData = isLoading || isFetching;


    // --- Chart Rendering Logic ---
    const renderChartData = () => {
        let dataToRender: { type: string, count: number, color?: string }[] = [];
        switch (chartView) {
            case 'byStatus': dataToRender = statusDistribution.map(d => ({ type: d._id, count: d.count })); break;
            case 'byJobManager': dataToRender = jobManagerDistribution.map(d => ({ type: d._id, count: d.count })); break;
            case 'wipPercentage': dataToRender = wipFeeDistribution.map(d => ({ type: d._id, count: d.count })); break;
            default: return null;
        }
        if (dataToRender.length === 0) return <div className="text-center py-8 text-muted-foreground">No data available for this view.</div>;
        const maxCount = Math.max(...dataToRender.map(d => d.count), 0);
        return (<div className="space-y-2 py-2 px-3">
            {dataToRender.map((item) => {
                const percentage = maxCount > 0 ? Math.round((item.count / maxCount) * 100) : 0;
                const color = generateColorFromString(item.type);
                return (
                    <div key={item.type} className="group flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors">
                        <div className="flex items-center gap-3">
                            <span className="w-3 h-3 rounded-full" style={{ backgroundColor: color }}></span>
                            <span className="text-sm font-medium">{formatTitle(item.type)}</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <Progress value={percentage} className="w-64 h-2" style={{ '--progress-color': color } as React.CSSProperties} />
                            <span className="text-sm font-semibold w-8 text-right">{item.count}</span>
                        </div>
                    </div>
                );
            })}
        </div>);
    };



    const deleteJobById = async (job: any) => {
        try {
            await deleteJob(job?._id).unwrap();
            toast.success('Job deleted successfully!');
        } catch (err) {
            console.error(`Failed to delete job: ${job?._id}`, err);
            toast.error('Failed to delete job. Please try again.');
        }
    }
    const handleSettingsClick = (event: React.MouseEvent<HTMLButtonElement>, jobId: string) => {
        event.stopPropagation();
        const rect = event.currentTarget.getBoundingClientRect();
        setSettingsMenu({
            jobId,
            x: rect.left,
            y: rect.bottom + 5,
        });
    };

    const closeSettingsMenu = () => setSettingsMenu(null);

    const handleMenuAction = (action: 'view' | 'edit' | 'delete', jobId: string) => {
        const job = jobs.find((j: any) => j._id === jobId);
        if (!job) return;
        switch (action) {
            case 'view':
                openViewDialog(job);
                break;
            case 'edit':
                openEditDialog(job);
                break;
            case 'delete':
                deleteJobById(job);
                break;
        }
        closeSettingsMenu();
    };

    function formatTitle(key: string): string {
        return key
            // Add space before capital letters (camelCase → camel Case)
            .replace(/([a-z])([A-Z])/g, "$1 $2")
            // Capitalize first letter of each word
            .replace(/\b\w/g, (char) => char.toUpperCase());
    }
    // --- Main Render ---
    return (
        <div className="space-y-6">
            {/* Date Filter Controls */}
            <Card>
                <CardContent className="p-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex gap-1">
                        {(['daily', 'weekly', 'monthly', 'yearly'] as const).map(v => (
                            <Button
                                key={v}
                                variant={dateFilter === v ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => handleTimeFilterChange(v)}
                            >
                                {v.charAt(0).toUpperCase() + v.slice(1)}
                            </Button>
                        ))}
                    </div>
                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" className="h-8 w-8 p-0" onClick={() => handlePeriodChange('prev')}>
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <span className="text-sm font-medium whitespace-nowrap">{periodInfo.label}</span>
                        <Button variant="outline" size="sm" className="h-8 w-8 p-0" onClick={() => handlePeriodChange('next')}>
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                </CardContent>
            </Card>


            {/* Reports Section */}
            <Card>
                <CardContent className="p-0">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex gap-2 p-4">
                            <Button
                                variant={chartView === 'distribution' ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => setChartView('distribution')}
                            >
                                Distribution
                            </Button>
                            <Button
                                variant={chartView === 'byStatus' ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => setChartView('byStatus')}
                            >
                                By Status
                            </Button>
                            <Button
                                variant={chartView === 'byJobManager' ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => setChartView('byJobManager')}
                            >
                                By Job Manager
                            </Button>
                            {/* <Button
                                variant={chartView === 'wipPercentage' ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => setChartView('wipPercentage')}
                            >
                                WIP % of Fee
                            </Button> */}
                        </div>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setIsReportCollapsed(!isReportCollapsed)}
                        >
                            {isReportCollapsed ? (
                                <ChevronDown className="w-4 h-4" />
                            ) : (
                                <ChevronUp className="w-4 h-4" />
                            )}
                        </Button>
                    </div>


                    {!isReportCollapsed && (
                        chartView === 'distribution' ? (
                            <Table>
                                <TableHeader>
                                    <TableRow className='!bg-[#edecf4] text-[#381980]'>
                                        <TableHead className='px-4'>Team Member</TableHead>
                                        <TableHead className='px-4'>Total Jobs</TableHead>
                                        <TableHead className='px-4'>Job Type Breakdown</TableHead>
                                        <TableHead className='px-4'>Status Breakdown</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {isLoadingData ? (
                                        <TableRow>
                                            <TableCell colSpan={4} className="text-center py-4 ">
                                                Loading...
                                            </TableCell>
                                        </TableRow>
                                    ) : teamMemberStats.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={4} className="text-center py-4 ">
                                                No data.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        teamMemberStats.map(stat => (
                                            <TableRow key={stat._id}>
                                                <TableCell className='px-4'>{stat.userName}</TableCell>
                                                <TableCell>
                                                    <Badge variant="secondary">{stat.totalJobs}</Badge>
                                                </TableCell>
                                                <TableCell className='px-4'>
                                                    <div className="flex flex-wrap gap-1">
                                                        {stat.jobTypesWithCount.map(jt => (
                                                            <Badge key={jt._id} variant="outline">
                                                                {jt.name}: {jt.count}
                                                            </Badge>
                                                        ))}
                                                    </div>
                                                </TableCell>
                                                <TableCell className='px-4'>
                                                    <div className="flex flex-wrap gap-1">
                                                        {Object.entries(stat.statusBreakdown).map(([s, c]) => (
                                                            c > 0 && (
                                                                <Badge
                                                                    key={s}
                                                                    variant="outline"
                                                                    className={statusColors[s as JobStatus]}
                                                                >
                                                                    {formatTitle(s)}: {c}
                                                                </Badge>
                                                            )
                                                        ))}
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        ) : (
                            renderChartData()
                        )
                    )}
                </CardContent>
            </Card>


            {/* Jobs Table */}
            <div className="w-full">
                <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                    <div className="flex items-center gap-3 mt-4 w-max p-[6px] rounded-sm pl-4">
                        <p className='text-[#381980] font-semibold text-[14px]'>Status:</p>
                        <div className="flex gap-0">
                            <button
                                onClick={() => handleStatusTabChange('all')}
                                className={`px-4 py-2 text-sm font-medium transition-colors ${(statusFilter || 'all') === 'all'
                                    ? 'bg-[#381980] text-white rounded-l-full'
                                    : 'bg-transparent text-[#71717A]'
                                    }`}
                            >
                                All ({statusBreakdown.all || 0})
                            </button>
                            <button
                                onClick={() => handleStatusTabChange('queued')}
                                className={`px-4 py-2 text-sm font-medium transition-colors ${statusFilter === 'queued'
                                    ? 'bg-[#381980] text-white'
                                    : 'bg-transparent text-[#71717A]'
                                    }`}
                            >
                                Queued ({statusBreakdown.queued || 0})
                            </button>
          <button
            onClick={() => handleStatusTabChange('awaitingRecords')}
            className={`px-4 py-2 text-sm font-medium transition-colors ${statusFilter === 'awaitingRecords'
              ? 'bg-[#381980] text-white'
              : 'bg-transparent text-[#71717A]'
              }`}
          >
            Awaiting Records ({statusBreakdown.awaitingRecords || 0})
          </button>
          <button
            onClick={() => handleStatusTabChange('inProgress')}
            className={`px-4 py-2 text-sm font-medium transition-colors ${statusFilter === 'inProgress'
              ? 'bg-[#381980] text-white'
              : 'bg-transparent text-[#71717A]'
              }`}
          >
            In Progress ({statusBreakdown.inProgress || 0})
          </button>
          <button
            onClick={() => handleStatusTabChange('withClient')}
            className={`px-4 py-2 text-sm font-medium transition-colors ${statusFilter === 'withClient'
              ? 'bg-[#381980] text-white'
              : 'bg-transparent text-[#71717A]'
              }`}
          >
            With Client ({statusBreakdown.withClient || 0})
          </button>
          <button
            onClick={() => handleStatusTabChange('forApproval')}
            className={`px-4 py-2 text-sm font-medium transition-colors ${statusFilter === 'forApproval'
              ? 'bg-[#381980] text-white'
              : 'bg-transparent text-[#71717A]'
              }`}
          >
            For Approval ({statusBreakdown.forApproval || 0})
          </button>
          <button
            onClick={() => handleStatusTabChange('completed')}
            className={`px-4 py-2 text-sm font-medium transition-colors rounded-r-full ${statusFilter === 'completed'
              ? 'bg-[#381980] text-white'
              : 'bg-transparent text-[#71717A]'
              }`}
          >
            Completed ({statusBreakdown.completed || 0})
          </button>
                        </div>
                    </div>
                </div>

                <div className="bg-[#E7E5F2] p-[6px] rounded-sm flex flex-wrap items-center justify-between gap-3 mb-6">
                    <div className="flex flex-wrap items-end gap-2">
                        <div className="relative flex-1 w-full max-w-[220px]">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                            <Input
                                placeholder="Search by client name..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10 bg-white text-[#381980] font-semibold placeholder:text-[#381980]"
                            />
                        </div>

                        {/* Job Type Filter */}
                        <div className="space-y-2">
                            <Popover>
                                <PopoverTrigger asChild>
                                    <button
                                        className={`w-36 h-10 ${jobTypeFilterActive ? 'bg-gray-200 border-[#381980]' : 'bg-white border-input'} text-[#381980] font-semibold rounded-md border px-3 flex items-center justify-between`}
                                    >
                                        <span className="truncate text-[14px]">
                                            Job Type{jobTypeFilter && ` (${jobTypeOptions.find(option => option.id === jobTypeFilter)?.name || 'Selected'})`}
                                        </span>
                                        <ChevronDown className="w-4 h-4" />
                                    </button>
                                </PopoverTrigger>
                                <PopoverContent className="w-56 p-2" align="start">
                                    <div className="max-h-64 overflow-auto">
                                        <div
                                            className={`px-2 py-1.5 rounded-[4px] cursor-pointer ${!jobTypeFilter ? 'bg-[#5f46b9] text-white' : 'hover:bg-[#5f46b9] hover:text-white'}`}
                                            onClick={() => setJobTypeFilter('')}
                                        >
                                            <div className="flex items-center justify-between">
                                                <span>All</span>
                                                {!jobTypeFilter && <Check className="w-4 h-4" />}
                                            </div>
                                        </div>
                                        {jobTypeOptions.map(option => {
                                            const active = jobTypeFilter === option.id;
                                            return (
                                                <div
                                                    key={option.id}
                                                    className={`flex items-center justify-between px-2 py-1.5 rounded-[4px] cursor-pointer ${active ? 'bg-[#5f46b9] text-white' : 'hover:bg-[#5f46b9] hover:text-white'}`}
                                                    onClick={() => setJobTypeFilter(option.id)}
                                                >
                                                    <span className="truncate">{option.name}</span>
                                                    {active && <Check className="w-4 h-4" />}
                                                </div>
                                            );
                                        })}
                                        {jobTypeOptions.length === 0 && (
                                            <div className="px-2 py-1.5 text-sm text-muted-foreground">No job types available.</div>
                                        )}
                                    </div>
                                </PopoverContent>
                            </Popover>
                        </div>

                        {/* Priority Filter */}
                        <div className="space-y-2">
                            <Popover>
                                <PopoverTrigger asChild>
                                    <button
                                        className={`w-32 h-10 ${priorityFilterActive ? 'bg-gray-200 border-[#381980]' : 'bg-white border-input'} text-[#381980] font-semibold rounded-md border px-3 flex items-center justify-between`}
                                    >
                                        <span className="truncate text-[14px]">
                                            Priority{priorityFilter && ` (${priorityFilter.charAt(0).toUpperCase() + priorityFilter.slice(1)})`}
                                        </span>
                                        <ChevronDown className="w-4 h-4" />
                                    </button>
                                </PopoverTrigger>
                                <PopoverContent className="w-48 p-2" align="start">
                                    <div className="max-h-64 overflow-auto">
                                        <div
                                            className={`px-2 py-1.5 rounded-[4px] cursor-pointer ${!priorityFilter ? 'bg-[#5f46b9] text-white' : 'hover:bg-[#5f46b9] hover:text-white'}`}
                                            onClick={() => setPriorityFilter('')}
                                        >
                                            <div className="flex items-center justify-between">
                                                <span>All</span>
                                                {!priorityFilter && <Check className="w-4 h-4" />}
                                            </div>
                                        </div>
                                        {['low', 'medium', 'high', 'urgent'].map(option => {
                                            const active = priorityFilter === option;
                                            return (
                                                <div
                                                    key={option}
                                                    className={`flex items-center justify-between px-2 py-1.5 rounded-[4px] cursor-pointer ${active ? 'bg-[#5f46b9] text-white' : 'hover:bg-[#5f46b9] hover:text-white'}`}
                                                    onClick={() => setPriorityFilter(option)}
                                                >
                                                    <span className="truncate">{option.charAt(0).toUpperCase() + option.slice(1)}</span>
                                                    {active && <Check className="w-4 h-4" />}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </PopoverContent>
                            </Popover>
                        </div>

                        {/* Job Manager Filter */}
                        <div className="space-y-2">
                            <Popover>
                                <PopoverTrigger asChild>
                                    <button
                                        className={`w-40 h-10 ${jobManagerFilterActive ? 'bg-gray-200 border-[#381980]' : 'bg-white border-input'} text-[#381980] font-semibold rounded-md border px-3 flex items-center justify-between`}
                                    >
                                        <span className="truncate text-[14px]">
                                            Job Manager{jobManagerFilterActive ? ` (${selectedJobManagerIds.size})` : ''}
                                        </span>
                                        <ChevronDown className="w-4 h-4" />
                                    </button>
                                </PopoverTrigger>
                                <PopoverContent className="w-56 p-2" align="start">
                                    <div className="max-h-64 overflow-auto">
                                        <div
                                            className={`px-2 py-1.5 rounded-[4px] cursor-pointer ${!jobManagerFilterActive ? 'bg-[#5f46b9] text-white' : 'hover:bg-[#5f46b9] hover:text-white'}`}
                                            onClick={() => clearSelection(setSelectedJobManagerIds)}
                                        >
                                            <div className="flex items-center justify-between">
                                                <span>All</span>
                                                {!jobManagerFilterActive && <Check className="w-4 h-4" />}
                                            </div>
                                        </div>
                                        {teamOptions.map(option => {
                                            const active = selectedJobManagerIds.has(option._id);
                                            return (
                                                <div
                                                    key={`manager-${option._id}`}
                                                    className={`flex items-center justify-between px-2 py-1.5 rounded-[4px] cursor-pointer ${active ? 'bg-[#5f46b9] text-white' : 'hover:bg-[#5f46b9] hover:text-white'}`}
                                                    onClick={() => toggleSelection(option._id, setSelectedJobManagerIds)}
                                                >
                                                    <span className="truncate">{option.name}</span>
                                                    {active && <Check className="w-4 h-4" />}
                                                </div>
                                            );
                                        })}
                                        {teamOptions.length === 0 && (
                                            <div className="px-2 py-1.5 text-sm text-muted-foreground">No team members available.</div>
                                        )}
                                    </div>
                                </PopoverContent>
                            </Popover>
                        </div>

                        {/* Team Members Filter */}
                        <div className="space-y-2">
                            <Popover>
                                <PopoverTrigger asChild>
                                    <button
                                        className={`w-40 h-10 ${teamFilterActive ? 'bg-gray-200 border-[#381980]' : 'bg-white border-input'} text-[#381980] font-semibold rounded-md border px-3 flex items-center justify-between`}
                                    >
                                        <span className="truncate text-[14px]">
                                            Team Members{teamFilterActive ? ` (${selectedTeamMemberIds.size})` : ''}
                                        </span>
                                        <ChevronDown className="w-4 h-4" />
                                    </button>
                                </PopoverTrigger>
                                <PopoverContent className="w-56 p-2" align="start">
                                    <div className="max-h-64 overflow-auto">
                                        <div
                                            className={`px-2 py-1.5 rounded-[4px] cursor-pointer ${!teamFilterActive ? 'bg-[#5f46b9] text-white' : 'hover:bg-[#5f46b9] hover:text-white'}`}
                                            onClick={() => clearSelection(setSelectedTeamMemberIds)}
                                        >
                                            <div className="flex items-center justify-between">
                                                <span>All</span>
                                                {!teamFilterActive && <Check className="w-4 h-4" />}
                                            </div>
                                        </div>
                                        {teamOptions.map(option => {
                                            const active = selectedTeamMemberIds.has(option._id);
                                            return (
                                                <div
                                                    key={`team-${option._id}`}
                                                    className={`flex items-center justify-between px-2 py-1.5 rounded-[4px] cursor-pointer ${active ? 'bg-[#5f46b9] text-white' : 'hover:bg-[#5f46b9] hover:text-white'}`}
                                                    onClick={() => toggleSelection(option._id, setSelectedTeamMemberIds)}
                                                >
                                                    <span className="truncate">{option.name}</span>
                                                    {active && <Check className="w-4 h-4" />}
                                                </div>
                                            );
                                        })}
                                        {teamOptions.length === 0 && (
                                            <div className="px-2 py-1.5 text-sm text-muted-foreground">No team members available.</div>
                                        )}
                                    </div>
                                </PopoverContent>
                            </Popover>
                        </div>
                        <Button
                            variant="outline"
                            className="bg-[#381980] w-[42px] rounded-sm text-white p-2 hover:bg-[#2c1469]"
                            onClick={handleRefreshFilters}
                        >
                            <RefreshCw className="w-3 h-3" />
                        </Button>
                    </div>
                    <div className="flex items-center gap-3 ml-auto">
                        <span className="text-sm text-[#381980] font-semibold">{totalJobCount} Rows</span>
                        <Button onClick={openAddDialog} className="bg-[#017DB9] text-white hover:bg-[#016798]">
                            <Plus className="w-4 h-4 mr-2" />
                             New Job
                        </Button>
                    </div>
                </div>


                <Card>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow className='!bg-[#edecf4] text-[#381980]'>
                                    <TableHead>
                                        <button type="button" className="flex items-center gap-1 font-semibold" onClick={() => handleSort('jobName')}>
                                            Job Name {getSortIcon('jobName')}
                                        </button>
                                    </TableHead>
                                    <TableHead>
                                        <button type="button" className="flex items-center gap-1 font-semibold" onClick={() => handleSort('clientName')}>
                                            Client {getSortIcon('clientName')}
                                        </button>
                                    </TableHead>
                                    <TableHead>
                                <button type="button" className="flex items-center gap-1 font-semibold" onClick={() => handleSort('jobType')}>
                                            Job Type {getSortIcon('jobType')}
                                        </button>
                                    </TableHead>
                                    <TableHead>
                                        <button type="button" className="flex items-center gap-1 font-semibold" onClick={() => handleSort('status')}>
                                            Status {getSortIcon('status')}
                                        </button>
                                    </TableHead>
                                    <TableHead>
                                        <button type="button" className="flex items-center gap-1 font-semibold" onClick={() => handleSort('jobManager')}>
                                            Job Manager {getSortIcon('jobManager')}
                                        </button>
                                    </TableHead>
                                    <TableHead>Team</TableHead>
                                    <TableHead className="text-center">
                                        <button type="button" className="flex items-center gap-1 font-semibold mx-auto" onClick={() => handleSort('loggedTime')}>
                                            Logged Time {getSortIcon('loggedTime')}
                                        </button>
                                    </TableHead>
                                    <TableHead className="text-right">
                                        <button type="button" className="flex items-center gap-1 font-semibold ml-auto" onClick={() => handleSort('jobFee')}>
                                            Job Fee {getSortIcon('jobFee')}
                                        </button>
                                    </TableHead>
                                    <TableHead className="text-center">
                                        <button type="button" className="flex items-center gap-1 font-semibold mx-auto" onClick={() => handleSort('wipBalance')}>
                                            WIP Balance {getSortIcon('wipBalance')}
                                        </button>
                                    </TableHead>
                                    <TableHead className="text-center">
                                        <button type="button" className="flex items-center gap-1 font-semibold mx-auto" onClick={() => handleSort('wipPercent')}>
                                            WIP % {getSortIcon('wipPercent')}
                                        </button>
                                    </TableHead>
                                    <TableHead className="text-center">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoadingData && (
                                    <TableRow>
                                        <TableCell colSpan={10} className="text-center py-10">
                                            Loading jobs...
                                        </TableCell>
                                    </TableRow>
                                )}
                                {isError && (
                                    <TableRow>
                                        <TableCell colSpan={10} className="text-center py-10 text-red-500">
                                            Failed to load jobs.
                                        </TableCell>
                                    </TableRow>
                                )}
                                {!isLoadingData && jobs.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={10} className="text-center py-10">
                                            No jobs found.
                                        </TableCell>
                                    </TableRow>
                                )}
                                {sortedJobs.map((job: any) => (
                                    <TableRow key={job._id}>
                                        <TableCell className='px-4'>
                                            <JobNameLink
                                                jobId={job._id}
                                                jobName={job.name}
                                                jobFee={job.jobCost}
                                                wipAmount={job.actualCost || 0}
                                                hoursLogged={0}
                                            />
                                        </TableCell>
                                        <TableCell className='px-4'>
                                            <ClientNameLink clientName={job.clientId.name} ciientId={job.clientId._id} />
                                        </TableCell>
                                        <TableCell className='px-4'>{job?.jobTypeId?.name}</TableCell>
                                        <TableCell className='px-4'>
                                            <Badge variant="outline" className={statusColors[job.status]}>
                                                {formatTitle(job.status)}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className='px-4'>{job.jobManagerId.name}</TableCell>
                                        <TableCell className='px-4'>
                                            <div className="flex -space-x-2">
                                                {job.teamMembers.map(tm => (
                                                    <Avatar
                                                        key={tm._id}
                                                        className="w-7 h-7 sm:w-8 sm:h-8 border-2 border-background rounded-full flex-shrink-0"
                                                    >
                                                        <AvatarImage
                                                            src={tm.avatarUrl ? `${import.meta.env.VITE_BACKEND_BASE_URL}${tm.avatarUrl}` : undefined}
                                                            className="rounded-full object-cover"
                                                            alt={tm.name}
                                                        />
                                                        <AvatarFallback className="text-[10px] sm:text-xs">
                                                            {getUserInitials(tm.name)}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                ))}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-center px-4 text-sm">
                                            {job.hoursLogged && job.hoursLogged > 0
                                                ? formatHoursToHHMMSS(job.hoursLogged)
                                                : '—'}
                                        </TableCell>
                                        <TableCell className="text-right px-4">
                                            {formatCurrency(job.jobCost)}
                                        </TableCell>
                                        <TableCell className="text-center px-4">
                                            {formatCurrency(job.wipBalance || 0)}
                                        </TableCell>
                                        <TableCell className="text-center px-4">
                                            {job.jobCost > 0 ? `${Math.min(((job.wipBalance || 0) / job.jobCost) * 100, 9999).toFixed(1)}%` : '0.0%'}
                                        </TableCell>
                                        <TableCell className="text-center px-4">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="text-muted-foreground hover:text-foreground"
                                                onClick={(e) => handleSettingsClick(e, job._id)}
                                            >
                                                <Settings className="w-4 h-4" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>

            {settingsMenu && (
                <>
                    <div className="fixed inset-0 z-40" onClick={closeSettingsMenu} />
                    <div
                        className="fixed z-50 bg-white border border-gray-200 rounded-md shadow-lg py-1 min-w-[160px]"
                        style={{ top: settingsMenu.y, left: settingsMenu.x }}
                    >
                        {/* <button
                            onClick={() => handleMenuAction('view', settingsMenu.jobId)}
                            className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2"
                        >
                            View Job
                        </button> */}
                        <button
                            onClick={() => handleMenuAction('edit', settingsMenu.jobId)}
                            className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2"
                        >
                            Edit Job
                        </button>
                        <button
                            onClick={() => handleMenuAction('delete', settingsMenu.jobId)}
                            className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 text-red-600 flex items-center gap-2"
                        >
                            Delete Job
                        </button>
                    </div>
                </>
            )}


            {/* Pagination */}
            {pagination && (
                <div className="space-y-4 mt-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-600">Show:</span>
                            <select
                                value={limit}
                                onChange={(e) => setLimit(Number(e.target.value))}
                                className="border border-gray-300 rounded px-2 py-1 text-sm"
                                disabled={isLoadingData}
                            >
                                <option value={5}>5 per page</option>
                                <option value={10}>10 per page</option>
                                <option value={20}>20 per page</option>
                                <option value={50}>50 per page</option>
                                <option value={100}>100 per page</option>
                                <option value={250}>250 per page</option>
                                <option value={500}>500 per page</option>
                                <option value={1000}>1000 per page</option>
                            </select>
                        </div>

                        <div className="text-sm text-gray-500">
                            Showing {((page - 1) * limit) + 1} to {Math.min(page * limit, pagination.totalJobs)} of {pagination.totalJobs} jobs
                        </div>
                    </div>

                    {pagination.totalPages > 1 && (
                        <div className="flex justify-center items-center gap-2">
                            <Button
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={page === 1 || isLoadingData}
                                variant="outline"
                                size="sm"
                            >
                                <ChevronLeft className="h-4 w-4" />
                                Previous
                            </Button>

                            <div className="flex items-center gap-1">
                                {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                                    let pageNum;
                                    if (pagination.totalPages <= 5) {
                                        pageNum = i + 1;
                                    } else if (page <= 3) {
                                        pageNum = i + 1;
                                    } else if (page >= pagination.totalPages - 2) {
                                        pageNum = pagination.totalPages - 4 + i;
                                    } else {
                                        pageNum = page - 2 + i;
                                    }

                                    return (
                                        <Button
                                            key={pageNum}
                                            onClick={() => setPage(pageNum)}
                                            disabled={isLoadingData}
                                            variant={page === pageNum ? "default" : "outline"}
                                            size="sm"
                                            className="w-8 h-8 p-0"
                                        >
                                            {pageNum}
                                        </Button>
                                    );
                                })}
                            </div>

                            <Button
                                onClick={() => setPage(p => p + 1)}
                                disabled={page >= pagination.totalPages || isLoadingData}
                                variant="outline"
                                size="sm"
                            >
                                Next
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </div>
                    )}
                </div>
            )}


            {/* Dialogs */}
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="max-w-2xl !rounded-none p-0 border-none for-close">
                    <button
                        onClick={() => setDialogOpen(false)}
                        className="bg-[#381980] text-white absolute right-[-35px] top-0 p-[6px] rounded-full max-sm:hidden"
                    >
                        <X size={16} />
                    </button>
                    <DialogHeader className="bg-[#381980] sticky z-50 top-0 left-0 w-full text-center ">
                        <DialogTitle className="text-center text-white py-4">{editingJob ? 'Edit Job' : '+ New Job'}</DialogTitle>
                    </DialogHeader>
                    <JobForm
                        job={editingJob}
                        onSubmit={handleFormSubmit}
                        onCancel={() => setDialogOpen(false)}
                    />
                </DialogContent>
            </Dialog>


            <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Job Details</DialogTitle>
                    </DialogHeader>
                    {viewingJob && (
                        <div className="space-y-4 form-change">
                            <div className="grid grid-cols-2 gap-4 form-change" >
                                <div>
                                    <Label>Job Name</Label>
                                    <p className="text-sm text-muted-foreground">{viewingJob?.name}</p>
                                </div>
                                <div>
                                    <Label>Client</Label>
                                    <p className="text-sm text-muted-foreground">{viewingJob?.clientId.name}</p>
                                </div>
                                <div>
                                    <Label>Type</Label>
                                    <p className="text-sm text-muted-foreground">{viewingJob?.jobTypeId.name}</p>
                                </div>
                                <div>
                                    <Label>Status</Label>
                                    <Badge variant="outline" className={`text-xs ${statusColors[viewingJob?.status]}`}>
                                        {viewingJob.status}
                                    </Badge>
                                </div>
                                <div>
                                    <Label>Priority</Label>
                                    <Badge variant="outline" className={`text-xs ${priorityColors[viewingJob.priority]}`}>
                                        {viewingJob.priority}
                                    </Badge>
                                </div>
                                <div>
                                    <Label>Assigned To</Label>
                                    <p className="text-sm text-muted-foreground">{viewingJob.jobManagerId.name}</p>
                                </div>
                                <div>
                                    <Label>Start Date</Label>
                                    <p className="text-sm text-muted-foreground">{new Date(viewingJob.startDate).toLocaleDateString()}</p>
                                </div>
                                <div>
                                    <Label>End Date</Label>
                                    <p className="text-sm text-muted-foreground">{new Date(viewingJob.endDate).toLocaleDateString()}</p>
                                </div>
                                <div>
                                    <Label>Job Fee</Label>
                                    <p className="text-sm text-muted-foreground">{formatCurrency(viewingJob?.jobCost)}</p>
                                </div>
                                <div>
                                    <Label>Actual Cost</Label>
                                    <p className="text-sm text-muted-foreground">
                                        {viewingJob.actualCost > 0 ? formatCurrency(viewingJob?.actualCost) : 'Not yet incurred'}
                                    </p>
                                </div>
                            </div>
                            <div>
                                <Label>Description</Label>
                                <p className="text-sm text-muted-foreground">{viewingJob?.description}</p>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
};


export default JobsTab;
