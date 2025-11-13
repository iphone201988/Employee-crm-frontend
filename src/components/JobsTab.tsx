import React, { useState, useMemo } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Edit2, Trash2, Eye, ChevronLeft, ChevronRight, ChevronDown, ChevronUp, Search } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { formatCurrency } from '@/lib/currency';
import ClientNameLink from '@/components/ClientNameLink';
import JobNameLink from '@/components/JobNameLink';
import { JobForm } from './JobForm';
import { useGetJobsQuery, useUpdateJobMutation, useCreateJobMutation, useDeleteJobMutation } from '@/store/jobApi';
import { useDebounce } from 'use-debounce';
import { toast } from 'sonner';
import { format } from 'path';


// --- Type Definitions ---
type JobStatus = 'queued' | 'inProgress' | 'withClient' | 'forApproval' | 'completed' | 'cancelled';
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
    inProgress: 'bg-green-100 text-green-800',
    withClient: 'bg-orange-100 text-orange-800',
    forApproval: 'bg-yellow-100 text-yellow-800',
    completed: 'bg-gray-100 text-gray-800',
    cancelled: 'bg-red-200 text-red-800'
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


const JobsTab = () => {
    // --- State Management ---
    const [editingJob, setEditingJob] = useState<any | null>(null);
    const [viewingJob, setViewingJob] = useState<Job | null>(null);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [viewDialogOpen, setViewDialogOpen] = useState(false);


    // API Filters
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);
    const [statusFilter, setStatusFilter] = useState('');
    const [priorityFilter, setPriorityFilter] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearchTerm] = useDebounce(searchTerm, 500);
    const [dateFilter, setDateFilter] = useState<'daily' | 'weekly' | 'monthly' | 'yearly'>('yearly');
    const [selectedDate, setSelectedDate] = useState(new Date());


    // UI State
    const [chartView, setChartView] = useState<'distribution' | 'jobTypes' | 'byStatus' | 'byJobManager' | 'wipPercentage'>('distribution');
    const [isReportCollapsed, setIsReportCollapsed] = useState(false);
    // --- API Hooks ---
    const {
        data: apiData,
        isLoading,
        isError,
        isFetching
    } = useGetJobsQuery({
        page,
        limit,
        status: statusFilter,
        priority: priorityFilter,
        search: debouncedSearchTerm,
        view: dateFilter
    });


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
        wipFeeDistribution
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


    const navigateDate = (direction: 'prev' | 'next') => {
        const newDate = new Date(selectedDate);
        switch (dateFilter) {
            case 'daily':
                newDate.setDate(newDate.getDate() + (direction === 'next' ? 1 : -1));
                break;
            case 'weekly':
                newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7));
                break;
            case 'monthly':
                newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1));
                break;
            case 'yearly':
                newDate.setFullYear(newDate.getFullYear() + (direction === 'next' ? 1 : -1));
                break;
        }
        setSelectedDate(newDate);
    };


    const formatDateDisplay = () => {
        const options: Intl.DateTimeFormatOptions = {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        };


        switch (dateFilter) {
            case 'daily':
                return selectedDate.toLocaleDateString('en-GB', options);
            case 'weekly':
                const weekStart = new Date(selectedDate);
                weekStart.setDate(weekStart.getDate() - weekStart.getDay());
                const weekEnd = new Date(weekStart);
                weekEnd.setDate(weekEnd.getDate() + 6);
                return `${weekStart.toLocaleDateString('en-GB', options)} to ${weekEnd.toLocaleDateString('en-GB', options)}`;
            case 'monthly':
                return selectedDate.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
            case 'yearly':
                return selectedDate.getFullYear().toString();
            default:
                return '';
        }
    };


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
        return (<div className="space-y-2 py-2">
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
                <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex gap-1">
                        {(['daily', 'weekly', 'monthly', 'yearly'] as const).map(v => (
                            <Button
                                key={v}
                                variant={dateFilter === v ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => setDateFilter(v)}
                            >
                                {v.charAt(0).toUpperCase() + v.slice(1)}
                            </Button>
                        ))}
                    </div>
                    {/* <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={() => navigateDate('prev')}>
                            <ChevronLeft className="w-4 h-4" />
                        </Button>
                        <span className="text-sm font-medium min-w-[200px] text-center">
                            {formatDateDisplay()}
                        </span>
                        <Button variant="outline" size="sm" onClick={() => navigateDate('next')}>
                            <ChevronRight className="w-4 h-4" />
                        </Button>
                    </div> */}
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
                            <Button
                                variant={chartView === 'wipPercentage' ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => setChartView('wipPercentage')}
                            >
                                WIP % of Fee
                            </Button>
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
            <Tabs value={statusFilter || 'all'} onValueChange={handleStatusTabChange} className="w-full">
                <div className="flex justify-between items-center mb-6">
                    <TabsList>
                        <TabsTrigger value="all">All ({statusBreakdown.all || 0})</TabsTrigger>
                        <TabsTrigger value="queued">Queued ({statusBreakdown.queued || 0})</TabsTrigger>
                        <TabsTrigger value="inProgress">In Progress ({statusBreakdown.inProgress || 0})</TabsTrigger>
                        <TabsTrigger value="withClient">With Client ({statusBreakdown.withClient || 0})</TabsTrigger>
                        <TabsTrigger value="forApproval">For Approval ({statusBreakdown.forApproval || 0})</TabsTrigger>
                        <TabsTrigger value="completed">Completed ({statusBreakdown.completed || 0})</TabsTrigger>
                    </TabsList>


                    <div className="flex gap-4">
                        <Select
                            value={priorityFilter}
                            onValueChange={v => setPriorityFilter(v === 'all' ? '' : v)}
                        >
                            <SelectTrigger className="w-40">
                                <SelectValue placeholder="All Priority" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Priority</SelectItem>
                                <SelectItem value="low">Low</SelectItem>
                                <SelectItem value="medium">Medium</SelectItem>
                                <SelectItem value="high">High</SelectItem>
                                <SelectItem value="urgent">Urgent</SelectItem>
                            </SelectContent>
                        </Select>
                        <Button onClick={openAddDialog}>
                            <Plus className="w-4 h-4 mr-2" />
                            Add Job
                        </Button>
                    </div>
                </div>


                <Card>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow className='!bg-[#edecf4] text-[#381980]'>
                                    <TableHead>Job Name</TableHead>
                                    <TableHead>Client</TableHead>
                                    <TableHead>Job Type</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Job Manager</TableHead>
                                    <TableHead>Team</TableHead>
                                    <TableHead className="text-right">Job Fee</TableHead>
                                    <TableHead className="text-center">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoadingData && (
                                    <TableRow>
                                        <TableCell colSpan={8} className="text-center py-10">
                                            Loading jobs...
                                        </TableCell>
                                    </TableRow>
                                )}
                                {isError && (
                                    <TableRow>
                                        <TableCell colSpan={8} className="text-center py-10 text-red-500">
                                            Failed to load jobs.
                                        </TableCell>
                                    </TableRow>
                                )}
                                {!isLoadingData && jobs.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={8} className="text-center py-10">
                                            No jobs found.
                                        </TableCell>
                                    </TableRow>
                                )}
                                {jobs.map((job: any) => (
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
                                                    <Avatar key={tm._id} className="h-6 w-6 border-2 border-background">
                                                        <AvatarFallback>{getUserInitials(tm.name)}</AvatarFallback>
                                                    </Avatar>
                                                ))}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right px-4">
                                            {formatCurrency(job.jobCost)}
                                        </TableCell>
                                        <TableCell className="text-center px-4">
                                            <div className="flex gap-1 justify-center">
                                                <Button variant="ghost" size="icon" onClick={() => openViewDialog(job)}>
                                                    <Eye className="w-4 h-4" />
                                                </Button>
                                                <Button variant="ghost" size="icon" onClick={() => openEditDialog(job)}>
                                                    <Edit2 className="w-4 h-4" />
                                                </Button>
                                                <Button variant="ghost" size="icon" onClick={() => deleteJobById(job)} className="text-red-500 hover:text-red-700">
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </Tabs>


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
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>{editingJob ? 'Edit Job' : 'Add New Jobas'}</DialogTitle>
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
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
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
                                    <Label>Estimated Cost</Label>
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
