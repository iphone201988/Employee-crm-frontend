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
import { CreditCard, Search, Filter, Eye, Edit, Download, Upload, Paperclip, ExternalLink, Plus, Settings, Trash2, X } from "lucide-react";
import sampleReceipt from "@/assets/sample-receipt.png";
import CustomTabs from '@/components/Tabs';
import { usePermissionTabs } from '@/hooks/usePermissionTabs';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@radix-ui/react-tooltip';
import { useLazyGetTabAccessQuery } from '@/store/authApi';
import { useGetDropdownOptionsQuery } from '@/store/teamApi';
import { useAddClientExpenseMutation, useUpdateExpenseMutation, useDeleteExpenseMutation, useListExpensesQuery } from '@/store/expensesApi';
import { useGetCurrentUserQuery } from '@/store/authApi';
import Avatars from '@/components/Avatars';
import ClientNameLink from '@/components/ClientNameLink';
import { validateExpenseForm, validateSingleField, ExpenseFormData, ValidationResult } from '@/utils/validation/expenseValidation';
interface Expense {
  id: string;
  date: string;
  clientId?: string;
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


const formatCategoryLabel = (categoryValue: string) => {
  if (!categoryValue) return '';
  return categoryValue
    .split('-')
    .map(word => {
      const lower = word.toLowerCase();
      if (lower === 'cro') return 'CRO';
      return lower.charAt(0).toUpperCase() + lower.slice(1);
    })
    .join(' ');
};

const normalizeCategoryToSlug = (categoryLabel: string) => {
  if (!categoryLabel) return 'subsistence';
  const normalized = categoryLabel.toLowerCase();
  if (normalized.includes('cro') && normalized.includes('filing')) return 'cro-filing-fee';
  if (normalized === 'subsistence') return 'subsistence';
  if (normalized === 'accommodation') return 'accommodation';
  if (normalized === 'mileage') return 'mileage';
  if (normalized === 'software') return 'software';
  if (normalized === 'stationary') return 'stationary';
  return 'subsistence';
};

const tabs = [
  {
    label: 'Client Expenses',
    id: 'clientExpenses'
  },
  {
    label: 'Team Expenses',
    id: 'teamExpenses'
  }
]

const ExpensesLogTab = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'invoiced' | 'not invoiced' | 'paid' | 'not paid'>('all');
  const [activeTab, setActiveTab] = useState('');
  const [invoiceDialogOpen, setInvoiceDialogOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<string | null>(null);
  const [addClientExpenseOpen, setAddClientExpenseOpen] = useState(false);
  const [addTeamExpenseOpen, setAddTeamExpenseOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [settingsPopup, setSettingsPopup] = useState<{ expenseId: string; x: number; y: number } | null>(null);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const { data: clientOptionsResp } = useGetDropdownOptionsQuery('client');
  const { data: teamOptionsResp } = useGetDropdownOptionsQuery('team');
  const clientOptions = (clientOptionsResp?.data?.clients || []).map((c: any) => ({ value: c._id, label: c.name }));
  const teamOptions = (teamOptionsResp?.data?.teams || []).map((t: any) => ({ value: t._id, label: t.name }));
  const [addClientExpense, { isLoading: isAddingClientExpense }] = useAddClientExpenseMutation();
  const [addTeamExpense, { isLoading: isAddingTeamExpense }] = useAddClientExpenseMutation();
  const [updateExpense, { isLoading: isUpdatingExpense }] = useUpdateExpenseMutation();
  const [deleteExpense, { isLoading: isDeletingExpense }] = useDeleteExpenseMutation();

  // API query for expenses
  const { data: expensesResp, isLoading: isExpensesLoading } = useListExpensesQuery({
    status: statusFilter === 'all' ? 'all' : (statusFilter === 'invoiced' || statusFilter === 'paid' ? 'yes' : 'no'),
    type: activeTab === 'clientExpenses' ? 'client' : activeTab === 'teamExpenses' ? 'team' : 'all',
    search: searchTerm || undefined,
    page,
    limit,
  });
  const [clientExpenseForm, setClientExpenseForm] = useState<ExpenseFormData>({
    date: '',
    clientId: '',
    description: '',
    expreseCategory: '',
    netAmount: '',
    vatPercentage: '',
    status: 'no',
    file: null,
    teamId: '', // Not used for client expenses but needed for type compatibility
  });
  const [teamExpenseForm, setTeamExpenseForm] = useState<ExpenseFormData>({
    date: '',
    teamId: '',
    description: '',
    expreseCategory: '',
    netAmount: '',
    vatPercentage: '',
    status: 'no',
    file: null,
    clientId: '', // Not used for team expenses but needed for type compatibility
  });

  // Validation errors state
  const [clientFormErrors, setClientFormErrors] = useState<Partial<Record<keyof ExpenseFormData, string>>>({});
  const [teamFormErrors, setTeamFormErrors] = useState<Partial<Record<keyof ExpenseFormData, string>>>({});

  // Validation functions
  const validateClientForm = (): boolean => {
    const validationResult = validateExpenseForm(clientExpenseForm, 'client');
    setClientFormErrors(validationResult.errors);
    return validationResult.isValid;
  };

  const validateTeamForm = (): boolean => {
    const validationResult = validateExpenseForm(teamExpenseForm, 'team');
    setTeamFormErrors(validationResult.errors);
    return validationResult.isValid;
  };

  // Real-time validation for individual fields
  const handleClientFieldChange = (field: keyof ExpenseFormData, value: any) => {
    setClientExpenseForm(prev => ({ ...prev, [field]: value }));

    // Clear error for this field
    if (clientFormErrors[field]) {
      setClientFormErrors(prev => ({ ...prev, [field]: undefined }));
    }

    // Validate field in real-time
    const error = validateSingleField(field, value, 'client');
    if (error) {
      setClientFormErrors(prev => ({ ...prev, [field]: error }));
    }
  };

  const handleTeamFieldChange = (field: keyof ExpenseFormData, value: any) => {
    setTeamExpenseForm(prev => ({ ...prev, [field]: value }));

    // Clear error for this field
    if (teamFormErrors[field]) {
      setTeamFormErrors(prev => ({ ...prev, [field]: undefined }));
    }

    // Validate field in real-time
    const error = validateSingleField(field, value, 'team');
    if (error) {
      setTeamFormErrors(prev => ({ ...prev, [field]: error }));
    }
  };

  const submitClientExpense = async () => {
    if (!validateClientForm()) {
      return;
    }
    try {
      const expenseData = {
        type: 'client' as const,
        description: clientExpenseForm.description,
        clientId: clientExpenseForm.clientId,
        date: clientExpenseForm.date,
        expreseCategory: formatCategoryLabel(clientExpenseForm.expreseCategory),
        netAmount: Number(clientExpenseForm.netAmount || 0),
        vatPercentage: Number(clientExpenseForm.vatPercentage || 0),
        vatAmount: undefined,
        totalAmount: undefined,
        status: clientExpenseForm.status as 'yes' | 'no',
        file: clientExpenseForm.file,
      };

      if (editingExpense) {
        // Update existing expense
        await updateExpense({ expenseId: editingExpense.id, expenseData }).unwrap();
      } else {
        // Add new expense
        await addClientExpense(expenseData).unwrap();
      }

      setAddClientExpenseOpen(false);
      setEditingExpense(null);
      // Reset form and errors
      setClientExpenseForm({
        date: '',
        clientId: '',
        description: '',
        expreseCategory: '',
        netAmount: '',
        vatPercentage: '',
        status: 'no',
        file: null,
        teamId: '',
      });
      setClientFormErrors({});
    } catch (e) {
      console.error('Failed to save client expense', e);
    }
  };

  const submitTeamExpense = async () => {
    if (!validateTeamForm()) {
      return;
    }
    try {
      const expenseData = {
        type: 'team' as const,
        description: teamExpenseForm.description,
        clientId: undefined, // No client for team expenses
        userId: teamExpenseForm.teamId, // Pass selected team's ID
        date: teamExpenseForm.date,
        expreseCategory: formatCategoryLabel(teamExpenseForm.expreseCategory),
        netAmount: Number(teamExpenseForm.netAmount || 0),
        vatPercentage: Number(teamExpenseForm.vatPercentage || 0),
        vatAmount: undefined,
        totalAmount: undefined,
        status: teamExpenseForm.status as 'yes' | 'no',
        file: teamExpenseForm.file,
      };

      if (editingExpense) {
        // Update existing expense
        await updateExpense({ expenseId: editingExpense.id, expenseData }).unwrap();
      } else {
        // Add new expense
        await addTeamExpense(expenseData).unwrap();
      }

      setAddTeamExpenseOpen(false);
      setEditingExpense(null);
      // Reset form and errors
      setTeamExpenseForm({
        date: '',
        teamId: '',
        description: '',
        expreseCategory: '',
        netAmount: '',
        vatPercentage: '',
        status: 'no',
        file: null,
        clientId: '',
      });
      setTeamFormErrors({});
    } catch (e) {
      console.error('Failed to save team expense', e);
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
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
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

  // Process API data
  const apiExpenses = expensesResp?.data?.expenses || [];
  const apiStatistics = expensesResp?.data?.statistics || {
    totalAmount: 0,
    approvedTotalAmount: 0,
    pendingTotalAmount: 0,
    totalExpenses: 0,
  };
  const apiPagination = expensesResp?.data?.pagination || {
    page: 1,
    limit: 10,
    total: 0,
  };

  // Transform API data to match existing interface
  const expenses: Expense[] = apiExpenses.map((expense: any) => ({
    id: expense._id,
    date: expense.date,
    clientId: expense.client?._id,
    client: expense.client?.name,
    description: expense.description,
    category: expense.expreseCategory as any,
    netAmount: expense.netAmount,
    vatRate: expense.vatPercentage,
    vatAmount: expense.vatAmount,
    amount: expense.totalAmount,
    status: expense.status === 'yes' ? (activeTab === 'clientExpenses' ? 'invoiced' : 'paid') : (activeTab === 'clientExpenses' ? 'not invoiced' : 'not paid'),
    invoiceNumber: expense.status === 'yes' ? `INV-${expense._id.slice(-6)}` : undefined,
    submittedBy: activeTab === 'teamExpenses' ? (expense.user?.name || 'Unknown') : (expense.submittedDetails?.name || 'Unknown'),
    submitterAvatar: activeTab === 'teamExpenses' ? (expense.user?.avatarUrl ? `${import.meta.env.VITE_BACKEND_BASE_URL}${expense.user.avatarUrl}` : '/lovable-uploads/2a629138-9746-40f3-ad13-33c9c4d4b180.png') : '/lovable-uploads/2a629138-9746-40f3-ad13-33c9c4d4b180.png',
    attachments: expense.attachments || [],
  }));

  const currentExpenses = expenses;
  const filteredExpenses = currentExpenses;

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

  const handleReceiptClick = (receiptUrl: string) => {
    setSelectedReceipt(receiptUrl);
    setReceiptDialogOpen(true);
  };

  const handleSettingsClick = (e: React.MouseEvent, expenseId: string) => {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    setSettingsPopup({ expenseId, x: rect.left, y: rect.bottom + 5 });
  };

  const handleEditExpense = (expenseId: string) => {
    const expense = expenses.find(e => e.id === expenseId);
    if (expense) {
      setEditingExpense(expense);

      // Convert date to YYYY-MM-DD format for date input
      const formatDateForInput = (dateString: string) => {
        const date = new Date(dateString);
        return date.toISOString().split('T')[0];
      };

      // Find client ID from client name
      const findClientId = (clientName?: string) => {
        if (!clientName) return '';
        const client = clientOptions.find(c => c.label === clientName);
        return client?.value || '';
      };

      // Find team ID from team member name
      const findTeamId = (teamMemberName?: string) => {
        if (!teamMemberName) return '';
        const team = teamOptions.find(t => t.label === teamMemberName);
        return team?.value || '';
      };

      // Convert category to form format
      const convertCategoryToForm = (category: string) => {
        return normalizeCategoryToSlug(category);
      };

      // Open the appropriate form based on expense type
      if (activeTab === 'clientExpenses') {
        setClientExpenseForm({
          date: formatDateForInput(expense.date),
          clientId: findClientId(expense.client),
          description: expense.description,
          expreseCategory: convertCategoryToForm(expense.category),
          netAmount: expense.netAmount.toString(),
          vatPercentage: expense.vatRate.toString(),
          status: expense.status === 'invoiced' ? 'yes' : 'no',
          file: null, // File inputs can't be pre-filled for security reasons
          teamId: '',
        });
        setAddClientExpenseOpen(true);
      } else {
        setTeamExpenseForm({
          date: formatDateForInput(expense.date),
          teamId: findTeamId(expense.submittedBy),
          description: expense.description,
          expreseCategory: convertCategoryToForm(expense.category),
          netAmount: expense.netAmount.toString(),
          vatPercentage: expense.vatRate.toString(),
          status: expense.status === 'paid' ? 'yes' : 'no',
          file: null, // File inputs can't be pre-filled for security reasons
          clientId: '',
        });
        setAddTeamExpenseOpen(true);
      }
      setSettingsPopup(null);
    }
  };

  const handleDeleteExpense = async (expenseId: string) => {
    try {
      await deleteExpense(expenseId).unwrap();
      setSettingsPopup(null);
    } catch (e) {
      console.error('Failed to delete expense', e);
    }
  };

  const handleCloseSettingsPopup = () => {
    setSettingsPopup(null);
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

  // Calculate totals based on API statistics
  const totalExpenses = apiStatistics.totalAmount || 0;
  const totalPaid = apiStatistics.approvedTotalAmount || 0;
  const totalUnpaid = apiStatistics.pendingTotalAmount || 0;

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
            <div className="text-2xl font-bold text-foreground !text-[#381980]">{apiStatistics.totalExpenses || 0}</div>
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
        <div className="flex flex-wrap mt-4 border border-[#381980] w-max p-[6px] rounded-sm">
          <Button
            variant={statusFilter === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setStatusFilter('all')}
            className="h-8 px-3 text-[14px] border-0 rounded-sm"
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
                className="h-8 px-3 text-[14px]  border-0 rounded-sm"
              >
                {/* <Filter className="h-4 w-4" /> */}
                Not Invoiced
              </Button>
              <Button
                variant={statusFilter === 'invoiced' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter('invoiced')}
                className="h-8 px-3 text-[14px] border-0 rounded-sm"
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
                className="h-8 px-3 text-[14px]  border-0 rounded-sm"
              >
                {/* <Filter className="h-4 w-4" /> */}
                Not Paid
              </Button>
              <Button
                variant={statusFilter === 'paid' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter('paid')}
                className="h-8 px-3 text-[14px]  border-0 rounded-sm"
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
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className='!bg-[#edecf4] text-[#381980]'>
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
                <TableHead className="w-20 text-left"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Object.entries(groupedExpenses).map(([groupName, expenses]) => (
                <React.Fragment key={groupName}>
                  {/* Group header row */}
                  <TableRow className="bg-muted/50 ">
                    <TableCell colSpan={activeTab === 'clientExpenses' ? 12 : 11} className="font-semibold py-3 px-4">
                      {groupName} ({expenses.length} expense{expenses.length > 1 ? 's' : ''})
                    </TableCell>
                  </TableRow>
                  {/* Expense rows */}
                  {expenses.map((expense) => (
                    <TableRow key={expense.id}>
                      <TableCell className="font-medium text-left px-4">{formatDate(expense.date)}</TableCell>
                      <TableCell className="text-left px-4">
                        <div className="flex items-center gap-2">
                          <Avatar className="h-8 w-8 flex-shrink-0">
                            <AvatarImage src={import.meta.env.VITE_BACKEND_BASE_URL + expense.submitterAvatar} alt={expense.submittedBy} />
                            <AvatarFallback>{expense.submittedBy.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                          </Avatar>
                          <span className="truncate">{expense.submittedBy}</span>
                        </div>
                      </TableCell>
                      {activeTab === 'clientExpenses' && (
                        <TableCell className="text-left px-4">
                          {expense.client ? (
                            <ClientNameLink name={expense.client} ciientId={expense.clientId} />
                          ) : (
                            <span className="text-muted-foreground">N/A</span>
                          )}
                        </TableCell>
                      )}
                      <TableCell className="text-left px-4">
                        <span className="block truncate" title={expense.description}>
                          {expense.description}
                        </span>
                      </TableCell>
                      <TableCell className="text-left px-4">
                        <span className="truncate block">{expense.category}</span>
                      </TableCell>
                      <TableCell className="text-left  px-4 font-medium">€{expense.netAmount.toFixed(2)}</TableCell>
                      <TableCell className="text-left px-4 ">{expense.vatRate}%</TableCell>
                      <TableCell className="text-left px-4  font-medium">€{expense.vatAmount.toFixed(2)}</TableCell>
                      <TableCell className="text-left  px-4 font-medium">€{expense.amount.toFixed(2)}</TableCell>
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
                              {/* <ExternalLink className="h-3 w-3" /> */}
                            </Button>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-center px-4">
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
                          // <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground">
                          //   <Upload className="h-4 w-4" />
                          // </Button>
                          <div>N/A</div>
                        )}
                      </TableCell>
                      <TableCell className="text-left px-4">
                        <div className="text-right">
                          <button
                            onClick={(e) => handleSettingsClick(e, expense.id)}
                            className="p-1 hover:bg-gray-100 rounded"
                          >
                            <Settings className='text-[#381980]' size={16} />
                          </button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </React.Fragment>
              ))}
            </TableBody>
          </Table>
          {isExpensesLoading && (
            <div className="text-center py-8 text-muted-foreground">
              Loading expenses...
            </div>
          )}
          {!isExpensesLoading && Object.keys(groupedExpenses).length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No expenses found matching the current filters
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination Controls */}
      {apiPagination && apiPagination.total > 0 && (
        <div className="space-y-4 mt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Show:</span>
              <select
                value={limit}
                onChange={(e) => { setPage(1); setLimit(Number(e.target.value)); }}
                className="border border-gray-300 rounded px-2 py-1 text-sm"
                disabled={isExpensesLoading}
              >
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
              Showing {apiPagination.total > 0 ? ((page - 1) * limit) + 1 : 0} to {Math.min(page * limit, apiPagination.total)} of {apiPagination.total} expenses
            </div>
          </div>
          {Math.ceil(apiPagination.total / limit) > 1 && (
            <div className="flex justify-center items-center gap-2">
              <Button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1 || isExpensesLoading}
                variant="outline"
                size="sm"
              >
                Previous
              </Button>
              <Button
                onClick={() => setPage(p => p + 1)}
                disabled={page >= Math.ceil(apiPagination.total / limit) || isExpensesLoading}
                variant="outline"
                size="sm"
              >
                Next
              </Button>
            </div>
          )}
        </div>
      )}

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
      <Dialog open={addClientExpenseOpen} onOpenChange={(open) => {
        setAddClientExpenseOpen(open);
        if (!open) {
          setEditingExpense(null);
          setClientFormErrors({});
        }
      }}>
        <DialogContent className="max-w-2xl !rounded-none p-0 border-none for-close">
          <DialogHeader className="bg-[#381980] sticky z-50 top-0 left-0 w-full text-center ">
            <DialogTitle className="text-center text-white py-4">{editingExpense ? 'Edit Client Expense' : '+ New Client Expense'}</DialogTitle>
          </DialogHeader>
          <button
            onClick={() => {
              setAddClientExpenseOpen(false);
              setEditingExpense(null);
              setClientFormErrors({});
            }}
            className=" bg-[#381980] text-white absolute right-[-35px] top-0 p-[6px] rounded-full max-sm:hidden"
          >
            <X size={16} />
          </button>
          <div className="space-y-4 form-change ">
            <div className="grid grid-cols-2 gap-4 px-[20px]">
              <div>
                <label className="text-sm font-medium">Date </label>
                <Input
                  type="date"
                  value={clientExpenseForm.date}
                  onChange={(e) => handleClientFieldChange('date', e.target.value)}
                  className={clientFormErrors.date ? 'border-red-500' : ''}
                />
                {clientFormErrors.date && (
                  <p className="text-red-500 text-xs mt-1">{clientFormErrors.date}</p>
                )}
              </div>
              <div>
                <label className="text-sm font-medium">Client</label>
                <Select
                  value={clientExpenseForm.clientId}
                  onValueChange={(v) => handleClientFieldChange('clientId', v)}
                >
                  <SelectTrigger className={clientFormErrors.clientId ? 'border-red-500' : ''}>
                    <SelectValue placeholder="Select client" />
                  </SelectTrigger>
                  <SelectContent>
                    {clientOptions.map(o => (
                      <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {clientFormErrors.clientId && (
                  <p className="text-red-500 text-xs mt-1">{clientFormErrors.clientId}</p>
                )}
              </div>
            </div>
            <div className='px-[20px]'>
              <label className="text-sm font-medium">Description</label>
              <Input
                placeholder="Enter expense description"
                value={clientExpenseForm.description}
                onChange={(e) => handleClientFieldChange('description', e.target.value)}
                className={clientFormErrors.description ? 'border-red-500' : ''}
              />
              {clientFormErrors.description && (
                <p className="text-red-500 text-xs mt-1">{clientFormErrors.description}</p>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4 px-[20px]">
              <div>
                <label className="text-sm font-medium">Category</label>
                <Select
                  value={clientExpenseForm.expreseCategory}
                  onValueChange={(v) => handleClientFieldChange('expreseCategory', v)}
                >
                  <SelectTrigger className={clientFormErrors.expreseCategory ? 'border-red-500' : ''}>
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
                {clientFormErrors.expreseCategory && (
                  <p className="text-red-500 text-xs mt-1">{clientFormErrors.expreseCategory}</p>
                )}
              </div>
              <div>
                <label className="text-sm font-medium">Amount</label>
                <Input
                  type="number"
                  placeholder="Net"
                  step="0.01"
                  value={clientExpenseForm.netAmount}
                  onChange={(e) => handleClientFieldChange('netAmount', e.target.value)}
                  className={clientFormErrors.netAmount ? 'border-red-500' : ''}
                />
                {clientFormErrors.netAmount && (
                  <p className="text-red-500 text-xs mt-1">{clientFormErrors.netAmount}</p>
                )}
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4 px-[20px]">
              <div>
                <label className="text-sm font-medium">VAT %</label>
                <Input
                  type="number"
                  placeholder="0"
                  step="0.01"
                  value={clientExpenseForm.vatPercentage}
                  onChange={(e) => handleClientFieldChange('vatPercentage', e.target.value)}
                  className={clientFormErrors.vatPercentage ? 'border-red-500' : ''}
                />
                {clientFormErrors.vatPercentage && (
                  <p className="text-red-500 text-xs mt-1">{clientFormErrors.vatPercentage}</p>
                )}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 px-[20px]">
              <div>
                <label className="text-sm font-medium">Status</label>
                <Select
                  value={clientExpenseForm.status}
                  onValueChange={(v) => handleClientFieldChange('status', v)}
                >
                  <SelectTrigger className={clientFormErrors.status ? 'border-red-500' : ''}>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="no">Not Invoiced</SelectItem>
                    <SelectItem value="yes">Invoiced</SelectItem>
                  </SelectContent>
                </Select>
                {clientFormErrors.status && (
                  <p className="text-red-500 text-xs mt-1">{clientFormErrors.status}</p>
                )}
              </div>
              <div>
                <label className="text-sm font-medium">Attachment</label>
                {editingExpense && editingExpense.attachments && editingExpense.attachments.length > 0 && (
                  <div className="mb-2 p-2 bg-blue-50 border border-blue-200 rounded text-sm text-blue-700">
                    <strong>Current attachment:</strong> {editingExpense.attachments[0].split('/').pop()}
                    <br />
                    <span className="text-xs text-blue-600">Upload a new file to replace the current attachment</span>
                  </div>
                )}
                <Input
                  type="file"
                  onChange={(e) => handleClientFieldChange('file', e.target.files && e.target.files[0] ? e.target.files[0] : null)}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-4 p-[20px] bg-[#381980]">
              <Button variant="outline" className="rounded-[6px] text-[#017DB9]" onClick={() => {
                setAddClientExpenseOpen(false);
                setEditingExpense(null);
                setClientFormErrors({});
              }}>
                Cancel
              </Button>
              <Button onClick={submitClientExpense} disabled={isAddingClientExpense || isUpdatingExpense} className="!bg-[#017DB9] rounded-[6px]">
                {isAddingClientExpense || isUpdatingExpense ? 'Saving...' : (editingExpense ? 'Update Expense' : 'Save Expense')}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Team Expense Dialog */}
      <Dialog open={addTeamExpenseOpen} onOpenChange={(open) => {
        setAddTeamExpenseOpen(open);
        if (!open) {
          setEditingExpense(null);
          setTeamFormErrors({});
        }
      }}>
        <DialogContent className="max-w-2xl !rounded-none p-0 border-none for-close">
          <DialogHeader className="bg-[#381980] sticky z-50 top-0 left-0 w-full text-center ">
            <DialogTitle className="text-center text-white py-4">{editingExpense ? 'Edit Team Expense' : '+ New Team Expense'}</DialogTitle>
          </DialogHeader>
          <button
            onClick={() => {
              setAddTeamExpenseOpen(false);
              setEditingExpense(null);
              setTeamFormErrors({});
            }}
            className=" bg-[#381980] text-white absolute right-[-35px] top-0 p-[6px] rounded-full max-sm:hidden"
          >
            <X size={16} />
          </button>
          <div className="space-y-4 form-change">
            <div className="grid grid-cols-2 gap-4 px-[20px]">
              <div>
                <label className="text-sm font-medium">Date </label>
                <Input
                  type="date"
                  value={teamExpenseForm.date}
                  onChange={(e) => handleTeamFieldChange('date', e.target.value)}
                  className={teamFormErrors.date ? 'border-red-500' : ''}
                />
                {teamFormErrors.date && (
                  <p className="text-red-500 text-xs mt-1">{teamFormErrors.date}</p>
                )}
              </div>
              <div>
                <label className="text-sm font-medium">Team</label>
                <Select
                  value={teamExpenseForm.teamId}
                  onValueChange={(v) => handleTeamFieldChange('teamId', v)}
                >
                  <SelectTrigger className={teamFormErrors.teamId ? 'border-red-500' : ''}>
                    <SelectValue placeholder="Select team" />
                  </SelectTrigger>
                  <SelectContent>
                    {teamOptions.map(o => (
                      <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {teamFormErrors.teamId && (
                  <p className="text-red-500 text-xs mt-1">{teamFormErrors.teamId}</p>
                )}
              </div>
            </div>
            <div className='px-[20px]'>
              <label className="text-sm font-medium">Description</label>
              <Input
                placeholder="Enter expense description"
                value={teamExpenseForm.description}
                onChange={(e) => handleTeamFieldChange('description', e.target.value)}
                className={teamFormErrors.description ? 'border-red-500' : ''}
              />
              {teamFormErrors.description && (
                <p className="text-red-500 text-xs mt-1">{teamFormErrors.description}</p>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4 px-[20px]">
              <div>
                <label className="text-sm font-medium">Category</label>
                <Select
                  value={teamExpenseForm.expreseCategory}
                  onValueChange={(v) => handleTeamFieldChange('expreseCategory', v)}
                >
                  <SelectTrigger className={teamFormErrors.expreseCategory ? 'border-red-500' : ''}>
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
                {teamFormErrors.expreseCategory && (
                  <p className="text-red-500 text-xs mt-1">{teamFormErrors.expreseCategory}</p>
                )}
              </div>
              <div>
                <label className="text-sm font-medium">Amount</label>
                <Input
                  type="number"
                  placeholder="Net"
                  step="0.01"
                  value={teamExpenseForm.netAmount}
                  onChange={(e) => handleTeamFieldChange('netAmount', e.target.value)}
                  className={teamFormErrors.netAmount ? 'border-red-500' : ''}
                />
                {teamFormErrors.netAmount && (
                  <p className="text-red-500 text-xs mt-1">{teamFormErrors.netAmount}</p>
                )}
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4 px-[20px]">
              <div>
                <label className="text-sm font-medium">VAT %</label>
                <Input
                  type="number"
                  placeholder="0"
                  step="0.01"
                  value={teamExpenseForm.vatPercentage}
                  onChange={(e) => handleTeamFieldChange('vatPercentage', e.target.value)}
                  className={teamFormErrors.vatPercentage ? 'border-red-500' : ''}
                />
                {teamFormErrors.vatPercentage && (
                  <p className="text-red-500 text-xs mt-1">{teamFormErrors.vatPercentage}</p>
                )}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 px-[20px]">
              <div>
                <label className="text-sm font-medium">Status</label>
                <Select
                  value={teamExpenseForm.status}
                  onValueChange={(v) => handleTeamFieldChange('status', v)}
                >
                  <SelectTrigger className={teamFormErrors.status ? 'border-red-500' : ''}>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="yes">Paid</SelectItem>
                    <SelectItem value="no">Not Paid</SelectItem>
                  </SelectContent>
                </Select>
                {teamFormErrors.status && (
                  <p className="text-red-500 text-xs mt-1">{teamFormErrors.status}</p>
                )}
              </div>
              <div>
                <label className="text-sm font-medium">Attachment</label>
                {editingExpense && editingExpense.attachments && editingExpense.attachments.length > 0 && (
                  <div className="mb-2 p-2 bg-blue-50 border border-blue-200 rounded text-sm text-blue-700">
                    <strong>Current attachment:</strong> {editingExpense.attachments[0].split('/').pop()}
                    <br />
                    <span className="text-xs text-blue-600">Upload a new file to replace the current attachment</span>
                  </div>
                )}
                <Input
                  type="file"
                  onChange={(e) => handleTeamFieldChange('file', e.target.files && e.target.files[0] ? e.target.files[0] : null)}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-4 p-[20px] bg-[#381980]">
              <Button variant="outline" className="rounded-[6px] text-[#017DB9]" onClick={() => {
                setAddTeamExpenseOpen(false);
                setEditingExpense(null);
                setTeamFormErrors({});
              }}>
                Cancel
              </Button>
              <Button onClick={submitTeamExpense} disabled={isAddingTeamExpense || isUpdatingExpense} className="!bg-[#017DB9] rounded-[6px]">
                {isAddingTeamExpense || isUpdatingExpense ? 'Saving...' : (editingExpense ? 'Update Expense' : 'Save Expense')}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Receipt Preview Dialog */}
      <Dialog open={receiptDialogOpen} onOpenChange={setReceiptDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Receipt Preview - {selectedReceipt?.split('/').pop()}</DialogTitle>
          </DialogHeader>
          <div className="flex justify-center p-6">
            <img
              src={selectedReceipt ? `${import.meta.env.VITE_BACKEND_BASE_URL}${selectedReceipt}` : ""}
              alt="Receipt"
              className="max-w-full h-auto border border-gray-200 rounded-lg shadow-lg"
              onError={(e) => {
                e.currentTarget.src = sampleReceipt;
              }}
            />
          </div>
        </DialogContent>
      </Dialog>

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
            onClick={() => handleEditExpense(settingsPopup.expenseId)}
            className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2"
          >
            <Edit size={14} />
            Edit
          </button>
          <button
            onClick={() => handleDeleteExpense(settingsPopup.expenseId)}
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
    </div>
  );
};

export default ExpensesLogTab;