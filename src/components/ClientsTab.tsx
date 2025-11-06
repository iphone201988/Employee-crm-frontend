import React, { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Card, CardContent } from "@/components/ui/card";
import { DashboardCard, DashboardGrid } from "@/components/ui/dashboard-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { ChevronUp, ChevronDown, Clock } from 'lucide-react';
import { formatCurrency } from '@/lib/currency';
import ActiveExpensesDialog from './ActiveExpensesDialog';
import WIPBalanceDialog from './WIPBalanceDialog';
import ClientJobsDialog from './ClientJobsDialog';
import ClientDetailsDialog from './ClientDetailsDialog';
import ClientNameLink from '@/components/ClientNameLink';
import DebtorsBalanceDialog from './DebtorsBalanceDialog';
import { useGetClientBreakdownQuery } from '@/store/clientApi';

interface TimeLog {
  id: string;
  date: string;
  teamMember: string;
  category: 'client work' | 'meeting' | 'phone call' | 'event' | 'training' | 'other';
  description: string;
  hours: number;
  rate: number;
  amount: number;
  billable: boolean;
  status: 'not-invoiced' | 'invoiced' | 'paid';
}

interface Job {
  id: string;
  name: string;
  type: string;
  logged: number;
  billable: number;
  nonBillable: number;
  wipValue: number;
  timeLogs: TimeLog[];
}

interface Expense {
  id: string;
  description: string;
  amount: number;
  hasVAT: boolean;
  vatRate: number;
  totalAmount: number;
}

interface Note {
  _id: string;
  note: string;
  createdAt: string;
  updatedAt: string;
  createdBy: {
    _id: string;
    name: string;
    avatarUrl?: string;
  };
}

interface Client {
  id: string;
  name: string;
  clientRef: string;
  balance: number;
  wipAmount: number;
  writeOffAmount?: number;
  notes?: Note[];
  jobs: Job[];
  expenses: Expense[];
  totalExpenses: number;
}

const ClientsTab = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [sortField, setSortField] = useState<'clientRef' | 'name' | 'balance' | 'wipAmount' | 'services' | 'timeLogged' | 'writeOff'>('balance');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [hideZeroBalances, setHideZeroBalances] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [newJob, setNewJob] = useState({ name: '', type: '' });
  const [isAddingJob, setIsAddingJob] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [newExpense, setNewExpense] = useState({
    description: '',
    amount: 0,
    hasVAT: false,
    vatRate: 20,
    totalAmount: 0
  });
  const [isAddingExpense, setIsAddingExpense] = useState(false);
  const [showExpensesDialog, setShowExpensesDialog] = useState(false);
  const [selectedExpensesClient, setSelectedExpensesClient] = useState<Client | null>(null);
  const [showWIPDialog, setShowWIPDialog] = useState(false);
  const [selectedWIPClient, setSelectedWIPClient] = useState<Client | null>(null);
  const [showJobsDialog, setShowJobsDialog] = useState(false);
  const [showClientDetailsDialog, setShowClientDetailsDialog] = useState(false);
  const [selectedClientForDetails, setSelectedClientForDetails] = useState<any | null>(null);
  const [showDebtorsDialog, setShowDebtorsDialog] = useState(false);
  const [selectedDebtorsClient, setSelectedDebtorsClient] = useState<Client | null>(null);
  const [showNotesDialog, setShowNotesDialog] = useState(false);
  const [selectedNotesClient, setSelectedNotesClient] = useState<Client | null>(null);

  useEffect(() => {
    console.log('selectedClientForDetails=============wedsfnsfkjsdfhikjsdfhkjladfhkljasdfhkajlsdfhajklsdfhakljsdfjkdsef', selectedClientForDetails);
  }, [selectedClientForDetails]);

  const jobTypes = [
    'Accounts',
    'Audit',
    'Bookkeeping',
    'Company Secretary',
    'Corporation Tax',
    'Management Accounts',
    'Payroll',
    'Personal Tax',
    'Other'
  ];

  const { data: breakdownResp } = useGetClientBreakdownQuery({ page: 1, limit: 10 });
  const allClientsApi: Client[] = useMemo(() => {
    const list = breakdownResp?.data?.clients || [];
    return list.map((c: any) => ({
      id: c._id,
      name: c.name,
      clientRef: c.clientRef,
      balance: Number(c.totalOutstanding || 0),
      wipAmount: Number(c.wipAmount || 0),
      writeOffAmount: Number(c.totalWriteOffAmount || 0),
      totalExpenses: Number(c.totalExpenses || 0),
      notes: Array.isArray(c.notes) ? c.notes.map((n: any) => ({
        _id: n._id,
        note: n.note,
        createdAt: n.createdAt,
        updatedAt: n.updatedAt,
        createdBy: n.createdBy || { _id: '', name: 'Unknown' }
      })) : [],
      jobs: (c.allJobs || []).map((j: any) => ({
        id: j._id,
        name: j.name,
        type: j.status,
        logged: Number(j.totalLogDuration || 0) / 3600,
        billable: 0,
        nonBillable: 0,
        wipValue: 0,
        timeLogs: (j.timeLogs || []).map((tl: any) => ({
          id: tl._id,
          date: tl.date,
          teamMember: tl.user?.name || '',
          category: tl.timeCategory?.name || '-',
          description: tl.description || '',
          hours: Number(tl.duration || 0) / 3600,
          rate: Number(tl.rate || 0),
          amount: Number(tl.amount || 0),
          billable: Boolean(tl.billable),
          status: (tl.status || '').includes('paid') ? 'paid' : (tl.status || '').includes('invoice') ? 'invoiced' : 'not-invoiced',
        }))
      })),
      expenses: [],
    })) as Client[];
  }, [breakdownResp]);
  const sourceClients: Client[] = allClientsApi.length > 0 ? allClientsApi : [];

  const allClients: Client[] = [
   
  ];

  const effectiveClients: Client[] = sourceClients.length > 0 ? sourceClients : allClients;

  // Calculate VAT amounts
  const calculateVATAmount = (amount: number, hasVAT: boolean, vatRate: number) => {
    if (!hasVAT) return amount;
    return amount * (1 + vatRate / 100);
  };

  // Filter clients based on hide zero balances option
  const filteredClients = useMemo(() => {
    const base = effectiveClients;
    return hideZeroBalances ? base.filter(client => client.balance > 0) : base;
  }, [hideZeroBalances, effectiveClients]);
  console.log('==================dfgdfgdfgkjdfgjkdgjkdfhgjkdhgjkdfghjkdfgfilteredClientsfilteredClientsfilteredClients', filteredClients)
  // Sort clients
  const sortedClients = useMemo(() => {
    return [...filteredClients].sort((a, b) => {
      if (sortField === 'name' || sortField === 'clientRef') {
        const aValue = a[sortField];
        const bValue = b[sortField];
        return sortDirection === 'asc'
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      } else {
        const aValue = a[sortField] as number;
        const bValue = b[sortField] as number;
        return sortDirection === 'asc'
          ? aValue - bValue
          : bValue - aValue;
      }
    });
  }, [filteredClients, sortField, sortDirection]);

  const totalBalance = breakdownResp?.data?.summary?.totalOutstanding ?? effectiveClients.reduce((sum, client) => sum + client.balance, 0);
  const totalWipAmount = breakdownResp?.data?.summary?.totalWipAmount ?? effectiveClients.reduce((sum, client) => sum + client.wipAmount, 0);
  const totalWriteOffAmount = breakdownResp?.data?.summary?.totalWriteOffAmount ?? effectiveClients.reduce((sum, client) => sum + (client.writeOffAmount || 0), 0);
  const totalExpenses = breakdownResp?.data?.summary?.totalExpenses ?? effectiveClients.reduce((sum, client) => sum + (client.totalExpenses || 0), 0);

  const handleSort = (field: 'clientRef' | 'name' | 'balance' | 'wipAmount' | 'services' | 'timeLogged' | 'writeOff') => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection(field === 'name' || field === 'clientRef' ? 'asc' : 'desc'); // Default desc for amounts, asc for names/refs
    }
  };

  const getSortIcon = (field: 'clientRef' | 'name' | 'balance' | 'wipAmount' | 'services' | 'timeLogged' | 'writeOff') => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />;
  };

  const handleViewDebtorsLog = (clientId: string) => {
    setSearchParams({ tab: 'debtors-log', client: clientId });
  };

  const handleAddJob = () => {
    if (newJob.name && newJob.type && selectedClientId) {
      const updatedClients = allClients.map(client => {
        if (client.id === selectedClientId) {
          const newJobId = (Math.max(...client.jobs.map(j => parseInt(j.id)), 0) + 1).toString();
          return {
            ...client,
            jobs: [...client.jobs, { id: newJobId, name: newJob.name, type: newJob.type }]
          };
        }
        return client;
      });
      // In a real app, you'd update the state/backend here
      setNewJob({ name: '', type: '' });
      setIsAddingJob(false);
    }
  };

  const handleAddNewJob = (jobData: { name: string; type: string; fee: number }) => {
    if (selectedClientId) {
      // In a real app, you would add the job to the backend/state
      console.log('Adding new job:', jobData, 'to client:', selectedClientId);
      // For now, we'll just close the dialog and could show a success toast
    }
  };

  const handleAddExpense = () => {
    if (newExpense.description && newExpense.amount && selectedClientId) {
      const totalAmount = calculateVATAmount(newExpense.amount, newExpense.hasVAT, newExpense.vatRate);
      const updatedClients = allClients.map(client => {
        if (client.id === selectedClientId) {
          const newExpenseId = (Math.max(...client.expenses.map(e => parseInt(e.id)), 0) + 1).toString();
          return {
            ...client,
            expenses: [...client.expenses, {
              id: newExpenseId,
              description: newExpense.description,
              amount: newExpense.amount,
              hasVAT: newExpense.hasVAT,
              vatRate: newExpense.vatRate,
              totalAmount: totalAmount
            }]
          };
        }
        return client;
      });
      // In a real app, you'd update the state/backend here
      setNewExpense({ description: '', amount: 0, hasVAT: false, vatRate: 20, totalAmount: 0 });
      setIsAddingExpense(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Dashboard Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="h-full">
          <CardContent className="p-4">
            <div className="text-2xl font-bold !text-[#381980]">
              {allClients.length}
            </div>
            <p className="text-sm text-muted-foreground">Total Clients</p>
          </CardContent>
        </Card>
        <Card className="h-full">
          <CardContent className="p-4">
            <div className="text-2xl font-bold !text-[#381980]">
              {formatCurrency(totalBalance)}
            </div>
            <p className="text-sm text-muted-foreground">Total Outstanding</p>
          </CardContent>
        </Card>
        <Card className="h-full">
          <CardContent className="p-4">
            <div className="text-2xl font-bold !text-[#381980]">
              {formatCurrency(totalWipAmount)}
            </div>
            <p className="text-sm text-muted-foreground">Total WIP Amount</p>
          </CardContent>
        </Card>
        <Card className="h-full">
          <CardContent className="p-4">
            <div className="text-2xl font-bold !text-[#381980]">
              {formatCurrency(totalBalance / allClients.length)}
            </div>
            <p className="text-sm text-muted-foreground">Average Balance</p>
          </CardContent>
        </Card>
      </div>


      {/* Clients Table */}
      <Card className="border-border bg-card">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th
                    className="text-left p-3 font-medium text-foreground h-12 cursor-pointer hover:bg-muted/70 transition-colors border-r"
                    onClick={() => handleSort('clientRef')}
                  >
                    <div className="flex items-center gap-1">
                      Client Ref.
                      {getSortIcon('clientRef')}
                    </div>
                  </th>
                  <th
                    className="text-left p-3 font-medium text-foreground h-12 cursor-pointer hover:bg-muted/70 transition-colors border-r"
                    onClick={() => handleSort('name')}
                  >
                    <div className="flex items-center gap-1">
                      Client Name
                      {getSortIcon('name')}
                    </div>
                  </th>
                  <th className="text-center p-3 font-medium text-foreground h-12 border-r">Jobs</th>
                  
                  <th
                    className="text-center p-3 font-medium text-foreground h-12 border-r cursor-pointer hover:bg-muted/70 transition-colors"
                    onClick={() => handleSort('timeLogged')}
                  >
                    <div className="flex items-center justify-center gap-1">
                      Time Logged
                      {getSortIcon('timeLogged')}
                    </div>
                  </th>
                  <th
                    className="text-center p-3 font-medium text-foreground h-12 border-r cursor-pointer hover:bg-muted/70 transition-colors"
                    onClick={() => handleSort('name')}
                  >
                    <div className="flex items-center justify-center gap-1">
                      Notes
                      {getSortIcon('name')}
                    </div>
                  </th>
                  <th
                    className="text-right p-3 font-medium text-foreground h-12 border-r cursor-pointer hover:bg-muted/70 transition-colors"
                    onClick={() => handleSort('wipAmount')}
                  >
                    <div className="flex items-center justify-end gap-1">
                      WIP Balance
                      {getSortIcon('wipAmount')}
                    </div>
                  </th>
                  <th
                    className="text-right p-3 font-medium text-foreground h-12 border-r cursor-pointer hover:bg-muted/70 transition-colors"
                    onClick={() => handleSort('name')}
                  >
                    <div className="flex items-center justify-end gap-1">
                      Invoices
                      {getSortIcon('name')}
                    </div>
                  </th>
                  <th
                    className="text-right p-3 font-medium text-foreground h-12 border-r cursor-pointer hover:bg-muted/70 transition-colors"
                    onClick={() => handleSort('writeOff')}
                  >
                    <div className="flex items-center justify-end gap-1">
                      Write Off €
                      {getSortIcon('writeOff')}
                    </div>
                  </th>
                  <th
                    className="text-right p-3 font-medium text-foreground h-12 border-r cursor-pointer hover:bg-muted/70 transition-colors"
                    onClick={() => handleSort('balance')}
                  >
                    <div className="flex items-center justify-end gap-1">
                      Balance
                      {getSortIcon('balance')}
                    </div>
                  </th>
                  <th
                    className="text-right p-3 font-medium text-foreground h-12 border-r cursor-pointer hover:bg-muted/70 transition-colors"
                    onClick={() => handleSort('name')}
                  >
                    <div className="flex items-center justify-end gap-1">
                      Expenses
                      {getSortIcon('name')}
                    </div>
                  </th>
                  <th className="text-center p-3 font-medium text-foreground h-12">Actions</th>
                </tr>
              </thead>
              <tbody>
                {sortedClients.map((client: Client) => (
                  <tr key={client.id} className="border-b border-border hover:bg-muted/30 transition-colors">
                    <td className="p-4 font-medium text-foreground border-r">{client.clientRef}</td>
                    <td className="p-4 font-medium text-foreground border-r">
                      <ClientNameLink name={client.name} ciientId={client.id} />
                    </td>
                    <td className="p-4 text-center border-r">

                      <Button
                        variant="outline"
                        size="sm"
                        className="bg-green-50 text-green-700 hover:bg-green-100"
                        onClick={() => {
                          setSelectedClientId(client.id);
                          setShowJobsDialog(true);
                        }}
                      >
                        {client.jobs.length}
                      </Button>
                    </td>
                    
                    <td className="p-4 text-center border-r">
                      <span className="font-semibold text-foreground">
                        {client.jobs.reduce((total, job) => total + job.logged, 0).toFixed(1)}h
                      </span>
                    </td>
                    <td className="p-4 text-center border-r">
                      {(() => {
                        const notesCount = Array.isArray(client.notes) ? client.notes.length : 0;
                        return notesCount === 0 ? (
                          <Badge variant="outline" className="opacity-50">N/A</Badge>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            className="bg-blue-50 text-blue-700 hover:bg-blue-100"
                            onClick={() => {
                              setSelectedNotesClient(client);
                              setShowNotesDialog(true);
                            }}
                          >
                            {notesCount}
                          </Button>
                        );
                      })()}
                    </td>
                    <td className="p-4 text-right border-r">
                      <span className="font-semibold text-foreground">
                        {client.wipAmount === 0 ? <Badge variant="outline">N/A</Badge> : formatCurrency(client.wipAmount)}
                      </span>
                    </td>
                    <td className="p-4 text-right border-r">
                      <span className="font-semibold text-foreground">
                        {formatCurrency([1250, 850, 1200, 675, 420, 340, 1180, 290, 560, 1320, 890, 1210, 780, 450, 925][effectiveClients.indexOf(client)] || 0)}
                      </span>
                    </td>
                    <td className="p-4 text-right border-r">
                      <span className="font-semibold text-foreground">
                        {client.writeOffAmount !== undefined && client.writeOffAmount > 0 
                          ? formatCurrency(client.writeOffAmount) 
                          : <Badge variant="outline">N/A</Badge>}
                      </span>
                    </td>
                    <td className="p-4 text-right border-r">
                      <span className="font-semibold text-foreground">
                        {formatCurrency([890, 670, 1150, 480, 920, 340, 1380, 220, 760, 1020, 540, 850, 410, 290, 1180][effectiveClients.indexOf(client)] || 0)}
                      </span>
                    </td>
                    <td className="p-4 text-right border-r">
                      <span className="font-semibold text-foreground">
                        {formatCurrency(client.totalExpenses)}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewDebtorsLog(client.id)}
                          className="bg-purple-dark hover:bg-purple-dark/90 text-purple-dark-foreground border-purple-dark hover:border-purple-dark transition-colors h-8 px-2 text-xs"
                        >
                          View Debtors Log
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-border bg-muted/50 font-semibold">
                  <td className="p-4 text-foreground border-r">TOTAL</td>
                  <td className="p-4 border-r"></td>
                  <td className="p-4 text-center text-foreground border-r">{effectiveClients.reduce((acc, c) => acc + c.jobs.length, 0)}</td>
                  <td className="p-4 text-center text-foreground border-r">{effectiveClients.reduce((total, client) => total + client.jobs.reduce((jobTotal, job) => jobTotal + job.logged, 0), 0).toFixed(1)}h</td>
                  <td className="p-4 text-center text-foreground border-r">-</td>
                  <td className="p-4 text-right text-foreground border-r">{formatCurrency(totalWipAmount)}</td>
                  <td className="p-4 text-right text-foreground border-r">-</td>
                  <td className="p-4 text-right text-foreground border-r">{formatCurrency(totalWriteOffAmount)}</td>
                  <td className="p-4 text-right text-foreground border-r">{formatCurrency(totalBalance)}</td>
                  <td className="p-4 text-right text-foreground border-r">{formatCurrency(totalExpenses)}</td>
                  <td className="p-4"></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Expenses Dialog */}
      {selectedExpensesClient && (
        <ActiveExpensesDialog
          isOpen={showExpensesDialog}
          onClose={() => {
            setShowExpensesDialog(false);
            setSelectedExpensesClient(null);
          }}
          clientName={selectedExpensesClient.name}
          expenses={selectedExpensesClient.expenses.map(expense => ({
            id: expense.id,
            description: expense.description,
            submittedBy: 'System', // Default value since not in client expense data
            amount: expense.totalAmount,
            hasAttachment: false, // Default value since not in client expense data
            dateLogged: new Date().toISOString(), // Default value since not in client expense data
            vatPercentage: 0, // Default value since not in client expense data
            totalAmount: expense.totalAmount
          }))}
        />
      )}

      {/* WIP Balance Dialog */}
      {selectedWIPClient && (
        <WIPBalanceDialog
          open={showWIPDialog}
          onOpenChange={(open) => {
            setShowWIPDialog(open);
            if (!open) setSelectedWIPClient(null);
          }}
          clientName={selectedWIPClient.name}
          wipBalance={selectedWIPClient.wipAmount}
          onCarryForward={() => {
            setShowWIPDialog(false);
            setSelectedWIPClient(null);
          }}
          onWriteOff={() => {
            setShowWIPDialog(false);
            setSelectedWIPClient(null);
          }}
        />
      )}

      {/* Client Jobs Dialog */}
      <ClientJobsDialog
        open={showJobsDialog}
        onOpenChange={setShowJobsDialog}
        clientName={effectiveClients.find(c => c.id === selectedClientId)?.name || ''}
        jobs={effectiveClients.find(c => c.id === selectedClientId)?.jobs || []}
      />

      

      {/* Debtors Balance Dialog */}
      {selectedDebtorsClient && (
        <DebtorsBalanceDialog
          open={showDebtorsDialog}
          onOpenChange={setShowDebtorsDialog}
          clientName={selectedDebtorsClient.name}
          onAddBalance={(amount) => {
            console.log(`Adding ${amount} to debtors balance for ${selectedDebtorsClient.name}`);
            setShowDebtorsDialog(false);
            setSelectedDebtorsClient(null);
          }}
        />
      )}

      {/* Notes Dialog */}
      {selectedNotesClient && (
        <Dialog open={showNotesDialog} onOpenChange={setShowNotesDialog}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Notes for {selectedNotesClient.name}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              {Array.isArray(selectedNotesClient.notes) && selectedNotesClient.notes.length > 0 ? (
                <div className="space-y-4">
                  {selectedNotesClient.notes.map((note, index) => (
                    <div key={note._id} className="relative pl-6 pb-4">
                      {index < selectedNotesClient.notes!.length - 1 && (
                        <div className="absolute left-2 top-6 bottom-0 w-0.5 bg-border"></div>
                      )}
                      <div className="absolute left-0 top-1 w-4 h-4 bg-primary rounded-full border-2 border-background"></div>
                      <div className="bg-muted rounded-lg p-3">
                        <div className="flex items-center gap-2 mb-2">
                          <Clock className="h-3 w-3 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">
                            {new Date(note.createdAt).toLocaleDateString()} at {new Date(note.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} by {note.createdBy?.name || 'Unknown'}
                          </span>
                        </div>
                        <p className="text-sm">{note.note}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <span className="text-muted-foreground">No notes yet.</span>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default ClientsTab;