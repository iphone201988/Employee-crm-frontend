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
import WriteOffLogicDialog from './WriteOffLogicDialog';

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
  const [itemizeTimeLogs, setItemizeTimeLogs] = useState(false);
  const [includeTimeAmount, setIncludeTimeAmount] = useState(false);
  const [includeValueAmount, setIncludeValueAmount] = useState(false);
  const [includeBillableRate, setIncludeBillableRate] = useState(false);
  const [includeExpenses, setIncludeExpenses] = useState(false);
  const [expenses, setExpenses] = useState<ExpenseItem[]>([]);
  const [invoiceNumber, setInvoiceNumber] = useState(invoiceData.invoiceNumber);
  const [includeVAT, setIncludeVAT] = useState(false);
  const [logInvoiceDialogOpen, setLogInvoiceDialogOpen] = useState(false);
  const [wipBalanceDialogOpen, setWipBalanceDialogOpen] = useState(false);
  const [writeOffLogicDialogOpen, setWriteOffLogicDialogOpen] = useState(false);
  const [logInvoiceData, setLogInvoiceData] = useState({
    invoiceNumber: '',
    invoiceDate: '',
    invoiceAmount: '',
    invoiceAmountIncVAT: ''
  });

  // Sample time logs data for the write-off logic dialog
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

  const handleLogInvoiceSubmit = () => {
    console.log('Log Invoice Data:', logInvoiceData);
    setLogInvoiceDialogOpen(false);
    setLogInvoiceData({
      invoiceNumber: '',
      invoiceDate: '',
      invoiceAmount: '',
      invoiceAmountIncVAT: ''
    });
  };


  // Auto-open log invoice dialog if openLogInvoiceOnly is true
  useEffect(() => {
    if (openLogInvoiceOnly && isOpen) {
      setLogInvoiceDialogOpen(true);
    }
  }, [openLogInvoiceOnly, isOpen]);

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
              <div className="space-y-3 p-4 bg-gray-50 rounded-lg">
                <div className="flex justify-between text-sm">
                  <span className="font-medium">WIP Amount:</span>
                  <span className="font-bold">{formatCurrency(invoiceData.amount)}</span>
                </div>
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
                  onChange={(e) => setLogInvoiceData(prev => ({ ...prev, invoiceAmount: e.target.value }))}
                  placeholder="0.00"
                />
              </div>
              
              {logInvoiceData.invoiceAmount && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">Balance:</span>
                    <span className="font-bold text-blue-800">
                      {formatCurrency(invoiceData.amount - parseFloat(logInvoiceData.invoiceAmount || '0'))}
                    </span>
                  </div>
                  {invoiceData.amount - parseFloat(logInvoiceData.invoiceAmount || '0') > 0 && (
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
                  {invoiceData.amount - parseFloat(logInvoiceData.invoiceAmount || '0') < 0 && (
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
                  disabled={!logInvoiceData.invoiceNumber || !logInvoiceData.invoiceDate || !logInvoiceData.invoiceAmount}
                >
                  Log Invoice
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
          onOpenChange={setWriteOffLogicDialogOpen}
          clientName={invoiceData.clientName}
          jobName={invoiceData.jobName || ''}
          timeLogs={sampleTimeLogs}
          totalAmount={sampleTimeLogs.reduce((sum, log) => sum + log.amount, 0)}
          writeOffBalance={sampleTimeLogs.reduce((sum, log) => sum + log.amount, 0) - parseFloat(logInvoiceData.invoiceAmount || '0')}
          onSave={(data) => {
            console.log('Write off saved:', data);
            // Handle the save logic here
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
      includeVAT: false
    };
    setExpenses([...expenses, newExpense]);
  };

  const removeExpense = (id: string) => {
    setExpenses(expenses.filter(expense => expense.id !== id));
  };

  const updateExpense = (id: string, field: keyof ExpenseItem, value: string | number | boolean) => {
    setExpenses(expenses.map(expense => 
      expense.id === id ? { ...expense, [field]: value } : expense
    ));
  };

  const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);
  const subtotal = invoiceData.amount + totalExpenses;
  const vatAmount = includeVAT ? subtotal * 0.23 : 0;
  const totalAmount = subtotal + vatAmount;

  const handleCreateInvoice = () => {
    const finalInvoice = {
      ...invoiceData,
      invoiceNumber,
      itemizeTimeLogs,
      includeTimeAmount,
      includeValueAmount,
      includeBillableRate,
      includeExpenses,
      expenses: includeExpenses ? expenses : [],
      totalAmount,
      status: 'draft' as const
    };
    
    onInvoiceCreate?.(finalInvoice);
    onClose();
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
                <h2>ABC Accounting</h2>
                <p>Main Street<br/>Dublin, Co. Dublin<br/>D56GH66<br/>Phone: (01) 1234567</p>
              </div>
              <div>
                <div class="invoice-title">INVOICE</div>
                <p>#${invoiceNumber}</p>
                <p>Date: ${new Date(invoiceData.date).toLocaleDateString()}</p>
              </div>
            </div>
            <div class="client-info">
              <h3>Invoice To:</h3>
              <p>${invoiceData.clientName} (${invoiceData.clientCode})<br/>${invoiceData.clientAddress}</p>
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
          <Button onClick={handleCreateInvoice}>
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