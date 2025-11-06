import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { FileText } from 'lucide-react';
import { InvoiceOptionsSection } from './Invoice/InvoiceOptionsSection';
import { ItemizationOptionsSection } from './Invoice/ItemizationOptionsSection';
import { InvoicePreviewSection } from './Invoice/InvoicePreviewSection';
import { ExpenseItem } from './Invoice/ExpensesSection';
import { formatCurrency } from '@/lib/currency';
import { useCreateInvoiceMutation, useGetInvoiceByInvoiceNoQuery, useCreateWriteOffMutation, useCreateInvoiceLogMutation } from '@/store/wipApi';
import WriteOffLogicDialog from './WriteOffLogicDialog';
import { useDebounce } from 'use-debounce';
import { toast } from 'sonner';

interface InvoicePreviewDialogProps {
  isOpen: boolean;
  onClose: () => void;
  invoiceData: {
    invoiceNumber: string;
    clientName: string;
    clientCode: string;
    clientAddress: string;
    amount: number;
    date: string;
    jobName?: string;
    company?: { name?: string; email?: string };
    members?: { userName: string; seconds: number; billableRate?: number }[];
  };
  onInvoiceCreate?: (invoice: any) => void;
  openLogInvoiceOnly?: boolean;
}

export const InvoicePreviewDialog = ({ 
  isOpen, 
  onClose, 
  invoiceData, 
  onInvoiceCreate,
  openLogInvoiceOnly = false
}: InvoicePreviewDialogProps) => {
  const [createInvoice, { isLoading: isCreating }] = useCreateInvoiceMutation();
  const [itemizeTimeLogs, setItemizeTimeLogs] = useState(false);
  const [includeTimeAmount, setIncludeTimeAmount] = useState(false);
  const [includeValueAmount, setIncludeValueAmount] = useState(false);
  const [includeBillableRate, setIncludeBillableRate] = useState(false);
  const [includeExpenses, setIncludeExpenses] = useState(false);
  const [expenses, setExpenses] = useState<ExpenseItem[]>([]);
  const [invoiceNumber, setInvoiceNumber] = useState(invoiceData.invoiceNumber);
  const [includeVAT, setIncludeVAT] = useState(false);
  const [vatRate, setVatRate] = useState<number>(23);
  const [logInvoiceDialogOpen, setLogInvoiceDialogOpen] = useState(false);
  const [wipBalanceDialogOpen, setWipBalanceDialogOpen] = useState(false);
  const [writeOffLogicDialogOpen, setWriteOffLogicDialogOpen] = useState(false);
  const [logInvoiceData, setLogInvoiceData] = useState({
    invoiceNumber: '',
    invoiceDate: '',
    invoiceAmount: '',
    invoiceAmountIncVAT: ''
  });
  const [wipAmount, setWipAmount] = useState<number | null>(null);
  const [fetchedInvoice, setFetchedInvoice] = useState<any>(null);
  const [writeOffData, setWriteOffData] = useState<any>(null);
  
  // Debounce invoice number for API call
  const [debouncedInvoiceNo] = useDebounce(logInvoiceData.invoiceNumber, 500);
  
  // Fetch invoice by invoice number
  const { data: invoiceResponse, isLoading: isLoadingInvoice, error: invoiceError } = useGetInvoiceByInvoiceNoQuery(
    debouncedInvoiceNo,
    { skip: !debouncedInvoiceNo || debouncedInvoiceNo.length < 3 }
  );
  
  const [createWriteOff, { isLoading: isCreatingWriteOff }] = useCreateWriteOffMutation();
  const [createInvoiceLog, { isLoading: isCreatingInvoiceLog }] = useCreateInvoiceLogMutation();

  // Update WIP amount and form data when invoice is fetched
  useEffect(() => {
    if (invoiceResponse?.data) {
      const invoice = invoiceResponse.data;
      setFetchedInvoice(invoice);
      setWipAmount(invoice.totalAmount || null);
      setLogInvoiceData(prev => ({
        ...prev,
        invoiceDate: invoice.date ? new Date(invoice.date).toISOString().split('T')[0] : prev.invoiceDate,
        invoiceAmount: invoice.totalAmount ? invoice.totalAmount.toString() : prev.invoiceAmount
      }));
    } else if (debouncedInvoiceNo && debouncedInvoiceNo.length >= 3 && !isLoadingInvoice) {
      // Reset if invoice not found
      setFetchedInvoice(null);
      setWipAmount(null);
    }
  }, [invoiceResponse, debouncedInvoiceNo, isLoadingInvoice]);

  // Reset when dialog closes
  useEffect(() => {
    if (!logInvoiceDialogOpen) {
      setLogInvoiceData({
        invoiceNumber: '',
        invoiceDate: '',
        invoiceAmount: '',
        invoiceAmountIncVAT: ''
      });
      setWipAmount(null);
      setFetchedInvoice(null);
      setWriteOffData(null);
    }
  }, [logInvoiceDialogOpen]);

  // Sample time logs data for the write-off logic dialog (will be replaced with API data)
  const sampleTimeLogs = [
    {
      id: '1',
      teamMember: 'John Smith',
      hours: 8.5,
      billableRate: 75,
      amount: 637.50,
      date: '2024-01-12',
      description: 'VAT return preparation'
    },
    {
      id: '2', 
      teamMember: 'John Smith',
      hours: 4.5,
      billableRate: 75,
      amount: 337.50,
      date: '2024-01-12',
      description: 'Client consultation'
    },
    {
      id: '3',
      teamMember: 'John Smith', 
      hours: 4.0,
      billableRate: 75,
      amount: 300.00,
      date: '2024-02-12',
      description: 'Document review'
    },
    {
      id: '4',
      teamMember: 'Sarah Johnson',
      hours: 6.0,
      billableRate: 65,
      amount: 390.00,
      date: '2024-02-12',
      description: 'Compliance check'
    },
    {
      id: '5',
      teamMember: 'Sarah Johnson',
      hours: 3.0,
      billableRate: 65,
      amount: 195.00,
      date: '2024-02-12',
      description: 'Document review'
    },
    {
      id: '6',
      teamMember: 'Sarah Johnson',
      hours: 3.0,
      billableRate: 65,
      amount: 195.00,
      date: '2024-03-12',
      description: 'Compliance check'
    },
    {
      id: '7',
      teamMember: 'Mike Wilson',
      hours: 12.5,
      billableRate: 90,
      amount: 1125.00,
      date: '2024-03-12',
      description: 'Tax calculations'
    },
    {
      id: '8',
      teamMember: 'Mike Wilson',
      hours: 6.5,
      billableRate: 90,
      amount: 585.00,
      date: '2024-03-12',
      description: 'Report finalization'
    },
    {
      id: '9',
      teamMember: 'Mike Wilson',
      hours: 6.0,
      billableRate: 90,
      amount: 540.00,
      date: '2024-04-12',
      description: 'Tax calculations'
    }
  ];

  // Convert fetched invoice time logs to format needed for WriteOffLogicDialog
  const getTimeLogsForWriteOff = () => {
    if (!fetchedInvoice?.timeLogIds) return [];
    
    return fetchedInvoice.timeLogIds.map((log: any) => ({
      id: log._id || String(log._id),
      timeLogId: log._id || String(log._id),
      teamMember: log.userId?.name || 'Unknown',
      hours: (log.duration || 0) / 3600,
      billableRate: log.rate || 0,
      amount: log.amount || 0,
      date: log.date || new Date().toISOString(),
      description: log.description || '',
      duration: log.duration || 0,
      clientId: log.clientId?._id || log.clientId || '',
      jobId: log.jobId?._id || log.jobId || '',
      userId: log.userId?._id || log.userId || '',
      jobCategoryId: log.jobTypeId?._id || log.jobTypeId || '',
      originalAmount: log.amount || 0
    }));
  };

  const handleLogInvoiceSubmit = async () => {
    if (!logInvoiceData.invoiceNumber || !logInvoiceData.invoiceDate || !logInvoiceData.invoiceAmount) {
      toast.error('Please fill all required fields');
      return;
    }

    const invoiceAmountNum = parseFloat(logInvoiceData.invoiceAmount);
    const totalLogAmount = fetchedInvoice?.totalLogAmount || 0;
    const currentWipAmount = wipAmount || 0;

    // Option 2: Balance should not exceed Total Log Amount
    // Balance = WIP Amount - Invoice Amount
    const currentBalance = currentWipAmount - invoiceAmountNum;

    if (currentBalance > totalLogAmount) {
      toast.error(`Balance (${formatCurrency(currentBalance)}) cannot exceed Total Log Amount (${formatCurrency(totalLogAmount)})`);
      return;
    }

    if (invoiceAmountNum < 0) {
      toast.error('Invoice amount cannot be negative');
      return;
    }

    // Get invoice ID from fetched invoice
    const invoiceId = fetchedInvoice?._id;
    if (!invoiceId) {
      toast.error('Invoice ID not found. Please fetch the invoice first.');
      return;
    }

    // If there's write-off data and balance > 0, create write-off first
    if (writeOffData && currentBalance > 0 && writeOffData.writeOffBalance > 0) {
      try {
        // The 'amount' field should be the Invoice Amount entered by the user in Log Invoice Only dialog
        // Backend sets invoice.totalAmount = amount, so we send the user-entered invoice amount
        const writeOffPayload = {
          invoiceNo: logInvoiceData.invoiceNumber,
          amount: invoiceAmountNum, // Invoice Amount entered by user in Log Invoice Only dialog
          date: logInvoiceData.invoiceDate ? new Date(logInvoiceData.invoiceDate).toISOString() : new Date().toISOString(),
          writeOffData: {
            timeLogs: writeOffData.timeLogs || [],
            reason: writeOffData.reason || '',
            logic: writeOffData.logic || 'manually'
          }
        };

        await createWriteOff(writeOffPayload).unwrap();
        toast.success('Write-off created successfully');
      } catch (error: any) {
        console.error('Failed to create write-off', error);
        toast.error(error?.data?.message || 'Failed to create write-off');
        return;
      }
    }

    // Create invoice log
    try {
      const invoiceLogPayload = {
        invoiceId: invoiceId,
        action: 'logged',
        amount: invoiceAmountNum,
        date: logInvoiceData.invoiceDate ? new Date(logInvoiceData.invoiceDate).toISOString() : new Date().toISOString()
      };

      await createInvoiceLog(invoiceLogPayload).unwrap();
      toast.success('Invoice logged successfully');
      
      // Close dialogs and call onInvoiceCreate if provided
      setLogInvoiceDialogOpen(false);
      if (onInvoiceCreate) {
        onInvoiceCreate({
          invoiceId,
          invoiceNo: logInvoiceData.invoiceNumber,
          amount: invoiceAmountNum,
          date: logInvoiceData.invoiceDate
        });
      }
      onClose();
    } catch (error: any) {
      console.error('Failed to log invoice', error);
      toast.error(error?.data?.message || 'Failed to log invoice');
    }
  };


  // Auto-open log invoice dialog if openLogInvoiceOnly is true
  useEffect(() => {
    if (openLogInvoiceOnly && isOpen) {
      setLogInvoiceDialogOpen(true);
    }
  }, [openLogInvoiceOnly, isOpen]);

  // Prefill expenses from invoiceData when includeExpenses is enabled and list is empty
  useEffect(() => {
    if (!isOpen) return;
    if (!includeExpenses) return;
    if (expenses.length > 0) return;
    const src: any[] = Array.isArray((invoiceData as any).expenses) ? (invoiceData as any).expenses : [];
    if (src.length === 0) return;
    const mapped: ExpenseItem[] = src.map((e: any) => ({
      id: e.id || e._id || String(Math.random()),
      description: e.description || '',
      amount: Number(e.amount || e.totalAmount || 0),
      vatPercent: typeof e.vatPercent === 'number' ? e.vatPercent : Number(e.vatPercentage || 0) || 0,
      locked: e.locked !== undefined ? !!e.locked : true,
    }));
    setExpenses(mapped);
  }, [isOpen, includeExpenses, invoiceData, expenses.length]);

  // Don't render the main dialog content if we're only showing log invoice
  if (openLogInvoiceOnly) {
    return (
      <>
        {/* Log Invoice Only Dialog */}
        <Dialog open={logInvoiceDialogOpen} onOpenChange={(open) => {
          setLogInvoiceDialogOpen(open);
          if (!open) onClose();
        }}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Log Invoice Only</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              {isLoadingInvoice && (
                <div className="text-sm text-muted-foreground text-center py-2">
                  Loading invoice...
                </div>
              )}
              {invoiceError && (
                <div className="text-sm text-red-600 text-center py-2">
                  Invoice not found
                </div>
              )}
              
              <div className="space-y-3 p-4 bg-gray-50 rounded-lg">
                <div className="flex justify-between text-sm">
                  <span className="font-medium">WIP Amount:</span>
                  <span className="font-bold">
                    {wipAmount !== null ? formatCurrency(wipAmount) : 'N/A'}
                  </span>
                </div>
                {fetchedInvoice?.totalLogAmount && (
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>Total Log Amount:</span>
                    <span>{formatCurrency(fetchedInvoice.totalLogAmount)}</span>
                  </div>
                )}
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium block">Invoice Number</label>
                <Input
                  value={logInvoiceData.invoiceNumber}
                  onChange={(e) => setLogInvoiceData(prev => ({ ...prev, invoiceNumber: e.target.value }))}
                  placeholder="Enter invoice number"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium block">Invoice Date</label>
                <Input
                  type="date"
                  value={logInvoiceData.invoiceDate}
                  onChange={(e) => setLogInvoiceData(prev => ({ ...prev, invoiceDate: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium block">Invoice Amount</label>
                <Input
                  type="number"
                  step="0.01"
                  value={logInvoiceData.invoiceAmount}
                  onChange={(e) => {
                    // Allow free editing without validation while typing
                    setLogInvoiceData(prev => ({ ...prev, invoiceAmount: e.target.value }));
                  }}
                  onBlur={(e) => {
                    // Validate only when user leaves the input field
                    const value = e.target.value;
                    const numValue = parseFloat(value);
                    const totalLogAmount = fetchedInvoice?.totalLogAmount || 0;
                    const currentWipAmount = wipAmount || 0;
                    
                    if (value && !isNaN(numValue)) {
                      // Option 2: Balance should not exceed Total Log Amount
                      // Balance = WIP Amount - Invoice Amount
                      const balance = currentWipAmount - numValue;
                      
                      if (numValue < 0) {
                        toast.error('Invoice amount cannot be negative');
                        setLogInvoiceData(prev => ({ ...prev, invoiceAmount: '0' }));
                        return;
                      }
                      
                      if (balance > totalLogAmount) {
                        const minInvoiceAmount = Math.max(0, currentWipAmount - totalLogAmount);
                        toast.error(`Balance (${formatCurrency(balance)}) cannot exceed Total Log Amount (${formatCurrency(totalLogAmount)}). Minimum invoice amount: ${formatCurrency(minInvoiceAmount)}`);
                        // Auto-correct to minimum valid amount
                        setLogInvoiceData(prev => ({ ...prev, invoiceAmount: minInvoiceAmount.toString() }));
                        return;
                      }
                    }
                  }}
                  placeholder="0.00"
                  min={wipAmount !== null && fetchedInvoice?.totalLogAmount ? Math.max(0, wipAmount - fetchedInvoice.totalLogAmount) : 0}
                />
                {fetchedInvoice?.totalLogAmount && wipAmount !== null && (
                  <p className="text-xs text-muted-foreground">
                    Minimum: {formatCurrency(Math.max(0, wipAmount - fetchedInvoice.totalLogAmount))} 
                    (Balance must not exceed {formatCurrency(fetchedInvoice.totalLogAmount)})
                  </p>
                )}
              </div>
              
              {logInvoiceData.invoiceAmount && wipAmount !== null && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">Balance:</span>
                    <span className="font-bold text-blue-800">
                      {formatCurrency(wipAmount - parseFloat(logInvoiceData.invoiceAmount || '0'))}
                    </span>
                  </div>
                  {wipAmount - parseFloat(logInvoiceData.invoiceAmount || '0') > 0 && (
                     <div className="space-y-3 mt-3">
                      {/* Apply Write Off Logic button */}
                      <div className="flex justify-center">
                        <Button
                          onClick={() => setWriteOffLogicDialogOpen(true)}
                          className="bg-orange-600 hover:bg-orange-700 text-white"
                          size="sm"
                        >
                          Apply Write Off Logic
                        </Button>
                      </div>
                    </div>
                  )}
                  {wipAmount - parseFloat(logInvoiceData.invoiceAmount || '0') < 0 && (
                    <div className="mt-3">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          console.log('Use Minus Balance As New WIP Balance clicked');
                        }}
                      >
                        Use Minus Balance As New WIP Balance
                      </Button>
                    </div>
                  )}
                </div>
              )}
              <div className="flex justify-end space-x-2 pt-4">
                <Button variant="outline" onClick={() => {
                  setLogInvoiceDialogOpen(false);
                  onClose();
                }}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleLogInvoiceSubmit}
                  disabled={!logInvoiceData.invoiceNumber || !logInvoiceData.invoiceDate || !logInvoiceData.invoiceAmount || !writeOffData || isCreatingWriteOff || isCreatingInvoiceLog}
                >
                  {(isCreatingWriteOff || isCreatingInvoiceLog) ? 'Processing...' : 'Log Invoice'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* WIP Balance Dialog */}
        <Dialog open={wipBalanceDialogOpen} onOpenChange={(open) => {
          setWipBalanceDialogOpen(open);
          if (!open) onClose();
        }}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>WIP Balance</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div className="space-y-3 p-4 bg-gray-50 rounded-lg">
                <div className="flex justify-between text-sm">
                  <span className="font-medium">WIP Balance Amount:</span>
                  <span className="font-bold text-lg">
                    {formatCurrency(invoiceData.amount - parseFloat(logInvoiceData.invoiceAmount || '0'))}
                  </span>
                </div>
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Client:</span>
                  <span>{invoiceData.clientName}</span>
                </div>
                {invoiceData.jobName && (
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Job:</span>
                    <span>{invoiceData.jobName}</span>
                  </div>
                )}
              </div>
              <div className="text-sm text-gray-600 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                This balance has been moved to the Write Off Log.
              </div>
              <div className="flex justify-end space-x-2 pt-4">
                <Button onClick={() => {
                  setWipBalanceDialogOpen(false);
                  onClose();
                }}>
                  Close
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Write Off Logic Dialog */}
        <WriteOffLogicDialog
          open={writeOffLogicDialogOpen}
          onOpenChange={(open) => {
            // Only close if explicitly set to false (when user clicks "Go back and save")
            // Don't close if user clicks outside or ESC - let onSave handle it
            if (!open && !writeOffData) {
              setWriteOffLogicDialogOpen(false);
            }
          }}
          clientName={invoiceData.clientName}
          jobName={invoiceData.jobName || ''}
          timeLogs={getTimeLogsForWriteOff()}
          totalAmount={fetchedInvoice?.totalLogAmount || 0}
          writeOffBalance={wipAmount !== null ? wipAmount - parseFloat(logInvoiceData.invoiceAmount || '0') : 0}
          invoiceNo={logInvoiceData.invoiceNumber}
          invoiceDate={logInvoiceData.invoiceDate}
          onSave={(data) => {
            // Store write-off data for later use when clicking "Log Invoice"
            setWriteOffData(data);
            // Close the write-off dialog and return to Log Invoice Only dialog
            setWriteOffLogicDialogOpen(false);
            toast.success('Write-off data saved. You can now click "Log Invoice" to complete the process.');
          }}
        />
      </>
    );
  }

  const addExpense = () => {
    const newExpense: ExpenseItem = {
      id: Date.now().toString(),
      description: '',
      amount: 0,
      vatPercent: 0,
      locked: false
    };
    setExpenses([...expenses, newExpense]);
  };

  const removeExpense = (id: string) => {
    const exp = expenses.find(e => e.id === id);
    if (exp?.locked) return; // prevent removing prefilled
    setExpenses(expenses.filter(expense => expense.id !== id));
  };

  const updateExpense = (id: string, field: keyof ExpenseItem, value: string | number | boolean) => {
    setExpenses(expenses.map(expense => {
      if (expense.id !== id) return expense;
      if (expense.locked) return expense;
      return { ...expense, [field]: value };
    }));
  };

  const computedExpenses = expenses.reduce((sum, expense) => {
    const vatPct = typeof (expense as any).vatPercent === 'number' ? (expense as any).vatPercent : 0;
    const isLocked = (expense as any).locked === true;
    const base = Number(expense.amount || 0);
    const gross = isLocked ? base : base + (base * vatPct / 100);
    return sum + gross;
  }, 0);
  const totalExpenses = includeExpenses ? computedExpenses : 0;
  // VAT applies to Professional Services amount; always reflect edited VAT
  const vatAmount = (invoiceData.amount * (vatRate / 100));
  const totalAmount = invoiceData.amount + totalExpenses + vatAmount;

  const handleCreateInvoice = async () => {
    // Build payload for /wip/invoice
    const baseExpenseIds: string[] = Array.isArray((invoiceData as any).expenseIdsBase)
      ? (invoiceData as any).expenseIdsBase
      : [];
    const wipOpenBalanceIds: string[] = Array.isArray((invoiceData as any).wipOpenBalanceIdsBase)
      ? (invoiceData as any).wipOpenBalanceIdsBase
      : [];
    const timeLogIds: string[] = Array.isArray((invoiceData as any).timeLogIdsBase)
      ? (invoiceData as any).timeLogIdsBase
      : [];
    const newExpenses = includeExpenses
      ? (expenses || []).filter((e) => !e.locked).map((e) => {
          const netAmount = Number(e.amount || 0);
          const vatPercentage = Number(e.vatPercent || 0);
          const vatAmount = netAmount * (vatPercentage / 100);
          const total = netAmount + vatAmount;
          return {
            description: e.description || '',
            netAmount,
            vatPercentage,
            vatAmount,
            totalAmount: total,
          };
        })
      : [];

    const payload = {
      date: (invoiceData.date || new Date().toISOString()).split('T')[0],
      clientId: (invoiceData as any).clientId,
      netAmount: Number(invoiceData.amount || 0),
      vatPercentage: Number(vatRate || 0),
      vatAmount: Number((invoiceData.amount || 0) * (vatRate / 100)),
      expenseAmount: includeExpenses ? Number(totalExpenses) : 0,
      totalAmount: Number(totalAmount),
      timeLogIds,
      expenseIds: includeExpenses ? baseExpenseIds : [],
      wipOpenBalanceIds,
      newExpenses,
    } as any;

    try {
      const resp: any = await createInvoice(payload).unwrap();
      onInvoiceCreate?.(resp?.data || payload);
      onClose();
    } catch (e) {
      console.error('Failed to create invoice', e);
    }
  };

  const handlePreviewPDF = () => {
    // Open a new window with the invoice preview
    const previewWindow = window.open('', '_blank', 'width=800,height=600');
    if (previewWindow) {
      previewWindow.document.write(`
        <html>
          <head>
            <title>Invoice ${invoiceNumber}</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 40px; }
              .header { display: flex; justify-content: space-between; margin-bottom: 30px; }
              .invoice-title { font-size: 24px; font-weight: bold; }
              .client-info { margin-bottom: 20px; }
              .total { font-size: 18px; font-weight: bold; margin-top: 20px; }
            </style>
          </head>
          <body>
            <div class="header">
              <div>
                <h2>${invoiceData.company?.name || 'ABC Accounting'}</h2>
                ${invoiceData.company?.email ? `<p>${invoiceData.company.email}</p>` : ''}
              </div>
              <div>
                <div class="invoice-title">INVOICE</div>
                <p>#${invoiceNumber}</p>
                <p>Date: ${new Date(invoiceData.date).toLocaleDateString()}</p>
              </div>
            </div>
            <div class="client-info">
              <h3>Invoice To:</h3>
              <p>
                ${invoiceData.clientName}${invoiceData.clientCode ? ` (${invoiceData.clientCode})` : ''}
                ${invoiceData.clientAddress ? `<br/>${invoiceData.clientAddress}` : ''}
              </p>
            </div>
            <div>
              <h3>Description</h3>
              <p>${invoiceData.jobName || 'Professional services'}</p>
              <div class="total">Total Amount: ${totalAmount.toLocaleString('en-IE', { style: 'currency', currency: 'EUR' })}</div>
            </div>
          </body>
        </html>
      `);
      previewWindow.document.close();
    }
  };


  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto border-2" style={{ borderColor: '#1a0d2e' }}>
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">Create Invoice</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          <InvoiceOptionsSection
            itemizeTimeLogs={itemizeTimeLogs}
            onItemizeTimeLogsChange={setItemizeTimeLogs}
            includeExpenses={includeExpenses}
            onIncludeExpensesChange={setIncludeExpenses}
          />

          {itemizeTimeLogs && (
            <ItemizationOptionsSection
              includeTimeAmount={includeTimeAmount}
              onIncludeTimeAmountChange={setIncludeTimeAmount}
              includeValueAmount={includeValueAmount}
              onIncludeValueAmountChange={setIncludeValueAmount}
              includeBillableRate={includeBillableRate}
              onIncludeBillableRateChange={setIncludeBillableRate}
            />
          )}

          <InvoicePreviewSection
            invoiceData={invoiceData}
            company={invoiceData.company}
            invoiceNumber={invoiceNumber}
            onInvoiceNumberChange={setInvoiceNumber}
            itemizeTimeLogs={itemizeTimeLogs}
            includeTimeAmount={includeTimeAmount}
            includeValueAmount={includeValueAmount}
            includeBillableRate={includeBillableRate}
            includeExpenses={includeExpenses}
            expenses={expenses}
            onAddExpense={addExpense}
            onRemoveExpense={removeExpense}
            onUpdateExpense={updateExpense}
            totalExpenses={totalExpenses}
            totalAmount={totalAmount}
            vatRate={vatRate}
            onVatRateChange={setVatRate}
            vatAmount={vatAmount}
            onAddLoggedExpenses={() => {
              // Functionality for adding logged expenses
              console.log('Add logged expenses functionality');
            }}
          />
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="secondary" onClick={handlePreviewPDF}>
            <FileText className="h-4 w-4 mr-2" />
            Preview PDF
          </Button>
          <Button onClick={handleCreateInvoice} disabled={isCreating}>
            Generate Invoice
          </Button>
        </DialogFooter>
      </DialogContent>


      {/* WIP Balance Dialog */}
      <Dialog open={wipBalanceDialogOpen} onOpenChange={setWipBalanceDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>WIP Balance</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="space-y-3 p-4 bg-gray-50 rounded-lg">
              <div className="flex justify-between text-sm">
                <span className="font-medium">WIP Balance Amount:</span>
                <span className="font-bold text-lg">
                  {formatCurrency(totalAmount - parseFloat(logInvoiceData.invoiceAmount || '0'))}
                </span>
              </div>
              <div className="flex justify-between text-sm text-gray-600">
                <span>Client:</span>
                <span>{invoiceData.clientName}</span>
              </div>
              {invoiceData.jobName && (
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Job:</span>
                  <span>{invoiceData.jobName}</span>
                </div>
              )}
            </div>
            <div className="text-sm text-gray-600 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              This balance has been moved to the Write Off Log.
            </div>
            <div className="flex justify-end space-x-2 pt-4">
              <Button onClick={() => setWipBalanceDialogOpen(false)}>
                Close
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
};