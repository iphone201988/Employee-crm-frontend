
import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DashboardCard, DashboardGrid } from "@/components/ui/dashboard-card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { FileText, Download, Search, ArrowLeft } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import LogItemDialog from './LogItemDialog';

interface DebtorLogEntry {
  id: string;
  date: string;
  type: string;
  docNo: string;
  refNo: string;
  jobCode: string;
  debit: number;
  credit: number;
  allocated: number;
  outstanding: number;
  balance: number;
}

interface ClientInfo {
  name: string;
  address: string;
  contact: string;
}

const DebtorsLogTab = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedClient, setSelectedClient] = useState<string>('water-savers');
  const [showLogItemDialog, setShowLogItemDialog] = useState(false);
  
  const clients = [
    { id: 'water-savers', name: 'Water Savers Limited', address: '123 Ocean Drive, Dublin 4', contact: 'John Smith' },
    { id: 'green-gardens', name: 'Green Gardens Limited', address: '456 Park Avenue, Cork', contact: 'Mary Johnson' },
    { id: 'brown-enterprises', name: 'Brown Enterprises', address: '789 Main Street, Galway', contact: 'David Brown' },
    { id: 'smith-associates', name: 'Smith & Associates', address: '321 Business Park, Limerick', contact: 'Sarah Smith' }
  ];

  // Check for client parameter in URL when component mounts
  useEffect(() => {
    const clientParam = searchParams.get('client');
    if (clientParam && clients.some(c => c.id === clientParam)) {
      setSelectedClient(clientParam);
    }
  }, [searchParams, clients]);

  const handleBackToClients = () => {
    setSearchParams({ tab: 'clients' });
  };

  const handleLogItemSave = (item: any) => {
    const newEntry: DebtorLogEntry = {
      id: Date.now().toString(),
      date: item.date,
      type: item.type,
      docNo: '',
      refNo: item.refNo,
      jobCode: 'AUD',
      debit: item.debit,
      credit: item.credit,
      allocated: 0,
      outstanding: item.debit - item.credit,
      balance: item.debit - item.credit
    };
    setLogEntries([...logEntries, newEntry]);
  };

  const clientInfo = clients.find(c => c.id === selectedClient) || clients[0];

  const [logEntries, setLogEntries] = useState<DebtorLogEntry[]>([
    {
      id: '1',
      date: '27/11/2020',
      type: 'Invoice',
      docNo: '117',
      refNo: 'IN-101',
      jobCode: 'AUD',
      debit: 1750.00,
      credit: 0.00,
      allocated: 0.00,
      outstanding: 1750.00,
      balance: 1750.00
    },
    {
      id: '2',
      date: '05/01/2021',
      type: 'Receipt',
      docNo: '259',
      refNo: 'RE-301',
      jobCode: 'AUD',
      debit: 0.00,
      credit: 1750.00,
      allocated: 1750.00,
      outstanding: 0.00,
      balance: 0.00
    },
    {
      id: '3',
      type: 'Credit Note',
      date: '12/05/2021',
      docNo: '298',
      refNo: 'CR-201',
      jobCode: 'AUD',
      debit: 0.00,
      credit: 500.00,
      allocated: 500.00,
      outstanding: 0.00,
      balance: 0.00
    },
    {
      id: '4',
      date: '15/06/2021',
      type: 'Invoice',
      docNo: '302',
      refNo: 'IN-102',
      jobCode: 'AUD',
      debit: 2800.00,
      credit: 0.00,
      allocated: 2800.00,
      outstanding: 0.00,
      balance: 2800.00
    },
    {
      id: '5',
      date: '18/08/2021',
      type: 'Receipt',
      docNo: '124',
      refNo: 'RE-302',
      jobCode: 'AUD',
      debit: 0.00,
      credit: 2800.00,
      allocated: 2800.00,
      outstanding: 0.00,
      balance: 0.00
    },
    {
      id: '6',
      date: '11/11/2021',
      type: 'Credit Note',
      docNo: '471',
      refNo: 'CR-202',
      jobCode: 'AUD',
      debit: 0.00,
      credit: 238.00,
      allocated: 238.00,
      outstanding: 0.00,
      balance: 0.00
    },
    {
      id: '7',
      date: '05/02/2022',
      type: 'Invoice',
      docNo: '1032',
      refNo: 'IN-103',
      jobCode: 'AUD',
      debit: 3200.00,
      credit: 0.00,
      allocated: 3200.00,
      outstanding: 0.00,
      balance: 3200.00
    },
    {
      id: '8',
      date: '07/06/2022',
      type: 'Receipt',
      docNo: '206',
      refNo: 'RE-303',
      jobCode: 'AUD',
      debit: 0.00,
      credit: 3200.00,
      allocated: 3200.00,
      outstanding: 0.00,
      balance: 0.00
    },
    {
      id: '9',
      date: '28/03/2024',
      type: 'Invoice',
      docNo: '3088',
      refNo: 'IN-104',
      jobCode: 'AUD',
      debit: 1599.00,
      credit: 0.00,
      allocated: 1599.00,
      outstanding: 1599.00,
      balance: 1599.00
    }
  ]);

  const totalDebit = logEntries.reduce((sum, entry) => sum + entry.debit, 0);
  const totalCredit = logEntries.reduce((sum, entry) => sum + entry.credit, 0);
  const totalOutstanding = logEntries.reduce((sum, entry) => sum + entry.outstanding, 0);

  const agingBreakdown = {
    current: 0.00,
    unallocated: 0.00,
    days30: 0.00,
    days60: 0.00,
    days90: 8.00,
    days120: 0.00
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="border-border bg-card">
        <CardHeader className="bg-purple-dark border-b border-sidebar-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleBackToClients}
                className="bg-background hover:bg-accent text-foreground border-border"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <CardTitle className="flex items-center gap-2 text-purple-dark-foreground text-lg">
                <FileText className="h-5 w-5" />
                Debtors Log for Water Savers Limited
              </CardTitle>
            </div>
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                className="bg-background hover:bg-accent text-foreground border-border"
                onClick={() => setShowLogItemDialog(true)}
              >
                Log Item
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="bg-background hover:bg-accent text-foreground border-border"
                onClick={() => {
                  const csvData = [
                    ['Date', 'Item', 'Reference Number', 'Debit', 'Credit', 'Allocated', 'Outstanding', 'Debtors Log Balance'],
                    ...logEntries.map(entry => [
                      entry.date,
                      entry.type,
                      entry.refNo,
                      entry.debit.toFixed(2),
                      entry.credit.toFixed(2),
                      entry.allocated.toFixed(2),
                      entry.outstanding.toFixed(2),
                      entry.balance.toFixed(2)
                    ])
                  ];
                  
                  const csvContent = csvData.map(row => row.join(',')).join('\n');
                  const blob = new Blob([csvContent], { type: 'text/csv' });
                  const url = window.URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `debtors-log-${clientInfo.name.replace(/\s+/g, '-').toLowerCase()}.csv`;
                  document.body.appendChild(a);
                  a.click();
                  document.body.removeChild(a);
                  window.URL.revokeObjectURL(url);
                }}
              >
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Dashboard Summary */}
      <DashboardGrid columns={4}>
        <DashboardCard
          title="Total Invoiced"
          value={`€${totalDebit.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
        />
        
        <DashboardCard
          title="Total Received"
          value={`€${totalCredit.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
        />
        
        <DashboardCard
          title="Outstanding Balance"
          value={`€${totalOutstanding.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
        />
        
        <DashboardCard
          title="Number of Transactions"
          value={logEntries.length}
        />
      </DashboardGrid>

      {/* Aging Breakdown Details */}
      <Card className="border-border bg-card">
        <CardContent className="p-6">
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Debtors Log Balance</p>
              <p className="text-lg font-semibold text-foreground">€{totalOutstanding.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Unallocated</p>
              <p className="text-lg font-semibold text-foreground">€{agingBreakdown.unallocated.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Current</p>
              <p className="text-lg font-semibold text-foreground">€{agingBreakdown.current.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-muted-foreground">30 Days</p>
              <p className="text-lg font-semibold text-foreground">€{agingBreakdown.days30.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-muted-foreground">60 Days</p>
              <p className="text-lg font-semibold text-foreground">€{agingBreakdown.days60.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-muted-foreground">90+ Days</p>
              <p className="text-lg font-semibold text-destructive">€{totalOutstanding.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Transaction Log */}
      <Card className="border-border bg-card">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                   <th className="text-left p-3 text-foreground h-12">Date</th>
                   <th className="text-left p-3 text-foreground h-12">Item</th>
                   <th className="text-left p-3 text-foreground h-12">Reference Number</th>
                   <th className="text-right p-3 text-foreground h-12">Debit</th>
                   <th className="text-right p-3 text-foreground h-12">Credit</th>
                   <th className="text-right p-3 text-foreground h-12">Allocated</th>
                   <th className="text-right p-3 text-foreground h-12">Outstanding</th>
                   <th className="text-right p-3 text-foreground h-12">Debtors Log Balance</th>
                </tr>
              </thead>
              <tbody>
                {logEntries.map((entry) => (
                  <tr key={entry.id} className="border-b border-border hover:bg-muted/30 transition-colors">
                    <td className="p-4 text-foreground">
                      {entry.date}
                    </td>
                    <td className="p-4 text-foreground">
                      <div className="flex items-center gap-2">
                        <Badge variant={
                          entry.type === 'Invoice' ? 'default' : 
                          entry.type === 'Receipt' ? 'secondary' : 
                          'destructive'
                        } className={entry.type === 'Credit Note' ? 'bg-orange-500 text-white hover:bg-orange-600' : ''}>
                          {entry.type}
                        </Badge>
                        {entry.type === 'Invoice' && (
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-6 w-6 p-0 hover:bg-muted/50">
                                <FileText className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl">
                              <DialogHeader>
                                <DialogTitle>Invoice Details - {entry.refNo}</DialogTitle>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <p className="text-sm text-gray-600">Date:</p>
                                    <p className="font-medium">{entry.date}</p>
                                  </div>
                                  <div>
                                    <p className="text-sm text-gray-600">Reference:</p>
                                    <p className="font-medium">{entry.refNo}</p>
                                  </div>
                                  <div>
                                    <p className="text-sm text-gray-600">Amount:</p>
                                    <p className="font-medium">€{entry.debit.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                                  </div>
                                  <div>
                                    <p className="text-sm text-gray-600">Status:</p>
                                    <p className="font-medium">{entry.outstanding > 0 ? 'Outstanding' : 'Paid'}</p>
                                  </div>
                                </div>
                                <div className="pt-4 border-t">
                                  <p className="text-sm text-gray-600 mb-2">Invoice Preview:</p>
                                  <div className="bg-gray-50 p-4 rounded-lg">
                                    <p className="text-center text-gray-500">Invoice preview would appear here</p>
                                  </div>
                                </div>
                              </div>
                            </DialogContent>
                          </Dialog>
                        )}
                      </div>
                    </td>
                    <td className="p-4 text-foreground">
                      {entry.refNo}
                    </td>
                    <td className="p-4 text-right text-foreground">
                      {entry.debit > 0 ? `€${entry.debit.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : ''}
                    </td>
                    <td className="p-4 text-right text-foreground">
                      {entry.credit > 0 ? `€${entry.credit.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : ''}
                    </td>
                    <td className="p-4 text-right text-foreground">
                      {entry.allocated > 0 ? `€${entry.allocated.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : ''}
                    </td>
                    <td className="p-4 text-right text-foreground">
                      {entry.outstanding > 0 ? `€${entry.outstanding.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : ''}
                    </td>
                    <td className="p-4 text-right font-semibold text-foreground">
                      {entry.balance > 0 ? `€${entry.balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : ''}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-border bg-muted/50">
                  <td className="p-4 text-foreground text-sm" colSpan={3}>TOTALS</td>
                  <td className="p-4 text-right text-foreground text-sm">€{totalDebit.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                  <td className="p-4 text-right text-foreground text-sm">€{totalCredit.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                  <td className="p-4 text-right"></td>
                  <td className="p-4 text-right"></td>
                  <td className="p-4 text-right text-foreground text-sm">€{totalOutstanding.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Log Item Dialog */}
      <LogItemDialog
        isOpen={showLogItemDialog}
        onClose={() => setShowLogItemDialog(false)}
        clientName={clientInfo.name}
        onSave={handleLogItemSave}
      />
    </div>
  );
};

export default DebtorsLogTab;
