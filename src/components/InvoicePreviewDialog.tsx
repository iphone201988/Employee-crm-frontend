import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FileText, X, Loader2 } from 'lucide-react';
import { InvoiceOptionsSection } from './Invoice/InvoiceOptionsSection';
import { ItemizationOptionsSection } from './Invoice/ItemizationOptionsSection';
import { InvoicePreviewSection } from './Invoice/InvoicePreviewSection';
import { ExpenseItem } from './Invoice/ExpensesSection';
import { formatCurrency } from '@/lib/currency';
import { formatDate } from '@/utils/dateFormat';
import { useGenerateInvoiceMutation, useGetInvoiceTimeLogsMutation, useLogInvoiceMutation } from '@/store/wipApi';
import { useUploadImageMutation } from '@/store/teamApi';
import WriteOffLogicDialog from './WriteOffLogicDialog';
import { toast } from 'sonner';
import InputComponent from './client/component/Input';

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

const DEFAULT_VAT_PERCENTAGE = '23';

export const InvoicePreviewDialog = ({ 
  isOpen, 
  onClose, 
  invoiceData, 
  onInvoiceCreate,
  openLogInvoiceOnly = false
}: InvoicePreviewDialogProps) => {
  const [generateInvoice, { isLoading: isGeneratingInvoice }] = useGenerateInvoiceMutation();
  const [logInvoice, { isLoading: isLoggingInvoice }] = useLogInvoiceMutation();
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
  const [writeOffLogicDialogOpen, setWriteOffLogicDialogOpen] = useState(false);
  const [logInvoiceData, setLogInvoiceData] = useState({
    invoiceNumber: '',
    invoiceDate: '',
    netAmount: '',
    vatPercentage: DEFAULT_VAT_PERCENTAGE,
    attachmentUrl: ''
  });
  const [writeOffData, setWriteOffData] = useState<any>(null);
  const [logInvoiceTimeLogs, setLogInvoiceTimeLogs] = useState<any[]>([]);
  const [fetchInvoiceTimeLogs, { isLoading: isFetchingTimeLogs }] = useGetInvoiceTimeLogsMutation();
  const [uploadAttachment, { isLoading: isUploadingAttachment }] = useUploadImageMutation();

  const computeManualInvoiceNumbers = () => {
    const wipAmountNumber = Number((((invoiceData as any)?.wipAmount ?? invoiceData.amount) ?? 0) || 0);
    const netAmountNumber = parseFloat(logInvoiceData.netAmount || '0');
    const vatPercentageNumber = parseFloat(logInvoiceData.vatPercentage || '0');
    const vatAmountNumber = Number((netAmountNumber * (vatPercentageNumber / 100)).toFixed(2));
    const grossAmountNumber = Number((netAmountNumber + vatAmountNumber).toFixed(2));
    // Remaining balance should be WIP Amount - Net Amount (not Gross)
    const remainingBalance = Math.max(0, Number((wipAmountNumber - netAmountNumber).toFixed(2)));
    return { wipAmountNumber, netAmountNumber, vatPercentageNumber, vatAmountNumber, grossAmountNumber, remainingBalance };
  };

  useEffect(() => {
    if (writeOffData) {
      setWriteOffData(null);
    }
  }, [logInvoiceData.netAmount, logInvoiceData.vatPercentage]);

  const handleLogInvoiceSubmit = async () => {
    const { wipAmountNumber, netAmountNumber, vatPercentageNumber, vatAmountNumber, grossAmountNumber, remainingBalance } = computeManualInvoiceNumbers();
    if (!logInvoiceData.invoiceNumber.trim()) {
      toast.error('Invoice number is required.');
      return;
    }
    if (!logInvoiceData.invoiceDate) {
      toast.error('Invoice date is required.');
      return;
    }
    if (!netAmountNumber || netAmountNumber <= 0) {
      toast.error('Net amount must be greater than 0.');
      return;
    }
    // Check if there's any WIP to invoice (time logs, open balances, or imported WIP)
    const hasTimeLogs = Array.isArray((invoiceData as any)?.timeLogIdsBase) && (invoiceData as any)?.timeLogIdsBase.length > 0;
    const hasOpenBalances = Array.isArray((invoiceData as any)?.wipOpenBalanceIdsBase) && (invoiceData as any)?.wipOpenBalanceIdsBase.length > 0;
    const hasWipAmount = wipAmountNumber > 0;
    
    if (!hasTimeLogs && !hasOpenBalances && !hasWipAmount) {
      toast.error('No WIP available to invoice (no time logs, open balances, or imported WIP).');
      return;
    }
    // If there's a remaining balance, require write-off data (can be empty timeLogs if no time logs exist)
    if (remainingBalance > 0 && !writeOffData) {
      toast.error('Please apply write off logic for the remaining balance.');
      return;
    }
    const payload: any = {
      date: logInvoiceData.invoiceDate,
      clientId: (invoiceData as any)?.clientId,
      jobId: (invoiceData as any)?.jobId,
      scope: (invoiceData as any)?.scope,
      netAmount: netAmountNumber,
      vatPercentage: vatPercentageNumber,
      vatAmount: vatAmountNumber,
      expenseAmount: 0,
      totalAmount: grossAmountNumber,
      timeLogIds: (invoiceData as any)?.timeLogIdsBase || [],
      expenseIds: (invoiceData as any)?.expenseIdsBase || [],
      wipOpenBalanceIds: (invoiceData as any)?.wipOpenBalanceIdsBase || [],
      invoiceNo: logInvoiceData.invoiceNumber,
      source: 'manual',
      attachmentUrl: logInvoiceData.attachmentUrl,
    };
    if (writeOffData && remainingBalance > 0) {
      payload.writeOffData = {
        ...writeOffData,
        writeOffBalance: remainingBalance
      };
    }
    try {
      const resp = await logInvoice(payload).unwrap();
      toast.success('Invoice logged successfully');
      onInvoiceCreate?.(resp?.data || payload);
      setLogInvoiceDialogOpen(false);
      setWriteOffData(null);
      onClose();
    } catch (error: any) {
      console.error('Failed to log invoice', error);
      toast.error(error?.data?.message || 'Failed to log invoice');
    }
  };

  useEffect(() => {
    if (openLogInvoiceOnly && isOpen) {
      setLogInvoiceDialogOpen(true);
    }
  }, [openLogInvoiceOnly, isOpen]);

  useEffect(() => {
    if (logInvoiceDialogOpen && openLogInvoiceOnly && isOpen) {
      const today = new Date().toISOString().split('T')[0];
      const defaultNet = Number(((invoiceData as any)?.wipAmount ?? invoiceData.amount ?? 0) || 0);
      setLogInvoiceData((prev) => ({
        ...prev,
        invoiceNumber: '',
        invoiceDate: today,
        netAmount: defaultNet > 0 ? defaultNet.toFixed(2) : '',
        attachmentUrl: ''
      }));
      setWriteOffData(null);
      const ids = (invoiceData as any)?.timeLogIdsBase;
      if (Array.isArray(ids) && ids.length) {
        fetchInvoiceTimeLogs({ timeLogIds: ids })
          .unwrap()
          .then((resp) => setLogInvoiceTimeLogs(Array.isArray(resp?.data) ? resp.data : []))
          .catch(() => {
            setLogInvoiceTimeLogs([]);
            toast.error('Failed to load time logs for this invoice.');
          });
      } else {
        setLogInvoiceTimeLogs([]);
      }
    }
  }, [logInvoiceDialogOpen, openLogInvoiceOnly, isOpen, invoiceData, fetchInvoiceTimeLogs]);

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
    const { wipAmountNumber, netAmountNumber, vatPercentageNumber, vatAmountNumber, grossAmountNumber, remainingBalance } = computeManualInvoiceNumbers();
    const formattedLogs = logInvoiceTimeLogs.map((log: any) => ({
      id: String(log.timeLogId || log._id),
      timeLogId: log.timeLogId || log._id,
      teamMember: log.userName || 'Team Member',
      hours: Number(log.duration || 0) / 3600,
      billableRate: Number(log.rate || 0),
      amount: Number(log.amount || 0),
      date: log.date,
      description: log.description || '',
      duration: Number(log.duration || 0),
      clientId: log.clientId || (invoiceData as any)?.clientId,
      jobId: log.jobId || (invoiceData as any)?.jobId,
      userId: log.userId,
      jobCategoryId: log.jobCategoryId || log.jobTypeId,
      originalAmount: Number(log.amount || 0),
    }));
    const handleAttachmentUpload = async (files: FileList | null) => {
      const file = files?.[0];
      if (!file) return;
      try {
        const result = await uploadAttachment(file).unwrap();
        setLogInvoiceData(prev => ({ ...prev, attachmentUrl: result?.fileUrl || '' }));
        toast.success('Attachment uploaded successfully');
      } catch (error: any) {
        console.error('Failed to upload attachment', error);
        toast.error(error?.data?.message || 'Failed to upload attachment');
      }
    };
    // Check if there's any WIP to invoice
    const hasTimeLogs = formattedLogs.length > 0;
    const hasOpenBalances = Array.isArray((invoiceData as any)?.wipOpenBalanceIdsBase) && (invoiceData as any)?.wipOpenBalanceIdsBase.length > 0;
    const hasWipAmount = wipAmountNumber > 0;
    
    const canSubmit = Boolean(
      logInvoiceData.invoiceNumber &&
      logInvoiceData.invoiceDate &&
      netAmountNumber > 0 &&
      (hasTimeLogs || hasOpenBalances || hasWipAmount) &&
      (!remainingBalance || writeOffData)
    );

    const handleDialogClose = (open: boolean) => {
      setLogInvoiceDialogOpen(open);
      if (!open) {
        setWriteOffData(null);
        onClose();
      }
    };

    return (
      <>
        <Dialog open={logInvoiceDialogOpen} onOpenChange={handleDialogClose}>
          <DialogContent className="max-w-2xl h-[80vh] !rounded-none p-0 border-none for-close">
            <button 
              onClick={() => handleDialogClose(false)}
              className="bg-[#381980] text-white absolute right-[-35px] top-0 p-[6px] rounded-full max-sm:hidden"
            >
              <X size={16}/>
            </button>
            <DialogHeader className="bg-[#381980] sticky z-50 top-0 left-0 w-full text-center">
              <DialogTitle className="text-center text-white py-4">Log Invoice Only</DialogTitle>
            </DialogHeader>

            <div className="overflow-auto h-full">
              <form onSubmit={async (e) => { 
                e.preventDefault(); 
                await handleLogInvoiceSubmit(); 
              }} className="space-y-6 form-change">
                <div className="space-y-4 px-[20px]">
                  <h3 className="text-lg font-semibold text-gray-800">Invoice Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="border rounded-lg p-4 bg-muted/30">
                      <p className="text-sm text-muted-foreground">Client Name</p>
                      <p className="text-lg font-semibold">{invoiceData.clientName}</p>
                      {invoiceData.jobName && (
                        <p className="text-sm text-muted-foreground mt-1">Job: {invoiceData.jobName}</p>
                      )}
                    </div>
                    <div className="border rounded-lg p-4 bg-muted/30">
                      <p className="text-sm text-muted-foreground">WIP Amount</p>
                      <p className="text-lg font-semibold">{formatCurrency(wipAmountNumber)}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <InputComponent
                      label="Invoice No."
                      id="invoiceNumber"
                      value={logInvoiceData.invoiceNumber}
                      onChange={(value) => setLogInvoiceData(prev => ({ ...prev, invoiceNumber: value as string }))}
                      placeholder="Enter invoice number"
                      required
                    />
                    <InputComponent
                      label="Invoice Date"
                      id="invoiceDate"
                      type="date"
                      value={logInvoiceData.invoiceDate}
                      onChange={(value) => setLogInvoiceData(prev => ({ ...prev, invoiceDate: value as string }))}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-4 px-[20px]">
                  <h3 className="text-lg font-semibold text-gray-800">Amount Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <InputComponent
                      label="Net Amount"
                      id="netAmount"
                      type="number"
                      value={logInvoiceData.netAmount}
                      onChange={(value) => setLogInvoiceData(prev => ({ ...prev, netAmount: value as string }))}
                      placeholder="0.00"
                      required
                    />
                    <InputComponent
                      label="VAT %"
                      id="vatPercentage"
                      type="number"
                      value={logInvoiceData.vatPercentage}
                      onChange={(value) => setLogInvoiceData(prev => ({ ...prev, vatPercentage: value as string }))}
                      placeholder="23"
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="vatAmount" className="text-sm font-medium">VAT Amount</Label>
                      <Input
                        id="vatAmount"
                        value={formatCurrency(vatAmountNumber)}
                        readOnly
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="grossAmount" className="text-sm font-medium">Gross Amount</Label>
                      <Input
                        id="grossAmount"
                        value={formatCurrency(grossAmountNumber)}
                        readOnly
                        className="mt-1"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-4 px-[20px]">
                  <h3 className="text-lg font-semibold text-gray-800">Attach Invoice</h3>
                  <div className="space-y-2">
                    <Input
                      type="file"
                      accept=".pdf,.png,.jpg,.jpeg"
                      disabled={isUploadingAttachment}
                      onChange={(e) => handleAttachmentUpload(e.target.files)}
                      className="mt-1"
                    />
                    {logInvoiceData.attachmentUrl && (
                      <div className="flex items-center justify-between text-sm mt-2">
                        <a
                          href={`${import.meta.env.VITE_BACKEND_BASE_URL || ''}${logInvoiceData.attachmentUrl}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-blue-600 hover:text-blue-800 underline"
                        >
                          View Attachment
                        </a>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setLogInvoiceData(prev => ({ ...prev, attachmentUrl: '' }))}
                        >
                          Remove
                        </Button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-4 px-[20px]">
                  <h3 className="text-lg font-semibold text-gray-800">WIP Summary</h3>
                  <div className="p-4 border rounded bg-muted/30 space-y-2 text-sm">
                    {isFetchingTimeLogs && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Loader2 className="h-4 w-4 animate-spin" /> Updating WIP data...
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span>Total WIP</span>
                      <span className="font-semibold">{formatCurrency(wipAmountNumber)}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4 px-[20px]">
                  <h3 className="text-lg font-semibold text-gray-800">Write Off Summary</h3>
                  <div className="p-4 border rounded bg-muted/30 space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">Net Amount</span>
                      <span className="font-semibold">{formatCurrency(netAmountNumber)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">Balance to Write Off</span>
                      <span className={`font-semibold ${remainingBalance > 0 ? 'text-red-600' : ''}`}>
                        {formatCurrency(remainingBalance)}
                      </span>
                    </div>
                    {remainingBalance > 0 && (
                      <Button
                        variant="outline"
                        onClick={() => setWriteOffLogicDialogOpen(true)}
                        disabled={!hasTimeLogs && !hasOpenBalances && !hasWipAmount}
                        className="w-full"
                      >
                        Apply Write Off Logic
                      </Button>
                    )}
                    {remainingBalance > 0 && writeOffData && (
                      <p className="text-sm text-green-600">
                        Write off prepared ({writeOffData.logic === 'manually' ? 'Manual' : 'Proportional'})
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex justify-end space-x-3 pt-6 border-t p-[20px] bg-[#381980]">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => handleDialogClose(false)}
                    disabled={isLoggingInvoice}
                    className="rounded-[6px] text-[#017DB9]"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={!canSubmit || isLoggingInvoice}
                    className="!bg-[#017DB9] rounded-[6px]"
                  >
                    {isLoggingInvoice ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      'Log Invoice'
                    )}
                  </Button>
                </div>
              </form>
            </div>
          </DialogContent>
        </Dialog>

        <WriteOffLogicDialog
          open={writeOffLogicDialogOpen}
          onOpenChange={setWriteOffLogicDialogOpen}
          clientName={invoiceData.clientName}
          jobName={invoiceData.jobName || ''}
          timeLogs={formattedLogs}
          totalAmount={formattedLogs.reduce((sum, log) => sum + log.amount, 0)}
          writeOffBalance={remainingBalance}
          invoiceNo={logInvoiceData.invoiceNumber}
          invoiceDate={logInvoiceData.invoiceDate}
          onSave={(data) => {
            setWriteOffData(data);
            setWriteOffLogicDialogOpen(false);
            toast.success('Write-off data saved. You can now log the invoice.');
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
      jobId: (invoiceData as any).jobId,
      scope: (invoiceData as any).scope,
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
      const resp: any = await generateInvoice(payload).unwrap();
      toast.success('Invoice generated successfully');
      onInvoiceCreate?.(resp?.data || payload);
      onClose();
    } catch (e: any) {
      console.error('Failed to create invoice', e);
      toast.error(e?.data?.message || 'Failed to generate invoice');
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
          <Button onClick={handleCreateInvoice} disabled={isGeneratingInvoice}>
            Generate Invoice
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};