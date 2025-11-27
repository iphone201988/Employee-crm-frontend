import React, { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DashboardCard, DashboardGrid } from "@/components/ui/dashboard-card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useGetCurrentUserQuery } from "@/store/authApi";

import { Clock, Users, ChevronDown, ChevronRight, ChevronLeft, ChevronRight as ChevronRightIcon, Settings, Download, FileText, Edit2, Search, RefreshCw, Move, Plus, Trash2, Check, Calendar, X, GripVertical, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { formatCurrency } from '@/lib/currency';
import { getProfileImage, getUserInitials } from '@/utils/profiles';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import TimeLogPopup, { TimeLog } from './TimeLogPopup';
import { useGetDropdownOptionsQuery } from '@/store/teamApi';
import { useListTimeLogsQuery, useDeleteTimeLogsMutation, useUpdateTimeLogMutation } from '@/store/timesheetApi';
import ClientDetailsDialog from './ClientDetailsDialog';
import { useGetClientQuery } from '@/store/clientApi';
import { JobDetailsDialog } from './JobDetailsDialog';




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
  // Multi-select states for comma-separated IDs
  const [selectedClientIds, setSelectedClientIds] = useState<Set<string>>(new Set());
  const [selectedJobNameIds, setSelectedJobNameIds] = useState<Set<string>>(new Set());
  const [selectedJobTypeIds, setSelectedJobTypeIds] = useState<Set<string>>(new Set());
  // Memoize CSV for jobType to ensure stable, comparable arg
  const selectedJobTypeIdsCsv = useMemo(() => Array.from(selectedJobTypeIds).join(','), [selectedJobTypeIds]);
  useEffect(() => {
    // Reset to first page when job type filter changes
    setPage(1);
  }, [selectedJobTypeIdsCsv]);
  const [selectedTeamIds, setSelectedTeamIds] = useState<Set<string>>(new Set());
  const [selectedPurposeIds, setSelectedPurposeIds] = useState<Set<string>>(new Set());
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
  const [editingLog, setEditingLog] = useState<TimeLog | null>(null);
  const [settingsPopup, setSettingsPopup] = useState<{ logId: string; x: number; y: number } | null>(null);
  const [viewMode, setViewMode] = useState<'clients' | 'jobTypes' | 'jobNames' | 'category' | 'teamMembers' | 'flat'>('flat');
  const [showClientDetailsDialog, setShowClientDetailsDialog] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [showJobDetailsDialog, setShowJobDetailsDialog] = useState(false);
  const [selectedJobData, setSelectedJobData] = useState<{ jobId: string; jobName: string; jobFee: number; wipAmount: number; hoursLogged: number } | null>(null);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const { data: currentUser }: any = useGetCurrentUserQuery();
  const clientFilterActive = selectedClientIds.size > 0;
  const jobNameFilterActive = selectedJobNameIds.size > 0;
  const jobTypeFilterActive = selectedJobTypeIds.size > 0;
  const teamFilterActive = selectedTeamIds.size > 0;
  const purposeFilterActive = selectedPurposeIds.size > 0;
  const billableFilterActive = filters.billable !== 'all';
  const statusFilterActive = filters.status !== 'all';
  const dateRangeFilterActive = Boolean(filters.dateFrom || filters.dateTo);
  
  // Sort state
  type SortField = 'date' | 'clientRef' | 'clientName' | 'jobName' | 'jobType' | 'teamMember' | 'description' | 'timePurpose' | 'billable' | 'hours' | 'rate' | 'amount' | 'status';
  type SortDirection = 'asc' | 'desc' | null;
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);

  // Check if user has bulk delete logs permission
  const canBulkDelete = currentUser?.data?.permissions?.bulkDeleteLogs || false;

  // Column visibility state
  const [visibleColumns, setVisibleColumns] = useState({
    date: true,
    clientRef: true,
    clientName: true,
    jobName: true,
    teamMember: true,
    jobType: true,
    category: true,
    description: true,
    timePurpose: true,
    billable: true,
    hours: true,
    rate: true,
    amount: true,
    status: true
  });

  // Column order state
  const [columnOrder, setColumnOrder] = useState([
    'date',
    'clientRef',
    'clientName',
    'jobName',
    'jobType',
    'teamMember',
    'description',
    'timePurpose',
    'billable',
    'hours',
    'rate',
    'amount',
    'status'
  ]);

  // Drag and drop state
  const [draggedItem, setDraggedItem] = useState<string | null>(null);

  // Column display names mapping
  const columnDisplayNames: Record<string, string> = {
    date: 'Date',
    clientRef: 'Client Ref',
    clientName: 'Client Name',
    jobName: 'Job Name',
    jobType: 'Job Type',
    teamMember: 'Team Name',
    description: 'Description',
    timePurpose: 'Time Purpose',
    billable: 'Billable',
    hours: 'Duration',
    rate: 'Billable Rate',
    amount: 'Amount',
    status: 'Status'
  };


  // Fetch time logs from API (None view)
  const { data: listResp, isLoading: isLogsLoading } = useListTimeLogsQuery({
    search: '',
    page,
    limit,
    clientId: selectedClientIds.size > 0 ? Array.from(selectedClientIds).join(',') : (filters.clientId !== 'all' ? filters.clientId : undefined),
    jobId: selectedJobNameIds.size > 0 ? Array.from(selectedJobNameIds).join(',') : (filters.jobNameId !== 'all' ? filters.jobNameId : undefined),
    jobTypeId: selectedJobTypeIdsCsv ? selectedJobTypeIdsCsv : (filters.jobTypeId !== 'all' ? filters.jobTypeId : undefined),
    userId: selectedTeamIds.size > 0 ? Array.from(selectedTeamIds).join(',') : (filters.teamId !== 'all' ? filters.teamId : undefined),
    timeCategoryId: selectedPurposeIds.size > 0 ? Array.from(selectedPurposeIds).join(',') : (filters.purposeId !== 'all' ? filters.purposeId : undefined),
    billable: filters.billable === 'all' ? undefined : filters.billable === 'true',
    status: filters.status !== 'all' ? (filters.status as any) : undefined,
    dateFrom: filters.dateFrom ? new Date(filters.dateFrom + 'T00:00:00.000Z').toISOString() : undefined,
    dateTo: filters.dateTo ? new Date(filters.dateTo + 'T23:59:59.999Z').toISOString() : undefined,
  });
  const apiLogs = listResp?.timeLogs || [];
  const apiSummary = listResp?.summary || {} as any;
  const apiPagination = listResp?.pagination;
  const [deleteTimeLogs, { isLoading: isDeleting }] = useDeleteTimeLogsMutation();
  const [updateTimeLog, { isLoading: isUpdating }] = useUpdateTimeLogMutation();

  // Fetch client data for the dialog
  const { data: selectedClientData } = useGetClientQuery(selectedClientId || '', {
    skip: !selectedClientId
  });

  const timeLogsData: TimeLog[] = apiLogs.map((log: any) => ({
    id: log?._id,
    date: log?.date,
    teamMember: log?.user?.name || '',
    teamMemberAvatar: log?.user?.avatarUrl || '',
    clientName: log?.client?.name || '',
    clientId: log?.client?._id || '',
    clientRef: log?.client?.clientRef || '',
    jobName: log?.job?.name || '',
    jobId: log?.job?._id || '',
    jobType: log?.jobCategory?.name || '',
    category: 'client work',
    description: log?.description || '',
    hours: (log?.duration || 0) / 3600,
    rate: Number(log?.rate || 0),
    amount: Number(log?.amount || 0),
    billable: Boolean(log?.billable),
    status: (log?.status as 'notInvoiced' | 'invoiced' | 'paid') || 'notInvoiced',
    timePurpose: log?.timeCategory?.name || '',
  }));

  console.log('timeLogsData===========', timeLogsData);

  const formatHoursToHHMMSS = (hours: number) => {
    const totalSeconds = Math.max(0, Math.round((hours || 0) * 3600));
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };



  // Handle sorting
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

  // Filter the time logs
  const filteredTimeLogsBase = useMemo(() => {
    return timeLogsData.filter(log => {
      if (filters.status && filters.status !== 'all') {
        const statusMap: Record<string, string> = { notInvoiced: 'notInvoiced', invoiced: 'invoiced', paid: 'paid' };
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

  // Apply sorting to filtered logs
  const filteredTimeLogs = useMemo(() => {
    if (!sortField || !sortDirection) return filteredTimeLogsBase;
    
    return [...filteredTimeLogsBase].sort((a, b) => {
      let aValue: any;
      let bValue: any;
      
      switch (sortField) {
        case 'date':
          aValue = new Date(a.date).getTime();
          bValue = new Date(b.date).getTime();
          break;
        case 'clientRef':
          aValue = (a.clientRef || '').toLowerCase();
          bValue = (b.clientRef || '').toLowerCase();
          break;
        case 'clientName':
          aValue = (a.clientName || '').toLowerCase();
          bValue = (b.clientName || '').toLowerCase();
          break;
        case 'jobName':
          aValue = (a.jobName || '').toLowerCase();
          bValue = (b.jobName || '').toLowerCase();
          break;
        case 'jobType':
          aValue = (a.jobType || '').toLowerCase();
          bValue = (b.jobType || '').toLowerCase();
          break;
        case 'teamMember':
          aValue = (a.teamMember || '').toLowerCase();
          bValue = (b.teamMember || '').toLowerCase();
          break;
        case 'description':
          aValue = (a.description || '').toLowerCase();
          bValue = (b.description || '').toLowerCase();
          break;
        case 'timePurpose':
          aValue = (a.timePurpose || '').toLowerCase();
          bValue = (b.timePurpose || '').toLowerCase();
          break;
        case 'billable':
          aValue = a.billable ? 1 : 0;
          bValue = b.billable ? 1 : 0;
          break;
        case 'hours':
          aValue = a.hours || 0;
          bValue = b.hours || 0;
          break;
        case 'rate':
          aValue = a.rate || 0;
          bValue = b.rate || 0;
          break;
        case 'amount':
          aValue = a.amount || 0;
          bValue = b.amount || 0;
          break;
        case 'status':
          aValue = (a.status || '').toLowerCase();
          bValue = (b.status || '').toLowerCase();
          break;
        default:
          return 0;
      }
      
      if (sortDirection === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });
  }, [filteredTimeLogsBase, sortField, sortDirection]);

  const totalRecordCount = apiPagination?.totalRecords ?? filteredTimeLogs.length;

  console.log('filteredTimeLogs===========', filteredTimeLogs);

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

  const handleSettingsClick = (e: React.MouseEvent, logId: string) => {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    setSettingsPopup({ logId, x: rect.left, y: rect.bottom + 5 });
  };

  const handleEditLog = (logId: string) => {
    const log = timeLogsData.find(l => l.id === logId);
    if (log) {
      setEditingLog(log);
      setShowTimeLogPopup(true);
      setSettingsPopup(null);
    }
  };

  const handleDeleteLog = async (logId: string) => {
    try {
      await deleteTimeLogs({ timeLogIds: [logId] }).unwrap();
      setSettingsPopup(null);
    } catch (e) {
      console.error('Failed to delete log', e);
    }
  };

  const handleCloseSettingsPopup = () => {
    setSettingsPopup(null);
  };

  const handleClientNameClick = (clientId: string) => {
    setSelectedClientId(clientId);
    setShowClientDetailsDialog(true);
  };

  const handleJobNameClick = (log: TimeLog) => {
    setSelectedJobData({
      jobId: log.jobId,
      jobName: log.jobName,
      jobFee: log.amount, // Using amount as job fee for now
      wipAmount: 0, // Default value
      hoursLogged: log.hours
    });
    setShowJobDetailsDialog(true);
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

  // Calculate totals
  const totalHours = apiSummary?.totalHours ? (apiSummary.totalHours / 60) : filteredTimeLogs.reduce((sum, log) => sum + log.hours, 0);
  const totalAmount = apiSummary?.totalAmount ?? filteredTimeLogs.reduce((sum, log) => sum + log.amount, 0);
  const uniqueClients = apiSummary?.uniqueClients ?? new Set(filteredTimeLogs.map(log => log.clientName)).size;
  const uniqueTeamMembers = apiSummary?.uniqueJobs ?? new Set(filteredTimeLogs.map(log => log.teamMember)).size;


  const formatStatusLabel = (status?: string) => {
    if (!status) return '';
    const normalized = status.toString().trim().toLowerCase();
    if (normalized === 'notinvoiced' || normalized === 'not invoiced' || normalized === 'notinvoiced') {
      return 'Not Invoiced';
    }
    if (normalized === 'invoiced') return 'Invoiced';
    if (normalized === 'paid') return 'Paid';
    return status
      .replace(/([a-z])([A-Z])/g, '$1 $2')
      .replace(/\b\w/g, (c) => c.toUpperCase());
  };

  const getStatusBadge = (status: TimeLog['status']) => {
    const label = formatStatusLabel(status);
    switch ((status || '').toLowerCase()) {
      case 'notinvoiced':
        return <Badge variant="secondary" className="bg-[#FEEBEA] text-[#F50000] border border-[#F50000] whitespace-nowrap">{label}</Badge>;
      case 'invoiced':
        return <Badge variant="secondary" className="bg-[#FEF8E7] text-[#F6B800] border border-[#F6B800]">{label}</Badge>;
      case 'paid':
        return <Badge variant="secondary" className="bg-green-100 text-green-800 border border-green-800">{label}</Badge>;
      default:
        return <Badge variant="outline">{label || status}</Badge>;
    }
  };

  // Deterministic color mapping for time purpose badges
  const timePurposeColors = useMemo(() => [
    { bg: 'bg-[#EBF6ED]', text: 'text-[#38A24B]', border: 'border-[#38A24B]' }, // green
    { bg: 'bg-[#E6F0FF]', text: 'text-[#1D4ED8]', border: 'border-[#1D4ED8]' }, // blue
    { bg: 'bg-[#FEF8E7]', text: 'text-[#F6B800]', border: 'border-[#F6B800]' }, // yellow
    { bg: 'bg-[#FEEBEA]', text: 'text-[#F50000]', border: 'border-[#F50000]' }, // red
    { bg: 'bg-[#F3E8FF]', text: 'text-[#7C3AED]', border: 'border-[#7C3AED]' }, // purple
    { bg: 'bg-[#E7F6FB]', text: 'text-[#017DB9]', border: 'border-[#017DB9]' }, // cyan
  ], []);

  const getPurposeColorClasses = (purpose?: string) => {
    const value = (purpose || '').toString();
    if (!value) {
      return `${timePurposeColors[0].bg} ${timePurposeColors[0].text} border ${timePurposeColors[0].border}`;
    }
    let hash = 0;
    for (let i = 0; i < value.length; i++) {
      hash = (hash * 31 + value.charCodeAt(i)) >>> 0;
    }
    const idx = hash % timePurposeColors.length;
    const c = timePurposeColors[idx];
    return `${c.bg} ${c.text} border ${c.border}`;
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

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, item: string) => {
    setDraggedItem(item);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, targetItem: string) => {
    e.preventDefault();
    if (!draggedItem || draggedItem === targetItem) return;

    const newOrder = [...columnOrder];
    const draggedIndex = newOrder.indexOf(draggedItem);
    const targetIndex = newOrder.indexOf(targetItem);

    // Remove dragged item and insert at target position
    newOrder.splice(draggedIndex, 1);
    newOrder.splice(targetIndex, 0, draggedItem);

    setColumnOrder(newOrder);
    setDraggedItem(null);
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
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
    if (visibleColumns.clientRef) {
      headers.push('Client Ref');
      dataMappers.push((log) => log.clientRef);
    }
    if (visibleColumns.clientName) {
      headers.push('Client Name');
      dataMappers.push((log) => log.clientName || '-');
    }
    if (visibleColumns.jobName) {
      headers.push('Job Name');
      dataMappers.push((log) => log.jobName || '-');
    }
    if (visibleColumns.teamMember) {
      headers.push('Team Member');
      dataMappers.push((log) => log.teamMember);
    }
    if (visibleColumns.jobType) {
      headers.push('Job Type');
      dataMappers.push((log) => log.jobType);
    }
    if (visibleColumns.description) {
      headers.push('Description');
      dataMappers.push((log) => log.description);
    }
    if (visibleColumns.timePurpose) {
      headers.push('Time Purpose');
      dataMappers.push((log) => log.timePurpose || '-');
    }
    if (visibleColumns.billable) {
      headers.push('Billable');
      dataMappers.push((log) => log.billable ? 'Yes' : 'No');
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
    // Build headers and data dynamically based on visible columns (current page only)
    const headers: string[] = [];
    const dataMappers: ((log: TimeLog) => string)[] = [];

    // Fixed leading columns depending on view mode
    if (viewMode === 'flat') {
      headers.push('Client Ref.', 'Client Name', 'Job Name');
      dataMappers.push(
        (log) => log.clientRef,
        (log) => log.clientName,
        (log) => log.jobName
      );
    }

    // Add columns in the order specified by columnOrder
    columnOrder.forEach((key) => {
      if (!visibleColumns[key as keyof typeof visibleColumns]) return;

      headers.push(columnDisplayNames[key]);

      switch (key) {
        case 'date':
          dataMappers.push((log) => new Date(log.date).toLocaleDateString('en-GB'));
          break;
        case 'clientRef':
          dataMappers.push((log) => log.clientRef);
          break;
        case 'clientName':
          dataMappers.push((log) => log.clientName || '-');
          break;
        case 'jobName':
          dataMappers.push((log) => log.jobName || '-');
          break;
        case 'teamMember':
          dataMappers.push((log) => log.teamMember);
          break;
        case 'jobType':
          dataMappers.push((log) => log.jobType);
          break;
        case 'description':
          dataMappers.push((log) => `"${(log.description || '').replace(/"/g, '""')}"`);
          break;
        case 'timePurpose':
          dataMappers.push((log) => log.timePurpose || '-');
          break;
        case 'billable':
          dataMappers.push((log) => (log.billable ? 'Yes' : 'No'));
          break;
        case 'hours':
          dataMappers.push((log) => formatHoursToHHMMSS(log.hours));
          break;
        case 'rate':
          dataMappers.push((log) => formatCurrency(log.rate));
          break;
        case 'amount':
          dataMappers.push((log) => formatCurrency(log.amount));
          break;
        case 'status':
          dataMappers.push((log) => formatStatusLabel(log.status));
          break;
      }
    });

    // Use current page logs only
    const pageStart = (page - 1) * (apiPagination?.limit || limit);
    const currentPageLogs = filteredTimeLogs.slice(pageStart, pageStart + (apiPagination?.limit || limit));
    const csvRows = `${headers.join(',')}\n${currentPageLogs.map(log =>
      dataMappers.map(mapper => mapper(log)).join(',')
    ).join('\n')}`;
    const csvContent = `\uFEFF${csvRows}`;


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
              {formatHoursToHHMMSS(totalHours)}
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
              className='rounded-sm bg-[#E7E5F2] h-7 text-[#381980ac]'
              size="sm"
            >
              None
            </Button>
            <Button
              variant={viewMode === 'clients' ? 'default' : 'outline'}
              onClick={() => setViewMode('clients')}
              className='rounded-sm bg-[#E7E5F2] h-7 text-[#381980ac]'
              size="sm"
            >
              Client Name
            </Button>
            <Button
                variant={viewMode === 'jobTypes' ? 'default' : 'outline'}
                onClick={() => setViewMode('jobTypes')}
                className='rounded-sm bg-[#E7E5F2] h-7 text-[#381980ac]'
                size="sm"
              >
                Job Type
              </Button>
              <Button
                variant={viewMode === 'teamMembers' ? 'default' : 'outline'}
                onClick={() => setViewMode('teamMembers')}
                className='rounded-sm bg-[#E7E5F2] h-7 text-[#381980ac]'
                size="sm"
              >
                Team Name
              </Button>
              <Button
                variant={viewMode === 'jobNames' ? 'default' : 'outline'}
                onClick={() => setViewMode('jobNames')}
                className='rounded-sm bg-[#E7E5F2] h-7 text-[#381980ac]'
                size="sm"
              >
                Job Name
              </Button>
              <Button
                variant={viewMode === 'category' ? 'default' : 'outline'}
                onClick={() => setViewMode('category')}
                className='rounded-sm bg-[#E7E5F2] h-7 text-[#381980ac]'
                size="sm"
              >
                Time Purpose
              </Button>
          </div>

        </div>
        <button onClick={() => setShowTimeLogPopup(true)} className='bg-[#017DB9] w-[120px] text-white py-[8px] px-[12px] rounded-[4px] flex items-center gap-[4px] font-semibold'><Plus size={16} /> Time Log</button>

      </div>


      {/* Filters */}
      <div className="p-[6px] rounded-sm bg-[#E7E5F2] flex justify-between items-center">
        <div className="flex flex-wrap items-end gap-2">
          <div className="relative flex-1 w-full max-w-[200px]">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Search..." className="pl-10 w-[200px] bg-white text-[#381980] font-semibold placeholder:text-[#381980]" />
          </div>
          <div className="space-y-2">
            <Popover>
              <PopoverTrigger asChild>
                <button className={`w-32 h-10 ${clientFilterActive ? 'bg-gray-200 border-black' : 'bg-white border-input'} text-[#381980] font-semibold rounded-md border px-3 flex items-center justify-between`}>
                  <span className="truncate text-[14px]">Client Name</span>
                  <ChevronDown className="w-4 h-4" />
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-56 p-2" align="start">
                <div className="max-h-64 overflow-auto">
                  <div
                    className={`px-2 py-1.5 rounded-[4px] cursor-pointer ${selectedClientIds.size === 0 ? 'bg-[#5f46b9] text-white' : 'hover:bg-[#5f46b9] hover:text-white'}`}
                    onClick={() => setSelectedClientIds(new Set())}
                  >
                    All
                  </div>
                  {clientOptions.map((o: any) => {
                    const active = selectedClientIds.has(o.value);
                    return (
                      <div
                        key={o.value}
                        className={`flex items-center justify-between px-2 py-1.5 rounded-[4px] cursor-pointer ${active ? 'bg-[#5f46b9] text-white' : 'hover:bg-[#5f46b9] hover:text-white'}`}
                        onClick={() => {
                          setSelectedClientIds(prev => {
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
                <button className={`w-28 h-10 ${jobNameFilterActive ? 'bg-gray-200 border-black' : 'bg-white border-input'} text-[#381980] font-semibold rounded-md border px-3 flex items-center justify-between`}>
                  <span className="truncate text-[14px]">Job Name</span>
                  <ChevronDown className="w-4 h-4" />
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-56 p-2" align="start">
                <div className="max-h-64 overflow-auto">
                  <div
                    className={`px-2 py-1.5 rounded-[4px] cursor-pointer ${selectedJobNameIds.size === 0 ? 'bg-[#5f46b9] text-white' : 'hover:bg-[#5f46b9] hover:text-white'}`}
                    onClick={() => setSelectedJobNameIds(new Set())}
                  >
                    All
                  </div>
                  {jobNameOptions.map((o: any) => {
                    const active = selectedJobNameIds.has(o.value);
                    return (
                      <div
                        key={o.value}
                        className={`flex items-center justify-between px-2 py-1.5 rounded-[4px] cursor-pointer ${active ? 'bg-[#5f46b9] text-white' : 'hover:bg-[#5f46b9] hover:text-white'}`}
                        onClick={() => {
                          setSelectedJobNameIds(prev => {
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
                <button className={`w-28 h-10 ${jobTypeFilterActive ? 'bg-gray-200 border-black' : 'bg-white border-input'} text-[#381980] font-semibold rounded-md border px-3 flex items-center justify-between`}>
                  <span className="truncate text-[14px]">Job Type</span>
                  <ChevronDown className="w-4 h-4" />
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-56 p-2" align="start">
                <div className="max-h-64 overflow-auto">
                  <div
                    className={`px-2 py-1.5 rounded-[4px] cursor-pointer ${selectedJobTypeIds.size === 0 ? 'bg-[#5f46b9] text-white' : 'hover:bg-[#5f46b9] hover:text-white'}`}
                    onClick={() => setSelectedJobTypeIds(new Set())}
                  >
                    All
                  </div>
                  {jobTypeOptions.map((o: any) => {
                    const active = selectedJobTypeIds.has(o.value);
                    return (
                      <div
                        key={o.value}
                        className={`flex items-center justify-between px-2 py-1.5 rounded-[4px] cursor-pointer ${active ? 'bg-[#5f46b9] text-white' : 'hover:bg-[#5f46b9] hover:text-white'}`}
                        onClick={() => {
                          setSelectedJobTypeIds(prev => {
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
                <button className={`w-32 h-10 ${teamFilterActive ? 'bg-gray-200 border-black' : 'bg-white border-input'} text-[#381980] font-semibold rounded-md border px-3 flex items-center justify-between`}>
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
                  {teamOptions.map((o: any) => {
                    const active = selectedTeamIds.has(o.value);
                    return (
                      <div
                        key={o.value}
                        className={`flex items-center justify-between px-2 py-1.5 rounded-[4px] cursor-pointer ${active ? 'bg-[#5f46b9] text-white' : 'hover:bg-[#5f46b9] hover:text-white'}`}
                        onClick={() => {
                          setSelectedTeamIds(prev => {
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
                <button className={`w-24 h-10 ${purposeFilterActive ? 'bg-gray-200 border-black' : 'bg-white border-input'} text-[#381980] font-semibold rounded-md border px-3 flex items-center justify-between`}>
                  <span className="truncate text-[14px]">Time Purpose</span>
                  <ChevronDown className="w-4 h-4" />
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-56 p-2" align="start">
                <div className="max-h-64 overflow-auto">
                  <div
                    className={`px-2 py-1.5 rounded-[4px] cursor-pointer ${selectedPurposeIds.size === 0 ? 'bg-[#5f46b9] text-white' : 'hover:bg-[#5f46b9] hover:text-white'}`}
                    onClick={() => setSelectedPurposeIds(new Set())}
                  >
                    All
                  </div>
                  {timePurposeOptions.map((o: any) => {
                    const active = selectedPurposeIds.has(o.value);
                    return (
                      <div
                        key={o.value}
                        className={`flex items-center justify-between px-2 py-1.5 rounded-[4px] cursor-pointer ${active ? 'bg-[#5f46b9] text-white' : 'hover:bg-[#5f46b9] hover:text-white'}`}
                        onClick={() => {
                          setSelectedPurposeIds(prev => {
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
                <button className={`w-24 h-10 ${billableFilterActive ? 'bg-gray-200 border-black' : 'bg-white border-input'} text-[#381980] font-semibold rounded-md border px-3 flex items-center justify-between`}>
                  <span className="truncate text-[14px]">
                    {filters.billable === 'all' ? 'Billable' : filters.billable === 'true' ? 'Billable' : 'Non Billable'}
                  </span>
                  <ChevronDown className="w-4 h-4" />
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-56 p-2" align="start">
                <div className="max-h-64 overflow-auto">
                  <div
                    className={`px-2 py-1.5 rounded-[4px] cursor-pointer ${filters.billable === 'all' ? 'bg-[#5f46b9] text-white' : 'hover:bg-[#5f46b9] hover:text-white'}`}
                    onClick={() => setFilters(prev => ({ ...prev, billable: 'all' }))}
                  >
                    All
                  </div>
                  <div
                    className={`flex items-center justify-between px-2 py-1.5 rounded-[4px] cursor-pointer ${filters.billable === 'true' ? 'bg-[#5f46b9] text-white' : 'hover:bg-[#5f46b9] hover:text-white'}`}
                    onClick={() => setFilters(prev => ({ ...prev, billable: 'true' }))}
                  >
                    <span className="truncate">Billable</span>
                    {filters.billable === 'true' && <Check className="w-4 h-4" />}
                  </div>
                  <div
                    className={`flex items-center justify-between px-2 py-1.5 rounded-[4px] cursor-pointer ${filters.billable === 'false' ? 'bg-[#5f46b9] text-white' : 'hover:bg-[#5f46b9] hover:text-white'}`}
                    onClick={() => setFilters(prev => ({ ...prev, billable: 'false' }))}
                  >
                    <span className="truncate">Non Billable</span>
                    {filters.billable === 'false' && <Check className="w-4 h-4" />}
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>
          <div className="space-y-2">
            <Popover>
              <PopoverTrigger asChild>
                <button className={`w-24 h-10 ${statusFilterActive ? 'bg-gray-200 border-black' : 'bg-white border-input'} text-[#381980] font-semibold rounded-md border px-3 flex items-center justify-between`}>
                  <span className="truncate text-[14px]">
                    {filters.status === 'all' ? 'Status' : filters.status === 'notInvoiced' ? 'Not Invoiced' : filters.status === 'invoiced' ? 'Invoiced' : 'Paid'}
                  </span>
                  <ChevronDown className="w-4 h-4" />
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-56 p-2" align="start">
                <div className="max-h-64 overflow-auto">
                  <div
                    className={`px-2 py-1.5 rounded-[4px] cursor-pointer ${filters.status === 'all' ? 'bg-[#5f46b9] text-white' : 'hover:bg-[#5f46b9] hover:text-white'}`}
                    onClick={() => setFilters(prev => ({ ...prev, status: 'all' }))}
                  >
                    All
                  </div>
                  <div
                    className={`flex items-center justify-between px-2 py-1.5 rounded-[4px] cursor-pointer ${filters.status === 'notInvoiced' ? 'bg-[#5f46b9] text-white' : 'hover:bg-[#5f46b9] hover:text-white'}`}
                    onClick={() => setFilters(prev => ({ ...prev, status: 'notInvoiced' }))}
                  >
                    <span className="truncate">Not Invoiced</span>
                    {filters.status === 'notInvoiced' && <Check className="w-4 h-4" />}
                  </div>
                  <div
                    className={`flex items-center justify-between px-2 py-1.5 rounded-[4px] cursor-pointer ${filters.status === 'invoiced' ? 'bg-[#5f46b9] text-white' : 'hover:bg-[#5f46b9] hover:text-white'}`}
                    onClick={() => setFilters(prev => ({ ...prev, status: 'invoiced' }))}
                  >
                    <span className="truncate">Invoiced</span>
                    {filters.status === 'invoiced' && <Check className="w-4 h-4" />}
                  </div>
                  <div
                    className={`flex items-center justify-between px-2 py-1.5 rounded-[4px] cursor-pointer ${filters.status === 'paid' ? 'bg-[#5f46b9] text-white' : 'hover:bg-[#5f46b9] hover:text-white'}`}
                    onClick={() => setFilters(prev => ({ ...prev, status: 'paid' }))}
                  >
                    <span className="truncate">Paid</span>
                    {filters.status === 'paid' && <Check className="w-4 h-4" />}
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>
          <div className="space-y-2">
            <Popover>
              <PopoverTrigger asChild>
                <button className={`w-full min-w-[200px] h-[40px] ${dateRangeFilterActive ? 'bg-gray-200 border-black' : 'bg-white border-input'} border rounded-md px-3 py-2 text-left flex items-center justify-between`}>
                  <span className="text-[#381980] font-semibold text-sm">
                    {filters.dateFrom && filters.dateTo
                      ? `${new Date(filters.dateFrom).toLocaleDateString()} — ${new Date(filters.dateTo).toLocaleDateString()}`
                      : 'Date Range'}
                  </span>
                  <Calendar className="w-4 h-4 text-[#381980]" />
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-[280px] p-3" align="start">
                <div className="space-y-2">
                  <div className="grid grid-cols-1 gap-2">
                    <div className="flex flex-col gap-1">
                      <Label htmlFor="dr-from">From</Label>
                      <Input id="dr-from" type="date" value={filters.dateFrom} onChange={(e) => setFilters(prev => ({ ...prev, dateFrom: e.target.value }))} />
                    </div>
                    <div className="flex flex-col gap-1">
                      <Label htmlFor="dr-to">To</Label>
                      <Input id="dr-to" type="date" value={filters.dateTo} onChange={(e) => setFilters(prev => ({ ...prev, dateTo: e.target.value }))} />
                    </div>
                  </div>
                  <div className="flex justify-between pt-1">
                    <Button variant="outline" size="sm" onClick={() => setFilters(prev => ({ ...prev, dateFrom: '', dateTo: '' }))}>Clear</Button>
                    {/* <Button size="sm">Apply</Button> */}
                  </div>
                </div>
              </PopoverContent>
            </Popover>
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
                setSelectedClientIds(new Set());
                setSelectedJobNameIds(new Set());
                setSelectedJobTypeIds(new Set());
                setSelectedTeamIds(new Set());
                setSelectedPurposeIds(new Set());
                setPage(1);
              }}
            >
              <RefreshCw className="w-3 h-3 sm:w-4 sm:h-4" />
            </Button>
          </div>

        </div>
        <div className="flex flex-wrap items-center justify-end gap-2">
          <span className="text-sm text-[#381980] font-semibold">{totalRecordCount} Rows</span>
          {canBulkDelete && (
            <Button
              onClick={handleDeleteSelected}
              disabled={isDeleting || selectedIds.size === 0}
              className='bg-[#381980] w-[42px] rounded-sm text-primary-foreground p-2 hover:bg-primary/90 !text-[#fff] flex items-center justify-center'
            >
              <Trash2 size={16} />
            </Button>
          )}
        </div>
      </div>


      {/* Time Logs Table */}
      <Card>
        {/* <CardHeader>
    <CardTitle>Time Logs ({filteredTimeLogs.length} entries)</CardTitle>
  </CardHeader> */}
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className='bg-[#E7E5F2]'>
                <TableRow className="border-b border-border bg-muted/50 text-[#381980] ">
                  {viewMode === 'flat' ? (
                    <>
                      {canBulkDelete && (
                        <TableHead className="p-3 text-foreground h-12 text-[#381980] !uppercase">
                          <input type="checkbox" onChange={(e) => toggleSelectAllVisible(e.target.checked, filteredTimeLogs)} />
                        </TableHead>
                      )}
                      {columnOrder.map((key) => {
                        if (!visibleColumns[key as keyof typeof visibleColumns]) return null;
                        const sortableFields: SortField[] = ['date', 'clientRef', 'clientName', 'jobName', 'jobType', 'teamMember', 'description', 'timePurpose', 'billable', 'hours', 'rate', 'amount', 'status'];
                        const isSortable = sortableFields.includes(key as SortField);
                        return (
                          <TableHead key={key} className="p-3 text-foreground h-12 text-[#381980] whitespace-nowrap">
                            {isSortable ? (
                              <button 
                                className="flex items-center gap-1 sm:gap-2 hover:text-foreground transition-colors uppercase" 
                                onClick={() => handleSort(key as SortField)}
                              >
                                {columnDisplayNames[key]}
                                {getSortIcon(key as SortField)}
                              </button>
                            ) : (
                              columnDisplayNames[key]
                            )}
                          </TableHead>
                        );
                      })}
                    </>
                  ) : (
                    <>
                      <TableHead>
                        <div className="bg-[#381980] text-white h-4 w-4 flex items-center justify-center rounded-sm" >
                          <ChevronDown className="h-4 w-4" />
                        </div>
                      </TableHead>
                      {columnOrder.map((key) => {
                        if (!visibleColumns[key as keyof typeof visibleColumns]) return null;
                        const sortableFields: SortField[] = ['date', 'clientRef', 'clientName', 'jobName', 'jobType', 'teamMember', 'description', 'timePurpose', 'billable', 'hours', 'rate', 'amount', 'status'];
                        const isSortable = sortableFields.includes(key as SortField);
                        return (
                          <TableHead key={key} className="p-3 text-foreground h-12 text-[#381980] whitespace-nowrap">
                            {isSortable ? (
                              <button 
                                className="flex items-center gap-1 sm:gap-2 hover:text-foreground transition-colors uppercase" 
                                onClick={() => handleSort(key as SortField)}
                              >
                                {columnDisplayNames[key]}
                                {getSortIcon(key as SortField)}
                              </button>
                            ) : (
                              columnDisplayNames[key]
                            )}
                          </TableHead>
                        );
                      })}
                    </>

                  )}

                  {/* Column visibility toggle */}
                  <TableHead className="p-3 text-foreground h-12 text-center">
                    <div className="flex gap-[6px] justify-center">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 bg-white rounded-full"
                        onClick={exportToCSV}
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
                              {columnOrder.map((key) => (
                                <div
                                  key={key}
                                  className={`flex items-center space-x-2 p-2 rounded-md cursor-move hover:bg-gray-50 transition-colors ${draggedItem === key ? 'opacity-50' : ''
                                    }`}
                                  draggable
                                  onDragStart={(e) => handleDragStart(e, key)}
                                  onDragOver={handleDragOver}
                                  onDrop={(e) => handleDrop(e, key)}
                                  onDragEnd={handleDragEnd}
                                >
                                  <GripVertical className="h-4 w-4 text-gray-400 cursor-move" />
                                  <Checkbox
                                    id={key}
                                    checked={(visibleColumns as any)[key]}
                                    onCheckedChange={() => toggleColumn(key as keyof typeof visibleColumns)}
                                  />
                                  <Label htmlFor={key} className="text-sm cursor-pointer flex-1">
                                    {columnDisplayNames[key]}
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
                {Object.entries(groupedLogs).map(([groupName, subGroups]) => (
                  <React.Fragment key={groupName}>
                    {/* Group Header Row */}
                    {viewMode !== 'flat' && (
                      <TableRow
                        className={`cursor-pointer transition-colors h-12 parent-group-title ${expandedClients.has(groupName) ? 'bg-[#381980] hover:bg-[#381980] text-white border-[#381980] border-t-2 border-l-2 border-r-2 rounded-t-md' : 'bg-muted/30 border-b border-border'}`}
                        onClick={() => toggleClientExpansion(groupName)}
                        {...(expandedClients.has(groupName) ? { onMouseEnter: undefined, onMouseLeave: undefined } : {})}
                      >
                        <TableCell className={`p-4 text-sm ${expandedClients.has(groupName) ? 'text-white' : 'text-foreground'}`}>
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
                        {columnOrder.map((key) => {
                          if (!visibleColumns[key as keyof typeof visibleColumns]) return null;

                          let cellContent;
                          switch (key) {
                            case 'date':
                              cellContent = '';
                              break;
                            case 'clientRef':
                              const firstSub = Object.values(subGroups)[0] as any[] | undefined;
                              const firstLog = firstSub && firstSub[0];
                              cellContent = firstLog?.clientRef || '-';
                              break;
                            case 'clientName':
                              cellContent = viewMode === 'clients' ? (
                                <div className="flex items-center gap-2 underline whitespace-nowrap">
                                  {groupName} ({Object.values(subGroups).reduce((acc: number, logs: any) => acc + (logs as any[]).length, 0)})
                                </div>
                              ) : null;
                              break;
                            case 'jobName':
                              cellContent = viewMode === 'jobNames' ? (
                                <div className="flex items-center gap-2 underline whitespace-nowrap">
                                  {groupName} ({Object.values(subGroups).reduce((acc: number, logs: any) => acc + (logs as any[]).length, 0)})
                                </div>
                              ) : null;
                              break;
                            case 'jobType':
                              cellContent = viewMode === 'jobTypes' ? (
                                <div className="flex items-center gap-2 underline whitespace-nowrap">
                                  {groupName} ({Object.values(subGroups).reduce((acc: number, logs: any) => acc + (logs as any[]).length, 0)})
                                </div>
                              ) : null;
                              break;
                            case 'teamMember':
                              cellContent = viewMode === 'teamMembers' ? (
                                <div className="flex items-center gap-2 underline whitespace-nowrap">
                                  {groupName} ({Object.values(subGroups).reduce((acc: number, logs: any) => acc + (logs as any[]).length, 0)})
                                </div>
                              ) : null;
                              break;
                            case 'description':
                              cellContent = '';
                              break;
                            case 'timePurpose':
                              cellContent = viewMode === 'category' ? (
                                <div className="flex items-center gap-2 underline whitespace-nowrap">
                                  {groupName} ({Object.values(subGroups).reduce((acc: number, logs: any) => acc + (logs as any[]).length, 0)})
                                </div>
                              ) : null;
                              break;
                            case 'billable':
                              cellContent = '';
                              break;
                            case 'hours':
                              const groupLogs = Object.values(subGroups).flat() as any[];
                              const sumHrs = groupLogs.reduce((s, l: any) => s + (l.hours || 0), 0);
                              cellContent = (
                                <div className="bg-[#F3F4F6] text-[#666666] rounded-[3px] py-[3px] px-[8px] font-semibold text-center">{formatHoursToHHMMSS(sumHrs)}</div>
                              );
                              break;
                            case 'rate':
                              cellContent = '';
                              break;
                            case 'amount':
                              const groupLogsAmount = Object.values(subGroups).flat() as any[];
                              const sumAmount = groupLogsAmount.reduce((s, l: any) => s + Number(l.amount || 0), 0);
                              cellContent = (
                                <div className="bg-[#F3F4F6] text-[#666666] rounded-[3px] py-[3px] px-[8px] font-semibold text-center">{formatCurrency(sumAmount)}</div>
                              );
                              break;
                            case 'status':
                              cellContent = '';
                              break;
                            default:
                              cellContent = '';
                          }

                          return (
                            <TableCell key={key} className={`p-4 text-sm ${expandedClients.has(groupName) ? 'text-white' : 'text-foreground'}`}>
                              {cellContent}
                            </TableCell>
                          );
                        })}
                        <TableCell className="p-4">
                          <div className="text-right">
                            <div className="text-right text-red-50"><Settings className='text-[#381980] ml-auto' size={16} /> </div>
                          </div>
                        </TableCell>

                      </TableRow>
                    )}

                    {/* Logs under each group (no sub-groups) */}
                    {(viewMode === 'flat' || expandedClients.has(groupName)) && (
                      (() => {
                        const flatLogs = Object.values(subGroups).flat() as any[];
                        return flatLogs.map((log: any, idx: number) => {
                          const isExpanded = expandedClients.has(groupName);
                          const isLastInGroup = idx === flatLogs.length - 1;
                          const borderColor = isExpanded ? 'border-[#381980]' : '';
                          const visibleKeys = columnOrder.filter((k) => (visibleColumns as any)[k]);
                          return (
                            <TableRow key={log.id} className={`border-b border-border transition-colors h-12`}>
                              {viewMode === 'flat' ? (
                                <>
                                  {canBulkDelete && (
                                    <TableCell className={`p-4 ${isExpanded ? `${borderColor} ${isLastInGroup ? 'border-b-2 rounded-bl-md' : ''} border-l-2` : ''}`}>
                                      <input type="checkbox" checked={selectedIds.has(log.id)} onChange={(e) => toggleSelect(log.id, e.target.checked)} />
                                    </TableCell>
                                  )}
                                  {columnOrder.map((key) => {
                                    if (!visibleColumns[key as keyof typeof visibleColumns]) return null;

                                    let cellContent;
                                    switch (key) {
                                      case 'date':
                                        cellContent = new Date(log.date).toLocaleDateString('en-GB');
                                        break;
                                      case 'clientRef':
                                        cellContent = log.clientRef;
                                        break;
                                      case 'clientName':
                                        cellContent = log.clientName && log.clientId ? (
                                          <button
                                            onClick={() => handleClientNameClick(log.clientId!)}
                                            className="text-blue-600 hover:text-blue-800 hover:underline cursor-pointer font-medium text-left"
                                          >
                                            {log.clientName}
                                          </button>
                                        ) : (
                                          log.clientName || '-'
                                        );
                                        break;
                                      case 'jobName':
                                        cellContent = log.jobName && log.jobId ? (
                                          <button
                                            onClick={() => handleJobNameClick(log)}
                                            className="text-blue-600 hover:text-blue-800 hover:underline cursor-pointer font-medium text-left"
                                          >
                                            {log.jobName}
                                          </button>
                                        ) : (
                                          log.jobName || '-'
                                        );
                                        break;
                                      case 'jobType':
                                        cellContent = log.jobType;
                                        break;
                                      case 'teamMember':
                                        cellContent = (
                                          <div className="flex items-center gap-2">                                          
                                            <Avatar className="h-8 w-8">
                                              <AvatarImage
                                                src={log.teamMemberAvatar ? (import.meta.env.VITE_BACKEND_BASE_URL + log.teamMemberAvatar) : getProfileImage(log.teamMember)}
                                                alt={log.teamMember}
                                              />
                                              <AvatarFallback className="text-xs">
                                                {getUserInitials(log.teamMember)}
                                              </AvatarFallback>
                                            </Avatar>
                                          </div>
                                        );
                                        break;
                                      case 'description':
                                        cellContent = log.description || 'N/A';
                                        break;
                                      case 'timePurpose':
                                        cellContent = (
                                          <Badge variant="secondary" className={`${getPurposeColorClasses(log.timePurpose)} whitespace-nowrap`}>{log.timePurpose || '-'}</Badge>
                                        );
                                        break;
                                      case 'billable':
                                        cellContent = log.billable ? (
                                          <Badge variant="secondary" className="bg-[#EBF6ED] text-[#38A24B] border border-[#38A24B] whitespace-nowrap rounded-full !p-[4px]"><Check size={14} /></Badge>
                                        ) : (
                                          <Badge variant="secondary" className="bg-[#FEEBEA] text-[#F50000] border border-[#F50000] whitespace-nowrap rounded-full !p-[4px]"><X size={14} /></Badge>
                                        );
                                        break;
                                      case 'hours':
                                        cellContent = (
                                          <div className="bg-[#F3F4F6] text-[#666666] rounded-[3px] py-[3px] px-[8px] font-semibold text-center">{formatHoursToHHMMSS(log.hours)}</div>
                                        );
                                        break;
                                      case 'rate':
                                        cellContent = (
                                          <div className="bg-[#F3F4F6] text-[#666666] rounded-[3px] py-[3px] px-[8px] font-semibold text-center">{formatCurrency(log.rate)}</div>
                                        );
                                        break;
                                      case 'amount':
                                        cellContent = (
                                          <div className="bg-[#F3F4F6] text-[#666666] rounded-[3px] py-[3px] px-[8px] font-semibold text-center">{formatCurrency(log.amount)}</div>
                                        );
                                        break;
                                      case 'status':
                                        cellContent = getStatusBadge(log.status);
                                        break;
                                      default:
                                        cellContent = '-';
                                    }

                                    return (
                                      <TableCell
                                        key={key}
                                        className={`p-4 text-muted-foreground whitespace-nowrap ${isExpanded ? `${borderColor} ${isLastInGroup ? 'border-b-2' : ''}` : ''}`}
                                      >
                                        {cellContent}
                                      </TableCell>
                                    );
                                  })}
                                  <TableCell className={`p-4 ${isExpanded ? `${borderColor} ${isLastInGroup ? 'border-b-2 rounded-br-md' : ''} border-r-2` : ''}`}>
                                    <div className="text-right">
                                      <button
                                        onClick={(e) => handleSettingsClick(e, log.id)}
                                        className="p-1 hover:bg-gray-100 rounded"
                                      >
                                        <Settings className='text-[#381980]' size={16} />
                                      </button>
                                    </div>
                                  </TableCell>
                                </>
                              ) : (
                                <>
                                  {canBulkDelete && (
                                    <TableCell className={`p-4 ${isExpanded ? `${borderColor} ${isLastInGroup ? 'border-b-2 rounded-bl-md' : ''} border-l-2` : ''}`}>
                                      <input type="checkbox" checked={selectedIds.has(log.id)} onChange={(e) => toggleSelect(log.id, e.target.checked)} />
                                    </TableCell>
                                  )}
                                  {columnOrder.map((key) => {
                                    if (!visibleColumns[key as keyof typeof visibleColumns]) return null;

                                    let cellContent;
                                    switch (key) {
                                      case 'date':
                                        cellContent = new Date(log.date).toLocaleDateString('en-GB');
                                        break;
                                      case 'clientRef':
                                        cellContent = log.clientRef || '-';
                                        break;
                                      case 'clientName':
                                        cellContent = log.clientName && log.clientId ? (
                                          <button
                                            onClick={() => handleClientNameClick(log.clientId!)}
                                            className="text-blue-600 hover:text-blue-800 hover:underline cursor-pointer font-medium text-left"
                                          >
                                            {log.clientName}
                                          </button>
                                        ) : (
                                          log.clientName || '-'
                                        );
                                        break;
                                      case 'jobName':
                                        cellContent = log.jobName && log.jobId ? (
                                          <button
                                            onClick={() => handleJobNameClick(log)}
                                            className="text-blue-600 hover:text-blue-800 hover:underline cursor-pointer font-medium text-left"
                                          >
                                            {log.jobName}
                                          </button>
                                        ) : (
                                          log.jobName || '-'
                                        );
                                        break;
                                      case 'jobType':
                                        cellContent = log.jobType || '-';
                                        break;
                                      case 'teamMember':
                                        cellContent = (
                                          <div className="flex items-center gap-2">
                                            <Avatar className="h-8 w-8">
                                              <AvatarImage
                                                src={log.teamMemberAvatar ? (import.meta.env.VITE_BACKEND_BASE_URL + log.teamMemberAvatar) : getProfileImage(log.teamMember)}
                                                alt={log.teamMember}
                                              />
                                              <AvatarFallback className="text-xs">
                                                {getUserInitials(log.teamMember)}
                                              </AvatarFallback>
                                            </Avatar>
                                          </div>
                                        );
                                        break;
                                      case 'description':
                                        cellContent = log.description || 'N/A';
                                        break;
                                      case 'timePurpose':
                                        cellContent = (
                                          <Badge variant="secondary" className={`${getPurposeColorClasses(log.timePurpose)} whitespace-nowrap`}>{log.timePurpose || '-'}</Badge>
                                        );
                                        break;
                                      case 'billable':
                                        cellContent = log.billable ? (
                                          <Badge variant="secondary" className="bg-[#EBF6ED] text-[#38A24B] border border-[#38A24B] whitespace-nowrap rounded-full !p-[4px]"><Check size={14} /></Badge>
                                        ) : (
                                          <Badge variant="secondary" className="bg-[#FEEBEA] text-[#F50000] border border-[#F50000] whitespace-nowrap rounded-full !p-[4px]"><X size={14} /></Badge>
                                        );
                                        break;
                                      case 'hours':
                                        cellContent = (
                                          <div className="bg-[#F3F4F6] text-[#666666] rounded-[3px] py-[3px] px-[8px] font-semibold text-center">{formatHoursToHHMMSS(log.hours)}</div>
                                        );
                                        break;
                                      case 'rate':
                                        cellContent = (
                                          <div className="bg-[#F3F4F6] text-[#666666] rounded-[3px] py-[3px] px-[8px] font-semibold text-center">{formatCurrency(log.rate)}</div>
                                        );
                                        break;
                                      case 'amount':
                                        cellContent = (
                                          <div className="bg-[#F3F4F6] text-[#666666] rounded-[3px] py-[3px] px-[8px] font-semibold text-center">
                                            {formatCurrency(log.amount)}
                                          </div>
                                        );
                                        break;
                                      case 'status':
                                        cellContent = getStatusBadge(log.status);
                                        break;
                                      default:
                                        cellContent = '-';
                                    }

                                    return (
                                      <TableCell
                                        key={key}
                                        className={`p-4 text-left whitespace-nowrap ${isExpanded ? `${borderColor} ${isLastInGroup ? 'border-b-2' : ''}` : ''}`}
                                      >
                                        {cellContent}
                                      </TableCell>
                                    );
                                  })}
                                  <TableCell className={`p-4 ${isExpanded ? `${borderColor} ${isLastInGroup ? 'border-b-2 rounded-br-md' : ''} border-r-2` : ''}`}>
                                    <div className="text-right">
                                      <button
                                        onClick={(e) => handleSettingsClick(e, log.id)}
                                        className="p-1 hover:bg-gray-100 rounded"
                                      >
                                        <Settings className='text-[#381980]' size={16} />
                                      </button>
                                    </div>
                                  </TableCell>
                                </>
                              )}
                            </TableRow>
                          );
                        });
                      })()
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
                <option value={100}>100 per page</option>
                <option value={250}>250 per page</option>
                <option value={500}>500 per page</option>
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
        <TimeLogPopup
          onClose={() => {
            setShowTimeLogPopup(false);
            setEditingLog(null);
          }}
          editingLog={editingLog}
        />
      )}

      {/* Settings Popup */}
      {settingsPopup && (
        <div
          className="fixed z-50 bg-white border border-gray-200 rounded-md shadow-lg py-1 min-w-[120px]"
          style={{
            left: settingsPopup.x,
            top: settingsPopup.y
          }}
        >
          <button
            onClick={() => handleEditLog(settingsPopup.logId)}
            className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2"
          >
            <Edit2 size={14} />
            Edit
          </button>
          <button
            onClick={() => handleDeleteLog(settingsPopup.logId)}
            className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 text-red-600 flex items-center gap-2"
          >
            <Trash2 size={14} />
            Delete
          </button>
        </div>
      )}

      {/* Click outside to close popup */}
      {settingsPopup && (
        <div
          className="fixed inset-0 z-40"
          onClick={handleCloseSettingsPopup}
        />
      )}

      {/* Client Details Dialog */}
      {selectedClientData && (
        <ClientDetailsDialog
          open={showClientDetailsDialog}
          onOpenChange={setShowClientDetailsDialog}
          clientData={selectedClientData.data}
        />
      )}

      {/* Job Details Dialog */}
      {selectedJobData && (
        <JobDetailsDialog
          isOpen={showJobDetailsDialog}
          onClose={() => setShowJobDetailsDialog(false)}
          jobId={selectedJobData.jobId}
          jobName={selectedJobData.jobName}
          jobFee={selectedJobData.jobFee}
          wipAmount={selectedJobData.wipAmount}
          hoursLogged={selectedJobData.hoursLogged}
        />
      )}

    </div>
  );
};


export default AllTimeLogsTab;
