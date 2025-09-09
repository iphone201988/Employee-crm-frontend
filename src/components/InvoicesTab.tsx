import React, { useState, useMemo } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { DashboardCard, DashboardGrid } from "@/components/ui/dashboard-card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, Mail } from 'lucide-react';
import { formatCurrency } from '@/lib/currency';
import { InvoicePreviewDialog } from './InvoicePreviewDialog';
import InvoiceTimeLogsDialog from './InvoiceTimeLogsDialog';

interface Invoice {
  invoiceNumber: string;
  clientName: string;
  clientCode: string;
  clientAddress: string;
  amount: number;
  date: string;
  status: 'issued' | 'part-paid' | 'paid';
  jobName?: string;
  paidDate?: string;
  invoiceSentFrom?: 'Within Kollabro' | 'Quickbooks';
}

interface InvoicesTabProps {
  invoices: Invoice[];
}

const InvoicesTab = ({ invoices }: InvoicesTabProps) => {
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [selectedTimeLogsInvoice, setSelectedTimeLogsInvoice] = useState<any>(null);
  const [isTimeLogsDialogOpen, setIsTimeLogsDialogOpen] = useState(false);

  // Add sample data with various statuses and dates
  const sampleInvoices: Invoice[] = [
    {
      invoiceNumber: '12345',
      clientName: 'Water Savers Limited',
      clientCode: 'WSL001',
      clientAddress: '123 Business Park, Dublin 2, Ireland',
      amount: 2500.00,
      date: '2024-12-15',
      status: 'paid',
      paidDate: '2024-12-20',
      invoiceSentFrom: 'Within Kollabro'
    },
    {
      invoiceNumber: '12346',
      clientName: 'Green Gardens Limited',
      clientCode: 'GGL002',
      clientAddress: '456 Industrial Estate, Cork, Ireland',
      amount: 1750.00,
      date: '2024-12-10',
      status: 'issued',
      invoiceSentFrom: 'Quickbooks'
    },
    {
      invoiceNumber: '12347',
      clientName: 'Tech Solutions Ltd',
      clientCode: 'TSL003',
      clientAddress: '789 Technology Hub, Galway, Ireland',
      amount: 3200.00,
      date: '2024-12-08',
      status: 'part-paid',
      paidDate: '2024-12-12',
      invoiceSentFrom: 'Within Kollabro'
    },
    {
      invoiceNumber: '12348',
      clientName: 'Smith & Associates',
      clientCode: 'SAA004',
      clientAddress: '321 Financial District, Limerick, Ireland',
      amount: 4150.00,
      date: '2024-12-05',
      status: 'paid',
      paidDate: '2024-12-10',
      invoiceSentFrom: 'Quickbooks'
    },
    {
      invoiceNumber: '12349',
      clientName: 'Brown Enterprises',
      clientCode: 'BEN005',
      clientAddress: '654 Commercial Center, Waterford, Ireland',
      amount: 2890.00,
      date: '2024-12-01',
      status: 'issued',
      invoiceSentFrom: 'Within Kollabro'
    },
    {
      invoiceNumber: '12350',
      clientName: 'Innovation Labs Ltd',
      clientCode: 'ILL006',
      clientAddress: '987 Innovation Park, Kilkenny, Ireland',
      amount: 3750.00,
      date: '2024-11-28',
      status: 'part-paid',
      paidDate: '2024-12-02',
      invoiceSentFrom: 'Quickbooks'
    },
    {
      invoiceNumber: '12351',
      clientName: 'Global Services Inc',
      clientCode: 'GSI007',
      clientAddress: '147 Enterprise Zone, Sligo, Ireland',
      amount: 5200.00,
      date: '2024-11-25',
      status: 'paid',
      paidDate: '2024-11-30',
      invoiceSentFrom: 'Within Kollabro'
    },
    {
      invoiceNumber: '12352',
      clientName: 'Digital Marketing Pro',
      clientCode: 'DMP008',
      clientAddress: '258 Creative Quarter, Drogheda, Ireland',
      amount: 1850.00,
      date: '2024-11-22',
      status: 'issued',
      invoiceSentFrom: 'Quickbooks'
    }
  ];

  const displayInvoices = invoices.length > 0 ? invoices : sampleInvoices;

  // Filter invoices based on status
  const filteredInvoices = useMemo(() => {
    return displayInvoices.filter(invoice => {
      if (statusFilter === 'all') return true;
      return invoice.status === statusFilter;
    });
  }, [displayInvoices, statusFilter]);

  // Calculate dashboard metrics
  const totalInvoiced = displayInvoices.reduce((sum, invoice) => sum + invoice.amount, 0);
  const totalPaid = displayInvoices.filter(invoice => invoice.status === 'paid').reduce((sum, invoice) => sum + invoice.amount, 0);
  const totalPartPaid = displayInvoices.filter(invoice => invoice.status === 'part-paid').reduce((sum, invoice) => sum + invoice.amount * 0.5, 0);
  const totalOutstanding = totalInvoiced - totalPaid - totalPartPaid;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'part-paid':
        return 'bg-yellow-100 text-yellow-800';
      case 'issued':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (invoice: Invoice) => {
    switch (invoice.status) {
      case 'paid':
        return `Paid on ${new Date(invoice.paidDate || invoice.date).toLocaleDateString('en-GB')}`;
      case 'part-paid':
        return `Part paid on ${new Date(invoice.paidDate || invoice.date).toLocaleDateString('en-GB')}`;
      case 'issued':
        return `Issued on ${new Date(invoice.date).toLocaleDateString('en-GB')}`;
      default:
        return invoice.status;
    }
  };

  const generateInvoiceNumber = (originalNumber: string) => {
    // Extract last 5 digits or pad with zeros if shorter
    const numberPart = originalNumber.replace(/[^\d]/g, '');
    return numberPart.slice(-5).padStart(5, '0');
  };

  const handlePreviewInvoice = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setShowPreview(true);
  };

  const handleTimeLogsClick = (invoice: Invoice) => {
    const timeLogsData = {
      invoiceNumber: invoice.invoiceNumber,
      client: invoice.clientName,
      invoiceTotal: invoice.amount,
      timeLogsCount: 8,
      timeLogs: getSampleTimeLogsForInvoice(invoice.invoiceNumber)
    };
    setSelectedTimeLogsInvoice(timeLogsData);
    setIsTimeLogsDialogOpen(true);
  };

  const getSampleTimeLogsForInvoice = (invoiceNumber: string) => {
    return [
      {
        date: '01/15/2024',
        teamMember: 'John Smith',
        client: 'Water Savers Limited',
        job: 'Tax Advisory',
        jobType: 'Tax Return',
        category: 'Client work',
        description: 'Annual tax planning consultation',
        hours: 2.5,
        rate: 120.00,
        amount: 300.00,
        billable: 'Yes'
      },
      {
        date: '01/16/2024',
        teamMember: 'Sarah Johnson',
        client: 'Water Savers Limited',
        job: 'Compliance Review',
        jobType: 'Compliance',
        category: 'Client work',
        description: 'Quarterly compliance check',
        hours: 3,
        rate: 100.00,
        amount: 300.00,
        billable: 'Yes'
      },
      {
        date: '01/17/2024',
        teamMember: 'Mike Wilson',
        client: 'Water Savers Limited',
        job: 'Financial Planning',
        jobType: 'Advisory',
        category: 'Meeting',
        description: 'Investment strategy review',
        hours: 4,
        rate: 85.00,
        amount: 340.00,
        billable: 'Yes'
      }
    ];
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="invoices-log" className="w-full">
        <TabsList>
          <TabsTrigger value="monthly">Monthly</TabsTrigger>
          <TabsTrigger value="invoices-log">Invoice Log</TabsTrigger>
          <TabsTrigger value="debtors-log">Debtors Log</TabsTrigger>
        </TabsList>

        <TabsContent value="monthly" className="space-y-6">
          {/* Weekly Invoice Data */}
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto w-full">
                <Table className="w-full">
                  <TableHeader>
                    <TableRow>
                      <TableHead className="border-r p-3 font-medium text-foreground h-12">Week</TableHead>
                      <TableHead className="border-r p-3 font-medium text-foreground h-12">Invoices Sent</TableHead>
                      <TableHead className="border-r p-3 font-medium text-foreground h-12">Amount Invoiced</TableHead>
                      <TableHead className="border-r p-3 font-medium text-foreground h-12">Amount Paid</TableHead>
                      <TableHead className="p-3 font-medium text-foreground h-12">Outstanding</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell className="font-medium border-r">Week of Dec 16, 2024</TableCell>
                      <TableCell className="border-r">3</TableCell>
                      <TableCell className="border-r">{formatCurrency(6450.00)}</TableCell>
                      <TableCell className="border-r">{formatCurrency(2500.00)}</TableCell>
                      <TableCell>{formatCurrency(3950.00)}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium border-r">Week of Dec 9, 2024</TableCell>
                      <TableCell className="border-r">2</TableCell>
                      <TableCell className="border-r">{formatCurrency(4950.00)}</TableCell>
                      <TableCell className="border-r">{formatCurrency(3200.00)}</TableCell>
                      <TableCell>{formatCurrency(1750.00)}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium border-r">Week of Dec 2, 2024</TableCell>
                      <TableCell className="border-r">1</TableCell>
                      <TableCell className="border-r">{formatCurrency(2890.00)}</TableCell>
                      <TableCell className="border-r">{formatCurrency(0.00)}</TableCell>
                      <TableCell>{formatCurrency(2890.00)}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium border-r">Week of Nov 25, 2024</TableCell>
                      <TableCell className="border-r">2</TableCell>
                      <TableCell className="border-r">{formatCurrency(9000.00)}</TableCell>
                      <TableCell className="border-r">{formatCurrency(5200.00)}</TableCell>
                      <TableCell>{formatCurrency(3800.00)}</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="invoices-log" className="space-y-6">
          {/* Dashboard Cards - Same style as Aged Debtors */}
          <DashboardGrid columns={4}>
            <DashboardCard
              title="Total Invoiced"
              value={formatCurrency(totalInvoiced)}
            />
            <DashboardCard
              title="Total Paid"
              value={formatCurrency(totalPaid)}
            />
            <DashboardCard
              title="Part Paid"
              value={formatCurrency(totalPartPaid)}
            />
            <DashboardCard
              title="Outstanding"
              value={formatCurrency(totalOutstanding)}
            />
          </DashboardGrid>

          {/* Filters */}
          <div className="flex justify-end">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">Status:</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="issued">Issued</SelectItem>
                  <SelectItem value="part-paid">Part Paid</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Invoices Table */}
          <Card>
            <CardContent className="p-0">
              {filteredInvoices.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">No invoices found.</p>
                  <p className="text-sm text-gray-400 mt-1">
                    {statusFilter !== 'all' ? 'Try changing the filter criteria.' : 'Create invoices from the WIP Report to see them here.'}
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto w-full">
                  <Table className="w-full">
                    <TableHeader>
                      <TableRow>
                         <TableHead className="border-r p-3 font-medium text-foreground h-12">Invoice Number</TableHead>
                         <TableHead className="border-r p-3 font-medium text-foreground h-12">Client Name</TableHead>
                         <TableHead className="border-r p-3 font-medium text-foreground h-12">Job Name</TableHead>
                         <TableHead className="border-r p-3 font-medium text-foreground h-12">Amount</TableHead>
                         <TableHead className="border-r p-3 font-medium text-foreground h-12">Invoice Date</TableHead>
                         <TableHead className="border-r p-3 font-medium text-foreground h-12">Invoice Sent From</TableHead>
                         <TableHead className="p-3 font-medium text-foreground h-12">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                     <TableBody>
                       {filteredInvoices.map((invoice, index) => (
                         <TableRow key={index}>
                           <TableCell className="font-medium border-r">{generateInvoiceNumber(invoice.invoiceNumber)}</TableCell>
                           <TableCell className="border-r">{invoice.clientName} ({invoice.clientCode})</TableCell>
                           <TableCell className="border-r">{invoice.jobName || '-'}</TableCell>
                           <TableCell className="border-r">{formatCurrency(invoice.amount)}</TableCell>
                           <TableCell className="border-r">{new Date(invoice.date).toLocaleDateString('en-GB')}</TableCell>
                           <TableCell className="border-r">{invoice.invoiceSentFrom || 'Within Kollabro'}</TableCell>
                           <TableCell>
                             <div className="flex items-center gap-2">
                               <Badge variant="secondary" className={`text-xs ${getStatusColor(invoice.status)}`}>
                                 {getStatusText(invoice)}
                               </Badge>
                               <Button
                                 variant="ghost"
                                 size="sm"
                                 onClick={() => handlePreviewInvoice(invoice)}
                                 className="h-8 w-8 p-0"
                               >
                                 <FileText className="h-4 w-4" />
                               </Button>
                               <Button
                                 variant="ghost"
                                 size="sm"
                                 onClick={() => handleTimeLogsClick(invoice)}
                                 className="h-8 px-2"
                               >
                                 <Mail className="w-4 h-4 mr-1" />
                                 Time Logs
                               </Button>
                             </div>
                           </TableCell>
                         </TableRow>
                       ))}
                     </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="debtors-log" className="space-y-6">
          <div className="text-center py-8 text-muted-foreground">
            Debtors Log functionality coming soon
          </div>
        </TabsContent>
      </Tabs>

      {/* Invoice Preview Dialog */}
      {selectedInvoice && (
        <InvoicePreviewDialog
          isOpen={showPreview}
          onClose={() => setShowPreview(false)}
          invoiceData={selectedInvoice}
        />
      )}

      {/* Time Logs Dialog */}
      {selectedTimeLogsInvoice && (
        <InvoiceTimeLogsDialog
          open={isTimeLogsDialogOpen}
          onOpenChange={setIsTimeLogsDialogOpen}
          invoiceNumber={selectedTimeLogsInvoice.invoiceNumber}
          client={selectedTimeLogsInvoice.client}
          invoiceTotal={selectedTimeLogsInvoice.invoiceTotal}
          timeLogsCount={selectedTimeLogsInvoice.timeLogsCount}
          timeLogs={selectedTimeLogsInvoice.timeLogs}
        />
      )}
    </div>
  );
};

export default InvoicesTab;