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


import { Clock, Users, ChevronDown, ChevronRight, Settings, Download, FileText, Edit2, Search, RefreshCw, Move, Plus, Trash2, Check } from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { formatCurrency } from '@/lib/currency';
import { getProfileImage, getUserInitials } from '@/utils/profiles';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';


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
}


const AllTimeLogsTab = () => {


  const [filters, setFilters] = useState({
    client: 'all-clients',
    teamMember: 'all-team-members',
    status: 'all',
    dateFrom: '',
    dateTo: ''
  });
  const [expandedClients, setExpandedClients] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<'clients' | 'jobTypes' | 'jobNames' | 'category' | 'teamMembers' | 'flat'>('flat');


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


  // Sample time logs data
  const timeLogsData: TimeLog[] = [
    { id: '1', date: '2024-01-15', teamMember: 'John Smith', clientName: 'Water Savers Limited', clientRef: 'WAT-24', jobName: 'VAT (01/01/2025 - 28/02/2025)', jobType: 'VAT Return', category: 'client work', description: 'Review financial statements and draft accounts', hours: 3.5, rate: 120, amount: 420, billable: true, status: 'not-invoiced' },
    { id: '2', date: '2024-01-16', teamMember: 'Sarah Johnson', clientName: 'Water Savers Limited', clientRef: 'WAT-24', jobName: 'Annual Returns - 2024', jobType: 'Annual Returns', category: 'client work', description: 'Complete corporation tax computation', hours: 2.0, rate: 100, amount: 200, billable: true, status: 'not-invoiced' },
    { id: '3', date: '2024-01-17', teamMember: 'John Smith', clientName: 'Water Savers Limited', clientRef: 'WAT-24', jobName: 'Payroll - W5  2025', jobType: 'Payroll', category: 'client work', description: 'Process monthly payroll', hours: 1.5, rate: 120, amount: 180, billable: true, status: 'invoiced' },
    { id: '4', date: '2024-01-18', teamMember: 'Mike Wilson', clientName: 'Green Gardens Limited', clientRef: 'GRE-23', jobName: 'Income Tax Returns - 2024', jobType: 'Tax Return', category: 'client work', description: 'Enter transactions and reconcile accounts', hours: 4.0, rate: 85, amount: 340, billable: true, status: 'not-invoiced' },
    { id: '5', date: '2024-01-19', teamMember: 'Sarah Johnson', clientName: 'Green Gardens Limited', clientRef: 'GRE-23', jobName: 'Audit - 2024', jobType: 'Audit', category: 'client work', description: 'Prepare and submit VAT return', hours: 2.5, rate: 100, amount: 250, billable: true, status: 'paid' },
    { id: '6', date: '2024-01-20', teamMember: 'John Smith', clientName: 'Brown Enterprises', clientRef: 'BRO-25', jobName: 'Payroll - January 2025', jobType: 'Payroll', category: 'client work', description: 'Audit testing and documentation', hours: 6.0, rate: 120, amount: 720, billable: true, status: 'invoiced' },
    { id: '7', date: '2024-01-21', teamMember: 'Mike Wilson', clientName: 'Tech Solutions Inc.', clientRef: 'TEC-22', jobName: 'VAT (01/01/2025 - 28/02/2025)', jobType: 'VAT Return', category: 'client work', description: 'Prepare corporation tax return', hours: 3.0, rate: 85, amount: 255, billable: true, status: 'not-invoiced' },
    { id: '8', date: '2024-01-22', teamMember: 'Sarah Johnson', clientName: 'Smith & Associates', clientRef: 'SMI-21', jobName: 'Annual Returns - 2024', jobType: 'Annual Returns', category: 'client work', description: 'Complete personal tax return', hours: 2.0, rate: 100, amount: 200, billable: true, status: 'paid' },
    { id: '9', date: '2024-01-23', teamMember: 'John Smith', clientName: 'Marine Consulting Ltd.', clientRef: 'MAR-23', jobName: 'Income Tax Returns - 2024', jobType: 'Tax Return', category: 'client work', description: 'Review compliance procedures', hours: 4.5, rate: 120, amount: 540, billable: true, status: 'not-invoiced' },
    { id: '10', date: '2024-01-24', teamMember: 'Emily Davis', clientName: 'Digital Media Group', clientRef: 'DIG-24', jobName: 'Audit - 2024', jobType: 'Audit', category: 'meeting', description: 'Prepare monthly management accounts', hours: 3.5, rate: 110, amount: 385, billable: true, status: 'invoiced' },
    { id: '11', date: '2024-01-25', teamMember: 'Mike Wilson', clientName: 'Construction Pros Ltd.', clientRef: 'CON-22', jobName: 'Payroll - W5  2025', jobType: 'Payroll', category: 'client work', description: 'Process bi-weekly payroll', hours: 2.0, rate: 85, amount: 170, billable: true, status: 'paid' },
    { id: '12', date: '2024-01-26', teamMember: 'Sarah Johnson', clientName: 'Financial Advisors Co.', clientRef: 'FIN-25', jobName: 'Payroll - January 2025', jobType: 'Payroll', category: 'meeting', description: 'Tax planning consultation', hours: 5.0, rate: 100, amount: 500, billable: true, status: 'not-invoiced' },
    { id: '13', date: '2024-01-27', teamMember: 'Emily Davis', clientName: 'Healthcare Systems Ltd.', clientRef: 'HEA-23', jobName: 'VAT (01/01/2025 - 28/02/2025)', jobType: 'VAT Return', category: 'client work', description: 'Internal controls audit', hours: 6.0, rate: 110, amount: 660, billable: true, status: 'invoiced' },
    { id: '14', date: '2024-01-28', teamMember: 'John Smith', clientName: 'Energy Solutions Corp.', clientRef: 'ENE-24', jobName: 'Annual Returns - 2024', jobType: 'Annual Returns', category: 'client work', description: 'Year-end financial audit', hours: 8.0, rate: 120, amount: 960, billable: true, status: 'not-invoiced' },
    { id: '15', date: '2024-01-29', teamMember: 'Mike Wilson', clientName: 'Transport & Logistics', clientRef: 'TRA-22', jobName: 'Income Tax Returns - 2024', jobType: 'Tax Return', category: 'client work', description: 'Monthly fleet cost analysis', hours: 3.0, rate: 85, amount: 255, billable: true, status: 'paid' },
    { id: '16', date: '2024-01-30', teamMember: 'Sarah Johnson', clientName: 'Hospitality Group plc', clientRef: 'HOS-25', jobName: 'Staff Payroll', jobType: 'Payroll', category: 'client work', description: 'Monthly staff payroll processing', hours: 2.5, rate: 100, amount: 250, billable: true, status: 'invoiced' },
    { id: '17', date: '2024-02-01', teamMember: 'Emily Davis', clientName: 'Water Savers Limited', clientRef: 'WAT-24', jobName: 'Management Reports', jobType: 'Management Accounts', category: 'client work', description: 'Quarterly management reporting', hours: 4.0, rate: 110, amount: 440, billable: true, status: 'not-invoiced' },
    { id: '18', date: '2024-02-02', teamMember: 'John Smith', clientName: 'Green Gardens Limited', clientRef: 'GRE-23', jobName: 'Company Secretarial', jobType: 'Company Secretarial', category: 'meeting', description: 'Board meeting preparation', hours: 1.5, rate: 120, amount: 180, billable: true, status: 'paid' },
    { id: '19', date: '2024-02-03', teamMember: 'Mike Wilson', clientName: 'Brown Enterprises', clientRef: 'BRO-25', jobName: 'Monthly Bookkeeping', jobType: 'Bookkeeping', category: 'client work', description: 'Bank reconciliation and data entry', hours: 5.0, rate: 85, amount: 425, billable: true, status: 'invoiced' },
    { id: '20', date: '2024-02-04', teamMember: 'Sarah Johnson', clientName: 'Tech Solutions Inc.', clientRef: 'TEC-22', jobName: 'VAT Return', jobType: 'VAT Return', category: 'client work', description: 'Quarterly VAT return preparation', hours: 3.0, rate: 100, amount: 300, billable: true, status: 'not-invoiced' }
  ];


  // Filter the time logs
  const filteredTimeLogs = useMemo(() => {
    return timeLogsData.filter(log => {
      if (filters.client && filters.client !== 'all-clients' && !log.clientName.toLowerCase().includes(filters.client.toLowerCase())) return false;
      if (filters.teamMember && filters.teamMember !== 'all-team-members' && !log.teamMember.toLowerCase().includes(filters.teamMember.toLowerCase())) return false;
      if (filters.status && filters.status !== 'all' && log.status !== filters.status) return false;
      if (filters.dateFrom && log.date < filters.dateFrom) return false;
      if (filters.dateTo && log.date > filters.dateTo) return false;
      return true;
    });
  }, [timeLogsData, filters]);


  // Group by client and job
  const groupedLogs = useMemo(() => {
    if (viewMode === 'flat') {
      return { 'All Entries': { 'All Jobs': filteredTimeLogs } };
    }


    if (viewMode === 'category') {
      const grouped: Record<string, Record<string, TimeLog[]>> = {};
      filteredTimeLogs.forEach(log => {
        const categoryKey = log.category.charAt(0).toUpperCase() + log.category.slice(1);
        if (!grouped[categoryKey]) {
          grouped[categoryKey] = {};
        }
        if (!grouped[categoryKey][log.clientName]) {
          grouped[categoryKey][log.clientName] = [];
        }
        grouped[categoryKey][log.clientName].push(log);
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
  const totalHours = filteredTimeLogs.reduce((sum, log) => sum + log.hours, 0);
  const totalAmount = filteredTimeLogs.reduce((sum, log) => sum + log.amount, 0);
  const uniqueClients = new Set(filteredTimeLogs.map(log => log.clientName)).size;
  const uniqueTeamMembers = new Set(filteredTimeLogs.map(log => log.teamMember)).size;


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
        <p className='text-[#381980] font-semibold'>Group by:</p>
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
          Category
        </Button>
      </div>

      </div>
      <button className='bg-[#017DB9] text-white py-[8px] px-[12px] rounded-[4px] flex items-center gap-[4px]'><Plus size={18}/> Time Log</button>
      </div>


    {/* Filters */}
     <div className="p-[6px] rounded-sm bg-[#E7E5F2] flex justify-between items-center">
       <div className="flex flex-wrap items-end gap-2">
        <div className="relative flex-1 w-full max-w-[200px]">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground"/>
                <Input placeholder="Search..." className="pl-10 w-[200px] bg-white text-[#381980] font-semibold placeholder:text-[#381980]"  />
              </div>
        <div className="space-y-2">
          {/* <Label htmlFor="client-filter">Client</Label> */}
          <Select
            value={filters.client}
            onValueChange={(value) => setFilters(prev => ({ ...prev, client: value }))}
            
          >
            <SelectTrigger className="w-32 bg-white text-[#381980] font-semibold">
              <SelectValue placeholder="Client Name" />
            </SelectTrigger>
            <SelectContent className=''>
              <SelectItem value="all-clients">Client Name</SelectItem>
              <SelectItem value="Water Savers Limited">Water Savers Limited</SelectItem>
              <SelectItem value="Green Gardens Limited">Green Gardens Limited</SelectItem>
              <SelectItem value="Brown Enterprises">Brown Enterprises</SelectItem>
              <SelectItem value="Tech Solutions Inc.">Tech Solutions Inc.</SelectItem>
              <SelectItem value="Smith & Associates">Smith & Associates</SelectItem>
              <SelectItem value="Marine Consulting Ltd.">Marine Consulting Ltd.</SelectItem>
              <SelectItem value="Digital Media Group">Digital Media Group</SelectItem>
              <SelectItem value="Construction Pros Ltd.">Construction Pros Ltd.</SelectItem>
              <SelectItem value="Financial Advisors Co.">Financial Advisors Co.</SelectItem>
              <SelectItem value="Healthcare Systems Ltd.">Healthcare Systems Ltd.</SelectItem>
              <SelectItem value="Energy Solutions Corp.">Energy Solutions Corp.</SelectItem>
              <SelectItem value="Transport & Logistics">Transport & Logistics</SelectItem>
              <SelectItem value="Hospitality Group plc">Hospitality Group plc</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Select
            value={filters.client}
            onValueChange={(value) => setFilters(prev => ({ ...prev, client: value }))}
            
          >
            <SelectTrigger className="w-28 bg-white text-[#381980] font-semibold">
              <SelectValue placeholder="Job Name" />
            </SelectTrigger>
            <SelectContent className=''>
              <SelectItem value="all-clients">Job Name</SelectItem>
              <SelectItem value="Water Savers Limited">Water Savers Limited</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Select
            value={filters.client}
            onValueChange={(value) => setFilters(prev => ({ ...prev, client: value }))}
            
          >
            <SelectTrigger className="w-28 bg-white text-[#381980] font-semibold">
              <SelectValue placeholder="Job Type" />
            </SelectTrigger>
            <SelectContent className=''>
              <SelectItem value="all-clients">Job Type</SelectItem>
              <SelectItem value="Water Savers Limited">Water Savers Limited</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Select
            value={filters.client}
            onValueChange={(value) => setFilters(prev => ({ ...prev, client: value }))}
            
          >
            <SelectTrigger className="w-32 bg-white text-[#381980] font-semibold">
              <SelectValue placeholder="Team Name" />
            </SelectTrigger>
            <SelectContent className=''>
              <SelectItem value="all-clients">Team Name</SelectItem>
              <SelectItem value="Water Savers Limited">Water Savers Limited</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Select
            value={filters.client}
            onValueChange={(value) => setFilters(prev => ({ ...prev, client: value }))}
            
          >
            <SelectTrigger className="w-24 bg-white text-[#381980] font-semibold">
              <SelectValue placeholder="Purpose" />
            </SelectTrigger>
            <SelectContent className=''>
              <SelectItem value="all-clients">Purpose</SelectItem>
              <SelectItem value="Water Savers Limited">Water Savers Limited</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Select
            value={filters.client}
            onValueChange={(value) => setFilters(prev => ({ ...prev, client: value }))}
            
          >
            <SelectTrigger className="w-24 bg-white text-[#381980] font-semibold">
              <SelectValue placeholder="Billable" />
            </SelectTrigger>
            <SelectContent className=''>
              <SelectItem value="all-clients">Billable</SelectItem>
              <SelectItem value="Water Savers Limited">Water Savers Limited</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Select
            value={filters.client}
            onValueChange={(value) => setFilters(prev => ({ ...prev, client: value }))}
            
          >
            <SelectTrigger className="w-24 bg-white text-[#381980] font-semibold">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent className=''>
              <SelectItem value="all-clients">Status</SelectItem>
              <SelectItem value="Water Savers Limited">Water Savers Limited</SelectItem>
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
           <Button variant="outline" className="bg-[#381980] w-[42px] rounded-sm text-primary-foreground p-2 ">
          <RefreshCw className="w-3 h-3 sm:w-4 sm:h-4" />
        </Button>
        </div>
        
      </div>
      <button className='text-[#fff] font-semibold bg-[#381980] w-[42px] rounded-sm text-primary-foreground p-2 hover:bg-primary/90'><Trash2 /></button>
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
                <TableHead className="p-3 text-foreground h-12 text-[#381980]"><input type="checkbox" name="" id="" /></TableHead>
                <TableHead className="p-3 text-foreground h-12 text-[#381980]">Date</TableHead>
                <TableHead className="p-3 text-foreground h-12 text-[#381980] whitespace-nowrap">Client Ref.</TableHead>
                <TableHead className="p-3 text-foreground h-12 text-[#381980] whitespace-nowrap">Client Name</TableHead>
                <TableHead className="p-3 text-foreground h-12 text-[#381980] whitespace-nowrap">Job Name</TableHead>
              </>
            ) : (
              <TableHead className="p-3 text-foreground h-12 text-[#381980]">
                {viewMode === 'clients' ? 'Client / Job' :
                  viewMode === 'jobTypes' ? 'Job Type / Client' :
                    viewMode === 'jobNames' ? 'Job Name / Client' :
                      viewMode === 'teamMembers' ? 'Team Member / Client' :
                        'Entry Details'}
              </TableHead>
            )}
            {visibleColumns.jobType && <TableHead className="p-3 text-foreground h-12 text-[#381980] whitespace-nowrap">Job Type</TableHead>}
            {visibleColumns.teamMember && <TableHead className="p-3 text-foreground h-12 text-[#381980] whitespace-nowrap">Team Name</TableHead>}
            {visibleColumns.description && <TableHead className="p-3 text-foreground h-12 text-[#381980]">Description</TableHead>}
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
                    <Move className="h-3 w-3 bg-red" color='#381980'/>
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
                    <div className="flex items-center gap-2">
                      {expandedClients.has(groupName) ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                      {groupName}
                    </div>
                  </TableCell>
                  {visibleColumns.teamMember && <TableCell className="p-4"></TableCell>}
                  {visibleColumns.jobType && <TableCell className="p-4"></TableCell>}
                  {visibleColumns.description && <TableCell className="p-4"></TableCell>}
                  {visibleColumns.amount && (
                    <TableCell className="p-4 text-right font-semibold">
                      {formatCurrency(Object.values(subGroups).flat().reduce((sum, log) => sum + log.amount, 0))}
                    </TableCell>
                  )}
                  {visibleColumns.billable && <TableCell className="p-4"></TableCell>}
                  {visibleColumns.status && <TableCell className="p-4"></TableCell>}
                  <TableCell className="p-4"></TableCell>
                </TableRow>
              )}

              {/* Sub-group + Log Rows */}
              {(viewMode === 'flat' || expandedClients.has(groupName)) &&
                Object.entries(subGroups).map(([subGroupName, logs]) => (
                  <React.Fragment key={`${groupName}-${subGroupName}`}>
                    {viewMode !== 'flat' && (
                      <TableRow className="border-b border-border bg-muted/20 h-12">
                        <TableCell className="p-4 pl-12 font-semibold text-foreground">
                          📋 {subGroupName}
                        </TableCell>
                        {visibleColumns.teamMember && <TableCell className="p-4"></TableCell>}
                        {visibleColumns.jobType && <TableCell className="p-4"></TableCell>}
                        {visibleColumns.description && <TableCell className="p-4"></TableCell>}
                        {visibleColumns.amount && (
                          <TableCell className="p-4 text-right font-semibold">
                            {formatCurrency(logs.reduce((sum, log) => sum + log.amount, 0))}
                          </TableCell>
                        )}
                        {visibleColumns.billable && <TableCell className="p-4"></TableCell>}
                        {visibleColumns.status && <TableCell className="p-4"></TableCell>}
                        <TableCell className="p-4"></TableCell>
                      </TableRow>
                    )}

                    {logs.map((log) => (
                      <TableRow key={log.id} className="border-b border-border hover:bg-muted/30 transition-colors h-12">
                        {viewMode === 'flat' ? (
                          <>
                            <TableCell className="p-4"><input type="checkbox" name="" id="" /></TableCell>
                            <TableCell className="p-4 text-muted-foreground">01/03/2025</TableCell>
                            <TableCell className="p-4 text-muted-foreground">{log.clientRef}</TableCell>
                            <TableCell className="p-4 text-muted-foreground underline whitespace-nowrap">Acme Consulting</TableCell>
                            <TableCell className="p-4 text-muted-foreground underline whitespace-nowrap">{log.jobName}</TableCell>
                             {visibleColumns.jobType && <TableCell className="p-4">{log.jobType}</TableCell>}

                          </>
                        ) : (
                          <TableCell className="p-4 text-muted-foreground pl-16">{log.description}</TableCell>
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
                        {/* {visibleColumns.jobType && <TableCell className="p-4">{log.jobType}</TableCell>} */}
                        {visibleColumns.description && <TableCell className="p-4 whitespace-nowrap">{log.description}</TableCell>}
                        {visibleColumns.description && <TableCell className="p-4">
                          <Badge variant="secondary" className="bg-[#EBF6ED] text-[#38A24B] border border-[#38A24B] whitespace-nowrap">Client Work</Badge>
                          {/* <Badge variant="secondary" className="bg-[#FEF8E5] text-[#F6BC00] border border-[#F6BC00] whitespace-nowrap">Admin</Badge>
                          <Badge variant="secondary" className="bg-[#E5F2F8] text-[#007CB8] border border-[#007CB8] whitespace-nowrap">Training</Badge>
                          <Badge variant="secondary" className="bg-[#F5F5F5] text-[#999999] border border-[#999999] whitespace-nowrap">Other</Badge> */}
                          </TableCell>}
                          {visibleColumns.description && <TableCell className="p-4">
                          <Badge variant="secondary" className="bg-[#EBF6ED] text-[#38A24B] border border-[#38A24B] whitespace-nowrap  rounded-full !p-[4px]"><Check size={14}/></Badge>
                          </TableCell>}
                        {visibleColumns.amount && (
                          <TableCell className="p-4 text-left">
                            <div className="bg-[#F3F4F6] text-[#666666] rounded-[3px] py-[3px] px-[8px] font-semibold">01:30:00</div>
                          </TableCell>
                        )}
                        {visibleColumns.status && (
                          <TableCell className="p-4 text-left">                           
                            <div className="bg-[#F3F4F6] text-[#666666] rounded-[3px] py-[3px] px-[8px] font-semibold text-center">€100.00</div>
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
                        <TableCell className="p-4 text-right">
                            <Settings className='ml-auto text-[#381980] cursor-pointer' size={16}/>
                          </TableCell>

                      </TableRow>
                    ))}
                  </React.Fragment>
                ))}
            </React.Fragment>
          ))}
        </TableBody>
      </Table>
    </div>
  </CardContent>
</Card>

    </div>
  );
};


export default AllTimeLogsTab;
