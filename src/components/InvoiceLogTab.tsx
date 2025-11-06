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
import jsPDF from 'jspdf';
import { useGetInvoicesQuery, useCreateInvoiceLogMutation, useUpdateInvoiceStatusMutation } from '@/store/wipApi';
import { useGetDropdownOptionsQuery } from '@/store/teamApi';
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
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [timeFilter, setTimeFilter] = useState('yearly');
  const [currentPeriod, setCurrentPeriod] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [isPartPaymentOpen, setIsPartPaymentOpen] = useState(false);
  const [selectedInvoiceForPayment, setSelectedInvoiceForPayment] = useState<InvoiceEntry | null>(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [createInvoiceLog, { isLoading: isCreatingLog }] = useCreateInvoiceLogMutation();
  const [updateInvoiceStatus, { isLoading: isUpdatingStatus }] = useUpdateInvoiceStatusMutation();
  const [isStatusTimelineOpen, setIsStatusTimelineOpen] = useState(false);
  const [selectedInvoiceForTimeline, setSelectedInvoiceForTimeline] = useState<InvoiceEntry | null>(null);
  const [statusToUpdate, setStatusToUpdate] = useState<'issued' | 'paid' | 'partPaid' | ''>('');
  const [sortConfig, setSortConfig] = useState<{ key: keyof InvoiceEntry; direction: 'asc' | 'desc' } | null>(null);
  const [clientIdFilter, setClientIdFilter] = useState('all-clients');
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

  const period = useMemo(() => {
    const now = new Date();
    if (timeFilter === 'daily') {
      const d = new Date(now);
      d.setDate(now.getDate() + currentPeriod);
      const start = new Date(d.setHours(0, 0, 0, 0));
      const end = new Date(d.setHours(23, 59, 59, 999));
      return { startDate: start.toISOString().split('T')[0], endDate: end.toISOString().split('T')[0] };
    }
    if (timeFilter === 'weekly') {
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - now.getDay() + 1 + currentPeriod * 7);
      startOfWeek.setHours(0, 0, 0, 0);
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      endOfWeek.setHours(23, 59, 59, 999);
      return { startDate: startOfWeek.toISOString().split('T')[0], endDate: endOfWeek.toISOString().split('T')[0] };
    }
    if (timeFilter === 'monthly') {
      const ref = new Date(now.getFullYear(), now.getMonth() + currentPeriod, 1);
      const start = new Date(ref.getFullYear(), ref.getMonth(), 1, 0, 0, 0, 0);
      const end = new Date(ref.getFullYear(), ref.getMonth() + 1, 0, 23, 59, 59, 999);
      return { startDate: start.toISOString().split('T')[0], endDate: end.toISOString().split('T')[0] };
    }
    const year = now.getFullYear() + currentPeriod;
    const start = new Date(year, 0, 1, 0, 0, 0, 0);
    const end = new Date(year, 11, 31, 23, 59, 59, 999);
    return { startDate: start.toISOString().split('T')[0], endDate: end.toISOString().split('T')[0] };
  }, [timeFilter, currentPeriod]);

  // Fetch clients for dropdown options
  const { data: clientsResp } = useGetDropdownOptionsQuery('client');
  const clientOptions = useMemo(() => {
    const arr = (clientsResp?.data?.client || clientsResp?.data?.clients || []) as any[];
    return Array.isArray(arr) ? arr : [];
  }, [clientsResp]);

  // Map UI status to backend status param
  const statusParam = statusFilter !== 'all-statuses' ? (statusFilter === 'part paid' ? 'partPaid' : statusFilter) : undefined;

  const { data: invoicesResp, isLoading, isError } = useGetInvoicesQuery({
    page,
    limit,
    clientId: clientIdFilter !== 'all-clients' ? clientIdFilter : undefined,
    status: statusParam,
    startDate: period.startDate,
    endDate: period.endDate,
  });

  const displayEntries = useMemo(() => {
    const apiData = invoicesResp?.data || [];
    if (apiData.length === 0 && invoiceEntries.length > 0) return invoiceEntries;
    return apiData.map((inv: any) => {
      const total = Number(inv.totalAmount || 0);
      const paid = Number(inv.paidAmount || 0);
      const status: 'paid' | 'issued' | 'part paid' = paid >= total ? 'paid' : paid > 0 ? 'part paid' : 'issued';
      return {
        id: String(inv._id),
        invoiceNumber: inv.invoiceNo,
        invoiceDate: inv.date,
        clientName: inv.client?.name || '-',
        clientRef: inv.client?.clientRef || '-',
        invoiceTotal: total,
        status,
        paidAmount: paid,
        balance: Math.max(0, total - paid),
        timeLogCount: Array.isArray(inv.timeLogs) ? inv.timeLogs.length : 0,
        _raw: inv,
      } as any;
    });
  }, [invoicesResp, invoiceEntries]);

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

      // Server-side filters handle client and status; keep always true here to avoid double filtering
      const clientFilterPassed = true;
      const statusFilterPassed = true;

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
  }, [displayEntries, timeFilter, currentPeriod, sortConfig]);

  // Totals from API summary
  const totalInvoiced = Number(invoicesResp?.summary?.totalInvoiced || 0);
  const totalPaid = Number(invoicesResp?.summary?.totalPaid || 0);
  const totalPartial = Number(invoicesResp?.summary?.totalPartial || 0);
  const totalOutstanding = Number(invoicesResp?.summary?.totalOutstanding || 0);

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
    const raw = (displayEntries.find(e => e.id === invoice.id) as any)?._raw;
    const backendStatus = raw?.status as string | undefined;
    // Convert backend status to Select display value ('partPaid' -> 'part paid')
    const normalized = backendStatus === 'partPaid' ? 'part paid' : backendStatus === 'paid' ? 'paid' : 'issued';
    setStatusToUpdate(normalized as any);
  };

  const processPartPayment = async () => {
    const amount = parseFloat(paymentAmount);
    if (amount > 0 && selectedInvoiceForPayment && amount <= selectedInvoiceForPayment.balance) {
      const isFull = Math.abs(amount - (selectedInvoiceForPayment.balance || 0)) < 1e-6;
      const action = isFull ? 'compeleted' : 'partialPayment';
      const invoiceId = (displayEntries.find(e => e.id === selectedInvoiceForPayment.id) as any)?._raw?._id || selectedInvoiceForPayment.id;
      const date = new Date().toISOString().split('T')[0];
      try {
        await createInvoiceLog({ invoiceId, action, amount, date }).unwrap();
        setIsPartPaymentOpen(false);
        setSelectedInvoiceForPayment(null);
        setPaymentAmount('');
      } catch (e) {
        console.error('Failed to create invoice log', e);
      }
    }
  };

  const generateInvoicePdf = (entry: InvoiceEntry, mode: 'preview' | 'download' = 'preview') => {
    const doc = new jsPDF();
    const raw: any = (displayEntries.find(e => e.id === entry.id) as any)?._raw || {};
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 20;
    const contentWidth = pageWidth - (margin * 2);
    let y = margin;
    const lineHeight = 7;
    
    // Helper function to add text with word wrap
    const addText = (text: string, x: number, yPos: number, options: any = {}) => {
      const maxWidth = options.maxWidth || (pageWidth - x - margin);
      const lines = doc.splitTextToSize(text, maxWidth);
      doc.text(lines, x, yPos, options);
      return yPos + (lines.length * (options.fontSize || 11) * 0.35);
    };

    // Header Background
    doc.setFillColor(56, 25, 128); // #381980
    doc.rect(0, 0, pageWidth, 35, 'F');
    
    // Invoice Title
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(28);
    doc.setFont('helvetica', 'bold');
    doc.text('INVOICE', pageWidth / 2, 22, { align: 'center' });
    
    // Reset text color
    doc.setTextColor(0, 0, 0);
    y = 50;

    // Invoice Details Section
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Invoice Details', margin, y);
    y += lineHeight + 3;

    // Draw box for invoice details
    const detailsBoxY = y;
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.5);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    
    const invoiceDate = new Date(entry.invoiceDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' });
    const invoiceDateY = addText(`Invoice Number:`, margin + 5, y, { fontSize: 10 });
    doc.setFont('helvetica', 'bold');
    addText(`${entry.invoiceNumber}`, margin + 55, invoiceDateY - 4, { fontSize: 10 });
    doc.setFont('helvetica', 'normal');
    y = addText(`Invoice Date: ${invoiceDate}`, margin + 5, invoiceDateY + 2, { fontSize: 10 });
    
    const statusText = entry.status === 'paid' ? 'Paid' : entry.status === 'part paid' ? 'Part Paid' : 'Issued';
    const statusY = addText(`Status:`, margin + 5, y + 2, { fontSize: 10 });
    doc.setFont('helvetica', 'bold');
    addText(statusText, margin + 30, statusY - 4, { fontSize: 10 });
    doc.setFont('helvetica', 'normal');
    
    // Box height
    const detailsBoxHeight = (statusY - detailsBoxY) + 8;
    doc.rect(margin, detailsBoxY - 5, contentWidth, detailsBoxHeight, 'S');
    y = detailsBoxY + detailsBoxHeight + 10;

    // Client Information Section
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Bill To', margin, y);
    y += lineHeight + 3;
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const clientName = entry.clientName || '-';
    const clientRef = (entry as any).clientRef ? ` (${(entry as any).clientRef})` : '';
    const clientAddress = raw?.client?.address || '';
    
    const clientBoxY = y;
    y = addText(clientName + clientRef, margin + 5, y, { fontSize: 10 });
    if (clientAddress) {
      y = addText(clientAddress, margin + 5, y + 2, { fontSize: 10, maxWidth: 80 });
    }
    const clientBoxHeight = (y - clientBoxY) + 8;
    doc.rect(margin, clientBoxY - 5, contentWidth / 2 - 5, clientBoxHeight, 'S');
    
    // Amounts
    const net = Number(raw?.netAmount ?? entry.invoiceTotal);
    const vat = Number(raw?.vatAmount ?? 0);
    const vatPercentage = raw?.vatPercentage ?? 0;
    const expense = Number(raw?.expenseAmount ?? 0);
    const total = Number(raw?.totalAmount ?? entry.invoiceTotal);
    const paid = Number(raw?.paidAmount ?? entry.paidAmount ?? 0);
    const balance = Math.max(0, total - paid);

    // Summary Box (right side)
    const summaryBoxX = pageWidth / 2 + 5;
    const summaryBoxY = clientBoxY - 5;
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Summary', summaryBoxX + 5, clientBoxY);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    let summaryY = clientBoxY + lineHeight + 3;
    
    const formatAmount = (label: string, amount: number, isBold = false) => {
      doc.setFont('helvetica', isBold ? 'bold' : 'normal');
      const text = `${label}:`;
      doc.text(text, summaryBoxX + 5, summaryY);
      const amountText = `€${amount.toFixed(2)}`;
      const amountWidth = doc.getTextWidth(amountText);
      doc.text(amountText, summaryBoxX + contentWidth / 2 - amountWidth - 10, summaryY);
      summaryY += lineHeight + 1;
    };

    formatAmount('Net Amount', net);
    formatAmount(`VAT (${vatPercentage}%)`, vat);
    if (expense > 0) {
      formatAmount('Expenses', expense);
    }
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.5);
    doc.line(summaryBoxX + 5, summaryY, summaryBoxX + contentWidth / 2 - 10, summaryY);
    summaryY += 3;
    formatAmount('Total', total, true);
    if (paid > 0) {
      formatAmount('Paid', paid);
      doc.setDrawColor(200, 0, 0);
      doc.line(summaryBoxX + 5, summaryY, summaryBoxX + contentWidth / 2 - 10, summaryY);
      summaryY += 3;
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(200, 0, 0);
      formatAmount('Balance Due', balance, true);
      doc.setTextColor(0, 0, 0);
    }
    
    const summaryBoxHeight = Math.max(summaryY - summaryBoxY + 5, clientBoxHeight);
    doc.setDrawColor(200, 200, 200);
    doc.rect(summaryBoxX, summaryBoxY, contentWidth / 2 - 5, summaryBoxHeight, 'S');
    
    y = Math.max(clientBoxY + clientBoxHeight, summaryBoxY + summaryBoxHeight) + 15;

    // Time Logs Section (if available)
    const timeLogs = Array.isArray(raw?.timeLogs) ? raw.timeLogs : [];
    if (timeLogs.length > 0 && y < 250) {
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('Time Logs', margin, y);
      y += lineHeight + 3;

      // Table header
      doc.setFillColor(245, 245, 245);
      doc.rect(margin, y - 5, contentWidth, 10, 'F');
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text('Date', margin + 3, y);
      doc.text('Member', margin + 30, y);
      doc.text('Job', margin + 70, y);
      doc.text('Hours', margin + 110, y);
      doc.text('Rate', margin + 130, y);
      doc.text('Amount', margin + 155, y);
      y += 8;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      
      // Limit to show top 10 time logs to avoid overflow
      const logsToShow = timeLogs.slice(0, 10);
      logsToShow.forEach((log: any, idx: number) => {
        if (y > 270) return; // Prevent overflow
        
        const logDate = new Date(log.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
        const memberName = log.user?.name || '-';
        const jobName = log.job?.name || '-';
        const hours = (Number(log.duration || 0) / 3600).toFixed(2);
        const rate = Number(log.rate || 0).toFixed(2);
        const amount = Number(log.amount || 0).toFixed(2);

        doc.text(logDate.substring(0, 8), margin + 3, y);
        doc.text(memberName.substring(0, 15), margin + 30, y);
        doc.text(jobName.substring(0, 20), margin + 70, y);
        doc.text(hours, margin + 110, y);
        doc.text(`€${rate}`, margin + 130, y);
        doc.text(`€${amount}`, margin + 155, y);
        
        y += lineHeight;
        
        // Draw line between rows
        doc.setDrawColor(230, 230, 230);
        doc.line(margin, y - 2, margin + contentWidth, y - 2);
      });
      
      if (timeLogs.length > 10) {
        y += 3;
        doc.setFontSize(8);
        doc.setFont('helvetica', 'italic');
        doc.text(`... and ${timeLogs.length - 10} more entries`, margin + 3, y);
      }
      
      y += 10;
    }

    // Footer
    doc.setDrawColor(200, 200, 200);
    doc.line(margin, y, pageWidth - margin, y);
    y += 8;
    doc.setFontSize(8);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(128, 128, 128);
    doc.text('Thank you for your business!', pageWidth / 2, y, { align: 'center' });
    y += 4;
    doc.text(`Generated on ${new Date().toLocaleDateString('en-GB')}`, pageWidth / 2, y, { align: 'center' });

    if (mode === 'download') {
      doc.save(`Invoice_${entry.invoiceNumber}.pdf`);
    } else {
      const blob = doc.output('blob');
      const url = URL.createObjectURL(blob);
      setPdfUrl(prev => { if (prev) URL.revokeObjectURL(prev); return url; });
    }
  };

  const handleViewInvoice = (invoice: InvoiceEntry) => {
    setSelectedInvoice(invoice);
    setIsPreviewOpen(true);
    generateInvoicePdf(invoice, 'preview');
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
              <Label htmlFor="client-filter">Client</Label>
              <Select value={clientIdFilter} onValueChange={setClientIdFilter}>
                <SelectTrigger className="w-60">
                  <SelectValue placeholder="All Clients" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all-clients">All Clients</SelectItem>
                  {clientOptions.map((c: any) => (
                    <SelectItem key={c._id} value={c._id}>
                      {c.name}{c.clientRef ? ` (${c.clientRef})` : ''}
                    </SelectItem>
                  ))}
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
                      <TableCell className="border-r">{(entry as any).clientRef || '-'}</TableCell>
                      <TableCell className="border-r">
                        <ClientNameLink 
                          clientName={entry.clientName}
                          ciientId={(entry as any)?._raw?.clientId || (entry as any)?._raw?.client?._id}
                        />
                      </TableCell>
                      <TableCell className="border-r">{formatCurrency(((entry as any)._raw?.netAmount) ?? (entry.invoiceTotal))}</TableCell>
                      <TableCell className="border-r">{formatCurrency(((entry as any)._raw?.vatAmount) ?? 0)}</TableCell>
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
                        {getStatusBadge((((displayEntries.find(e => e.id === entry.id) as any)?._raw?.status) === 'partPaid') ? 'part paid' : (((displayEntries.find(e => e.id === entry.id) as any)?._raw?.status) || entry.status))}
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
                {pdfUrl ? (
                  <iframe src={pdfUrl} title={`Invoice ${selectedInvoice.invoiceNumber}`} className="w-full" style={{ height: '70vh' }} />
                ) : (
                  <div className="p-6 text-center text-sm text-muted-foreground">Generating preview...</div>
                )}
              </div>
              <div className="flex justify-end gap-2 border-t pt-4">
                <Button variant="outline" onClick={() => selectedInvoice && generateInvoicePdf(selectedInvoice, 'preview')}>Refresh Preview</Button>
                <Button onClick={() => selectedInvoice && generateInvoicePdf(selectedInvoice, 'download')}>Download PDF</Button>
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
                    {(((displayEntries.find(e => e.id === selectedInvoiceForTimeline.id) as any)?._raw?.invoiceLogs) || []).map((log: any, index: number) => (
                      <div key={index} className="flex items-start gap-3">
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-background border-2 border-border flex items-center justify-center relative z-10">
                          {log.action === 'generated' ? (
                            <Receipt className="h-4 w-4 text-blue-500" />
                          ) : (log.action === 'partialPayment' || log.action === 'payment') ? (
                            <Clock className="h-4 w-4 text-yellow-500" />
                          ) : (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0 pb-4">
                          <div className="bg-card border rounded-lg p-3">
                            <div className="flex justify-between items-start mb-1">
                              <div className="font-medium">
                                {log.action === 'generated' ? 'Invoice Generated' : (log.action === 'partialPayment' || log.action === 'payment') ? 'Part Payment Received' : 'Payment Completed'}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {formatDate(log.date)}
                              </div>
                            </div>
                            <div className="flex justify-between items-center">
                              <div className="text-lg font-semibold text-primary">
                                {formatCurrency(log.amount)}
                              </div>
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
                    <Select disabled={selectedInvoiceForTimeline.status === 'paid'} value={statusToUpdate || undefined} onValueChange={(val) => setStatusToUpdate((val === 'part paid' ? 'partPaid' : (val as any)))}>
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
                      disabled={selectedInvoiceForTimeline.status === 'paid' || !statusToUpdate || isUpdatingStatus}
                      onClick={async () => {
                        if (!statusToUpdate || !selectedInvoiceForTimeline) return;
                        const invoiceId = (displayEntries.find(e => e.id === selectedInvoiceForTimeline.id) as any)?._raw?._id || selectedInvoiceForTimeline.id;
                        try {
                          await updateInvoiceStatus({ invoiceId, status: statusToUpdate }).unwrap();
                        } catch (e) {
                          console.error('Failed to update invoice status', e);
                        }
                      }}
                    >
                      Update Status
                    </Button>
                  </div>
                </div>
              </div>

              {/* Close button at bottom-right */}
              <div className="flex justify-end pt-4">
                <Button
                  variant="outline"
                  onClick={() => setIsStatusTimelineOpen(false)}
                >
                  Close
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
                  disabled={!paymentAmount || parseFloat(paymentAmount) <= 0 || parseFloat(paymentAmount) > selectedInvoiceForPayment.balance || isCreatingLog}
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
                    {(((displayEntries.find(e => e.id === selectedInvoiceForTimeLogs.id) as any)?._raw?.timeLogs) || []).map((log: any) => (
                      <TableRow key={log._id}>
                        <TableCell>{formatDate(log.date)}</TableCell>
                        <TableCell>{log.user?.name || '-'}</TableCell>
                        <TableCell>{log.client?.name || '-'}</TableCell>
                        <TableCell>{log.job?.name || '-'}</TableCell>
                        <TableCell>{log.timeCategory?.name || '-'}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">-</Badge>
                        </TableCell>
                        <TableCell className="max-w-xs truncate">{log.description || ''}</TableCell>
                        <TableCell className="text-right">{(Number(log.duration || 0) / 3600).toFixed(2)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(Number(log.rate || 0))}</TableCell>
                        <TableCell className="text-right">{formatCurrency(Number(log.amount || 0))}</TableCell>
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

      {/* Pagination */}
      {invoicesResp?.pagination && (
        <div className="space-y-4 mt-6">
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
                const total = invoicesResp.pagination.total;
                const start = total > 0 ? ((page - 1) * limit) + 1 : 0;
                const end = Math.min(page * limit, total);
                return `Showing ${start} to ${end} of ${total} invoices`;
              })()}
            </div>
          </div>
          {(() => {
            const totalPages = Math.max(1, Math.ceil((invoicesResp.pagination.total || 0) / limit));
            if (totalPages <= 1) return null;
            return (
              <div className="flex justify-center items-center gap-2">
                <Button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} variant="outline" size="sm">Previous</Button>
                <Button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages} variant="outline" size="sm">Next</Button>
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
};

export default InvoiceLogTab;