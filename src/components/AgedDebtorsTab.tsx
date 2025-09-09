
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DashboardCard, DashboardGrid } from "@/components/ui/dashboard-card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TrendingDown, AlertTriangle, Calendar, FileDown } from 'lucide-react';
import ClientNameLink from './ClientNameLink';
import ClientDetailsDialog from './ClientDetailsDialog';
import InvoiceTimeLogsDialog from './InvoiceTimeLogsDialog';

interface AgedDebtorEntry {
  id: string;
  clientRef: string;
  client: string;
  jobCode: string;
  jobDescription: string;
  balance: number;
  unallocated: number;
  current: number;
  days30: number;
  days60: number;
  days90: number;
  days120: number;
  days150: number;
  days180: number;
}

const AgedDebtorsTab = () => {
  const [selectedClient, setSelectedClient] = useState<string | null>(null);
  const [isClientDialogOpen, setIsClientDialogOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [isTimeLogsDialogOpen, setIsTimeLogsDialogOpen] = useState(false);
  const [agedDebtors] = useState<AgedDebtorEntry[]>([
    {
      id: '1',
      clientRef: 'WAT-23',
      client: 'Water Savers Limited',
      jobCode: 'ACC',
      jobDescription: 'Accounts',
      balance: 1250.00,
      unallocated: 0.00,
      current: 0.00,
      days30: 0.00,
      days60: 0.00,
      days90: 1250.00,
      days120: 0.00,
      days150: 0.00,
      days180: 0.00
    },
    {
      id: '2',
      clientRef: 'GRE-25',
      client: 'Green Gardens Limited',
      jobCode: 'PTX',
      jobDescription: 'Personal Tax',
      balance: 615.00,
      unallocated: 0.00,
      current: 0.00,
      days30: 0.00,
      days60: 0.00,
      days90: 615.00,
      days120: 0.00,
      days150: 0.00,
      days180: 0.00
    },
    {
      id: '3',
      clientRef: 'BRO-24',
      client: 'Brown Enterprises',
      jobCode: 'PTX',
      jobDescription: 'Personal Tax',
      balance: 615.00,
      unallocated: 0.00,
      current: 0.00,
      days30: 0.00,
      days60: 0.00,
      days90: 0.00,
      days120: 0.00,
      days150: 307.50,
      days180: 0.00
    },
    {
      id: '4',
      clientRef: 'SMI-22',
      client: 'Smith & Associates',
      jobCode: 'ACC',
      jobDescription: 'Accounts',
      balance: 1885.00,
      unallocated: 0.00,
      current: 0.00,
      days30: 0.00,
      days60: 0.00,
      days90: 942.50,
      days120: 0.00,
      days150: 0.00,
      days180: 0.00
    },
    {
      id: '5',
      clientRef: 'TEC-25',
      client: 'Tech Solutions Ltd',
      jobCode: 'ACC',
      jobDescription: 'Accounts',
      balance: 2350.00,
      unallocated: 0.00,
      current: 1175.00,
      days30: 1175.00,
      days60: 0.00,
      days90: 0.00,
      days120: 0.00,
      days150: 0.00,
      days180: 0.00
    },
    {
      id: '6',
      clientRef: 'MAR-20',
      client: 'Marketing Pro',
      jobCode: 'PTX',
      jobDescription: 'Personal Tax',
      balance: 450.00,
      unallocated: 0.00,
      current: 0.00,
      days30: 0.00,
      days60: 450.00,
      days90: 0.00,
      days120: 0.00,
      days150: 0.00,
      days180: 0.00
    },
    {
      id: '7',
      clientRef: 'DIG-24',
      client: 'Digital Media Co',
      jobCode: 'CTX',
      jobDescription: 'Corporation Tax',
      balance: 3200.00,
      unallocated: 0.00,
      current: 0.00,
      days30: 0.00,
      days60: 0.00,
      days90: 0.00,
      days120: 3200.00,
      days150: 0.00,
      days180: 0.00
    },
    {
      id: '8',
      clientRef: 'RET-23',
      client: 'Retail Express',
      jobCode: 'VAT',
      jobDescription: 'VAT Return',
      balance: 825.00,
      unallocated: 0.00,
      current: 0.00,
      days30: 0.00,
      days60: 0.00,
      days90: 0.00,
      days120: 0.00,
      days150: 0.00,
      days180: 825.00
    },
    {
      id: '9',
      clientRef: 'CON-25',
      client: 'Construction Pros',
      jobCode: 'ACC',
      jobDescription: 'Accounts',
      balance: 1680.00,
      unallocated: 0.00,
      current: 840.00,
      days30: 840.00,
      days60: 0.00,
      days90: 0.00,
      days120: 0.00,
      days150: 0.00,
      days180: 0.00
    },
    {
      id: '10',
      clientRef: 'FIN-22',
      client: 'Finance First',
      jobCode: 'AUD',
      jobDescription: 'Audit',
      balance: 4500.00,
      unallocated: 0.00,
      current: 0.00,
      days30: 0.00,
      days60: 0.00,
      days90: 0.00,
      days120: 0.00,
      days150: 4500.00,
      days180: 0.00
    }
  ]);

  const [sortBy, setSortBy] = useState<string>('balance');
  const [filterPeriod, setFilterPeriod] = useState<string>('all');

  const handleClientClick = (clientName: string) => {
    setSelectedClient(clientName);
    setIsClientDialogOpen(true);
  };

  const handleTimeLogsClick = (invoiceNumber: string, client: string, gross: number, timeLogsCount: number) => {
    const invoice = {
      invoiceNumber,
      client,
      invoiceTotal: gross,
      timeLogsCount,
      timeLogs: getSampleTimeLogsForInvoice(invoiceNumber)
    };
    setSelectedInvoice(invoice);
    setIsTimeLogsDialogOpen(true);
  };

  const getSampleTimeLogsForInvoice = (invoiceNumber: string) => {
    // Sample time logs data matching the UI image
    const sampleTimeLogs = [
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
      },
      {
        date: '01/18/2024',
        teamMember: 'Emily Davis',
        client: 'Water Savers Limited',
        job: 'Document Review',
        jobType: 'Compliance',
        category: 'Client work',
        description: 'Review legal documents',
        hours: 1.5,
        rate: 110.00,
        amount: 165.00,
        billable: 'Yes'
      },
      {
        date: '01/19/2024',
        teamMember: 'John Smith',
        client: 'Water Savers Limited',
        job: 'Client Meeting',
        jobType: 'Meeting',
        category: 'Meeting',
        description: 'Quarterly review meeting',
        hours: 2,
        rate: 120.00,
        amount: 240.00,
        billable: 'Yes'
      }
    ];

    // Return first 8 entries for the invoice
    return sampleTimeLogs.slice(0, 8);
  };

  const getClientData = (clientName: string) => ({
    clientRef: clientName.substring(0, 3).toUpperCase() + '-001',
    name: clientName,
    customerNumber: 'CUST-' + Math.floor(Math.random() * 1000),
    clientType: 'Corporate',
    address: '123 Business Street, Business City, BC 12345',
    contactPerson: 'Contact Person',
    email: 'contact@example.com',
    phone: '+1 234 567 8900',
    takeOnDate: '2024-01-01',
    clientTags: ['Active', 'Corporate'],
    taxes: ['VAT', 'CT', 'PAYE-EMP']
  });

  // Calculate totals
  const totals = agedDebtors.reduce((acc, entry) => ({
    balance: acc.balance + entry.balance,
    unallocated: acc.unallocated + entry.unallocated,
    current: acc.current + entry.current,
    days30: acc.days30 + entry.days30,
    days60: acc.days60 + entry.days60,
    days90: acc.days90 + entry.days90,
    days120: acc.days120 + entry.days120,
    days150: acc.days150 + entry.days150,
    days180: acc.days180 + entry.days180
  }), {
    balance: 0,
    unallocated: 0,
    current: 0,
    days30: 0,
    days60: 0,
    days90: 0,
    days120: 0,
    days150: 0,
    days180: 0
  });

  const getRiskLevel = (entry: AgedDebtorEntry) => {
    if (entry.days180 > 0) return 'high';
    if (entry.days120 > 0 || entry.days150 > 0) return 'medium';
    if (entry.days90 > 0) return 'low';
    return 'current';
  };

  const sortedEntries = [...agedDebtors].sort((a, b) => {
    switch (sortBy) {
      case 'balance':
        return b.balance - a.balance;
      case 'client':
        return a.client.localeCompare(b.client);
      case 'oldest':
        return (b.days180 + b.days150 + b.days120) - (a.days180 + a.days150 + a.days120);
      default:
        return 0;
    }
  });

  return (
    <div className="space-y-6">
          {/* Dashboard Cards */}
          <DashboardGrid columns={4}>
            <DashboardCard
              title="30 Days"
              value={`€${totals.days30.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
            />
            
            <DashboardCard
              title="60 Days"
              value={`€${totals.days60.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
            />
            
            <DashboardCard
              title="90+ Days"
              value={`€${(totals.days90 + totals.days120).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
            />
            
            <DashboardCard
              title="150+ Days"
              value={`€${(totals.days150 + totals.days180).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
            />
          </DashboardGrid>

          {/* Aged Debtors Table */}
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr className="border-b bg-gray-50">
                       <th className="text-left p-3 font-medium text-foreground h-12">Client Ref.</th>
                       <th className="text-left p-3 font-medium text-foreground h-12">Client</th>
                       <th className="text-right p-3 font-medium text-foreground h-12">Balance</th>
                       <th className="text-right p-3 font-medium text-foreground h-12">30 Days</th>
                       <th className="text-right p-3 font-medium text-foreground h-12">60 Days</th>
                       <th className="text-right p-3 font-medium text-foreground h-12">90 Days</th>
                       <th className="text-right p-3 font-medium text-foreground h-12">120 Days</th>
                       <th className="text-right p-3 font-medium text-foreground h-12">150 Days</th>
                       <th className="text-right p-3 font-medium text-foreground h-12">180 Days</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedEntries.map((entry) => {
                      const riskLevel = getRiskLevel(entry);
                      return (
                        <tr key={entry.id} className="border-b hover:bg-gray-50 h-12">
                          <td className="p-3">
                            <div className="font-medium">{entry.clientRef}</div>
                          </td>
                           <td className="p-3">
                             <div className="font-medium">
                               <ClientNameLink clientName={entry.client} />
                             </div>
                           </td>
                          <td className="p-3 text-right text-sm">€{entry.balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                          <td className="p-3 text-right">{entry.days30 > 0 ? `€${entry.days30.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '-'}</td>
                          <td className="p-3 text-right">{entry.days60 > 0 ? `€${entry.days60.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '-'}</td>
                          <td className="p-3 text-right">{entry.days90 > 0 ? `€${entry.days90.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '-'}</td>
                          <td className="p-3 text-right">{entry.days120 > 0 ? `€${entry.days120.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '-'}</td>
                          <td className="p-3 text-right">{entry.days150 > 0 ? `€${entry.days150.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '-'}</td>
                          <td className="p-3 text-right">{entry.days180 > 0 ? `€${entry.days180.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '-'}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 bg-gray-100">
                      <td className="p-3"></td>
                      <td className="p-3">TOTALS</td>
                      <td className="p-3 text-right">€{totals.balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                      <td className="p-3 text-right">€{totals.days30.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                      <td className="p-3 text-right">€{totals.days60.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                      <td className="p-3 text-right">€{totals.days90.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                      <td className="p-3 text-right">€{totals.days120.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                      <td className="p-3 text-right">€{totals.days150.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                      <td className="p-3 text-right">€{totals.days180.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </CardContent>
          </Card>

      {/* Client Details Dialog */}
      {selectedClient && (
        <ClientDetailsDialog
          open={isClientDialogOpen}
          onOpenChange={setIsClientDialogOpen}
          clientData={getClientData(selectedClient)}
        />
      )}

      {/* Invoice Time Logs Dialog */}
      {selectedInvoice && (
        <InvoiceTimeLogsDialog
          open={isTimeLogsDialogOpen}
          onOpenChange={setIsTimeLogsDialogOpen}
          invoiceNumber={selectedInvoice.invoiceNumber}
          client={selectedInvoice.client}
          invoiceTotal={selectedInvoice.invoiceTotal}
          timeLogsCount={selectedInvoice.timeLogsCount}
          timeLogs={selectedInvoice.timeLogs}
        />
      )}
    </div>
  );
};

export default AgedDebtorsTab;
