import React, { useMemo, useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { DashboardCard, DashboardGrid } from "@/components/ui/dashboard-card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Search, ArrowUpDown, ChevronDown, Check, RefreshCw, Download, Move, GripVertical } from 'lucide-react';
import { formatCurrency } from '@/lib/currency';
import { formatTime, TimeFormat } from '@/utils/timeFormat';
import ClientNameLink from './ClientNameLink';
import { useGetWriteOffDashboardQuery, useGetWriteOffQuery } from '@/store/wipApi';
import { useGetDropdownOptionsQuery } from '@/store/teamApi';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

interface WriteOffMergedData {
  id?: string;
  name: string;
  ref?: string;
  clientName?: string;
  clientRef?: string;
  clientId?: string;
  department?: string;
  jobType?: string;
  writeOffOccasions: number;
  totalWriteOffValue: number;
  noJobsWithWriteOff: number;
  totalFees: number;
  writeOffValue: number;
  percentageWriteOff: number;
  jobsWithWriteOff?: string[]; // Array of job names for the popup
}

interface WriteOffDetail {
  amount: number;
  date: string;
  by: string;
  logic: string;
  reason: string;
  clientName?: string;
  clientId?: string;
  jobName?: string;
}

const WriteOffMergedTab = () => {
  console.log("WriteOffMergedTab");
  const [activeFilter, setActiveFilter] = useState<'clients' | 'jobs' | 'job-type' | 'team'>('clients');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState<{ key: string | null; direction: 'asc' | 'desc' } | null>(null);
  const [selectedOccasions, setSelectedOccasions] = useState<{ name: string; occasions: number; details: WriteOffDetail[] } | null>(null);
  const [selectedJobs, setSelectedJobs] = useState<{ name: string; jobs: string[] } | null>(null);
  const [showLogView, setShowLogView] = useState(false);
  const [timeFormat] = useState<TimeFormat>('0:00');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [logPage, setLogPage] = useState(1);
  const [logLimit, setLogLimit] = useState(10);
  
  // Filter states for Write Off Log
  const [logSearchQuery, setLogSearchQuery] = useState('');
  const [selectedLogClientIds, setSelectedLogClientIds] = useState<Set<string>>(new Set());
  const [selectedLogJobNameIds, setSelectedLogJobNameIds] = useState<Set<string>>(new Set());
  const [selectedLogLogic, setSelectedLogLogic] = useState<string>('all');
  
  // Column visibility state for Write Off Log
  const [logVisibleColumns, setLogVisibleColumns] = useState({
    date: true,
    clientName: true,
    jobName: true,
    amount: true,
    by: true,
    reason: true,
    logic: true
  });

  // Column order state for Write Off Log
  const [logColumnOrder, setLogColumnOrder] = useState([
    'date',
    'clientName',
    'jobName',
    'amount',
    'by',
    'reason',
    'logic'
  ]);

  // Drag and drop state for Write Off Log
  const [logDraggedItem, setLogDraggedItem] = useState<string | null>(null);

  // Column display names mapping for Write Off Log
  const logColumnDisplayNames: Record<string, string> = {
    date: 'Date',
    clientName: 'Client Name',
    jobName: 'Job Name',
    amount: 'Write-off Value',
    by: 'Write-off By',
    reason: 'Write-off Reason',
    logic: 'Write-off Logic'
  };
  
  // Fetch dropdown options for filters
  const { data: logClientOptionsResp } = useGetDropdownOptionsQuery('client');
  const { data: logJobListOptionsResp } = useGetDropdownOptionsQuery('jobList');
  
  const logClientOptions = (logClientOptionsResp?.data?.clients || []).map((c: any) => ({ value: c._id, label: c.name }));
  const logJobNameOptions = (logJobListOptionsResp?.data?.jobs || []).map((j: any) => ({ value: j._id, label: j.name }));

  // API integration: map active filter to backend type
  const apiType: 'client' | 'job' | 'jobtype' | 'team' = useMemo(() => {
    if (activeFilter === 'clients') return 'client';
    if (activeFilter === 'jobs') return 'job';
    if (activeFilter === 'job-type') return 'jobtype';
    return 'team';
  }, [activeFilter]);

  const { data: dashboardResp, isLoading } = useGetWriteOffDashboardQuery({ type: apiType, page, limit });

  // Preserve raw data for dialogs
  const rawItems: any[] = dashboardResp?.data || [];

  // Map API data to table rows per type
  const generateData = (): WriteOffMergedData[] => {
    if (!rawItems || rawItems.length === 0) return [];
    return rawItems.map((item: any) => {
      if (apiType === 'client') {
        return {
          id: item._id,
          name: item.name || 'N/A',
          ref: item.clientRef || 'N/A',
          clientId: item._id || undefined,
          writeOffOccasions: Array.isArray(item.occasionDetails) ? item.occasionDetails.length : 0,
          totalWriteOffValue: Number(item.totalWriteOffValue || 0),
          noJobsWithWriteOff: Number(item.jobsWithWriteOffCount || (Array.isArray(item.jobsWithWriteOff) ? item.jobsWithWriteOff.length : 0)),
          totalFees: Number(item.totalFees || 0),
          writeOffValue: Number(item.totalWriteOffValue || 0),
          percentageWriteOff: Number(item.writeOffPercentage || 0),
          jobsWithWriteOff: (item.uniqueJobs || []).map((j: any) => j.name)
        } as WriteOffMergedData;
      }
      if (apiType === 'team') {
        return {
          id: item._id,
          name: item.name || 'N/A',
          writeOffOccasions: Array.isArray(item.occasionDetails) ? item.occasionDetails.length : 0,
          totalWriteOffValue: Number(item.totalWriteOffValue || 0),
          noJobsWithWriteOff: Number(item.jobsCount || 0),
          totalFees: Number(item.totalFees || 0),
          writeOffValue: Number(item.totalWriteOffValue || 0),
          percentageWriteOff: Number(item.writeOffPercentage || 0),
          jobsWithWriteOff: (item.uniqueJobs || []).map((j: any) => j.name)
        } as WriteOffMergedData;
      }
      if (apiType === 'jobtype') {
        return {
          id: item._id,
          name: item.categoryName || 'N/A',
          writeOffOccasions: Array.isArray(item.occasionDetails) ? item.occasionDetails.length : 0,
          totalWriteOffValue: Number(item.totalWriteOffValue || 0),
          noJobsWithWriteOff: Number(item.jobsCount || 0),
          totalFees: Number(item.totalFees || 0),
          writeOffValue: Number(item.totalWriteOffValue || 0),
          percentageWriteOff: Number(item.writeOffPercentage || 0),
          jobsWithWriteOff: (item.uniqueJobs || []).map((j: any) => j.name)
        } as WriteOffMergedData;
      }
      // job
      return {
        id: item._id,
        name: item.name || 'N/A',
        clientName: item.clientDetails?.name || 'N/A',
        clientRef: item.clientDetails?.clientRef || 'N/A',
        clientId: item.clientDetails?._id || undefined,
        writeOffOccasions: Array.isArray(item.occasionDetails) ? item.occasionDetails.length : 0,
        totalWriteOffValue: Number(item.totalWriteOffValue || 0),
        noJobsWithWriteOff: 1,
        totalFees: Number(item.totalFees || 0),
        writeOffValue: Number(item.totalWriteOffValue || 0),
        percentageWriteOff: Number(item.writeOffPercentage || 0),
        jobsWithWriteOff: (item.uniqueJobs || []).map((j: any) => j.name)
      } as WriteOffMergedData;
    });
  };

  const handleSort = (key: string) => {
    setSortConfig(current => {
      if (current?.key === key) {
        return current.direction === 'desc'
          ? { key, direction: 'asc' }
          : null;
      }
      return { key, direction: 'desc' };
    });
  };

  const getSortIcon = (key: string) => {
    if (sortConfig?.key !== key) {
      return <ArrowUpDown className="ml-1 !h-3 !w-3 opacity-50" />;
    }
    return <ArrowUpDown className={`ml-1 !h-3 !w-3 ${sortConfig.direction === 'desc' ? 'rotate-180' : ''}`} />;
  };

  const getFilteredAndSortedData = () => {
    let data = generateData();

    // Apply search filter
    if (searchTerm) {
      data = data.filter(item =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.ref && item.ref.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (item.clientName && item.clientName.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (item.department && item.department.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Apply sorting
    if (sortConfig?.key) {
      data = [...data].sort((a, b) => {
        const aValue = a[sortConfig.key as keyof WriteOffMergedData];
        const bValue = b[sortConfig.key as keyof WriteOffMergedData];

        if (typeof aValue === 'string' && typeof bValue === 'string') {
          return sortConfig.direction === 'asc'
            ? aValue.localeCompare(bValue)
            : bValue.localeCompare(aValue);
        }

        if (typeof aValue === 'number' && typeof bValue === 'number') {
          return sortConfig.direction === 'asc'
            ? aValue - bValue
            : bValue - aValue;
        }

        return 0;
      });
    }

    return data;
  };

  const filteredData = getFilteredAndSortedData();

  // Calculate summary statistics
  const totalWriteOffs = filteredData.reduce((sum, item) => sum + item.totalWriteOffValue, 0);
  const totalOccasions = filteredData.reduce((sum, item) => sum + item.writeOffOccasions, 0);
  const totalJobs = filteredData.reduce((sum, item) => sum + item.noJobsWithWriteOff, 0);
  const avgPercentage = filteredData.reduce((sum, item) => sum + item.percentageWriteOff, 0) / (filteredData.length || 1);

  const handleOccasionsClick = (item: WriteOffMergedData) => {
    // Find matching raw item to get real occasionDetails
    const match = rawItems.find((ri: any) => {
      if (apiType === 'client') return ri.name === item.name;
      if (apiType === 'team') return ri.name === item.name;
      if (apiType === 'jobtype') return ri.categoryName === item.name;
      return ri.name === item.name;
    });
    const details: WriteOffDetail[] = Array.isArray(match?.occasionDetails)
      ? match.occasionDetails.map((d: any) => ({
          amount: Number(d.amount || 0),
          date: d.date ? new Date(d.date).toLocaleDateString('en-GB') : '-',
          by: d.by || 'N/A',
          logic: d.logic === 'proportionally' ? 'Proportionally' : d.logic === 'manually' ? 'Manually' : d.logic || 'N/A',
          reason: d.reason || 'N/A',
          clientName: typeof d.clientDetails === 'object' && d.clientDetails !== null && d.clientDetails !== 'N/A' ? d.clientDetails.name : 'N/A',
          clientId: typeof d.clientDetails === 'object' && d.clientDetails !== null && d.clientDetails !== 'N/A' ? d.clientDetails._id : undefined,
          jobName: typeof d.jobDetails === 'object' && d.jobDetails !== null && d.jobDetails !== 'N/A' ? d.jobDetails.name : 'N/A'
        }))
      : [];
    setSelectedOccasions({ name: item.name, occasions: details.length, details });
  };

  const handleJobsClick = (item: WriteOffMergedData) => {
    setSelectedJobs({ name: item.name, jobs: item.jobsWithWriteOff || [] });
  };

  // Reset to first page when filters change
  useEffect(() => {
    if (showLogView) {
      setLogPage(1);
    }
  }, [logSearchQuery, selectedLogClientIds, selectedLogJobNameIds, selectedLogLogic, showLogView]);

  // Fetch write-off log data with filters
  const { data: writeOffLogResp, isLoading: isLoadingLog } = useGetWriteOffQuery(
    showLogView ? { 
      page: logPage, 
      limit: logLimit,
      search: logSearchQuery || undefined,
      clientId: selectedLogClientIds.size > 0 ? Array.from(selectedLogClientIds).join(',') : undefined,
      jobId: selectedLogJobNameIds.size > 0 ? Array.from(selectedLogJobNameIds).join(',') : undefined,
      logic: selectedLogLogic !== 'all' ? selectedLogLogic : undefined
    } : undefined,
    { skip: !showLogView }
  );

  const logData = useMemo(() => {
    if (!writeOffLogResp?.data || !Array.isArray(writeOffLogResp.data)) return [];
    return writeOffLogResp.data.map((item: any) => {
      const clientDetails = typeof item.clientDetails === 'object' && item.clientDetails !== null 
        ? item.clientDetails 
        : null;
      const jobs = Array.isArray(item.jobs) && item.jobs.length > 0 && typeof item.jobs[0] === 'object'
        ? item.jobs
        : [];
      const firstJob = jobs.length > 0 ? jobs[0] : null;
      
      return {
        id: item._id,
        date: item.createdAt ? new Date(item.createdAt).toISOString() : null,
        client: clientDetails?.name || 'N/A',
        clientId: clientDetails?._id || undefined,
        job: firstJob?.name || (Array.isArray(item.jobs) && item.jobs[0] === 'N/A' ? 'N/A' : 'N/A'),
        amount: Number(item.amount || 0),
        by: item.by || 'N/A',
        reason: item.reason || 'N/A',
        logic: item.logic === 'proportionally' ? 'Proportionally' : item.logic === 'manually' ? 'Manually' : item.logic || 'N/A'
      };
    });
  }, [writeOffLogResp]);

  const logTotalWriteOffs = writeOffLogResp?.totalWriteOffs || logData.reduce((sum, entry) => sum + entry.amount, 0);

  // Toggle column visibility for Write Off Log
  const toggleLogColumn = (column: keyof typeof logVisibleColumns) => {
    setLogVisibleColumns(prev => ({ ...prev, [column]: !prev[column] }));
  };

  // Drag and drop handlers for Write Off Log
  const handleLogDragStart = (e: React.DragEvent, item: string) => {
    setLogDraggedItem(item);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleLogDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleLogDrop = (e: React.DragEvent, targetItem: string) => {
    e.preventDefault();
    if (!logDraggedItem || logDraggedItem === targetItem) return;

    const newOrder = [...logColumnOrder];
    const draggedIndex = newOrder.indexOf(logDraggedItem);
    const targetIndex = newOrder.indexOf(targetItem);

    // Remove dragged item and insert at target position
    newOrder.splice(draggedIndex, 1);
    newOrder.splice(targetIndex, 0, logDraggedItem);

    setLogColumnOrder(newOrder);
    setLogDraggedItem(null);
  };

  const handleLogDragEnd = () => {
    setLogDraggedItem(null);
  };

  // Export to CSV for Write Off Log
  const exportLogToCSV = () => {
    const headers: string[] = [];
    const dataMappers: ((entry: any) => string)[] = [];

    // Add columns in the order specified by logColumnOrder
    logColumnOrder.forEach((key) => {
      if (!logVisibleColumns[key as keyof typeof logVisibleColumns]) return;

      headers.push(logColumnDisplayNames[key]);

      switch (key) {
        case 'date':
          dataMappers.push((entry) => entry.date ? new Date(entry.date).toLocaleDateString('en-GB') : 'N/A');
          break;
        case 'clientName':
          dataMappers.push((entry) => entry.client || 'N/A');
          break;
        case 'jobName':
          dataMappers.push((entry) => entry.job || 'N/A');
          break;
        case 'amount':
          dataMappers.push((entry) => formatCurrency(entry.amount));
          break;
        case 'by':
          dataMappers.push((entry) => entry.by || 'N/A');
          break;
        case 'reason':
          dataMappers.push((entry) => `"${(entry.reason || '').replace(/"/g, '""')}"`);
          break;
        case 'logic':
          dataMappers.push((entry) => entry.logic || 'N/A');
          break;
      }
    });

    // Use current page logs only
    const pageStart = (logPage - 1) * logLimit;
    const currentPageLogs = logData.slice(pageStart, pageStart + logLimit);
    const csvContent = `${headers.join(',')}\n${currentPageLogs.map(entry =>
      dataMappers.map(mapper => mapper(entry)).join(',')
    ).join('\n')}`;

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'write-off-log.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (showLogView) {
    return (
      <div className="space-y-6">
        {/* Header with back button */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              onClick={() => setShowLogView(false)}
              className="flex items-center gap-2"
            >
              ← Back
            </Button>
            <h2 className="text-xl font-semibold">Write Off Log</h2>
          </div>
        </div>

        {/* Filters - Same design as AllTimeLogsTab */}
        <div className="p-[6px] rounded-sm bg-[#E7E5F2] flex justify-between items-center">
          <div className="flex flex-wrap items-end gap-2">
            <div className="relative flex-1 w-full max-w-[200px]">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input 
                placeholder="Search..." 
                className="pl-10 w-[200px] bg-white text-[#381980] font-semibold placeholder:text-[#381980]" 
                value={logSearchQuery}
                onChange={(e) => setLogSearchQuery(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Popover>
                <PopoverTrigger asChild>
                  <button className="w-32 h-10 bg-white text-[#381980] font-semibold rounded-md border px-3 flex items-center justify-between">
                    <span className="truncate text-[14px]">Client Name</span>
                    <ChevronDown className="w-4 h-4" />
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-56 p-2" align="start">
                  <div className="max-h-64 overflow-auto">
                    <div
                      className={`px-2 py-1.5 rounded-[4px] cursor-pointer ${selectedLogClientIds.size === 0 ? 'bg-[#5f46b9] text-white' : 'hover:bg-[#5f46b9] hover:text-white'}`}
                      onClick={() => setSelectedLogClientIds(new Set())}
                    >
                      All
                    </div>
                    {logClientOptions.map((o: any) => {
                      const active = selectedLogClientIds.has(o.value);
                      return (
                        <div
                          key={o.value}
                          className={`flex items-center justify-between px-2 py-1.5 rounded-[4px] cursor-pointer ${active ? 'bg-[#5f46b9] text-white' : 'hover:bg-[#5f46b9] hover:text-white'}`}
                          onClick={() => {
                            setSelectedLogClientIds(prev => {
                              const next = new Set(prev);
                              if (next.has(o.value)) next.delete(o.value); else next.add(o.value);
                              return next;
                            });
                          }}
                        >
                          <span className="truncate">{o.label}</span>
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
                  <button className="w-28 h-10 bg-white text-[#381980] font-semibold rounded-md border px-3 flex items-center justify-between">
                    <span className="truncate text-[14px]">Job Name</span>
                    <ChevronDown className="w-4 h-4" />
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-56 p-2" align="start">
                  <div className="max-h-64 overflow-auto">
                    <div
                      className={`px-2 py-1.5 rounded-[4px] cursor-pointer ${selectedLogJobNameIds.size === 0 ? 'bg-[#5f46b9] text-white' : 'hover:bg-[#5f46b9] hover:text-white'}`}
                      onClick={() => setSelectedLogJobNameIds(new Set())}
                    >
                      All
                    </div>
                    {logJobNameOptions.map((o: any) => {
                      const active = selectedLogJobNameIds.has(o.value);
                      return (
                        <div
                          key={o.value}
                          className={`flex items-center justify-between px-2 py-1.5 rounded-[4px] cursor-pointer ${active ? 'bg-[#5f46b9] text-white' : 'hover:bg-[#5f46b9] hover:text-white'}`}
                          onClick={() => {
                            setSelectedLogJobNameIds(prev => {
                              const next = new Set(prev);
                              if (next.has(o.value)) next.delete(o.value); else next.add(o.value);
                              return next;
                            });
                          }}
                        >
                          <span className="truncate">{o.label}</span>
                          {active && <Check className="w-4 h-4" />}
                        </div>
                      );
                    })}
                  </div>
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-2">
              <Select
                value={selectedLogLogic}
                onValueChange={(value) => setSelectedLogLogic(value)}
              >
                <SelectTrigger className="w-32 h-10 bg-white text-[#381980] font-semibold">
                  <SelectValue placeholder="Logic" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Logic</SelectItem>
                  <SelectItem value="proportionally">Proportionally</SelectItem>
                  <SelectItem value="manually">Manually</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Button
                variant="outline"
                className="bg-[#381980] w-[42px] rounded-sm text-primary-foreground p-2 hover:bg-primary/90 !text-[#fff]"
                onClick={() => {
                  setLogSearchQuery('');
                  setSelectedLogClientIds(new Set());
                  setSelectedLogJobNameIds(new Set());
                  setSelectedLogLogic('all');
                  setLogPage(1);
                }}
              >
                <RefreshCw className="w-3 h-3 sm:w-4 sm:h-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Log Table */}
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className='bg-[#E7E5F2]'>
                  <TableRow className="border-b border-border bg-muted/50 text-[#381980]">
                    {logColumnOrder.map((key) => {
                      if (!logVisibleColumns[key as keyof typeof logVisibleColumns]) return null;
                      return (
                        <TableHead key={key} className="p-3 text-foreground h-12 text-[#381980] whitespace-nowrap">
                          {logColumnDisplayNames[key]}
                        </TableHead>
                      );
                    })}
                    {/* Column visibility toggle */}
                    <TableHead className="p-3 text-foreground h-12 text-center">
                      <div className="flex gap-[6px] justify-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 bg-white rounded-full"
                          onClick={exportLogToCSV}
                          aria-label="Export CSV"
                          title="Export CSV (current page, visible columns)"
                        >
                          <Download className="h-3 w-3" color='#381980' />
                        </Button>
                        <Popover>
                          <PopoverTrigger>
                            <Button variant="ghost" size="sm" className="h-6 w-6 p-0 bg-white rounded-full" aria-label="Show/Hide Columns" title="Show/Hide Columns">
                              <Move className="h-3 w-3" color='#381980' />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent
                            className="w-64 max-h-96 overflow-y-auto z-50"
                            align="start"
                            side="bottom"
                            sideOffset={5}
                            avoidCollisions={true}
                            collisionPadding={10}
                          >
                            <div className="space-y-3">
                              <h4 className="font-medium text-sm">Show/Hide Columns</h4>
                              <div className="space-y-2">
                                {logColumnOrder.map((key) => (
                                  <div
                                    key={key}
                                    className={`flex items-center space-x-2 p-2 rounded-md cursor-move hover:bg-gray-50 transition-colors ${logDraggedItem === key ? 'opacity-50' : ''
                                      }`}
                                    draggable
                                    onDragStart={(e) => handleLogDragStart(e, key)}
                                    onDragOver={handleLogDragOver}
                                    onDrop={(e) => handleLogDrop(e, key)}
                                    onDragEnd={handleLogDragEnd}
                                  >
                                    <GripVertical className="h-4 w-4 text-gray-400 cursor-move" />
                                    <Checkbox
                                      id={key}
                                      checked={(logVisibleColumns as any)[key]}
                                      onCheckedChange={() => toggleLogColumn(key as keyof typeof logVisibleColumns)}
                                    />
                                    <Label htmlFor={key} className="text-sm cursor-pointer flex-1">
                                      {logColumnDisplayNames[key]}
                                    </Label>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </PopoverContent>
                        </Popover>
                      </div>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoadingLog ? (
                    <TableRow>
                      <TableCell colSpan={logColumnOrder.filter(key => logVisibleColumns[key as keyof typeof logVisibleColumns]).length + 1} className="p-4 text-sm text-center">
                        Loading write-off log...
                      </TableCell>
                    </TableRow>
                  ) : logData.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={logColumnOrder.filter(key => logVisibleColumns[key as keyof typeof logVisibleColumns]).length + 1} className="p-4 text-sm text-center">
                        No write-off records found
                      </TableCell>
                    </TableRow>
                  ) : (
                    logData.map((entry) => (
                      <TableRow key={entry.id} className="border-b border-border transition-colors h-12">
                        {logColumnOrder.map((key) => {
                          if (!logVisibleColumns[key as keyof typeof logVisibleColumns]) return null;
                          
                          let cellContent;
                          switch (key) {
                            case 'date':
                              cellContent = entry.date ? new Date(entry.date).toLocaleDateString('en-GB') : 'N/A';
                              break;
                            case 'clientName':
                              cellContent = (
                                <ClientNameLink name={entry.client} ciientId={entry.clientId} />
                              );
                              break;
                            case 'jobName':
                              cellContent = entry.job;
                              break;
                            case 'amount':
                              cellContent = <span className="font-medium text-red-600">{formatCurrency(entry.amount)}</span>;
                              break;
                            case 'by':
                              cellContent = entry.by;
                              break;
                            case 'reason':
                              cellContent = entry.reason;
                              break;
                            case 'logic':
                              cellContent = entry.logic;
                              break;
                            default:
                              cellContent = '-';
                          }

                          return (
                            <TableCell key={key} className={`p-4 ${key === 'clientName' ? 'font-medium' : ''}`}>
                              {cellContent}
                            </TableCell>
                          );
                        })}
                        <TableCell className="p-4">
                          {/* Empty cell for actions column */}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
                <tfoot className="bg-muted/50 border-t-2">
                  <tr>
                    {(() => {
                      const visibleColumns = logColumnOrder.filter(key => logVisibleColumns[key as keyof typeof logVisibleColumns]);
                      const amountIndex = visibleColumns.indexOf('amount');
                      const columnsBeforeAmount = amountIndex >= 0 ? amountIndex : visibleColumns.length;
                      const columnsAfterAmount = amountIndex >= 0 ? visibleColumns.length - amountIndex - 1 : 0;
                      
                      return (
                        <>
                          <td className="p-3 text-left font-medium" colSpan={columnsBeforeAmount}>Total Write Offs</td>
                          {logVisibleColumns.amount && (
                            <td className="p-3 text-left font-medium text-red-600">
                              {formatCurrency(logTotalWriteOffs)}
                            </td>
                          )}
                          <td className="p-3" colSpan={columnsAfterAmount + 1}></td>
                        </>
                      );
                    })()}
                  </tr>
                </tfoot>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Pagination Controls for Log View */}
        {writeOffLogResp?.pagination && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Show:</span>
                <select
                  value={logLimit}
                  onChange={(e) => { setLogPage(1); setLogLimit(Number(e.target.value)); }}
                  className="border border-gray-300 rounded px-2 py-1 text-sm"
                  disabled={isLoadingLog}
                >
                  <option value={5}>5 per page</option>
                  <option value={10}>10 per page</option>
                  <option value={20}>20 per page</option>
                  <option value={50}>50 per page</option>
                </select>
              </div>
              <div className="text-sm text-gray-500">
                {(() => {
                  const total = writeOffLogResp?.pagination?.total || 0;
                  const start = total > 0 ? ((logPage - 1) * logLimit) + 1 : 0;
                  const end = Math.min(logPage * logLimit, total);
                  return `Showing ${start} to ${end} of ${total} records`;
                })()}
              </div>
            </div>
            {(() => {
              const totalPages = Math.max(1, Number(writeOffLogResp?.pagination?.totalPages || 1));
              if (totalPages <= 1) return null;
              return (
                <div className="flex justify-center items-center gap-2">
                  <Button onClick={() => setLogPage(p => Math.max(1, p - 1))} disabled={logPage === 1 || isLoadingLog} variant="outline" size="sm">Previous</Button>
                  <span className="text-sm">Page {logPage} of {totalPages}</span>
                  <Button onClick={() => setLogPage(p => Math.min(totalPages, p + 1))} disabled={logPage >= totalPages || isLoadingLog} variant="outline" size="sm">Next</Button>
                </div>
              );
            })()}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Pagination Controls */}
      {dashboardResp?.pagination && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Show:</span>
              <select
                value={limit}
                onChange={(e) => { setPage(1); setLimit(Number(e.target.value)); }}
                className="border border-gray-300 rounded px-2 py-1 text-sm"
              >
                <option value={5}>5 per page</option>
                <option value={10}>10 per page</option>
                <option value={20}>20 per page</option>
                <option value={50}>50 per page</option>
              </select>
            </div>
            <div className="text-sm text-gray-500">
              {(() => {
                const total = dashboardResp.pagination.total || 0;
                const start = total > 0 ? ((page - 1) * limit) + 1 : 0;
                const end = Math.min(page * limit, total);
                return `Showing ${start} to ${end} of ${total} records`;
              })()}
            </div>
          </div>
          {(() => {
            const totalPages = Math.max(1, Number(dashboardResp.pagination.totalPages || 1));
            if (totalPages <= 1) return null;
            return (
              <div className="flex justify-center items-center gap-2">
                <Button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} variant="outline" size="sm">Previous</Button>
                <span className="text-sm">Page {page} of {totalPages}</span>
                <Button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages} variant="outline" size="sm">Next</Button>
              </div>
            );
          })()}
        </div>
      )}
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="h-full">
          <CardContent className="p-4">
            <div className="text-2xl font-bold !text-[#381980]">
              {formatCurrency(totalWriteOffs)}
            </div>
            <p className="text-sm text-muted-foreground">Total Write-offs</p>
          </CardContent>
        </Card>
        <Card className="h-full">
          <CardContent className="p-4">
            <div className="text-2xl font-bold !text-[#381980]">
              {totalOccasions}
            </div>
            <p className="text-sm text-muted-foreground">Total Occasions</p>
          </CardContent>
        </Card>
        <Card className="h-full">
          <CardContent className="p-4">
            <div className="text-2xl font-bold !text-[#381980]">
              {totalJobs}
            </div>
            <p className="text-sm text-muted-foreground">Jobs with Write-offs</p>
          </CardContent>
        </Card>
        <Card className="h-full">
          <CardContent className="p-4">
            <div className="text-2xl font-bold !text-[#381980]">
              {`${avgPercentage.toFixed(1)}%`}
            </div>
            <p className="text-sm text-muted-foreground">Avg % Write-off</p>
          </CardContent>
        </Card>
      </div>


      {/* Filter Tabs */}
      <div className="flex items-center justify-between p-[6px] rounded-sm bg-[#E7E5F2]">
        <div className="flex items-center gap-2">
          {/* Search Bar */}
          <div className="relative flex-1 w-full max-w-[200px]">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Search..." 
              className="pl-10 w-[200px] bg-white text-[#381980] font-semibold placeholder:text-[#381980]" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button
            size="sm"
            variant={activeFilter === 'clients' ? 'default' : 'outline'}
            onClick={() => setActiveFilter('clients')}
            className="px-3 py-1 h-8 text-sm rounded-sm"
          >
            Clients
          </Button>
          <Button
            size="sm"
            variant={activeFilter === 'jobs' ? 'default' : 'outline'}
            onClick={() => setActiveFilter('jobs')}
            className="px-3 py-1 h-8 text-sm rounded-sm"
          >
            Jobs
          </Button>
          <Button
            size="sm"
            variant={activeFilter === 'job-type' ? 'default' : 'outline'}
            onClick={() => setActiveFilter('job-type')}
            className="px-3 py-1 h-8 text-sm rounded-sm"
          >
            Job Type
          </Button>
          <Button
            size="sm"
            variant={activeFilter === 'team' ? 'default' : 'outline'}
            onClick={() => setActiveFilter('team')}
            className="px-3 py-1 h-8 text-sm rounded-sm"
          >
            Team
          </Button>
        </div>

        {/* Log Button */}
        <Button
          onClick={() => setShowLogView(true)}
          variant="outline"
          className="flex items-center gap-2 px-3 py-1 h-8 text-sm rounded-sm"
        >
          Write Off Log
        </Button>
      </div>

      {/* Data Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className='!bg-[#edecf4] !text-[#381980]'>
                <TableRow>
                  {activeFilter === 'clients' && (
                    <TableHead className="text-left px-3">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleSort('ref')}
                        className="h-8 px-1 font-medium justify-start text-[12px] hover:bg-transparent hover:text-inherit"
                      >
                        Client Ref.
                        {getSortIcon('ref')}
                      </Button>
                    </TableHead>
                  )}
                  <TableHead className="text-left px-3">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSort('name')}
                      className="h-8 px-1 font-medium justify-start text-[12px] hover:bg-transparent hover:text-inherit"
                    >
                      {activeFilter === 'clients' ? 'Client Name' :
                        activeFilter === 'jobs' ? 'Job Name' :
                          activeFilter === 'job-type' ? 'Service Type' : 'Team Member'}
                      {getSortIcon('name')}
                    </Button>
                  </TableHead>
                  {activeFilter === 'jobs' && (
                    <>
                      <TableHead className="text-left px-3">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleSort('clientRef')}
                          className="h-8 px-1 font-medium justify-start text-[12px] hover:bg-transparent hover:text-inherit"
                        >
                          Client Ref.
                          {getSortIcon('clientRef')}
                        </Button>
                      </TableHead>
                      <TableHead className="text-left px-3">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleSort('clientName')}
                          className="h-8 px-1 font-medium justify-start text-[12px] hover:bg-transparent hover:text-inherit"
                        >
                          Client Name
                          {getSortIcon('clientName')}
                        </Button>
                      </TableHead>
                    </>
                  )}
                  <TableHead className="text-center px-3">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSort('writeOffOccasions')}
                      className="h-8 px-1 font-medium justify-start text-[12px] hover:bg-transparent hover:text-inherit"
                    >
                      Write-off Occasions'
                      {getSortIcon('writeOffOccasions')}
                    </Button>
                  </TableHead>
                  <TableHead className="text-left px-3">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSort('totalWriteOffValue')}
                      className="h-8 px-1 font-medium justify-start text-[12px] hover:bg-transparent hover:text-inherit"
                    >
                      Total Write Off Value
                      {getSortIcon('totalWriteOffValue')}
                    </Button>
                  </TableHead>
                  <TableHead className="text-left px-3">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSort('noJobsWithWriteOff')}
                      className="h-8 px-1 font-medium justify-start text-[12px] hover:bg-transparent hover:text-inherit"
                    >
                      Jobs With Write Off
                      {getSortIcon('noJobsWithWriteOff')}
                    </Button>
                  </TableHead>
                  <TableHead className="text-left px-3">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSort('totalFees')}
                      className="h-8 px-1 font-medium justify-start text-[12px] hover:bg-transparent hover:text-inherit"
                    >
                      Total Job Fees
                      {getSortIcon('totalFees')}
                    </Button>
                  </TableHead>
                  <TableHead className="text-left px-3">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSort('writeOffValue')}
                      className="h-8 px-1 font-medium justify-start text-[12px] hover:bg-transparent hover:text-inherit"
                    >
                      Write Off Value
                      {getSortIcon('writeOffValue')}
                    </Button>
                  </TableHead>
                  <TableHead className="text-left px-3">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSort('percentageWriteOff')}
                      className="h-8 px-1 font-medium justify-start text-[12px] hover:bg-transparent hover:text-inherit"
                    >
                      % Write Off
                      {getSortIcon('percentageWriteOff')}
                    </Button>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredData.map((item, index) => (
                  <TableRow key={index} className="h-12">
                    {activeFilter === 'clients' && (
                      <TableCell className="p-3 text-sm text-left">{item.ref}</TableCell>
                    )}
                    <TableCell className="p-3 text-sm font-medium text-left">
                    {activeFilter === 'clients' ? (
                      <ClientNameLink className='underline-text' name={item.name} ciientId={item.clientId} />
                    ) : (
                      item.name
                    )}
                    </TableCell>
                    {activeFilter === 'jobs' && (
                      <>
                        <TableCell className="p-3 text-sm text-left">{item.clientRef}</TableCell>
                        <TableCell className="p-3 text-sm text-left">
                          <ClientNameLink className='underline-text' name={item.clientName || ''} ciientId={item.clientId} />
                        </TableCell>
                      </>
                    )}
                    <TableCell className="p-3 text-center">
                      <Badge 
                        variant="secondary" 
                        className="bg-blue-100 text-blue-800 cursor-pointer hover:opacity-80"
                        onClick={() => handleOccasionsClick(item)}
                      >
                        {item.writeOffOccasions}
                      </Badge>
                    </TableCell>
                    <TableCell className="p-3 text-center text-sm font-medium">
                      {formatCurrency(item.totalWriteOffValue)}
                    </TableCell>
                    <TableCell className="p-3 text-center text-sm">
                      <Badge 
                        variant="secondary" 
                        className="bg-blue-100 text-blue-800 cursor-pointer hover:opacity-80"
                        onClick={() => handleJobsClick(item)}
                      >
                        {item.noJobsWithWriteOff}
                      </Badge>
                    </TableCell>
                    <TableCell className="p-3 text-left text-sm">
                      {formatCurrency(item.totalFees)}
                    </TableCell>
                    <TableCell className="p-3 text-left text-sm font-medium text-red-600">
                      {formatCurrency(item.writeOffValue)}
                    </TableCell>
                    <TableCell className="p-3 text-left text-sm font-medium">
                      {item.percentageWriteOff.toFixed(1)}%
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
              <tfoot>
                <tr className="border-t-2 bg-muted/50">
                  {activeFilter === 'clients' && <td className="p-3"></td>}
                  <td className="p-3 text-sm font-medium text-left">TOTALS</td>
                  {activeFilter === 'jobs' && <td className="p-3"></td>}
                  {activeFilter === 'jobs' && <td className="p-3"></td>}
                  <td className="p-3 text-center text-sm font-medium">{totalOccasions}</td>
                  <td className="p-3 text-center text-sm font-medium">{formatCurrency(totalWriteOffs)}</td>
                  <td className="p-3 text-center text-sm font-medium">{totalJobs}</td>
                  <td className="p-3 text-left text-sm font-medium">
                    {formatCurrency(filteredData.reduce((sum, item) => sum + item.totalFees, 0))}
                  </td>
                  <td className="p-3 text-left text-sm font-medium text-red-600">
                    {formatCurrency(filteredData.reduce((sum, item) => sum + item.writeOffValue, 0))}
                  </td>
                  <td className="p-3 text-left text-sm font-medium">{avgPercentage.toFixed(1)}%</td>
                </tr>
              </tfoot>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Write Off Occasions Dialog */}
      <Dialog open={selectedOccasions !== null} onOpenChange={() => setSelectedOccasions(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Write Off Details</DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            <div className="space-y-4">
              <p className="text-sm font-medium">
                <strong>{activeFilter === 'clients' ? 'Client' : activeFilter === 'jobs' ? 'Job' : activeFilter === 'job-type' ? 'Service Type' : 'Team Member'}:</strong> {selectedOccasions?.name}
              </p>
              <p className="text-sm font-medium">
                <strong>Number of Write Off Occasions:</strong> {selectedOccasions?.occasions}
              </p>
            </div>

            <div className="space-y-4">
              <h4 className="font-medium">Write Off Details:</h4>
              <Card>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader className='bg-[#E7E5F2]'>
                        <TableRow className="border-b border-border bg-muted/50 text-[#381980]">
                          <TableHead className="p-3 text-foreground h-12 text-[#381980] whitespace-nowrap">Date</TableHead>
                          <TableHead className="p-3 text-foreground h-12 text-[#381980] whitespace-nowrap">Client Name</TableHead>
                          <TableHead className="p-3 text-foreground h-12 text-[#381980] whitespace-nowrap">Job Name</TableHead>
                          <TableHead className="p-3 text-foreground h-12 text-[#381980] whitespace-nowrap">Write-off Value</TableHead>
                          <TableHead className="p-3 text-foreground h-12 text-[#381980] whitespace-nowrap">Write-off By</TableHead>
                          <TableHead className="p-3 text-foreground h-12 text-[#381980] whitespace-nowrap">Write-off Reason</TableHead>
                          <TableHead className="p-3 text-foreground h-12 text-[#381980] whitespace-nowrap">Write-off Logic</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedOccasions?.details.map((detail, index) => (
                          <TableRow key={index} className="border-b border-border transition-colors h-12">
                            <TableCell className="p-4">
                              {detail.date}
                            </TableCell>
                            <TableCell className="p-4 font-medium">
                              {detail.clientName && detail.clientId ? (
                                <ClientNameLink className='underline-text' name={detail.clientName} ciientId={detail.clientId} />
                              ) : (
                                detail.clientName || 'N/A'
                              )}
                            </TableCell>
                            <TableCell className="p-4">{detail.jobName || 'N/A'}</TableCell>
                            <TableCell className="p-4 font-medium text-red-600">{formatCurrency(detail.amount)}</TableCell>
                            <TableCell className="p-4">{detail.by}</TableCell>
                            <TableCell className="p-4">{detail.reason}</TableCell>
                            <TableCell className="p-4">{detail.logic}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Jobs with Write Off Dialog */}
      <Dialog open={selectedJobs !== null} onOpenChange={() => setSelectedJobs(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Jobs with Write Off</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm font-medium">
              <strong>{activeFilter === 'clients' ? 'Client' : activeFilter === 'jobs' ? 'Job' : activeFilter === 'job-type' ? 'Service Type' : 'Team Member'}:</strong> {selectedJobs?.name}
            </p>
            <p className="text-sm font-medium">
              <strong>Number of Jobs with Write Off:</strong> {selectedJobs?.jobs.length}
            </p>

            <div className="space-y-2">
              <h4 className="font-medium">Jobs:</h4>
              <div className="max-h-60 overflow-y-auto">
                <ul className="space-y-1">
                  {selectedJobs?.jobs.map((job, index) => (
                    <li key={index} className="text-sm p-2 bg-muted/50 rounded border-l-2 border-primary">
                      {job}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default WriteOffMergedTab;