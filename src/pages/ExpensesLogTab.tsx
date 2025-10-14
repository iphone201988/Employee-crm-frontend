import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CreditCard, Search, Filter, Eye, Edit, Download, Upload, Paperclip, ExternalLink, Plus } from "lucide-react";
import sampleReceipt from "@/assets/sample-receipt.png";
import CustomTabs from '@/components/Tabs';
import { usePermissionTabs } from '@/hooks/usePermissionTabs';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@radix-ui/react-tooltip';
import { useLazyGetTabAccessQuery } from '@/store/authApi';
import { useGetDropdownOptionsQuery } from '@/store/teamApi';
import { useAddClientExpenseMutation } from '@/store/expensesApi';
import { useGetCurrentUserQuery } from '@/store/authApi';
import Avatars from '@/components/Avatars';
interface Expense {
  id: string;
  date: string;
  client?: string; // Optional for own expenses
  description: string;
  category: 'CRO filing fee' | 'Subsistence' | 'Accommodation' | 'Mileage' | 'Software' | 'Stationary';
  netAmount: number;
  vatRate: number;
  vatAmount: number;
  amount: number; // Gross amount (net + vat)
  status: 'invoiced' | 'not invoiced' | 'paid' | 'not paid';
  invoiceNumber?: string;
  submittedBy: string;
  submitterAvatar?: string;
  attachments?: string[]; // File paths/names for receipts
}

// Helper function to calculate VAT based on category
const calculateVATDetails = (netAmount: number, category: string) => {
  let vatRate = 0;
  switch (category) {
    case 'Subsistence':
      vatRate = 13.5;
      break;
    case 'CRO filing fee':
      vatRate = 0;
      break;
    default:
      vatRate = 23;
      break;
  }
  const vatAmount = (netAmount * vatRate) / 100;
  const grossAmount = netAmount + vatAmount;
  return { vatRate, vatAmount, grossAmount };
};

const sampleExpenses: Expense[] = [
  {
    id: '1',
    date: '2024-01-15',
    client: 'ABC Corp Ltd',
    description: 'Mileage for client meeting in Dublin',
    category: 'Mileage',
    netAmount: 69.51,
    vatRate: 23,
    vatAmount: 15.99,
    amount: 85.50,
    status: 'not invoiced',
    submittedBy: 'Sarah Johnson',
    submitterAvatar: '/lovable-uploads/2a629138-9746-40f3-ad13-33c9c4d4b180.png',
    attachments: ['mileage_receipt_001.pdf']
  },
  {
    id: '2',
    date: '2024-01-14',
    client: 'XYZ Holdings',
    description: 'Software subscription for project analysis',
    category: 'Software',
    netAmount: 243.09,
    vatRate: 23,
    vatAmount: 55.91,
    amount: 299.00,
    status: 'invoiced',
    invoiceNumber: 'INV-2024-001',
    submittedBy: 'Michael Chen',
    submitterAvatar: '/lovable-uploads/379fa9c7-8b08-43d9-958a-2037e951a111.png',
    attachments: ['software_invoice.pdf']
  },
  {
    id: '3',
    date: '2024-01-13',
    client: 'Smith & Associates',
    description: 'Meal expenses during client consultation',
    category: 'Subsistence',
    netAmount: 40.31,
    vatRate: 13.5,
    vatAmount: 5.44,
    amount: 45.75,
    status: 'not invoiced',
    submittedBy: 'Emily Davis',
    submitterAvatar: '/lovable-uploads/69b009d6-9e34-4be5-b5f7-e4f487c247d1.png',
    attachments: ['restaurant_receipt.jpg']
  },
  {
    id: '23',
    date: '2024-01-16',
    client: 'Tech Solutions Ltd',
    description: 'Office supplies for project documentation',
    category: 'Stationary',
    netAmount: 97.56,
    vatRate: 23,
    vatAmount: 22.44,
    amount: 120.00,
    status: 'not invoiced',
    submittedBy: 'Sarah Johnson',
    submitterAvatar: '/lovable-uploads/2a629138-9746-40f3-ad13-33c9c4d4b180.png',
    attachments: ['supplies_receipt.pdf']
  },
  {
    id: '24',
    date: '2024-01-17',
    client: 'Manufacturing Corp',
    description: 'Client dinner meeting',
    category: 'Subsistence',
    netAmount: 88.11,
    vatRate: 13.5,
    vatAmount: 11.89,
    amount: 100.00,
    status: 'invoiced',
    invoiceNumber: 'INV-2024-006',
    submittedBy: 'Michael Chen',
    submitterAvatar: '/lovable-uploads/379fa9c7-8b08-43d9-958a-2037e951a111.png',
    attachments: ['dinner_receipt.pdf']
  },
  {
    id: '25',
    date: '2024-01-18',
    client: 'Finance Partners',
    description: 'Professional software license',
    category: 'Software',
    netAmount: 162.60,
    vatRate: 23,
    vatAmount: 37.40,
    amount: 200.00,
    status: 'not invoiced',
    submittedBy: 'Emily Davis',
    submitterAvatar: '/lovable-uploads/69b009d6-9e34-4be5-b5f7-e4f487c247d1.png',
    attachments: ['license_receipt.pdf']
  },
  {
    id: '26',
    date: '2024-01-19',
    client: 'Global Services Inc',
    description: 'Company formation filing fee',
    category: 'CRO filing fee',
    netAmount: 150.00,
    vatRate: 0,
    vatAmount: 0.00,
    amount: 150.00,
    status: 'invoiced',
    invoiceNumber: 'INV-2024-007',
    submittedBy: 'David Wilson',
    submitterAvatar: '/lovable-uploads/585eab8a-4417-41e5-9f7d-d353e3d174ba.png',
    attachments: ['filing_receipt.pdf']
  },
  {
    id: '27',
    date: '2024-01-20',
    client: 'Business Registrations Ltd',
    description: 'Travel expenses to client site',
    category: 'Mileage',
    netAmount: 73.17,
    vatRate: 23,
    vatAmount: 16.83,
    amount: 90.00,
    status: 'not invoiced',
    submittedBy: 'Lisa Thompson',
    submitterAvatar: '/lovable-uploads/85fbd059-f53e-48f2-9cb6-691d0c4ba899.png',
    attachments: ['travel_receipt.pdf']
  },
  {
    id: '4',
    date: '2024-01-12',
    description: 'Personal office supplies',
    category: 'Stationary',
    netAmount: 97.80,
    vatRate: 23,
    vatAmount: 22.49,
    amount: 120.30,
    status: 'not paid',
    submittedBy: 'David Wilson',
    submitterAvatar: '/lovable-uploads/585eab8a-4417-41e5-9f7d-d353e3d174ba.png',
    attachments: ['stationary_receipt.pdf']
  },
  {
    id: '5',
    date: '2024-01-11',
    client: 'Global Services Inc',
    description: 'Hotel accommodation for site visit',
    category: 'Accommodation',
    netAmount: 260.16,
    vatRate: 23,
    vatAmount: 59.84,
    amount: 320.00,
    status: 'not invoiced',
    submittedBy: 'Lisa Thompson',
    submitterAvatar: '/lovable-uploads/85fbd059-f53e-48f2-9cb6-691d0c4ba899.png',
    attachments: ['hotel_invoice.pdf']
  },
  {
    id: '6',
    date: '2024-01-10',
    client: 'Business Registrations Ltd',
    description: 'Company registration filing fee',
    category: 'CRO filing fee',
    netAmount: 150.00,
    vatRate: 0,
    vatAmount: 0.00,
    amount: 150.00,
    status: 'invoiced',
    invoiceNumber: 'INV-2024-003',
    submittedBy: 'Michael Chen',
    submitterAvatar: '/lovable-uploads/379fa9c7-8b08-43d9-958a-2037e951a111.png'
  },
  {
    id: '7',
    date: '2024-01-09',
    description: 'Personal training software subscription',
    category: 'Software',
    netAmount: 40.65,
    vatRate: 23,
    vatAmount: 9.35,
    amount: 49.99,
    status: 'not paid',
    submittedBy: 'Sarah Johnson',
    submitterAvatar: '/lovable-uploads/2a629138-9746-40f3-ad13-33c9c4d4b180.png',
    attachments: ['software_receipt.pdf']
  },
  {
    id: '8',
    date: '2024-01-08',
    client: 'Tech Solutions Ltd',
    description: 'Client lunch meeting',
    category: 'Subsistence',
    netAmount: 66.26,
    vatRate: 13.5,
    vatAmount: 8.95,
    amount: 75.20,
    status: 'invoiced',
    invoiceNumber: 'INV-2024-004',
    submittedBy: 'Emily Davis',
    submitterAvatar: '/lovable-uploads/69b009d6-9e34-4be5-b5f7-e4f487c247d1.png',
    attachments: ['lunch_receipt.jpg']
  },
  {
    id: '9',
    date: '2024-01-07',
    client: 'Finance Partners',
    description: 'Mileage to client offices in Cork',
    category: 'Mileage',
    netAmount: 102.11,
    vatRate: 23,
    vatAmount: 23.49,
    amount: 125.60,
    status: 'not invoiced',
    submittedBy: 'David Wilson',
    submitterAvatar: '/lovable-uploads/585eab8a-4417-41e5-9f7d-d353e3d174ba.png',
    attachments: ['mileage_log.pdf']
  },
  {
    id: '10',
    date: '2024-01-06',
    client: 'Manufacturing Corp',
    description: 'Overnight accommodation for audit',
    category: 'Accommodation',
    netAmount: 146.34,
    vatRate: 23,
    vatAmount: 33.66,
    amount: 180.00,
    status: 'invoiced',
    invoiceNumber: 'INV-2024-005',
    submittedBy: 'Lisa Thompson',
    submitterAvatar: '/lovable-uploads/85fbd059-f53e-48f2-9cb6-691d0c4ba899.png',
    attachments: ['hotel_bill.pdf']
  },
  // Additional team expenses
  {
    id: '11',
    date: '2024-01-05',
    description: 'Personal office equipment',
    category: 'Stationary',
    netAmount: 73.16,
    vatRate: 23,
    vatAmount: 16.83,
    amount: 89.99,
    status: 'paid',
    submittedBy: 'Sarah Johnson',
    submitterAvatar: '/lovable-uploads/2a629138-9746-40f3-ad13-33c9c4d4b180.png',
    attachments: ['equipment_receipt.pdf']
  },
  {
    id: '12',
    date: '2024-01-04',
    description: 'Professional development course',
    category: 'Software',
    netAmount: 161.79,
    vatRate: 23,
    vatAmount: 37.21,
    amount: 199.00,
    status: 'not paid',
    submittedBy: 'Michael Chen',
    submitterAvatar: '/lovable-uploads/379fa9c7-8b08-43d9-958a-2037e951a111.png',
    attachments: ['course_invoice.pdf']
  },
  {
    id: '13',
    date: '2024-01-03',
    description: 'Home office supplies',
    category: 'Stationary',
    netAmount: 36.75,
    vatRate: 23,
    vatAmount: 8.45,
    amount: 45.20,
    status: 'paid',
    submittedBy: 'Emily Davis',
    submitterAvatar: '/lovable-uploads/69b009d6-9e34-4be5-b5f7-e4f487c247d1.png',
    attachments: ['supplies_receipt.jpg']
  },
  {
    id: '14',
    date: '2024-01-02',
    description: 'Personal laptop upgrade',
    category: 'Software',
    netAmount: 243.89,
    vatRate: 23,
    vatAmount: 56.09,
    amount: 299.99,
    status: 'not paid',
    submittedBy: 'David Wilson',
    submitterAvatar: '/lovable-uploads/585eab8a-4417-41e5-9f7d-d353e3d174ba.png',
    attachments: ['laptop_receipt.pdf']
  },
  {
    id: '15',
    date: '2024-01-01',
    description: 'Annual software license',
    category: 'Software',
    netAmount: 121.95,
    vatRate: 23,
    vatAmount: 28.05,
    amount: 149.99,
    status: 'paid',
    submittedBy: 'Lisa Thompson',
    submitterAvatar: '/lovable-uploads/85fbd059-f53e-48f2-9cb6-691d0c4ba899.png',
    attachments: ['license_receipt.pdf']
  },
  {
    id: '16',
    date: '2023-12-30',
    description: 'Office desk accessories',
    category: 'Stationary',
    netAmount: 54.88,
    vatRate: 23,
    vatAmount: 12.62,
    amount: 67.50,
    status: 'not paid',
    submittedBy: 'Sarah Johnson',
    submitterAvatar: '/lovable-uploads/2a629138-9746-40f3-ad13-33c9c4d4b180.png',
    attachments: ['desk_receipt.pdf']
  },
  {
    id: '17',
    date: '2023-12-29',
    description: 'Personal training materials',
    category: 'Stationary',
    netAmount: 28.29,
    vatRate: 23,
    vatAmount: 6.51,
    amount: 34.80,
    status: 'paid',
    submittedBy: 'Michael Chen',
    submitterAvatar: '/lovable-uploads/379fa9c7-8b08-43d9-958a-2037e951a111.png',
    attachments: ['materials_receipt.jpg']
  },
  {
    id: '18',
    date: '2023-12-28',
    description: 'Personal productivity software',
    category: 'Software',
    netAmount: 65.04,
    vatRate: 23,
    vatAmount: 14.96,
    amount: 79.99,
    status: 'not paid',
    submittedBy: 'Emily Davis',
    submitterAvatar: '/lovable-uploads/69b009d6-9e34-4be5-b5f7-e4f487c247d1.png',
    attachments: ['software_receipt.pdf']
  },
  {
    id: '19',
    date: '2023-12-27',
    description: 'Home office furniture',
    category: 'Stationary',
    netAmount: 199.19,
    vatRate: 23,
    vatAmount: 45.81,
    amount: 245.00,
    status: 'paid',
    submittedBy: 'David Wilson',
    submitterAvatar: '/lovable-uploads/585eab8a-4417-41e5-9f7d-d353e3d174ba.png',
    attachments: ['furniture_receipt.pdf']
  },
  {
    id: '20',
    date: '2023-12-26',
    description: 'Professional certification exam',
    category: 'Software',
    netAmount: 129.27,
    vatRate: 23,
    vatAmount: 29.73,
    amount: 159.00,
    status: 'not paid',
    submittedBy: 'Lisa Thompson',
    submitterAvatar: '/lovable-uploads/85fbd059-f53e-48f2-9cb6-691d0c4ba899.png',
    attachments: ['exam_receipt.pdf']
  },
  {
    id: '21',
    date: '2023-12-25',
    description: 'Personal workspace setup',
    category: 'Stationary',
    netAmount: 100.37,
    vatRate: 23,
    vatAmount: 23.08,
    amount: 123.45,
    status: 'paid',
    submittedBy: 'Sarah Johnson',
    submitterAvatar: '/lovable-uploads/2a629138-9746-40f3-ad13-33c9c4d4b180.png',
    attachments: ['setup_receipt.jpg']
  },
  {
    id: '22',
    date: '2023-12-24',
    description: 'Professional development tools',
    category: 'Software',
    netAmount: 72.76,
    vatRate: 23,
    vatAmount: 16.73,
    amount: 89.50,
    status: 'not paid',
    submittedBy: 'Michael Chen',
    submitterAvatar: '/lovable-uploads/379fa9c7-8b08-43d9-958a-2037e951a111.png',
    attachments: ['tools_receipt.pdf']
  }
];

const tabs = [
  {
    label: 'Client',
    id: 'clientExpenses'
  },
  {
    label: 'Team',
    id: 'teamExpenses'
  }
]

const ExpensesLogTab = () => {
  const [expenses, setExpenses] = useState<Expense[]>(sampleExpenses);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'invoiced' | 'not invoiced' | 'paid' | 'not paid'>('all');
  const [activeTab, setActiveTab] = useState('');
  const [invoiceDialogOpen, setInvoiceDialogOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<string | null>(null);
  const [addClientExpenseOpen, setAddClientExpenseOpen] = useState(false);
  const [addTeamExpenseOpen, setAddTeamExpenseOpen] = useState(false);
  const { data: clientOptionsResp } = useGetDropdownOptionsQuery('client');
  const clientOptions = (clientOptionsResp?.data?.clients || []).map((c: any) => ({ value: c._id, label: c.name }));
  const [addClientExpense, { isLoading: isAddingClientExpense }] = useAddClientExpenseMutation();
  const [clientExpenseForm, setClientExpenseForm] = useState({
    date: '',
    clientId: '',
    description: '',
    expreseCategory: '',
    netAmount: '',
    vatPercentage: '',
    vatAmount: '',
    totalAmount: '',
    status: 'no',
    file: null as File | null,
  });
  const submitClientExpense = async () => {
    try {
      await addClientExpense({
        type: 'client',
        description: clientExpenseForm.description,
        clientId: clientExpenseForm.clientId,
        date: clientExpenseForm.date,
        expreseCategory: clientExpenseForm.expreseCategory,
        netAmount: Number(clientExpenseForm.netAmount || 0),
        vatPercentage: Number(clientExpenseForm.vatPercentage || 0),
        vatAmount: Number(clientExpenseForm.vatAmount || 0),
        totalAmount: Number(clientExpenseForm.totalAmount || 0),
        status: clientExpenseForm.status as 'yes' | 'no',
        file: clientExpenseForm.file,
      }).unwrap();
      setAddClientExpenseOpen(false);
    } catch (e) {
      console.error('Failed to add client expense', e);
    }
  };
  const [receiptDialogOpen, setReceiptDialogOpen] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState<string | null>(null);
  const { visibleTabs, isLoading, isError } = usePermissionTabs(tabs);
  const [getTabAccess, { data: currentTabsUsers }] = useLazyGetTabAccessQuery()
  const { data: currentUserData }: any = useGetCurrentUserQuery();
  useEffect(() => {
    if (visibleTabs.length > 0) {
      if (!visibleTabs.some(tab => tab.id === activeTab)) {
        setActiveTab(visibleTabs[0].id);
      }
    } else {
      setActiveTab('');
    }
    getTabAccess(activeTab).unwrap();
  }, [visibleTabs, activeTab]);

  const formatDate = (dateString: string) => {
    const [year, month, day] = dateString.split('-');
    return `${day}/${month}/${year}`;
  };

  if (!isLoading && !isError && visibleTabs.length === 0) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <p className="text-lg text-muted-foreground">
            You don't have permission to view any expense tabs.
          </p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <p className="text-lg text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <p className="text-lg text-red-600">Error loading permissions.</p>
        </div>
      </div>
    );
  }

  // Don't render content if activeTab is not set or not valid
  if (!activeTab || !visibleTabs.some(tab => tab.id === activeTab)) {
    return (
      <div className="space-y-6">
        <CustomTabs
          tabs={visibleTabs}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
        />
        <div className="text-center py-12">
          <p className="text-lg text-muted-foreground">
            Please select a tab to view expenses.
          </p>
        </div>
      </div>
    );
  }

  const clientExpenses = expenses.filter(expense => expense.client);
  const teamExpenses = expenses.filter(expense => !expense.client);

  const currentExpenses = activeTab === 'clientExpenses' ? clientExpenses : teamExpenses;

  const filteredExpenses = currentExpenses.filter(expense => {
    const matchesSearch = (expense.client?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
      expense.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      expense.submittedBy.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || expense.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Group expenses by client (for client tab) or by team member (for team tab)
  const groupedExpenses = filteredExpenses.reduce((acc, expense) => {
    const groupKey = activeTab === 'clientExpenses' ? (expense.client || 'No Client') : expense.submittedBy;
    if (!acc[groupKey]) {
      acc[groupKey] = [];
    }
    acc[groupKey].push(expense);
    return acc;
  }, {} as Record<string, Expense[]>);

  const getStatusBadge = (status: 'invoiced' | 'not invoiced' | 'paid' | 'not paid') => {
    switch (status) {
      case 'invoiced':
        return <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-200">Invoiced</Badge>;
      case 'not invoiced':
        return <Badge variant="secondary" className="bg-orange-100 text-orange-800 border-orange-200">Not Invoiced</Badge>;
      case 'paid':
        return <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-200">Paid</Badge>;
      case 'not paid':
        return <Badge variant="secondary" className="bg-orange-100 text-orange-800 border-orange-200">Not Paid</Badge>;
      default:
        return null;
    }
  };

  const handleInvoiceClick = (invoiceNumber: string) => {
    setSelectedInvoice(invoiceNumber);
    setInvoiceDialogOpen(true);
  };

  const handleReceiptClick = (receiptName: string) => {
    setSelectedReceipt(receiptName);
    setReceiptDialogOpen(true);
  };

  const handleExport = () => {
    const csvHeaders = activeTab === 'clientExpenses'
      ? ['Date', 'Submitted By', 'Client', 'Description', 'Category', 'Net', 'VAT%', 'VAT', 'Gross', 'Status', 'Invoice']
      : ['Date', 'Submitted By', 'Description', 'Category', 'Net', 'VAT%', 'VAT', 'Gross', 'Status'];

    const csvData = filteredExpenses.map(expense => {
      const baseData = [
        formatDate(expense.date),
        expense.submittedBy,
        ...(activeTab === 'clientExpenses' ? [expense.client || ''] : []),
        expense.description,
        expense.category,
        expense.netAmount.toFixed(2),
        expense.vatRate + '%',
        expense.vatAmount.toFixed(2),
        expense.amount.toFixed(2),
        expense.status,
        ...(activeTab === 'clientExpenses' ? [expense.invoiceNumber || ''] : [])
      ];
      return baseData;
    });

    const csvContent = [csvHeaders, ...csvData]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `expenses_${activeTab}_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Calculate totals based on filtered expenses
  const totalPaid = filteredExpenses
    .filter(expense => activeTab === 'clientExpenses' ? expense.status === 'invoiced' : expense.status === 'paid')
    .reduce((sum, expense) => sum + expense.amount, 0);

  const totalUnpaid = filteredExpenses
    .filter(expense => activeTab === 'clientExpenses' ? expense.status === 'not invoiced' : expense.status === 'not paid')
    .reduce((sum, expense) => sum + expense.amount, 0);

  const totalExpenses = filteredExpenses.reduce((sum, expense) => sum + expense.amount, 0);

  return (
    <div className="space-y-6 p-6">
      <div className="mb-6">

      <Avatars activeTab={activeTab} title={"Expenses"} />

        {/* Tabs */}
        <CustomTabs tabs={visibleTabs} activeTab={activeTab} setActiveTab={setActiveTab} />
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold !text-[#381980]">
              €{totalExpenses.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <p className="text-sm text-muted-foreground">Total Expenses</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold !text-[#381980]">€{totalPaid.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
            <p className="text-sm text-muted-foreground">{activeTab === 'clientExpenses' ? 'Invoiced' : 'Paid'}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold !text-[#381980]">€{totalUnpaid.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
            <p className="text-sm text-muted-foreground">{activeTab === 'clientExpenses' ? 'Not Invoiced' : 'Not Paid'}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-foreground !text-[#381980]">{filteredExpenses.length}</div>
            <p className="text-sm text-muted-foreground">Total Items</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search expenses..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <div className="w-full sm:w-[200px]">
              <Select value={statusFilter} onValueChange={(value: 'all' | 'invoiced' | 'not invoiced' | 'paid' | 'not paid') => setStatusFilter(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Expenses</SelectItem>
                  {activeTab === 'clientExpenses' && (
                    <>
                      <SelectItem value="invoiced">Invoiced</SelectItem>
                      <SelectItem value="not invoiced">Not Invoiced</SelectItem>
                    </>
                  )}
                  {activeTab === 'teamExpenses' && (
                    <>
                      <SelectItem value="paid">Paid</SelectItem>
                      <SelectItem value="not paid">Not Paid</SelectItem>
                    </>
                  )}
                </SelectContent>
              </Select>
            </div>
            <Button variant="outline" className="gap-2" onClick={handleExport}>
              <Download className="h-4 w-4" />
              Export
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Filter Buttons above table */}

      {/* <CardContent className="p-4"> */}
      {/* Main container: stacks vertically on mobile, row on sm screens and up */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">

        {/* Filter buttons container: allows buttons to wrap */}
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant={statusFilter === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setStatusFilter('all')}
            className="h-8 px-3 text-xs border-0"
          >
            {/* <Filter className="h-4 w-4" />/ */}
            All
          </Button>
          {activeTab === 'clientExpenses' && (
            <>
              <Button
                variant={statusFilter === 'not invoiced' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter('not invoiced')}
                className="h-8 px-3 text-xs  border-0"
              >
                {/* <Filter className="h-4 w-4" /> */}
                Not Invoiced
              </Button>
              <Button
                variant={statusFilter === 'invoiced' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter('invoiced')}
                className="h-8 px-3 text-xs border-0"
              >
                {/* <Filter className="h-4 w-4" /> */}
                Invoiced
              </Button>
            </>
          )}
          {activeTab === 'teamExpenses' && (
            <>
              <Button
                variant={statusFilter === 'not paid' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter('not paid')}
                className="h-8 px-3 text-xs border-0"
              >
                {/* <Filter className="h-4 w-4" /> */}
                Not Paid
              </Button>
              <Button
                variant={statusFilter === 'paid' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter('paid')}
                className="h-8 px-3 text-xs border-0"
              >
                {/* <Filter className="h-4 w-4" /> */}
                Paid
              </Button>
            </>
          )}
        </div>

        {/* Add Expense button: full-width on mobile, auto-width on larger screens */}
        <Button
          onClick={() => activeTab === 'clientExpenses' ? setAddClientExpenseOpen(true) : setAddTeamExpenseOpen(true)}
          className="gap-2 w-full sm:w-auto"
        >
          <Plus className="h-4 w-4" />
          {activeTab === 'clientExpenses' ? 'Client' : 'Team'} Expense
        </Button>

      </div>
      {/* </CardContent> */}



      {/* Expenses Table */}
      <Card>
        <CardContent className="p-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-24 text-left">Date</TableHead>
                <TableHead className="w-40 text-left">Submitted By</TableHead>
                {activeTab === 'clientExpenses' && <TableHead className="w-40 text-left">Client</TableHead>}
                <TableHead className="w-60 text-left">Description</TableHead>
                <TableHead className="w-32 text-left">Category</TableHead>
                <TableHead className="w-20 text-left">Net</TableHead>
                <TableHead className="w-16 text-left">VAT%</TableHead>
                <TableHead className="w-20 text-left">VAT</TableHead>
                <TableHead className="w-20 text-left">Gross</TableHead>
                <TableHead className="w-32 text-left">Status</TableHead>
                <TableHead className="w-20 text-left">Receipt</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Object.entries(groupedExpenses).map(([groupName, expenses]) => (
                <React.Fragment key={groupName}>
                  {/* Group header row */}
                  <TableRow className="bg-muted/50">
                    <TableCell colSpan={activeTab === 'clientExpenses' ? 11 : 10} className="font-semibold py-3">
                      {groupName} ({expenses.length} expense{expenses.length > 1 ? 's' : ''})
                    </TableCell>
                  </TableRow>
                  {/* Expense rows */}
                  {expenses.map((expense) => (
                    <TableRow key={expense.id}>
                      <TableCell className="font-medium text-left">{formatDate(expense.date)}</TableCell>
                      <TableCell className="text-left">
                        <div className="flex items-center gap-2">
                          <Avatar className="h-8 w-8 flex-shrink-0">
                            <AvatarImage src={expense.submitterAvatar} alt={expense.submittedBy} />
                            <AvatarFallback>{expense.submittedBy.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                          </Avatar>
                          <span className="truncate">{expense.submittedBy}</span>
                        </div>
                      </TableCell>
                      {activeTab === 'clientExpenses' && (
                        <TableCell className="text-left">
                          <span className="truncate block" title={expense.client}>
                            {expense.client || <span className="text-muted-foreground">N/A</span>}
                          </span>
                        </TableCell>
                      )}
                      <TableCell className="text-left">
                        <span className="block truncate" title={expense.description}>
                          {expense.description}
                        </span>
                      </TableCell>
                      <TableCell className="text-left">
                        <span className="truncate block">{expense.category}</span>
                      </TableCell>
                      <TableCell className="text-left font-medium">€{expense.netAmount.toFixed(2)}</TableCell>
                      <TableCell className="text-left">{expense.vatRate}%</TableCell>
                      <TableCell className="text-left font-medium">€{expense.vatAmount.toFixed(2)}</TableCell>
                      <TableCell className="text-left font-medium">€{expense.amount.toFixed(2)}</TableCell>
                      <TableCell className="text-left">
                        <div className="flex items-center gap-2">
                          {getStatusBadge(expense.status)}
                          {activeTab === 'clientExpenses' && expense.invoiceNumber && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0 text-blue-600 hover:text-blue-800"
                              onClick={() => handleInvoiceClick(expense.invoiceNumber!)}
                              title={`View Invoice: ${expense.invoiceNumber}`}
                            >
                              <ExternalLink className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-left">
                        {expense.attachments && expense.attachments.length > 0 ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-blue-600 hover:text-blue-800"
                            onClick={() => handleReceiptClick(expense.attachments![0])}
                            title="View Receipt"
                          >
                            <Paperclip className="h-4 w-4" />
                          </Button>
                        ) : (
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground">
                            <Upload className="h-4 w-4" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </React.Fragment>
              ))}
            </TableBody>
          </Table>
          {Object.keys(groupedExpenses).length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No expenses found matching the current filters
            </div>
          )}
        </CardContent>
      </Card>

      {/* Invoice Preview Dialog */}
      <Dialog open={invoiceDialogOpen} onOpenChange={setInvoiceDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Invoice Preview - {selectedInvoice}</DialogTitle>
          </DialogHeader>
          <div className="p-6 bg-white border rounded-lg">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800">INVOICE</h2>
              <p className="text-gray-600">Invoice #{selectedInvoice}</p>
            </div>

            <div className="grid grid-cols-2 gap-6 mb-6">
              <div>
                <h3 className="font-semibold text-gray-700 mb-2">From:</h3>
                <p className="text-gray-600">
                  Your Company Name<br />
                  123 Business Street<br />
                  Dublin, Ireland<br />
                  VAT: IE1234567T
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-700 mb-2">To:</h3>
                <p className="text-gray-600">
                  Client Company<br />
                  456 Client Avenue<br />
                  Cork, Ireland<br />
                  VAT: IE9876543T
                </p>
              </div>
            </div>

            <div className="border-t pt-4">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2">Description</th>
                    <th className="text-right py-2">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="py-2">Expense Reimbursement</td>
                    <td className="text-right py-2">€{expenses.find(e => e.invoiceNumber === selectedInvoice)?.amount.toFixed(2) || '0.00'}</td>
                  </tr>
                </tbody>
                <tfoot>
                  <tr className="border-t font-semibold">
                    <td className="py-2">Total</td>
                    <td className="text-right py-2">€{expenses.find(e => e.invoiceNumber === selectedInvoice)?.amount.toFixed(2) || '0.00'}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Client Expense Dialog */}
      <Dialog open={addClientExpenseOpen} onOpenChange={setAddClientExpenseOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add Client Expense</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Date</label>
                <Input type="date" value={clientExpenseForm.date} onChange={(e) => setClientExpenseForm(f => ({ ...f, date: e.target.value }))} />
              </div>
              <div>
                <label className="text-sm font-medium">Client</label>
                <Select value={clientExpenseForm.clientId} onValueChange={(v) => setClientExpenseForm(f => ({ ...f, clientId: v }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select client" />
                  </SelectTrigger>
                  <SelectContent>
                    {clientOptions.map(o => (
                      <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Description</label>
              <Input placeholder="Enter expense description" value={clientExpenseForm.description} onChange={(e) => setClientExpenseForm(f => ({ ...f, description: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Category</label>
                <Input placeholder="Enter category" value={clientExpenseForm.expreseCategory} onChange={(e) => setClientExpenseForm(f => ({ ...f, expreseCategory: e.target.value }))} />
              </div>
              <div>
                <label className="text-sm font-medium">Amount</label>
                <Input type="number" placeholder="Net" step="0.01" value={clientExpenseForm.netAmount} onChange={(e) => setClientExpenseForm(f => ({ ...f, netAmount: e.target.value }))} />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium">VAT %</label>
                <Input type="number" placeholder="0" step="0.01" value={clientExpenseForm.vatPercentage} onChange={(e) => setClientExpenseForm(f => ({ ...f, vatPercentage: e.target.value }))} />
              </div>
              <div>
                <label className="text-sm font-medium">VAT Amount</label>
                <Input type="number" placeholder="0.00" step="0.01" value={clientExpenseForm.vatAmount} onChange={(e) => setClientExpenseForm(f => ({ ...f, vatAmount: e.target.value }))} />
              </div>
              <div>
                <label className="text-sm font-medium">Total Amount</label>
                <Input type="number" placeholder="0.00" step="0.01" value={clientExpenseForm.totalAmount} onChange={(e) => setClientExpenseForm(f => ({ ...f, totalAmount: e.target.value }))} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Status</label>
                <Select value={clientExpenseForm.status} onValueChange={(v) => setClientExpenseForm(f => ({ ...f, status: v }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="no">Not Invoiced</SelectItem>
                    <SelectItem value="yes">Invoiced</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Attachment</label>
                <Input type="file" onChange={(e) => setClientExpenseForm(f => ({ ...f, file: e.target.files && e.target.files[0] ? e.target.files[0] : null }))} />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Status</label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="invoiced">Invoiced</SelectItem>
                  <SelectItem value="not invoiced">Not Invoiced</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Attachments</label>
              <Input type="file" multiple />
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setAddClientExpenseOpen(false)}>
                Cancel
              </Button>
              <Button onClick={submitClientExpense} disabled={isAddingClientExpense}>
                {isAddingClientExpense ? 'Saving...' : 'Save Expense'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Team Expense Dialog */}
      <Dialog open={addTeamExpenseOpen} onOpenChange={setAddTeamExpenseOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add Team Expense</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Date</label>
              <Input type="date" />
            </div>
            <div>
              <label className="text-sm font-medium">Description</label>
              <Input placeholder="Enter expense description" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Category</label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cro-filing-fee">CRO filing fee</SelectItem>
                    <SelectItem value="subsistence">Subsistence</SelectItem>
                    <SelectItem value="accommodation">Accommodation</SelectItem>
                    <SelectItem value="mileage">Mileage</SelectItem>
                    <SelectItem value="software">Software</SelectItem>
                    <SelectItem value="stationary">Stationary</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Amount</label>
                <Input type="number" placeholder="0.00" step="0.01" />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Status</label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="not paid">Not Paid</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Attachments</label>
              <Input type="file" multiple />
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setAddTeamExpenseOpen(false)}>
                Cancel
              </Button>
              <Button onClick={() => setAddTeamExpenseOpen(false)}>
                Save Expense
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Receipt Preview Dialog */}
      <Dialog open={receiptDialogOpen} onOpenChange={setReceiptDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Receipt Preview - {selectedReceipt}</DialogTitle>
          </DialogHeader>
          <div className="flex justify-center p-6">
            <img
              src={sampleReceipt}
              alt="Receipt"
              className="max-w-full h-auto border border-gray-200 rounded-lg shadow-lg"
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ExpensesLogTab;