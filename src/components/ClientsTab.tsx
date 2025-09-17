import React, { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Card, CardContent } from "@/components/ui/card";
import { DashboardCard, DashboardGrid } from "@/components/ui/dashboard-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {  ChevronUp, ChevronDown } from 'lucide-react';
import { formatCurrency } from '@/lib/currency';
import ActiveExpensesDialog from './ActiveExpensesDialog';
import WIPBalanceDialog from './WIPBalanceDialog';
import ClientJobsDialog from './ClientJobsDialog';
import ClientDetailsDialog from './ClientDetailsDialog';
import DebtorsBalanceDialog from './DebtorsBalanceDialog';

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

interface Client {
  id: string;
  name: string;
  clientRef: string;
  balance: number;
  wipAmount: number;
  jobs: Job[];
  expenses: Expense[];
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

  const allClients: Client[] = [
    {
      id: 'water-savers',
      name: 'Water Savers Limited',
      clientRef: 'WAT-23',
      balance: 8.00,
      wipAmount: 1200.00,
      jobs: [
        {
          id: '1',
          name: 'Annual Accounts Preparation',
          type: 'Accounts',
          logged: 12.5,
          billable: 10.0,
          nonBillable: 2.5,
          wipValue: 1200.00,
          timeLogs: [
            { id: 'tl1', date: '2024-01-15', teamMember: 'John Smith', category: 'client work', description: 'Review financial statements', hours: 3.5, rate: 120, amount: 420, billable: true, status: 'not-invoiced' },
            { id: 'tl2', date: '2024-01-16', teamMember: 'Sarah Johnson', category: 'meeting', description: 'Client meeting for accounts review', hours: 2.0, rate: 100, amount: 200, billable: true, status: 'invoiced' }
          ]
        },
        {
          id: '2',
          name: 'Payroll Management',
          type: 'Payroll',
          logged: 8.0,
          billable: 8.0,
          nonBillable: 0.0,
          wipValue: 480.00,
          timeLogs: [
            { id: 'tl3', date: '2024-01-17', teamMember: 'Mike Wilson', category: 'client work', description: 'Process monthly payroll', hours: 4.0, rate: 85, amount: 340, billable: true, status: 'not-invoiced' }
          ]
        }
      ],
      expenses: [
        { id: '1', description: 'Office Supplies', amount: 150.00, hasVAT: true, vatRate: 20, totalAmount: 180.00 },
        { id: '2', description: 'Travel Costs', amount: 75.50, hasVAT: false, vatRate: 0, totalAmount: 75.50 }
      ]
    },
    {
      id: 'green-gardens',
      name: 'Green Gardens Limited',
      clientRef: 'GRE-25',
      balance: 1250.00,
      wipAmount: 850.00,
      jobs: [
        { id: '3', name: 'VAT Return Filing', type: 'Corporation Tax', logged: 6.0, billable: 5.5, nonBillable: 0.5, wipValue: 550.00, timeLogs: [{ id: 'tl4', date: '2024-01-18', teamMember: 'Emily Davis', category: 'client work', description: 'VAT return preparation', hours: 5.5, rate: 100, amount: 550, billable: true, status: 'not-invoiced' }] },
        { id: '4', name: 'Monthly Bookkeeping', type: 'Bookkeeping', logged: 15.0, billable: 15.0, nonBillable: 0.0, wipValue: 1275.00, timeLogs: [{ id: 'tl5', date: '2024-01-19', teamMember: 'Mike Wilson', category: 'client work', description: 'Monthly bookkeeping entries', hours: 15.0, rate: 85, amount: 1275, billable: true, status: 'not-invoiced' }] },
        { id: '5', name: 'Management Reports', type: 'Management Accounts', logged: 4.5, billable: 4.0, nonBillable: 0.5, wipValue: 400.00, timeLogs: [{ id: 'tl6', date: '2024-01-20', teamMember: 'Sarah Johnson', category: 'meeting', description: 'Management report preparation', hours: 4.0, rate: 100, amount: 400, billable: true, status: 'invoiced' }] }
      ],
      expenses: [
        { id: '3', description: 'Client Meeting', amount: 120.00, hasVAT: true, vatRate: 20, totalAmount: 144.00 }
      ]
    },
    {
      id: 'brown-enterprises',
      name: 'Brown Enterprises',
      clientRef: 'BRO-24',
      balance: 2500.00,
      wipAmount: 3200.00,
      jobs: [
        { id: '6', name: 'Year-end Audit', type: 'Audit', logged: 25.0, billable: 22.0, nonBillable: 3.0, wipValue: 2640.00, timeLogs: [{ id: 'tl7', date: '2024-01-21', teamMember: 'John Smith', category: 'client work', description: 'Year-end audit procedures', hours: 22.0, rate: 120, amount: 2640, billable: true, status: 'not-invoiced' }] },
        { id: '7', name: 'Company Secretarial Services', type: 'Company Secretary', logged: 3.5, billable: 3.5, nonBillable: 0.0, wipValue: 420.00, timeLogs: [{ id: 'tl8', date: '2024-01-22', teamMember: 'Sarah Johnson', category: 'phone call', description: 'Company secretarial work', hours: 3.5, rate: 120, amount: 420, billable: true, status: 'paid' }] }
      ],
      expenses: [
        { id: '7', description: 'CRO Filing Fee', amount: 40.00, hasVAT: false, vatRate: 0, totalAmount: 40.00 },
        { id: '8', description: 'Mileage to Client', amount: 65.00, hasVAT: false, vatRate: 0, totalAmount: 65.00 }
      ]
    },
    {
      id: 'smith-associates',
      name: 'Smith & Associates',
      clientRef: 'SMI-22',
      balance: 750.00,
      wipAmount: 0.00,
      jobs: [
        { id: '8', name: 'Personal Tax Return', type: 'Personal Tax', logged: 7.0, billable: 6.5, nonBillable: 0.5, wipValue: 650.00, timeLogs: [{ id: 'tl9', date: '2024-01-23', teamMember: 'Emily Davis', category: 'client work', description: 'Personal tax return preparation', hours: 6.5, rate: 100, amount: 650, billable: true, status: 'invoiced' }] }
      ],
      expenses: [
        { id: '9', description: 'Subsistence', amount: 75.00, hasVAT: true, vatRate: 23, totalAmount: 92.25 }
      ]
    },
    {
      id: 'tech-solutions',
      name: 'Tech Solutions Inc.',
      clientRef: 'TEC-25',
      balance: 4200.00,
      wipAmount: 2800.00,
      jobs: [
        { id: '9', name: 'Corporation Tax Return', type: 'Corporation Tax', logged: 12.0, billable: 11.0, nonBillable: 1.0, wipValue: 1320.00, timeLogs: [{ id: 'tl10', date: '2024-01-24', teamMember: 'John Smith', category: 'client work', description: 'Corporation tax return preparation', hours: 11.0, rate: 120, amount: 1320, billable: true, status: 'not-invoiced' }] },
        { id: '10', name: 'System Implementation', type: 'Other', logged: 20.0, billable: 18.0, nonBillable: 2.0, wipValue: 1980.00, timeLogs: [{ id: 'tl11', date: '2024-01-25', teamMember: 'Mike Wilson', category: 'training', description: 'System implementation and training', hours: 18.0, rate: 110, amount: 1980, billable: true, status: 'not-invoiced' }] },
        { id: '11', name: 'Weekly Payroll', type: 'Payroll', logged: 16.0, billable: 16.0, nonBillable: 0.0, wipValue: 1360.00, timeLogs: [{ id: 'tl12', date: '2024-01-26', teamMember: 'Sarah Johnson', category: 'client work', description: 'Weekly payroll processing', hours: 16.0, rate: 85, amount: 1360, billable: true, status: 'invoiced' }] }
      ],
      expenses: [
        { id: '4', description: 'Software License', amount: 500.00, hasVAT: true, vatRate: 20, totalAmount: 600.00 }
      ]
    },
    {
      id: 'marine-consulting',
      name: 'Marine Consulting Ltd.',
      clientRef: 'MAR-99',
      balance: 0.00,
      wipAmount: 450.00,
      jobs: [
        { id: '12', name: 'Compliance Audit', type: 'Audit', logged: 18.5, billable: 17.0, nonBillable: 1.5, wipValue: 2040.00, timeLogs: [{ id: 'tl13', date: '2024-01-27', teamMember: 'John Smith', category: 'client work', description: 'Compliance audit procedures', hours: 17.0, rate: 120, amount: 2040, billable: true, status: 'not-invoiced' }] },
        { id: '13', name: 'Financial Statements', type: 'Accounts', logged: 14.0, billable: 13.0, nonBillable: 1.0, wipValue: 1300.00, timeLogs: [{ id: 'tl14', date: '2024-01-28', teamMember: 'Emily Davis', category: 'client work', description: 'Financial statements preparation', hours: 13.0, rate: 100, amount: 1300, billable: true, status: 'paid' }] }
      ],
      expenses: []
    },
    {
      id: 'digital-media',
      name: 'Digital Media Group',
      clientRef: 'DIG-24',
      balance: 1850.00,
      wipAmount: 1600.00,
      jobs: [
        { id: '14', name: 'Management Accounts Prep', type: 'Management Accounts', logged: 22.0, billable: 20.0, nonBillable: 2.0, wipValue: 2200.00, timeLogs: [{ id: 'tl15', date: '2024-01-29', teamMember: 'Mike Wilson', category: 'client work', description: 'Management accounts preparation', hours: 20.0, rate: 110, amount: 2200, billable: true, status: 'not-invoiced' }] },
        { id: '15', name: 'Personal Tax Advisory', type: 'Personal Tax', logged: 5.5, billable: 5.0, nonBillable: 0.5, wipValue: 500.00, timeLogs: [{ id: 'tl16', date: '2024-01-30', teamMember: 'Sarah Johnson', category: 'meeting', description: 'Personal tax advisory meeting', hours: 5.0, rate: 100, amount: 500, billable: true, status: 'invoiced' }] }
      ],
      expenses: [
        { id: '5', description: 'Marketing Materials', amount: 250.00, hasVAT: true, vatRate: 20, totalAmount: 300.00 }
      ]
    },
    {
      id: 'retail-partners',
      name: 'Retail Partners LLC',
      clientRef: 'RET-23',
      balance: 0.00,
      wipAmount: 0.00,
      jobs: [],
      expenses: []
    },
    {
      id: 'construction-pros',
      name: 'Construction Pros Ltd.',
      clientRef: 'CON-25',
      balance: 5600.00,
      wipAmount: 4200.00,
      jobs: [
        { id: '16', name: 'Annual Accounts Review', type: 'Accounts', logged: 28.0, billable: 25.0, nonBillable: 3.0, wipValue: 3000.00, timeLogs: [{ id: 'tl17', date: '2024-02-01', teamMember: 'John Smith', category: 'client work', description: 'Annual accounts review', hours: 25.0, rate: 120, amount: 3000, billable: true, status: 'not-invoiced' }] },
        { id: '17', name: 'Monthly Bookkeeping', type: 'Bookkeeping', logged: 32.0, billable: 32.0, nonBillable: 0.0, wipValue: 2720.00, timeLogs: [{ id: 'tl18', date: '2024-02-02', teamMember: 'Mike Wilson', category: 'client work', description: 'Monthly bookkeeping services', hours: 32.0, rate: 85, amount: 2720, billable: true, status: 'invoiced' }] },
        { id: '18', name: 'Payroll Processing', type: 'Payroll', logged: 24.0, billable: 24.0, nonBillable: 0.0, wipValue: 2040.00, timeLogs: [{ id: 'tl19', date: '2024-02-03', teamMember: 'Sarah Johnson', category: 'client work', description: 'Payroll processing services', hours: 24.0, rate: 85, amount: 2040, billable: true, status: 'paid' }] }
      ],
      expenses: []
    },
    {
      id: 'financial-advisors',
      name: 'Financial Advisors Co.',
      clientRef: 'FIN-22',
      balance: 3200.00,
      wipAmount: 2100.00,
      jobs: [
        { id: '19', name: 'Strategic Tax Planning', type: 'Corporation Tax', logged: 15.5, billable: 14.0, nonBillable: 1.5, wipValue: 1680.00, timeLogs: [{ id: 'tl20', date: '2024-02-04', teamMember: 'John Smith', category: 'meeting', description: 'Strategic tax planning consultation', hours: 14.0, rate: 120, amount: 1680, billable: true, status: 'not-invoiced' }] },
        { id: '20', name: 'Personal Tax Consultation', type: 'Personal Tax', logged: 9.0, billable: 8.5, nonBillable: 0.5, wipValue: 850.00, timeLogs: [{ id: 'tl21', date: '2024-02-05', teamMember: 'Emily Davis', category: 'phone call', description: 'Personal tax consultation call', hours: 8.5, rate: 100, amount: 850, billable: true, status: 'invoiced' }] }
      ],
      expenses: []
    },
    {
      id: 'healthcare-systems',
      name: 'Healthcare Systems Ltd.',
      clientRef: 'HEA-24',
      balance: 890.00,
      wipAmount: 750.00,
      jobs: [
        { id: '21', name: 'System Audit', type: 'Audit', logged: 12.0, billable: 11.0, nonBillable: 1.0, wipValue: 1320.00, timeLogs: [{ id: 'tl22', date: '2024-02-06', teamMember: 'Mike Wilson', category: 'client work', description: 'System audit procedures', hours: 11.0, rate: 120, amount: 1320, billable: true, status: 'not-invoiced' }] }
      ],
      expenses: []
    },
    {
      id: 'education-first',
      name: 'Education First Academy',
      clientRef: 'EDU-21',
      balance: 0.00,
      wipAmount: 320.00,
      jobs: [
        { id: '22', name: 'Board Meeting Support', type: 'Company Secretary', logged: 4.0, billable: 4.0, nonBillable: 0.0, wipValue: 480.00, timeLogs: [{ id: 'tl23', date: '2024-02-07', teamMember: 'Sarah Johnson', category: 'meeting', description: 'Board meeting support services', hours: 4.0, rate: 120, amount: 480, billable: true, status: 'paid' }] }
      ],
      expenses: []
    },
    {
      id: 'transport-logistics',
      name: 'Transport & Logistics',
      clientRef: 'TRA-23',
      balance: 2750.00,
      wipAmount: 1800.00,
      jobs: [
        { id: '23', name: 'Fleet Management Accounts', type: 'Management Accounts', logged: 26.0, billable: 24.0, nonBillable: 2.0, wipValue: 2640.00, timeLogs: [{ id: 'tl24', date: '2024-02-08', teamMember: 'John Smith', category: 'client work', description: 'Fleet management accounting', hours: 24.0, rate: 110, amount: 2640, billable: true, status: 'invoiced' }] },
        { id: '24', name: 'Operational Bookkeeping', type: 'Bookkeeping', logged: 30.0, billable: 30.0, nonBillable: 0.0, wipValue: 2550.00, timeLogs: [{ id: 'tl25', date: '2024-02-09', teamMember: 'Mike Wilson', category: 'client work', description: 'Operational bookkeeping services', hours: 30.0, rate: 85, amount: 2550, billable: true, status: 'not-invoiced' }] }
      ],
      expenses: []
    },
    {
      id: 'energy-solutions',
      name: 'Energy Solutions Corp.',
      clientRef: 'ENE-25',
      balance: 6800.00,
      wipAmount: 5200.00,
      jobs: [
        { id: '25', name: 'Financial Audit', type: 'Audit', logged: 35.0, billable: 32.0, nonBillable: 3.0, wipValue: 3840.00, timeLogs: [{ id: 'tl26', date: '2024-02-10', teamMember: 'John Smith', category: 'client work', description: 'Financial audit procedures', hours: 32.0, rate: 120, amount: 3840, billable: true, status: 'not-invoiced' }] },
        { id: '26', name: 'Tax Compliance', type: 'Corporation Tax', logged: 18.0, billable: 17.0, nonBillable: 1.0, wipValue: 2040.00, timeLogs: [{ id: 'tl27', date: '2024-02-11', teamMember: 'Emily Davis', category: 'client work', description: 'Tax compliance review', hours: 17.0, rate: 120, amount: 2040, billable: true, status: 'invoiced' }] },
        { id: '27', name: 'Quarterly Accounts', type: 'Accounts', logged: 16.0, billable: 15.0, nonBillable: 1.0, wipValue: 1500.00, timeLogs: [{ id: 'tl28', date: '2024-02-12', teamMember: 'Sarah Johnson', category: 'client work', description: 'Quarterly accounts preparation', hours: 15.0, rate: 100, amount: 1500, billable: true, status: 'paid' }] }
      ],
      expenses: []
    },
    {
      id: 'hospitality-group',
      name: 'Hospitality Group plc',
      clientRef: 'HOS-24',
      balance: 1200.00,
      wipAmount: 900.00,
      jobs: [
        { id: '28', name: 'Hotel Accounts Management', type: 'Management Accounts', logged: 21.0, billable: 19.0, nonBillable: 2.0, wipValue: 2090.00, timeLogs: [{ id: 'tl29', date: '2024-02-13', teamMember: 'Mike Wilson', category: 'client work', description: 'Hotel accounts management', hours: 19.0, rate: 110, amount: 2090, billable: true, status: 'not-invoiced' }] },
        { id: '29', name: 'Staff Payroll', type: 'Payroll', logged: 14.0, billable: 14.0, nonBillable: 0.0, wipValue: 1190.00, timeLogs: [{ id: 'tl30', date: '2024-02-14', teamMember: 'Sarah Johnson', category: 'client work', description: 'Staff payroll processing', hours: 14.0, rate: 85, amount: 1190, billable: true, status: 'invoiced' }] }
      ],
      expenses: []
    }
  ];

  // Calculate VAT amounts
  const calculateVATAmount = (amount: number, hasVAT: boolean, vatRate: number) => {
    if (!hasVAT) return amount;
    return amount * (1 + vatRate / 100);
  };

  // Filter clients based on hide zero balances option
  const filteredClients = useMemo(() => {
    return hideZeroBalances
      ? allClients.filter(client => client.balance > 0)
      : allClients;
  }, [hideZeroBalances]);

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

  const totalBalance = allClients.reduce((sum, client) => sum + client.balance, 0);
  const totalWipAmount = allClients.reduce((sum, client) => sum + client.wipAmount, 0);

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
      <DashboardGrid columns={4}>
        <DashboardCard
          title="Total Clients"
          value={allClients.length}
        />

        <DashboardCard
          title="Total Outstanding"
          value={formatCurrency(totalBalance)}
        />

        <DashboardCard
          title="Total WIP Amount"
          value={formatCurrency(totalWipAmount)}
        />

        <DashboardCard
          title="Average Balance"
          value={formatCurrency(totalBalance / allClients.length)}
        />
      </DashboardGrid>


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
                    onClick={() => handleSort('services')}
                  >
                    <div className="flex items-center justify-center gap-1">
                      Services
                      {getSortIcon('services')}
                    </div>
                  </th>
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
                {sortedClients.map((client) => (
                  <tr key={client.id} className="border-b border-border hover:bg-muted/30 transition-colors">
                    <td className="p-4 font-medium text-foreground border-r">{client.clientRef}</td>
                    <td className="p-4 font-medium text-foreground border-r">
                      <span
                        className="cursor-pointer text-blue-600 hover:text-blue-800 hover:underline"
                        onClick={() => {
                          setSelectedClientForDetails(client);
                          setShowClientDetailsDialog(true);
                        }}
                      >
                        {client.name}
                      </span>
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
                      {(() => {
                        const servicesValue = [3, 2, 5, 2, 4, 1, 6, 1, 3, 4, 2, 3, 2, 1, 5][allClients.indexOf(client)] || 0;
                        return servicesValue === 0 ? (
                          <Badge variant="outline" className="opacity-50">N/A</Badge>
                        ) : (
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                className="bg-green-50 text-green-700 hover:bg-green-100"
                              >
                                {servicesValue}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-80">
                              <div className="space-y-2">
                                <h4 className="font-medium">Services for {client.name}</h4>
                                <div className="space-y-1">
                                  {client.jobs.map((job, index) => (
                                    <div key={job.id} className="text-sm">
                                      • {job.type}: {job.name}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </PopoverContent>
                          </Popover>
                        );
                      })()}
                    </td>
                    <td className="p-4 text-center border-r">
                      <span className="font-semibold text-foreground">
                        {client.jobs.reduce((total, job) => total + job.logged, 0).toFixed(1)}h
                      </span>
                    </td>
                    <td className="p-4 text-center border-r">
                      {(() => {
                        const notesValue = [15, 8, 23, 12, 19, 7, 31, 5, 14, 22, 9, 18, 11, 6, 25][allClients.indexOf(client)] || 0;
                        return notesValue === 0 ? (
                          <Badge variant="outline" className="opacity-50">N/A</Badge>
                        ) : (
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                className="bg-blue-50 text-blue-700 hover:bg-blue-100"
                              >
                                {notesValue}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-80">
                              <div className="space-y-2">
                                <h4 className="font-medium">Notes for {client.name}</h4>
                                <div className="space-y-1 text-sm text-muted-foreground">
                                  <div>• Client meeting scheduled for next week</div>
                                  <div>• Need to review Q4 accounts</div>
                                  <div>• Follow up on outstanding invoices</div>
                                  <div>• Prepare annual compliance checklist</div>
                                </div>
                              </div>
                            </PopoverContent>
                          </Popover>
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
                        {formatCurrency([1250, 850, 1200, 675, 420, 340, 1180, 290, 560, 1320, 890, 1210, 780, 450, 925][allClients.indexOf(client)] || 0)}
                      </span>
                    </td>
                    <td className="p-4 text-right border-r">
                      <span className="font-semibold text-foreground">
                        {formatCurrency([450, 320, 780, 210, 590, 150, 940, 80, 380, 650, 290, 520, 180, 110, 870][allClients.indexOf(client)] || 0)}
                      </span>
                    </td>
                    <td className="p-4 text-right border-r">
                      <span className="font-semibold text-foreground">
                        {formatCurrency([890, 670, 1150, 480, 920, 340, 1380, 220, 760, 1020, 540, 850, 410, 290, 1180][allClients.indexOf(client)] || 0)}
                      </span>
                    </td>
                    <td className="p-4 text-right border-r">
                      <span className="font-semibold text-foreground">
                        {formatCurrency(client.expenses.reduce((total, expense) => total + expense.totalAmount, 0))}
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
                  <td className="p-4 border-r"></td>
                  <td className="p-4 text-center text-foreground border-r">47</td>
                  <td className="p-4 text-center text-foreground border-r">{allClients.reduce((total, client) => total + client.jobs.reduce((jobTotal, job) => jobTotal + job.logged, 0), 0).toFixed(1)}h</td>
                  <td className="p-4 text-center text-foreground border-r">293</td>
                  <td className="p-4 text-right text-foreground border-r">{formatCurrency(totalWipAmount)}</td>
                  <td className="p-4 text-right text-foreground border-r">{formatCurrency(13845)}</td>
                  <td className="p-4 text-right text-foreground border-r">{formatCurrency(6250)}</td>
                  <td className="p-4 text-right text-foreground border-r">{formatCurrency(totalBalance)}</td>
                  <td className="p-4 text-right text-foreground border-r">{formatCurrency(allClients.reduce((total, client) => total + client.expenses.reduce((expTotal, expense) => expTotal + expense.totalAmount, 0), 0))}</td>
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
        clientName={allClients.find(c => c.id === selectedClientId)?.name || ''}
        jobs={allClients.find(c => c.id === selectedClientId)?.jobs || []}
        onAddJob={handleAddNewJob}
      />

      {/* Client Details Dialog */}
      {selectedClientForDetails && (
        <ClientDetailsDialog
          open={showClientDetailsDialog}
          onOpenChange={setShowClientDetailsDialog}
          clientData={selectedClientForDetails}
        />
      )}

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
    </div>
  );
};

export default ClientsTab;