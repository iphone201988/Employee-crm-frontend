import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatCurrency } from '@/lib/currency';
import { formatDate } from '@/utils/dateFormat';
import { Receipt, Paperclip, ChevronLeft, ChevronRight, Plus, Clock, CheckCircle, ArrowUpDown, Eye } from 'lucide-react';
import { InvoicePreviewDialog } from './InvoicePreviewDialog';
import ClientNameLink from './ClientNameLink';

interface PaymentHistory {
  date: string;
  amount: number;
  type: 'issued' | 'payment' | 'paid';
}

interface InvoiceEntry {
  id: string;
  invoiceNumber: string;
  invoiceDate: string;
  clientName: string;
  invoiceTotal: number;
  status: 'paid' | 'issued' | 'part paid';
  paidAmount?: number;
  balance: number;
  paymentHistory?: PaymentHistory[];
  timeLogCount?: number;
}

interface InvoiceLogTabProps {
  invoiceEntries: InvoiceEntry[];
}

const InvoiceLogTab = ({ invoiceEntries }: InvoiceLogTabProps) => {
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceEntry | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [timeFilter, setTimeFilter] = useState('yearly');
  const [currentPeriod, setCurrentPeriod] = useState(0);
  const [isPartPaymentOpen, setIsPartPaymentOpen] = useState(false);
  const [selectedInvoiceForPayment, setSelectedInvoiceForPayment] = useState<InvoiceEntry | null>(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [isStatusTimelineOpen, setIsStatusTimelineOpen] = useState(false);
  const [selectedInvoiceForTimeline, setSelectedInvoiceForTimeline] = useState<InvoiceEntry | null>(null);
  const [sortConfig, setSortConfig] = useState<{ key: keyof InvoiceEntry; direction: 'asc' | 'desc' } | null>(null);
  const [clientFilter, setClientFilter] = useState('all-clients');
  const [statusFilter, setStatusFilter] = useState('all-statuses');
  const [isTimeLogsOpen, setIsTimeLogsOpen] = useState(false);
  const [selectedInvoiceForTimeLogs, setSelectedInvoiceForTimeLogs] = useState<InvoiceEntry | null>(null);

  // Sample data if no entries provided
  const sampleEntries: InvoiceEntry[] = [
    {
      id: '1',
      invoiceNumber: 'IN-101',
      invoiceDate: '2025-07-29',
      clientName: 'Water Savers Limited',
      invoiceTotal: 2583.00,
      status: 'paid',
      paidAmount: 2583.00,
      balance: 0,
      timeLogCount: 8,
      paymentHistory: [
        { date: '2025-07-29', amount: 2583.00, type: 'issued' },
        { date: '2025-07-30', amount: 2583.00, type: 'paid' }
      ]
    },
    {
      id: '2',
      invoiceNumber: 'IN-102',
      invoiceDate: '2025-07-30',
      clientName: 'Green Gardens Limited',
      invoiceTotal: 1250.00,
      status: 'issued',
      paidAmount: 0,
      balance: 1250.00,
      timeLogCount: 5,
      paymentHistory: [
        { date: '2025-07-30', amount: 1250.00, type: 'issued' }
      ]
    },
    {
      id: '3',
      invoiceNumber: 'IN-103',
      invoiceDate: '2025-07-31',
      clientName: 'Smith & Associates',
      invoiceTotal: 615.00,
      status: 'part paid',
      paidAmount: 300.00,
      balance: 315.00,
      timeLogCount: 3,
      paymentHistory: [
        { date: '2025-07-31', amount: 615.00, type: 'issued' },
        { date: '2025-08-01', amount: 300.00, type: 'payment' }
      ]
    },
    {
      id: '4',
      invoiceNumber: 'IN-104',
      invoiceDate: '2025-08-01',
      clientName: 'Brown Enterprises',
      invoiceTotal: 1885.00,
      status: 'issued',
      paidAmount: 0,
      balance: 1885.00,
      timeLogCount: 7,
      paymentHistory: [
        { date: '2025-08-01', amount: 1885.00, type: 'issued' }
      ]
    },
    {
      id: '5',
      invoiceNumber: 'IN-105',
      invoiceDate: '2025-08-02',
      clientName: 'Tech Solutions Ltd',
      invoiceTotal: 3250.00,
      status: 'paid',
      paidAmount: 3250.00,
      balance: 0,
      timeLogCount: 12,
      paymentHistory: [
        { date: '2025-08-02', amount: 3250.00, type: 'issued' },
        { date: '2025-08-03', amount: 3250.00, type: 'paid' }
      ]
    },
    {
      id: '6',
      invoiceNumber: 'IN-106',
      invoiceDate: '2025-08-03',
      clientName: 'Digital Marketing Co',
      invoiceTotal: 875.00,
      status: 'part paid',
      paidAmount: 500.00,
      balance: 375.00,
      timeLogCount: 4,
      paymentHistory: [
        { date: '2025-08-03', amount: 875.00, type: 'issued' },
        { date: '2025-08-04', amount: 500.00, type: 'payment' }
      ]
    },
    {
      id: '7',
      invoiceNumber: 'IN-107',
      invoiceDate: '2025-08-04',
      clientName: 'Phoenix Construction',
      invoiceTotal: 4120.00,
      status: 'issued',
      paidAmount: 0,
      balance: 4120.00,
      timeLogCount: 15,
      paymentHistory: [
        { date: '2025-08-04', amount: 4120.00, type: 'issued' }
      ]
    },
    {
      id: '8',
      invoiceNumber: 'IN-108',
      invoiceDate: '2025-08-05',
      clientName: 'Emerald Hospitality',
      invoiceTotal: 1950.00,
      status: 'paid',
      paidAmount: 1950.00,
      balance: 0,
      timeLogCount: 9,
      paymentHistory: [
        { date: '2025-08-05', amount: 1950.00, type: 'issued' },
        { date: '2025-08-06', amount: 1950.00, type: 'paid' }
      ]
    },
    {
      id: '9',
      invoiceNumber: 'IN-109',
      invoiceDate: '2025-08-06',
      clientName: 'Atlantic Fisheries',
      invoiceTotal: 685.00,
      status: 'part paid',
      paidAmount: 400.00,
      balance: 285.00,
      timeLogCount: 3,
      paymentHistory: [
        { date: '2025-08-06', amount: 685.00, type: 'issued' },
        { date: '2025-08-07', amount: 400.00, type: 'payment' }
      ]
    },
    {
      id: '10',
      invoiceNumber: 'IN-110',
      invoiceDate: '2025-08-07',
      clientName: 'Creative Design Studio',
      invoiceTotal: 1475.00,
      status: 'issued',
      paidAmount: 0,
      balance: 1475.00,
      timeLogCount: 6,
      paymentHistory: [
        { date: '2025-08-07', amount: 1475.00, type: 'issued' }
      ]
    }
  ];

  // Generate client refs based on client names
  const getClientRef = (clientName: string) => {
    const refMap: { [key: string]: string } = {
      'Water Savers Limited': 'WS001',
      'Green Gardens Limited': 'GG002',
      'Smith & Associates': 'SA003',
      'Brown Enterprises': 'BE004',
      'Tech Solutions Ltd': 'TS005',
      'Digital Marketing Co': 'DM006'
    };
    return refMap[clientName] || 'REF' + Math.floor(Math.random() * 1000);
  };

  const displayEntries = invoiceEntries.length > 0 ? invoiceEntries : sampleEntries;

  // Filter and sort entries based on time period and filters
  const filteredEntries = useMemo(() => {
    const now = new Date();

    let filtered = displayEntries.filter(entry => {
      const entryDate = new Date(entry.invoiceDate);

      // Time filter
      let timeFilterPassed = false;
      if (timeFilter === 'daily') {
        const targetDate = new Date(now);
        targetDate.setDate(now.getDate() + currentPeriod);
        timeFilterPassed = entryDate.toDateString() === targetDate.toDateString();
      } else if (timeFilter === 'weekly') {
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - now.getDay() + 1 + (currentPeriod * 7));
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        timeFilterPassed = entryDate >= startOfWeek && entryDate <= endOfWeek;
      } else if (timeFilter === 'monthly') {
        const targetMonth = new Date(now.getFullYear(), now.getMonth() + currentPeriod, 1);
        timeFilterPassed = entryDate.getFullYear() === targetMonth.getFullYear() &&
          entryDate.getMonth() === targetMonth.getMonth();
      } else { // yearly
        const targetYear = now.getFullYear() + currentPeriod;
        timeFilterPassed = entryDate.getFullYear() === targetYear;
      }

      // Client filter
      const clientFilterPassed = clientFilter === 'all-clients' || entry.clientName.toLowerCase().includes(clientFilter.toLowerCase());

      // Status filter
      const statusFilterPassed = statusFilter === 'all-statuses' || entry.status === statusFilter;

      return timeFilterPassed && clientFilterPassed && statusFilterPassed;
    });

    // Apply sorting
    if (sortConfig) {
      filtered.sort((a, b) => {
        let aVal = a[sortConfig.key];
        let bVal = b[sortConfig.key];

        if (sortConfig.key === 'invoiceDate') {
          aVal = new Date(aVal as string).getTime();
          bVal = new Date(bVal as string).getTime();
        }

        if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return filtered;
  }, [displayEntries, timeFilter, currentPeriod, sortConfig, clientFilter, statusFilter]);

  // Calculate totals based on filtered entries
  const totalInvoiced = filteredEntries.reduce((sum, entry) => sum + entry.invoiceTotal, 0);
  const totalPaid = filteredEntries.reduce((sum, entry) => sum + (entry.paidAmount || 0), 0);
  const totalPartial = filteredEntries.reduce((sum, entry) => {
    return sum + (entry.status === 'part paid' ? (entry.paidAmount || 0) : 0);
  }, 0);
  const totalOutstanding = filteredEntries.reduce((sum, entry) => sum + entry.balance, 0);

  const getCurrentPeriodInfo = () => {
    const now = new Date();

    if (timeFilter === 'daily') {
      const targetDate = new Date(now);
      targetDate.setDate(now.getDate() + currentPeriod);
      return targetDate.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
    } else if (timeFilter === 'weekly') {
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - now.getDay() + 1 + (currentPeriod * 7));
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      const formatDate = (date: Date) => date.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
      return `${formatDate(startOfWeek)} to ${formatDate(endOfWeek)}`;
    } else if (timeFilter === 'monthly') {
      const currentMonth = new Date(now.getFullYear(), now.getMonth() + currentPeriod, 1);
      return currentMonth.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
    } else {
      const currentYear = now.getFullYear() + currentPeriod;
      return `${currentYear}`;
    }
  };

  const getInvoiceAge = (invoiceDate: string) => {
    const now = new Date();
    const invoice = new Date(invoiceDate);
    const diffTime = Math.abs(now.getTime() - invoice.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return `${diffDays} days`;
  };

  const handlePeriodChange = (direction: 'prev' | 'next') => {
    setCurrentPeriod(prev => direction === 'prev' ? prev - 1 : prev + 1);
  };

  const handleTimeFilterChange = (newFilter: string) => {
    setTimeFilter(newFilter);
    setCurrentPeriod(0);
  };

  const handlePaymentLog = (invoice: InvoiceEntry) => {
    setSelectedInvoiceForTimeline(invoice);
    setIsStatusTimelineOpen(true);
  };

  const processPartPayment = () => {
    const amount = parseFloat(paymentAmount);
    if (amount > 0 && selectedInvoiceForPayment && amount <= selectedInvoiceForPayment.balance) {
      // In a real app, this would update the backend
      console.log('Processing payment:', { invoice: selectedInvoiceForPayment.invoiceNumber, amount });
      setIsPartPaymentOpen(false);
      setSelectedInvoiceForPayment(null);
      setPaymentAmount('');
    }
  };

  const handleViewInvoice = (invoice: InvoiceEntry) => {
    setSelectedInvoice(invoice);
    setIsPreviewOpen(true);
  };

  const handleStatusClick = (invoice: InvoiceEntry) => {
    setSelectedInvoiceForTimeline(invoice);
    setIsStatusTimelineOpen(true);
  };

  const markAsPaid = () => {
    if (selectedInvoiceForTimeline) {
      // In a real app, this would update the backend
      console.log('Marking as paid:', selectedInvoiceForTimeline.invoiceNumber);
      setIsStatusTimelineOpen(false);
      setSelectedInvoiceForTimeline(null);
    }
  };

  const handleSort = (key: keyof InvoiceEntry) => {
    setSortConfig(current => {
      if (current?.key === key) {
        return current.direction === 'asc'
          ? { key, direction: 'desc' }
          : null;
      }
      return { key, direction: 'asc' };
    });
  };

  const getSortIcon = (key: keyof InvoiceEntry) => {
    if (sortConfig?.key !== key) {
      return <ArrowUpDown className="h-4 w-4 opacity-50" />;
    }
    return <ArrowUpDown className={`h-4 w-4 ${sortConfig.direction === 'desc' ? 'rotate-180' : ''}`} />;
  };

  const getStatusBadge = (status: 'paid' | 'issued' | 'part paid') => {
    switch (status) {
      case 'paid':
        return <Badge className="bg-green-100 text-green-800 border-green-200">Paid</Badge>;
      case 'issued':
        return <Badge className="bg-blue-100 text-blue-800 border-blue-200">Issued</Badge>;
      case 'part paid':
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Part Paid</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const handleTimeLogsClick = (invoice: InvoiceEntry) => {
    setSelectedInvoiceForTimeLogs(invoice);
    setIsTimeLogsOpen(true);
  };

  // Sample time logs data for the selected invoice
  const getTimeLogsForInvoice = (invoiceId: string) => {
    return [
      { id: '1', date: '2024-01-15', teamMember: 'John Smith', client: 'Water Savers Limited', job: 'Tax Advisory', jobType: 'Tax Return', category: 'client work', description: 'Annual tax planning consultation', hours: 2.5, rate: 120, amount: 300, billable: true, status: 'not-invoiced' },
      { id: '2', date: '2024-01-16', teamMember: 'Sarah Johnson', client: 'Water Savers Limited', job: 'Compliance Review', jobType: 'Compliance', category: 'client work', description: 'Quarterly compliance check', hours: 3.0, rate: 100, amount: 300, billable: true, status: 'invoiced' },
      { id: '3', date: '2024-01-17', teamMember: 'Mike Wilson', client: 'Water Savers Limited', job: 'Financial Planning', jobType: 'Advisory', category: 'meeting', description: 'Investment strategy review', hours: 4.0, rate: 85, amount: 340, billable: true, status: 'not-invoiced' },
      { id: '4', date: '2024-01-18', teamMember: 'Emily Davis', client: 'Water Savers Limited', job: 'Document Review', jobType: 'Compliance', category: 'client work', description: 'Review legal documents', hours: 1.5, rate: 110, amount: 165, billable: true, status: 'invoiced' },
      { id: '5', date: '2024-01-19', teamMember: 'John Smith', client: 'Water Savers Limited', job: 'Client Meeting', jobType: 'Meeting', category: 'meeting', description: 'Quarterly review meeting', hours: 2.0, rate: 120, amount: 240, billable: true, status: 'paid' }
    ];
  };

  return (
    <div className="space-y-6">
      {/* Dashboard Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="h-full">
          <CardContent className="p-4">
            <div className="text-2xl font-bold !text-[#381980]">
              {formatCurrency(totalInvoiced)}
            </div>
            <p className="text-sm text-muted-foreground">Total Invoiced</p>
          </CardContent>
        </Card>
        <Card className="h-full">
          <CardContent className="p-4">
            <div className="text-2xl font-bold !text-[#381980]">
              {formatCurrency(totalPaid)}
            </div>
            <p className="text-sm text-muted-foreground">Total Paid</p>
          </CardContent>
        </Card>
        <Card className="h-full">
          <CardContent className="p-4">
            <div className="text-2xl font-bold !text-[#381980]">
              {formatCurrency(totalPartial)}
            </div>
            <p className="text-sm text-muted-foreground">Total Partial</p>
          </CardContent>
        </Card>
        <Card className="h-full">
          <CardContent className="p-4">
            <div className="text-2xl font-bold !text-[#381980]">
              {formatCurrency(totalOutstanding)}
            </div>
            <p className="text-sm text-muted-foreground">Outstanding</p>
          </CardContent>
        </Card>
      </div>


      {/* Time Filter Buttons */}
      <div className="flex items-center justify-center">
        <div className="flex items-center gap-1 bg-muted rounded-md p-1">
          <Button
            variant={timeFilter === 'daily' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => handleTimeFilterChange('daily')}
            className="h-8 px-3"
          >
            Daily
          </Button>
          <Button
            variant={timeFilter === 'weekly' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => handleTimeFilterChange('weekly')}
            className="h-8 px-3"
          >
            Weekly
          </Button>
          <Button
            variant={timeFilter === 'monthly' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => handleTimeFilterChange('monthly')}
            className="h-8 px-3"
          >
            Monthly
          </Button>
          <Button
            variant={timeFilter === 'yearly' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => handleTimeFilterChange('yearly')}
            className="h-8 px-3"
          >
            Yearly
          </Button>
        </div>
      </div>

      {/* Date Range Navigation */}
      <div className="flex items-center justify-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => handlePeriodChange('prev')}
          className="h-8 w-8 p-0"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="text-sm font-medium whitespace-nowrap">
          {getCurrentPeriodInfo()}
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={() => handlePeriodChange('next')}
          className="h-8 w-8 p-0"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      <Card>
        <CardContent className="pt-6">
          {/* Filters */}
          <div className="flex gap-4 mb-6">
            <div className="flex flex-col gap-2">
              <Label htmlFor="client-filter">Client Name</Label>
              <Select value={clientFilter} onValueChange={setClientFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="All Clients" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all-clients">All Clients</SelectItem>
                  <SelectItem value="Water Savers Limited">Water Savers Limited</SelectItem>
                  <SelectItem value="Green Gardens Limited">Green Gardens Limited</SelectItem>
                  <SelectItem value="Smith & Associates">Smith & Associates</SelectItem>
                  <SelectItem value="Brown Enterprises">Brown Enterprises</SelectItem>
                  <SelectItem value="Tech Solutions Ltd">Tech Solutions Ltd</SelectItem>
                  <SelectItem value="Digital Marketing Co">Digital Marketing Co</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="status-filter">Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all-statuses">All Statuses</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="issued">Issued</SelectItem>
                  <SelectItem value="part paid">Part Paid</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {filteredEntries.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No invoices found for the selected period.</p>
              <p className="text-sm text-gray-400 mt-1">
                Try selecting a different time period or process entries from the WIP Report to create invoices.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="border-r p-3 font-medium text-foreground h-12">
                      <Button
                        variant="ghost"
                        onClick={() => handleSort('invoiceNumber')}
                        className="flex items-center gap-2 p-0 h-auto font-medium hover:bg-transparent"
                      >
                        Invoice No. {getSortIcon('invoiceNumber')}
                      </Button>
                    </TableHead>
                    <TableHead className="border-r p-3 font-medium text-foreground h-12">
                      <Button
                        variant="ghost"
                        onClick={() => handleSort('invoiceDate')}
                        className="flex items-center gap-2 p-0 h-auto font-medium hover:bg-transparent"
                      >
                        Invoice Date {getSortIcon('invoiceDate')}
                      </Button>
                    </TableHead>
                    <TableHead className="border-r p-3 font-medium text-foreground h-12">Client Ref.</TableHead>
                    <TableHead className="border-r p-3 font-medium text-foreground h-12">
                      <Button
                        variant="ghost"
                        onClick={() => handleSort('clientName')}
                        className="flex items-center gap-2 p-0 h-auto font-medium hover:bg-transparent"
                      >
                        Client Name {getSortIcon('clientName')}
                      </Button>
                    </TableHead>
                    <TableHead className="border-r p-3 font-medium text-foreground h-12">
                      <Button
                        variant="ghost"
                        onClick={() => handleSort('invoiceTotal')}
                        className="flex items-center gap-2 p-0 h-auto font-medium hover:bg-transparent"
                      >
                        Net {getSortIcon('invoiceTotal')}
                      </Button>
                    </TableHead>
                    <TableHead className="border-r p-3 font-medium text-foreground h-12">VAT</TableHead>
                    <TableHead className="border-r p-3 font-medium text-foreground h-12">
                      <Button
                        variant="ghost"
                        onClick={() => handleSort('invoiceTotal')}
                        className="flex items-center gap-2 p-0 h-auto font-medium hover:bg-transparent"
                      >
                        Gross {getSortIcon('invoiceTotal')}
                      </Button>
                    </TableHead>
                    <TableHead className="border-r p-3 font-medium text-foreground h-12">
                      <Button
                        variant="ghost"
                        onClick={() => handleSort('balance')}
                        className="flex items-center gap-2 p-0 h-auto font-medium hover:bg-transparent"
                      >
                        Balance {getSortIcon('balance')}
                      </Button>
                    </TableHead>
                    <TableHead className="border-r p-3 font-medium text-foreground h-12">Invoice Age</TableHead>
                    <TableHead className="border-r p-3 font-medium text-foreground h-12">Time Logs</TableHead>
                    <TableHead className="border-r p-3 font-medium text-foreground h-12">Actions</TableHead>
                    <TableHead className="p-3 font-medium text-foreground h-12">
                      <Button
                        variant="ghost"
                        onClick={() => handleSort('status')}
                        className="flex items-center gap-2 p-0 h-auto font-medium hover:bg-transparent"
                      >
                        Status {getSortIcon('status')}
                      </Button>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredEntries.map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell className="font-medium border-r">{entry.invoiceNumber}</TableCell>
                      <TableCell className="border-r">{formatDate(entry.invoiceDate)}</TableCell>
                      <TableCell className="border-r">{getClientRef(entry.clientName)}</TableCell>
                      <TableCell className="border-r">{entry.clientName}</TableCell>
                      <TableCell className="border-r">{formatCurrency(entry.invoiceTotal / 1.23)}</TableCell>
                      <TableCell className="border-r">{formatCurrency(entry.invoiceTotal - (entry.invoiceTotal / 1.23))}</TableCell>
                      <TableCell className="border-r">{formatCurrency(entry.invoiceTotal)}</TableCell>
                      <TableCell className="border-r">
                        <span className={`font-medium ${entry.balance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                          {formatCurrency(entry.balance)}
                        </span>
                      </TableCell>
                      <TableCell className="border-r text-sm text-muted-foreground">
                        {getInvoiceAge(entry.invoiceDate)}
                      </TableCell>
                      <TableCell className="border-r text-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleTimeLogsClick(entry)}
                          className="text-blue-600 hover:text-blue-800 font-medium"
                        >
                          {entry.timeLogCount || 0}
                        </Button>
                      </TableCell>
                      <TableCell className="border-r">
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewInvoice(entry)}
                            className="text-xs"
                          >
                            View Invoice
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handlePaymentLog(entry)}
                            className="text-xs"
                          >
                            Invoice Log
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell className="p-4 text-left">
                        {getStatusBadge(entry.status)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Invoice Preview Dialog */}
      {selectedInvoice && (
        <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
            <DialogHeader>
              <DialogTitle>Invoice Preview - {selectedInvoice.invoiceNumber}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="border rounded-lg overflow-hidden">
                <img
                  src="/lovable-uploads/4406f6f5-c6e3-4aa7-8455-a31e63b73c4c.png"
                  alt={`Invoice ${selectedInvoice.invoiceNumber}`}
                  className="w-full h-auto"
                />
              </div>
              <div className="border-t pt-4">
                <h3 className="font-medium mb-2">Attachments</h3>
                <div className="flex items-center gap-2 p-2 border rounded">
                  <Paperclip className="h-4 w-4" />
                  <span className="text-sm">Invoice_{selectedInvoice.invoiceNumber}.pdf</span>
                  <Button variant="outline" size="sm" className="ml-auto">
                    Download
                  </Button>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Payment Log Dialog */}
      <Dialog open={isStatusTimelineOpen} onOpenChange={setIsStatusTimelineOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Invoice Log</DialogTitle>
          </DialogHeader>
          {selectedInvoiceForTimeline && (
            <div className="space-y-6">
              {/* Invoice Details */}
              <div className="grid grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
                <div>
                  <p className="text-sm text-muted-foreground">Invoice Amount</p>
                  <p className="text-xl font-semibold">{formatCurrency(selectedInvoiceForTimeline.invoiceTotal)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Invoice Balance</p>
                  <p className="text-xl font-semibold">{formatCurrency(selectedInvoiceForTimeline.balance)}</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="relative">
                  {/* Timeline Line */}
                  <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border"></div>

                  <div className="space-y-4">
                    {(selectedInvoiceForTimeline.paymentHistory || []).map((event, index) => (
                      <div key={index} className="flex items-start gap-3">
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-background border-2 border-border flex items-center justify-center relative z-10">
                          {event.type === 'issued' ? (
                            <Receipt className="h-4 w-4 text-blue-500" />
                          ) : event.type === 'payment' ? (
                            <Clock className="h-4 w-4 text-yellow-500" />
                          ) : (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0 pb-4">
                          <div className="bg-card border rounded-lg p-3">
                            <div className="flex justify-between items-start mb-1">
                              <div className="font-medium">
                                {event.type === 'issued'
                                  ? 'Invoice Generated'
                                  : event.type === 'payment'
                                    ? 'Part Payment Received'
                                    : 'Payment Completed'
                                }
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {formatDate(event.date)}
                              </div>
                            </div>
                            <div className="flex justify-between items-center">
                              <div className="text-lg font-semibold text-primary">
                                {formatCurrency(event.amount)}
                              </div>
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-6 text-xs"
                                onClick={() => {/* Handle edit */ }}
                              >
                                Edit
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 border-t pt-6">
                <div className="space-y-3">
                  <Label className="text-base font-semibold">Log Payment</Label>
                  <div className="flex flex-col gap-2">
                    <Button
                      onClick={() => {
                        setPaymentAmount(selectedInvoiceForTimeline.balance.toString());
                        setSelectedInvoiceForPayment(selectedInvoiceForTimeline);
                        setIsPartPaymentOpen(true);
                      }}
                      className="w-full"
                      disabled={selectedInvoiceForTimeline.status === 'paid'}
                    >
                      Log Full Payment
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setPaymentAmount('');
                        setSelectedInvoiceForPayment(selectedInvoiceForTimeline);
                        setIsPartPaymentOpen(true);
                      }}
                      className="w-full"
                      disabled={selectedInvoiceForTimeline.status === 'paid'}
                    >
                      Log Part Payment
                    </Button>
                  </div>
                </div>

                <div className="space-y-3">
                  <Label className="text-base font-semibold">Update Status</Label>
                  <div className="flex flex-col gap-2">
                    <Select disabled={selectedInvoiceForTimeline.status === 'paid'}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="issued">Issued</SelectItem>
                        <SelectItem value="part paid">Part Paid</SelectItem>
                        <SelectItem value="paid">Paid</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button
                      variant="outline"
                      className="w-full"
                      disabled={selectedInvoiceForTimeline.status === 'paid'}
                    >
                      Update Status
                    </Button>
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <Button
                  onClick={() => setIsStatusTimelineOpen(false)}
                >
                  Save & Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Part Payment Dialog */}
      <Dialog open={isPartPaymentOpen} onOpenChange={setIsPartPaymentOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Log Payment</DialogTitle>
          </DialogHeader>
          {selectedInvoiceForPayment && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Outstanding Balance</Label>
                <div className="p-2 bg-muted rounded font-medium text-red-600">
                  {formatCurrency(selectedInvoiceForPayment.balance)}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Payment Amount</Label>
                  <Input
                    type="number"
                    placeholder="0.00"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    max={selectedInvoiceForPayment.balance}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Remaining Balance</Label>
                  <div className="p-2 bg-muted rounded border">
                    €{(selectedInvoiceForPayment.balance - (parseFloat(paymentAmount) || 0)).toFixed(2)}
                  </div>
                </div>
              </div>
              <div className="flex justify-end">
                <Button
                  onClick={processPartPayment}
                  disabled={!paymentAmount || parseFloat(paymentAmount) <= 0 || parseFloat(paymentAmount) > selectedInvoiceForPayment.balance}
                >
                  Save & Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Time Logs Dialog */}
      <Dialog open={isTimeLogsOpen} onOpenChange={setIsTimeLogsOpen}>
        <DialogContent className="max-w-[85vw] max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Time Logs for Invoice {selectedInvoiceForTimeLogs?.invoiceNumber}</DialogTitle>
          </DialogHeader>
          {selectedInvoiceForTimeLogs && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4 p-4 bg-muted rounded-lg">
                <div>
                  <Label className="text-sm text-muted-foreground">Client</Label>
                  <div className="font-medium">{selectedInvoiceForTimeLogs.clientName}</div>
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">Invoice Total</Label>
                  <div className="font-medium">{formatCurrency(selectedInvoiceForTimeLogs.invoiceTotal)}</div>
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">Time Logs Count</Label>
                  <div className="font-medium">{selectedInvoiceForTimeLogs.timeLogCount || 0}</div>
                </div>
              </div>

              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Team Member</TableHead>
                      <TableHead>Client</TableHead>
                      <TableHead>Job</TableHead>
                      <TableHead>Job Type</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead className="text-right">Hours</TableHead>
                      <TableHead className="text-right">Rate</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead>Billable</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {getTimeLogsForInvoice(selectedInvoiceForTimeLogs.id).map((log) => (
                      <TableRow key={log.id}>
                        <TableCell>{formatDate(log.date)}</TableCell>
                        <TableCell>{log.teamMember}</TableCell>
                        <TableCell>{log.client}</TableCell>
                        <TableCell>{log.job}</TableCell>
                        <TableCell>{log.jobType}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">
                            {log.category.charAt(0).toUpperCase() + log.category.slice(1)}
                          </Badge>
                        </TableCell>
                        <TableCell className="max-w-xs truncate">{log.description}</TableCell>
                        <TableCell className="text-right">{log.hours}</TableCell>
                        <TableCell className="text-right">{formatCurrency(log.rate)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(log.amount)}</TableCell>
                        <TableCell>
                          <Badge variant={log.billable ? "default" : "secondary"} className="text-xs">
                            {log.billable ? 'Yes' : 'No'}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default InvoiceLogTab;