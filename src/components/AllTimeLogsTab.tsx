import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DashboardCard, DashboardGrid } from "@/components/ui/dashboard-card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";


import { Clock, Users, ChevronDown, ChevronRight, ChevronLeft, ChevronRight as ChevronRightIcon, Settings, Download, FileText, Edit2, Search, RefreshCw, Move, Plus, Trash2, Check } from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { formatCurrency } from '@/lib/currency';
import { getProfileImage, getUserInitials } from '@/utils/profiles';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import TimeLogPopup from './TimeLogPopup';
import { useGetDropdownOptionsQuery } from '@/store/teamApi';
import { useListTimeLogsQuery, useDeleteTimeLogsMutation } from '@/store/timesheetApi';


interface TimeLog {
  id: string;
  date: string;
  teamMember: string;
  clientName: string;
  clientRef: string;
  jobName: string;
  jobType: string;
  category: 'client work' | 'meeting' | 'phone call' | 'event' | 'training' | 'other';
  description: string;
  hours: number;
  rate: number;
  amount: number;
  billable: boolean;
  status: 'not-invoiced' | 'invoiced' | 'paid';
  timePurpose?: string;
}


const AllTimeLogsTab = () => {


  const [filters, setFilters] = useState({
    clientId: 'all',
    jobNameId: 'all',
    jobTypeId: 'all',
    teamId: 'all',
    purposeId: 'all',
    billable: 'all', // 'true' | 'false' | 'all'
    status: 'all', // 'notInvoiced' | 'invoiced' | 'paid' | 'all'
    dateFrom: '',
    dateTo: ''
  });
  // Dropdown options via API
  const { data: clientOptionsResp } = useGetDropdownOptionsQuery('client');
  const { data: jobListOptionsResp } = useGetDropdownOptionsQuery('jobList');
  const { data: jobTypeOptionsResp } = useGetDropdownOptionsQuery('job');
  const { data: teamOptionsResp } = useGetDropdownOptionsQuery('team');
  const { data: timePurposeOptionsResp } = useGetDropdownOptionsQuery('time');

  const clientOptions = (clientOptionsResp?.data?.clients || []).map((c: any) => ({ value: c._id, label: c.name }));
  const jobNameOptions = (jobListOptionsResp?.data?.jobs || []).map((j: any) => ({ value: j._id, label: j.name }));
  const jobTypeOptions = (jobTypeOptionsResp?.data?.jobCategories || jobTypeOptionsResp?.data?.jobs || []).map((jt: any) => ({ value: jt._id, label: jt.name }));
  const teamOptions = (teamOptionsResp?.data?.teams || []).map((t: any) => ({ value: t._id, label: t.name }));
  const timePurposeOptions = (timePurposeOptionsResp?.data?.times || []).map((p: any) => ({ value: p._id, label: p.name || p.title || 'Purpose' }));
  const [expandedClients, setExpandedClients] = useState<Set<string>>(new Set());
  const [showTimeLogPopup, setShowTimeLogPopup] = useState(false);
  const [viewMode, setViewMode] = useState<'clients' | 'jobTypes' | 'jobNames' | 'category' | 'teamMembers' | 'flat'>('flat');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());


  // Column visibility state
  const [visibleColumns, setVisibleColumns] = useState({
    date: true,
    teamMember: true,
    jobType: true,
    category: true,
    description: true,
    hours: true,
    rate: true,
    amount: true,
    billable: true,
    status: true
  });


  // Fetch time logs from API (None view)
  const { data: listResp, isLoading: isLogsLoading } = useListTimeLogsQuery({
    search: '',
    page,
    limit,
    clientId: filters.clientId !== 'all' ? filters.clientId : undefined,
    jobId: filters.jobNameId !== 'all' ? filters.jobNameId : undefined,
    jobTypeId: filters.jobTypeId !== 'all' ? filters.jobTypeId : undefined,
    userId: filters.teamId !== 'all' ? filters.teamId : undefined,
    timeCategoryId: filters.purposeId !== 'all' ? filters.purposeId : undefined,
    billable: filters.billable === 'all' ? undefined : filters.billable === 'true',
    status: filters.status !== 'all' ? (filters.status as any) : undefined,
    dateFrom: filters.dateFrom ? new Date(filters.dateFrom + 'T00:00:00.000Z').toISOString() : undefined,
    dateTo: filters.dateTo ? new Date(filters.dateTo + 'T23:59:59.999Z').toISOString() : undefined,
  });
  const apiLogs = listResp?.timeLogs || [];
  const apiSummary = listResp?.summary || {} as any;
  const apiPagination = listResp?.pagination;
  const [deleteTimeLogs, { isLoading: isDeleting }] = useDeleteTimeLogsMutation();

  const timeLogsData: TimeLog[] = apiLogs.map((log: any) => ({
    id: log?._id,
    date: log?.date,
    teamMember: log?.user?.name || '',
    clientName: log?.client?.name || '',
    clientRef: log?.client?.clientRef || '',
    jobName: log?.job?.name || '',
    jobType: log?.jobCategory?.name || '',
    category: 'client work',
    description: log?.description || '',
    hours: (log?.duration || 0) / 3600,
    rate: Number(log?.rate || 0),
    amount: Number(log?.amount || 0),
    billable: Boolean(log?.billable),
    status: 'not-invoiced',
    timePurpose: log?.timeCategory?.name || '',
  }));

  const formatHoursToHHMMSS = (hours: number) => {
    const totalSeconds = Math.max(0, Math.round((hours || 0) * 3600));
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
  };



  // Filter the time logs
  const filteredTimeLogs = useMemo(() => {
    return timeLogsData.filter(log => {
      if (filters.status && filters.status !== 'all') {
        const statusMap: Record<string, string> = { notInvoiced: 'not-invoiced', invoiced: 'invoiced', paid: 'paid' };
        const wanted = statusMap[filters.status] || filters.status;
        if (log.status !== wanted as any) return false;
      }
      if (filters.billable !== 'all') {
        const isBillable = filters.billable === 'true';
        if (log.billable !== isBillable) return false;
      }
      if (filters.dateFrom && log.date < filters.dateFrom) return false;
      if (filters.dateTo && log.date > filters.dateTo) return false;
      return true;
    });
  }, [timeLogsData, filters]);

  const toggleSelect = (id: string, checked: boolean) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (checked) next.add(id); else next.delete(id);
      return next;
    });
  };

  const toggleSelectAllVisible = (checked: boolean, logs: any[]) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      logs.forEach(l => { if (checked) next.add(l.id); else next.delete(l.id); });
      return next;
    });
  };

  const handleDeleteSelected = async () => {
    if (selectedIds.size === 0) return;
    try {
      await deleteTimeLogs({ timeLogIds: Array.from(selectedIds) }).unwrap();
      setSelectedIds(new Set());
    } catch (e) {
      console.error('Failed to delete logs', e);
    }
  };



  // Group by client and job
  const groupedLogs = useMemo(() => {
    if (viewMode === 'flat') {
      return { 'All Entries': { 'All Jobs': filteredTimeLogs } };
    }


    if (viewMode === 'category') {
      const grouped: Record<string, Record<string, TimeLog[]>> = {};
      filteredTimeLogs.forEach(log => {
        const purposeKey = (log.timePurpose || '—').toString();
        if (!grouped[purposeKey]) {
          grouped[purposeKey] = {};
        }
        if (!grouped[purposeKey][log.clientName]) {
          grouped[purposeKey][log.clientName] = [];
        }
        grouped[purposeKey][log.clientName].push(log);
      });
      return grouped;
    }


    if (viewMode === 'jobTypes') {
      const grouped: Record<string, Record<string, TimeLog[]>> = {};
      filteredTimeLogs.forEach(log => {
        if (!grouped[log.jobType]) {
          grouped[log.jobType] = {};
        }
        if (!grouped[log.jobType][log.clientName]) {
          grouped[log.jobType][log.clientName] = [];
        }
        grouped[log.jobType][log.clientName].push(log);
      });
      return grouped;
    }


    if (viewMode === 'jobNames') {
      const grouped: Record<string, Record<string, TimeLog[]>> = {};
      filteredTimeLogs.forEach(log => {
        if (!grouped[log.jobName]) {
          grouped[log.jobName] = {};
        }
        if (!grouped[log.jobName][log.clientName]) {
          grouped[log.jobName][log.clientName] = [];
        }
        grouped[log.jobName][log.clientName].push(log);
      });
      return grouped;
    }


    if (viewMode === 'teamMembers') {
      const grouped: Record<string, Record<string, TimeLog[]>> = {};
      filteredTimeLogs.forEach(log => {
        if (!grouped[log.teamMember]) {
          grouped[log.teamMember] = {};
        }
        if (!grouped[log.teamMember][log.clientName]) {
          grouped[log.teamMember][log.clientName] = [];
        }
        grouped[log.teamMember][log.clientName].push(log);
      });
      return grouped;
    }


    // Default: group by clients
    const grouped: Record<string, Record<string, TimeLog[]>> = {};
    filteredTimeLogs.forEach(log => {
      if (!grouped[log.clientName]) {
        grouped[log.clientName] = {};
      }
      if (!grouped[log.clientName][log.jobName]) {
        grouped[log.clientName][log.jobName] = [];
      }
      grouped[log.clientName][log.jobName].push(log);
    });


    return grouped;
  }, [filteredTimeLogs, viewMode]);
  console.log("grouped============fdgdfgdfg", groupedLogs);

  // Calculate totals
  const totalHours = apiSummary?.totalHours ? (apiSummary.totalHours / 3600) : filteredTimeLogs.reduce((sum, log) => sum + log.hours, 0);
  const totalAmount = apiSummary?.totalAmount ?? filteredTimeLogs.reduce((sum, log) => sum + log.amount, 0);
  const uniqueClients = apiSummary?.uniqueClients ?? new Set(filteredTimeLogs.map(log => log.clientName)).size;
  const uniqueTeamMembers = apiSummary?.uniqueJobs ?? new Set(filteredTimeLogs.map(log => log.teamMember)).size;


  const getStatusBadge = (status: TimeLog['status']) => {
    switch (status) {
      case 'not-invoiced':
        return <Badge variant="secondary" className="bg-[#FEEBEA] text-[#F50000] border border-[#F50000] whitespace-nowrap">Not Invoiced</Badge>;
      case 'invoiced':
        return <Badge variant="secondary" className="bg-[#FEF8E7] text-[#F6B800] border border-[#F6B800]">Invoiced</Badge>;
      case 'paid':
        return <Badge variant="secondary" className="bg-green-100 text-green-800 border border-green-800">Paid</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };


  const getCategorySelect = (category: TimeLog['category'], logId: string) => {
    const categories = ['client work', 'meeting', 'phone call', 'event', 'training', 'other'] as const;
    return (
      <Select value={category} onValueChange={(value) => console.log(`Change category for ${logId} to ${value}`)}>
        <SelectTrigger className="w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {categories.map(cat => (
            <SelectItem key={cat} value={cat}>
              {cat.charAt(0).toUpperCase() + cat.slice(1)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  };


  const toggleClientExpansion = (clientName: string) => {
    const newExpanded = new Set(expandedClients);
    if (newExpanded.has(clientName)) {
      newExpanded.delete(clientName);
    } else {
      newExpanded.add(clientName);
    }
    setExpandedClients(newExpanded);
  };


  const toggleColumn = (column: keyof typeof visibleColumns) => {
    setVisibleColumns(prev => ({ ...prev, [column]: !prev[column] }));
  };


  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(20);
    doc.text('Time Logs Report', 14, 22);


    // Build headers and data based on visible columns
    const headers = [];
    const dataMappers: ((log: TimeLog) => string)[] = [];


    if (viewMode === 'flat') {
      headers.push('Client Ref.', 'Client Name', 'Job Name');
      dataMappers.push(
        (log) => log.clientRef,
        (log) => log.clientName,
        (log) => log.jobName
      );
    }


    if (visibleColumns.date) {
      headers.push('Date');
      dataMappers.push((log) => new Date(log.date).toLocaleDateString('en-GB'));
    }
    if (visibleColumns.teamMember) {
      headers.push('Team Member');
      dataMappers.push((log) => log.teamMember);
    }
    if (visibleColumns.jobType) {
      headers.push('Job Type');
      dataMappers.push((log) => log.jobType);
    }
    if (visibleColumns.category) {
      headers.push('Category');
      dataMappers.push((log) => log.category);
    }
    if (visibleColumns.description) {
      headers.push('Description');
      dataMappers.push((log) => log.description);
    }
    if (visibleColumns.hours) {
      headers.push('Hours');
      dataMappers.push((log) => log.hours.toFixed(1) + 'h');
    }
    if (visibleColumns.rate) {
      headers.push('Rate');
      dataMappers.push((log) => formatCurrency(log.rate));
    }
    if (visibleColumns.amount) {
      headers.push('Amount');
      dataMappers.push((log) => formatCurrency(log.amount));
    }
    if (visibleColumns.billable) {
      headers.push('Billable');
      dataMappers.push((log) => log.billable ? 'Yes' : 'No');
    }
    if (visibleColumns.status) {
      headers.push('Status');
      dataMappers.push((log) => log.status);
    }


    const tableData = filteredTimeLogs.map(log =>
      dataMappers.map(mapper => mapper(log))
    );


    autoTable(doc, {
      head: [headers],
      body: tableData,
      startY: 30,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [41, 128, 185] },
      alternateRowStyles: { fillColor: [245, 245, 245] }
    });


    doc.save('time-logs-report.pdf');
  };


  const exportToCSV = () => {
    // Build headers and data based on visible columns
    const headers = [];
    const dataMappers: ((log: TimeLog) => string)[] = [];


    if (viewMode === 'flat') {
      headers.push('Client Ref.', 'Client Name', 'Job Name');
      dataMappers.push(
        (log) => log.clientRef,
        (log) => log.clientName,
        (log) => log.jobName
      );
    }


    if (visibleColumns.date) {
      headers.push('Date');
      dataMappers.push((log) => log.date);
    }
    if (visibleColumns.teamMember) {
      headers.push('Team Member');
      dataMappers.push((log) => log.teamMember);
    }
    if (visibleColumns.jobType) {
      headers.push('Job Type');
      dataMappers.push((log) => log.jobType);
    }
    if (visibleColumns.category) {
      headers.push('Category');
      dataMappers.push((log) => log.category);
    }
    if (visibleColumns.description) {
      headers.push('Description');
      dataMappers.push((log) => `"${log.description}"`);
    }
    if (visibleColumns.hours) {
      headers.push('Hours');
      dataMappers.push((log) => log.hours.toString());
    }
    if (visibleColumns.rate) {
      headers.push('Rate');
      dataMappers.push((log) => formatCurrency(log.rate));
    }
    if (visibleColumns.amount) {
      headers.push('Amount');
      dataMappers.push((log) => formatCurrency(log.amount));
    }
    if (visibleColumns.billable) {
      headers.push('Billable');
      dataMappers.push((log) => log.billable ? 'Yes' : 'No');
    }
    if (visibleColumns.status) {
      headers.push('Status');
      dataMappers.push((log) => log.status);
    }


    const csvContent = `${headers.join(',')}\n${filteredTimeLogs.map(log =>
      dataMappers.map(mapper => mapper(log)).join(',')
    ).join('\n')}`;


    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'time-logs.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };


  return (
    <div className="space-y-6">
      {/* <TimeLogPopup/> */}
      {/* Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="h-full">
          <CardContent className="p-4">
            <div className="text-2xl font-bold !text-[#381980]">
              {totalHours.toFixed(1)}
            </div>
            <p className="text-sm text-muted-foreground">Total Hours</p>
          </CardContent>
        </Card>
        <Card className="h-full">
          <CardContent className="p-4">
            <div className="text-2xl font-bold !text-[#381980]">
              {formatCurrency(totalAmount)}
            </div>
            <p className="text-sm text-muted-foreground">Total Amount</p>
          </CardContent>
        </Card>
        <Card className="h-full">
          <CardContent className="p-4">
            <div className="text-2xl font-bold !text-[#381980]">
              {uniqueClients.toString()}
            </div>
            <p className="text-sm text-muted-foreground">Unique Clients</p>
          </CardContent>
        </Card>
        <Card className="h-full">
          <CardContent className="p-4">
            <div className="text-2xl font-bold !text-[#381980]">
              {uniqueTeamMembers.toString()}
            </div>
            <p className="text-sm text-muted-foreground">Team Members</p>
          </CardContent>
        </Card>
      </div>





      {/* View Switcher */}
      <div className="flex  items-center justify-between">
        <div className="flex items-center gap-3 mt-4 border border-[#381980] w-max p-[6px] rounded-sm pl-4">
          <p className='text-[#381980] font-semibold text-[14px]'>Group by:</p>
          <div className="flex gap-2">
            <Button
              variant={viewMode === 'flat' ? 'default' : 'outline'}
              onClick={() => setViewMode('flat')}
              className='rounded-sm bg-[#E7E5F2] text-[#381980ac]'
              size="sm"
            >
              None
            </Button>
            <Button
              variant={viewMode === 'clients' ? 'default' : 'outline'}
              onClick={() => setViewMode('clients')}
              className='rounded-sm bg-[#E7E5F2] text-[#381980ac]'
              size="sm"
            >
              Client Name
            </Button>
            <Button
              variant={viewMode === 'teamMembers' ? 'default' : 'outline'}
              onClick={() => setViewMode('teamMembers')}
              className='rounded-sm bg-[#E7E5F2] text-[#381980ac]'
              size="sm"
            >
              Team Name
            </Button>
            <Button
              variant={viewMode === 'jobTypes' ? 'default' : 'outline'}
              onClick={() => setViewMode('jobTypes')}
              className='rounded-sm bg-[#E7E5F2] text-[#381980ac]'
              size="sm"
            >
              Job Types
            </Button>
            <Button
              variant={viewMode === 'jobNames' ? 'default' : 'outline'}
              onClick={() => setViewMode('jobNames')}
              className='rounded-sm bg-[#E7E5F2] text-[#381980ac]'
              size="sm"
            >
              Job Name
            </Button>
            <Button
              variant={viewMode === 'category' ? 'default' : 'outline'}
              onClick={() => setViewMode('category')}
              className='rounded-sm bg-[#E7E5F2] text-[#381980ac]'
              size="sm"
            >
              Time purpose
            </Button>
          </div>

        </div>
        <button onClick={() => setShowTimeLogPopup(true)} className='bg-[#017DB9] text-white py-[8px] px-[12px] rounded-[4px] flex items-center gap-[4px] font-semibold'><Plus size={16} /> Time Log</button>

      </div>


      {/* Filters */}
      <div className="p-[6px] rounded-sm bg-[#E7E5F2] flex justify-between items-center">
        <div className="flex flex-wrap items-end gap-2">
          <div className="relative flex-1 w-full max-w-[200px]">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Search..." className="pl-10 w-[200px] bg-white text-[#381980] font-semibold placeholder:text-[#381980]" />
          </div>
          <div className="space-y-2">
            <Select
              value={filters.clientId}
              onValueChange={(value) => setFilters(prev => ({ ...prev, clientId: value }))}
            >
              <SelectTrigger className="w-32 bg-white text-[#381980] font-semibold">
                <SelectValue placeholder="Client Name" />
              </SelectTrigger>
              <SelectContent className=''>
                <SelectItem value="all">Client Name</SelectItem>
                {clientOptions.map((o: any) => (
                  <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Select
              value={filters.jobNameId}
              onValueChange={(value) => setFilters(prev => ({ ...prev, jobNameId: value }))}
            >
              <SelectTrigger className="w-28 bg-white text-[#381980] font-semibold">
                <SelectValue placeholder="Job Name" />
              </SelectTrigger>
              <SelectContent className=''>
                <SelectItem value="all">Job Name</SelectItem>
                {jobNameOptions.map((o: any) => (
                  <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Select
              value={filters.jobTypeId}
              onValueChange={(value) => setFilters(prev => ({ ...prev, jobTypeId: value }))}
            >
              <SelectTrigger className="w-28 bg-white text-[#381980] font-semibold">
                <SelectValue placeholder="Job Type" />
              </SelectTrigger>
              <SelectContent className=''>
                <SelectItem value="all">Job Type</SelectItem>
                {jobTypeOptions.map((o: any) => (
                  <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Select
              value={filters.teamId}
              onValueChange={(value) => setFilters(prev => ({ ...prev, teamId: value }))}
            >
              <SelectTrigger className="w-32 bg-white text-[#381980] font-semibold">
                <SelectValue placeholder="Team Name" />
              </SelectTrigger>
              <SelectContent className=''>
                <SelectItem value="all">Team Name</SelectItem>
                {teamOptions.map((o: any) => (
                  <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Select
              value={filters.purposeId}
              onValueChange={(value) => setFilters(prev => ({ ...prev, purposeId: value }))}
            >
              <SelectTrigger className="w-24 bg-white text-[#381980] font-semibold">
                <SelectValue placeholder="Purpose" />
              </SelectTrigger>
              <SelectContent className=''>
                <SelectItem value="all">Purpose</SelectItem>
                {timePurposeOptions.map((o: any) => (
                  <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Select
              value={filters.billable}
              onValueChange={(value) => setFilters(prev => ({ ...prev, billable: value }))}
            >
              <SelectTrigger className="w-24 bg-white text-[#381980] font-semibold">
                <SelectValue placeholder="Billable" />
              </SelectTrigger>
              <SelectContent className=''>
                <SelectItem value="all">Billable</SelectItem>
                <SelectItem value="true">Billable</SelectItem>
                <SelectItem value="false">Non Billable</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Select
              value={filters.status}
              onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}
            >
              <SelectTrigger className="w-24 bg-white text-[#381980] font-semibold">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent className=''>
                <SelectItem value="all">Status</SelectItem>
                <SelectItem value="notInvoiced">notInvoiced</SelectItem>
                <SelectItem value="invoiced">invoiced</SelectItem>
                <SelectItem value="paid">paid</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            {/* <Label htmlFor="date-to">Date To</Label> */}
            <Input
              id="date-to"
              type="date"
              placeholder='sisdis'
              value={filters.dateTo}
              onChange={(e) => setFilters(prev => ({ ...prev, dateTo: e.target.value }))}
              className="w- bg-white"
            />
          </div>
          <div className="space-y-2">
            <Button
              variant="outline"
              className="bg-[#381980] w-[42px] rounded-sm text-primary-foreground p-2 hover:bg-primary/90 !text-[#fff]"
              onClick={() => {
                setFilters({
                  clientId: 'all',
                  jobNameId: 'all',
                  jobTypeId: 'all',
                  teamId: 'all',
                  purposeId: 'all',
                  billable: 'all',
                  status: 'all',
                  dateFrom: '',
                  dateTo: ''
                });
                setPage(1);
              }}
            >
              <RefreshCw className="w-3 h-3 sm:w-4 sm:h-4" />
            </Button>
          </div>

        </div>
        <button onClick={handleDeleteSelected} disabled={isDeleting || selectedIds.size===0} className='text-[#fff] font-semibold bg-[#381980] w/[42px] h/[42px] flex items-center justify-center rounded-sm text-primary-foreground p-2 hover:bg-primary/90'><Trash2 size={16} /></button>
      </div>


      {/* Time Logs Table */}
      <Card>
        {/* <CardHeader>
    <CardTitle>Time Logs ({filteredTimeLogs.length} entries)</CardTitle>
  </CardHeader> */}
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className='bg-[#E7E5F2] '>
                <TableRow className="border-b border-border bg-muted/50 text-[#381980]">
                  {viewMode === 'flat' ? (
                    <>
                      <TableHead className="p-3 text-foreground h-12 text-[#381980]"><input type="checkbox" onChange={(e) => toggleSelectAllVisible(e.target.checked, filteredTimeLogs)} /></TableHead>
                      <TableHead className="p-3 text-foreground h-12 text-[#381980]">Date</TableHead>
                      <TableHead className="p-3 text-foreground h-12 text-[#381980] whitespace-nowrap">Client Ref.</TableHead>
                      <TableHead className="p-3 text-foreground h-12 text-[#381980] whitespace-nowrap">Client Name</TableHead>
                      <TableHead className="p-3 text-foreground h-12 text-[#381980] whitespace-nowrap">Job Name</TableHead>
                    </>
                  ) : (
                    <>
                      <TableHead>
                        <div className="bg-[#381980] text-white h-4 w-4 flex items-center justify-center rounded-sm" >
                          <ChevronDown className="h-4 w-4" />
                        </div>
                      </TableHead>
                      <TableHead className="p-3 text-foreground h-12 text-[#381980]">Date</TableHead>
                      <TableHead className="p-3 text-foreground h-12 text-[#381980]">
                        {viewMode === 'clients' ? 'Client Ref.' :
                          viewMode === 'jobTypes' ? 'Job Type / Client' :
                            viewMode === 'jobNames' ? 'Job Name / Client' :
                              viewMode === 'teamMembers' ? 'Team Member / Client' :
                                'Entry Details'}
                      </TableHead>
                      <TableHead className="p-3 text-foreground h-12 text-[#381980] whitespace-nowrap">Client Name</TableHead>
                      <TableHead className="p-3 text-foreground h-12 text-[#381980] whitespace-nowrap">Job Name</TableHead>
                    </>

                  )}
                  {visibleColumns.jobType && <TableHead className="p-3 text-foreground h-12 text-[#381980] whitespace-nowrap">Job Type</TableHead>}
                  {visibleColumns.teamMember && <TableHead className="p-3 text-foreground h-12 text-[#381980] whitespace-nowrap">Team Name</TableHead>}
                  {visibleColumns.description && <TableHead className="p-3 text-foreground h-12 text-[#381980] whitespace-nowrap">Description</TableHead>}
                  {visibleColumns.amount && <TableHead className="p-3 text-foreground h-12 text-left text-[#381980] whitespace-nowrap">Time Purpose</TableHead>}
                  {visibleColumns.billable && <TableHead className="p-3 text-foreground h-12 text-left text-[#381980]">Billable</TableHead>}
                  {visibleColumns.billable && <TableHead className="p-3 text-foreground h-12 text-left text-[#381980]">Duration</TableHead>}
                  {visibleColumns.amount && <TableHead className="p-3 text-foreground h-12 text-left text-[#381980] whitespace-nowrap">Billable Rate</TableHead>}
                  {visibleColumns.amount && <TableHead className="p-3 text-foreground h-12 text-left text-[#381980]">Amount</TableHead>}
                  {visibleColumns.status && <TableHead className="p-3 text-foreground h-12 text-left text-[#381980]">Status</TableHead>}

                  {/* Column visibility toggle */}
                  <TableHead className="p-3 text-foreground h-12 text-center">
                    <Popover>
                      <div className="flex gap-[6px]">
                        <PopoverTrigger asChild className='mr-[4px]'>
                          <Button variant="ghost" size="sm" className="h-6 w-6 p-0 bg-white rounded-full">
                            <Download className="h-3 w-3 bg-red" color='#381980' />
                          </Button>
                        </PopoverTrigger>
                        <PopoverTrigger >
                          <Button variant="ghost" size="sm" className="h-6 w-6 p-0 bg-white rounded-full">
                            <Move className="h-3 w-3 bg-red" color='#381980' />
                          </Button>
                        </PopoverTrigger>
                      </div>
                      <PopoverContent className="w-64" align="end">
                        <div className="space-y-3">
                          <h4 className="font-medium text-sm">Show/Hide Columns</h4>
                          <div className="space-y-2">
                            {Object.entries(visibleColumns).map(([column, visible]) => (
                              <div key={column} className="flex items-center space-x-2">
                                <Checkbox
                                  id={column}
                                  checked={visible}
                                  onCheckedChange={() => toggleColumn(column as keyof typeof visibleColumns)}
                                />
                                <Label htmlFor={column} className="text-sm capitalize">
                                  {column === 'teamMember' ? 'Team Member' :
                                    column === 'jobType' ? 'Job Type' :
                                      column}
                                </Label>
                              </div>
                            ))}
                          </div>
                        </div>
                      </PopoverContent>
                    </Popover>
                  </TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {Object.entries(groupedLogs).map(([groupName, subGroups]) => (
                  <React.Fragment key={groupName}>
                    {/* Group Header Row */}
                    {viewMode !== 'flat' && (
                      <TableRow
                        className="border-b border-border bg-muted/30 cursor-pointer hover:bg-muted/50 transition-colors h-12"
                        onClick={() => toggleClientExpansion(groupName)}
                      >
                        <TableCell className="p-4 text-foreground text-sm">
                          {expandedClients.has(groupName) ? (
                            <div className="bg-[#381980] text-white h-4 w-4 flex items-center justify-center rounded-sm" >
                              <ChevronDown className="h-4 w-4" />
                            </div>
                          ) : (
                            <div className="bg-[#381980] text-white h-4 w-4 flex items-center justify-center rounded-sm" >
                              <ChevronRight className="h-4 w-4" />
                            </div>
                          )}

                        </TableCell>
                        <TableCell className="p-4 text-foreground text-sm"></TableCell>
                        <TableCell className="p-4 text-foreground text-sm">
                          <div className="flex items-center gap-2">
                            {(() => {
                              const firstSub = Object.values(subGroups)[0] as any[] | undefined;
                              const firstLog = firstSub && firstSub[0];
                              return firstLog?.clientRef || '-';
                            })()}
                          </div>
                        </TableCell>
                        <TableCell className="p-4 text-foreground text-sm">
                          <div className="flex items-center gap-2 underline whitespace-nowrap">
                            {groupName} ({Object.values(subGroups).reduce((acc: number, logs: any) => acc + (logs as any[]).length, 0)})
                          </div>
                        </TableCell>
                        {visibleColumns.teamMember && <TableCell className="p-4"></TableCell>}
                        {visibleColumns.jobType && <TableCell className="p-4"></TableCell>}
                        {visibleColumns.description && <TableCell className="p-4 whitespace-nowrap"></TableCell>}
                        {visibleColumns.amount && (<TableCell className="p-4 text-left font-semibold"></TableCell>)}
                        {visibleColumns.billable && <TableCell className="p-4"></TableCell>}
                        {visibleColumns.status && <TableCell className="p-4"></TableCell>}
                        <TableCell className="p-4 text-left">
                          {(() => {
                            const groupLogs = Object.values(subGroups).flat() as any[];
                            const sumHrs = groupLogs.reduce((s, l: any) => s + (l.hours || 0), 0);
                            return (
                              <div className="bg-[#F3F4F6] text-[#666666] rounded-[3px] py-[3px] px-[8px] font-semibold text-center">{formatHoursToHHMMSS(sumHrs)}</div>
                            );
                          })()}
                        </TableCell>
                        <TableCell className="p-4"></TableCell>
                        <TableCell className="p-4 text-left">
                          {(() => {
                            const groupLogs = Object.values(subGroups).flat() as any[];
                            const sumAmount = groupLogs.reduce((s, l: any) => s + Number(l.amount || 0), 0);
                            return (
                              <div className="bg-[#F3F4F6] text-[#666666] rounded-[3px] py-[3px] px-[8px] font-semibold text-center">{formatCurrency(sumAmount)}</div>
                            );
                          })()}
                        </TableCell>
                        <TableCell className="p-4"></TableCell>
                        <TableCell className="p-4">
                          <div className="text-right text-red-50"><Settings className='text-[#381980] ml-auto' size={16} /> </div>
                        </TableCell>

                      </TableRow>
                    )}

                    {/* Logs under each group (no sub-groups) */}
                    {(viewMode === 'flat' || expandedClients.has(groupName)) && (
                      Object.values(subGroups).flat().map((log: any) => (
                            <TableRow key={log.id} className="border-b border-border hover:bg-muted/30 transition-colors h-12">
                              {viewMode === 'flat' ? (
                                <>
                                  <TableCell className="p-4"><input type="checkbox" checked={selectedIds.has(log.id)} onChange={(e) => toggleSelect(log.id, e.target.checked)} /></TableCell>
                                  <TableCell className="p-4 text-muted-foreground">{new Date(log.date).toLocaleDateString('en-GB')}</TableCell>
                                  <TableCell className="p-4 text-muted-foreground">{log.clientRef}</TableCell>
                                  <TableCell className="p-4 text-muted-foreground underline whitespace-nowrap">{log.clientName || '-'}</TableCell>
                                  <TableCell className="p-4 text-muted-foreground underline whitespace-nowrap">{log.jobName}</TableCell>
                                  {visibleColumns.jobType && <TableCell className="p-4">{log.jobType}</TableCell>}

                                </>
                              ) : (
                              <>
                                <TableCell className="p-4"><input type="checkbox" checked={selectedIds.has(log.id)} onChange={(e) => toggleSelect(log.id, e.target.checked)} /></TableCell>
                                <TableCell className="p-4" />
                                <TableCell className="p-4 text-left">{log.clientRef || '-'}</TableCell>
                                <TableCell className="p-4 text-left underline">{log.clientName || '-'}</TableCell>
                                <TableCell className="p-4 text-left underline whitespace-nowrap">{log.jobName || '-'}</TableCell>
                                <TableCell className="p-4 text-left  whitespace-nowrap">{log.jobType || '-'}</TableCell>
                              </>
                              )}
                              {visibleColumns.teamMember && (
                                <TableCell className="p-4">
                                  <div className="flex items-center gap-2">
                                    <Avatar className="h-8 w-8">
                                      <AvatarImage
                                        src={getProfileImage(log.teamMember)}
                                        alt={log.teamMember}
                                      />
                                      <AvatarFallback className="text-xs">
                                        {getUserInitials(log.teamMember)}
                                      </AvatarFallback>
                                    </Avatar>
                                  </div>
                                </TableCell>
                              )}
                              {visibleColumns.description && <TableCell className="p-4 whitespace-nowrap">{log.description}</TableCell>}
                              {visibleColumns.amount && <TableCell className="p-4">
                                <Badge variant="secondary" className="bg-[#EBF6ED] text-[#38A24B] border border-[#38A24B] whitespace-nowrap">{log.timePurpose || '-'}</Badge>
                              </TableCell>}
                              {visibleColumns.billable && <TableCell className="p-4">
                                {log.billable ? (
                                  <Badge variant="secondary" className="bg-[#EBF6ED] text-[#38A24B] border border-[#38A24B] whitespace-nowrap  rounded-full !p-[4px]"><Check size={14} /></Badge>
                                ) : (
                                  <span className="text-[#666666] text-sm">—</span>
                                )}
                              </TableCell>}
                              {visibleColumns.billable && (
                                <TableCell className="p-4 text-left">
                                  <div className="bg-[#F3F4F6] text-[#666666] rounded-[3px] py-[3px] px-[8px] font-semibold">{formatHoursToHHMMSS(log.hours)}</div>
                                </TableCell>
                              )}
                              {visibleColumns.amount && (
                                <TableCell className="p-4 text-left">
                                  <div className="bg-[#F3F4F6] text-[#666666] rounded-[3px] py-[3px] px-[8px] font-semibold text-center">{formatCurrency(log.rate)}</div>
                                </TableCell>
                              )}
                              {visibleColumns.amount && (
                                <TableCell className="p-4 text-left "><div className="bg-[#F3F4F6] text-[#666666] rounded-[3px] py-[3px] px-[8px] font-semibold">
                                  {formatCurrency(log.amount)}</div></TableCell>
                              )}
                              {visibleColumns.status && (
                                <TableCell className="p-4 text-left">
                                  {getStatusBadge(log.status)}
                                </TableCell>
                              )}
                              <TableCell className="p-4">
                                <div className="text-right text-red-50"><Settings className='text-[#381980] ml-auto' size={16} /> </div>
                              </TableCell>
                            </TableRow>
                      ))
                    )}
                  </React.Fragment>
                ))}
              </TableBody>
            </Table>
            {isLogsLoading && <div className="px-4 py-6 text-sm">Loading logs...</div>}
          </div>
        </CardContent>
      </Card>

      {/* Pagination Controls */}
      {apiPagination && apiPagination.totalPages > 0 && (
        <div className="space-y-4 mt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Show:</span>
              <select value={limit} onChange={(e) => { setPage(1); setLimit(Number(e.target.value)); }} className="border border-gray-300 rounded px-2 py-1 text-sm" disabled={isLogsLoading}>
                <option value={5}>5 per page</option>
                <option value={10}>10 per page</option>
                <option value={20}>20 per page</option>
                <option value={50}>50 per page</option>
              </select>
            </div>
            <div className="text-sm text-gray-500">
              Showing {apiPagination.totalRecords > 0 ? ((page - 1) * (apiPagination.limit || limit)) + 1 : 0} to {Math.min(page * (apiPagination.limit || limit), apiPagination.totalRecords)} of {apiPagination.totalRecords} logs
            </div>
          </div>
          {apiPagination.totalPages > 1 && (
            <div className="flex justify-center items-center gap-2">
              <Button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1 || isLogsLoading} variant="outline" size="sm">
                <ChevronLeft className="h-4 w-4" /> Previous
              </Button>
              <Button onClick={() => setPage(p => p + 1)} disabled={page >= apiPagination.totalPages || isLogsLoading} variant="outline" size="sm">
                Next <ChevronRightIcon className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      )}

      {showTimeLogPopup && (
        <TimeLogPopup onClose={() => setShowTimeLogPopup(false)} />
      )}

    </div>
  );
};


export default AllTimeLogsTab;
