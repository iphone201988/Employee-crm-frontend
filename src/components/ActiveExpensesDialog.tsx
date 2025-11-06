import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatCurrency } from '@/lib/currency';
import { formatDate } from '@/utils/dateFormat';
import { Paperclip, X, Edit } from 'lucide-react';

interface Expense {
  id: string;
  description: string;
  submittedBy: string;
  amount: number;
  hasAttachment: boolean;
  dateLogged: string;
  vatPercentage: number;
  totalAmount: number;
  category?: string;
  status?: 'invoiced' | 'not invoiced' | 'paid' | 'not paid';
  client?: string;
  attachments?: string[];
}

interface ActiveExpensesDialogProps {
  isOpen: boolean;
  onClose: () => void;
  clientName: string;
  expenses: Expense[];
}

const ActiveExpensesDialog = ({ isOpen, onClose, clientName, expenses: initialExpenses }: ActiveExpensesDialogProps) => {
  const [expenses, setExpenses] = useState<Expense[]>(initialExpenses);
  const [editingExpense, setEditingExpense] = useState<string | null>(null);
  const [receiptDialogOpen, setReceiptDialogOpen] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState<string | null>(null);

  // Update expenses when initialExpenses changes
  React.useEffect(() => {
    setExpenses(initialExpenses);
  }, [initialExpenses]);

  const addExpense = () => {
    const newExpense: Expense = {
      id: Date.now().toString(),
      description: '',
      submittedBy: 'Current User',
      amount: 0,
      hasAttachment: false,
      dateLogged: new Date().toISOString(),
      vatPercentage: 0,
      totalAmount: 0,
      category: 'General',
      status: 'not invoiced',
      client: clientName
    };
    setExpenses([...expenses, newExpense]);
    setEditingExpense(newExpense.id);
  };

  const updateExpense = (id: string, field: keyof Expense, value: any) => {
    setExpenses(expenses.map(expense => {
      if (expense.id === id) {
        const updatedExpense = { ...expense, [field]: value };
        // Recalculate total when amount or VAT changes
        if (field === 'amount' || field === 'vatPercentage') {
          const amount = field === 'amount' ? value : updatedExpense.amount;
          const vatPercentage = field === 'vatPercentage' ? value : updatedExpense.vatPercentage;
          updatedExpense.totalAmount = amount + (amount * vatPercentage / 100);
        }
        return updatedExpense;
      }
      return expense;
    }));
  };

  const removeExpense = (id: string) => {
    setExpenses(expenses.filter(expense => expense.id !== id));
  };

  const totalExpenses = expenses.reduce((sum, expense) => sum + expense.totalAmount, 0);

  return (
    <>
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[1200px] w-[96vw] sm:w-[90vw] max-h-[85vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>Expenses - {clientName}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 max-h-[75vh] overflow-y-auto">
          <div className="overflow-auto">
          <Table className="table-fixed w-full min-w-[1100px]">
            <TableHeader>
              <TableRow>
                <TableHead className="w-28 text-left whitespace-nowrap">Date</TableHead>
                <TableHead className="w-40 text-left whitespace-nowrap">Submitted By</TableHead>
                <TableHead className="w-40 text-left whitespace-nowrap">Client</TableHead>
                <TableHead className="w-[360px] text-left whitespace-nowrap">Description</TableHead>
                <TableHead className="w-32 text-left whitespace-nowrap">Category</TableHead>
                <TableHead className="w-24 text-left whitespace-nowrap">Net</TableHead>
                <TableHead className="w-20 text-left whitespace-nowrap">VAT%</TableHead>
                <TableHead className="w-24 text-left whitespace-nowrap">VAT</TableHead>
                <TableHead className="w-24 text-left whitespace-nowrap">Gross</TableHead>
                <TableHead className="w-32 text-left whitespace-nowrap">Status</TableHead>
                <TableHead className="w-24 text-center whitespace-nowrap">Receipt</TableHead>
                {/* <TableHead className="w-24 text-center whitespace-nowrap">Actions</TableHead> */}
              </TableRow>
            </TableHeader>
            <TableBody>
              {expenses.map((expense) => {
                const vatAmount = expense.amount * (expense.vatPercentage / 100);
                const getStatusBadge = (status: string) => {
                  switch (status) {
                    case 'invoiced':
                      return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">Invoiced</span>;
                    case 'not invoiced':
                      return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">Not Invoiced</span>;
                    case 'paid':
                      return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">Paid</span>;
                    case 'not paid':
                      return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">Not Paid</span>;
                    default:
                      return null;
                  }
                };

                return (
                <TableRow key={expense.id} className="h-12">
                  <TableCell className="text-left whitespace-nowrap">
                    {editingExpense === expense.id ? (
                      <Input
                        type="date"
                        value={expense.dateLogged.split('T')[0]}
                        onChange={(e) => updateExpense(expense.id, 'dateLogged', e.target.value + 'T00:00:00.000Z')}
                        onBlur={() => setEditingExpense(null)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') setEditingExpense(null);
                        }}
                        className="w-32"
                      />
                    ) : (
                      <span>{formatDate(expense.dateLogged)}</span>
                    )}
                  </TableCell>
                  <TableCell className="text-left whitespace-nowrap">
                    {editingExpense === expense.id ? (
                      <Input
                        value={expense.submittedBy}
                        onChange={(e) => updateExpense(expense.id, 'submittedBy', e.target.value)}
                        onBlur={() => setEditingExpense(null)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') setEditingExpense(null);
                        }}
                        className="w-40"
                      />
                    ) : (
                      <span className="block max-w-[160px] truncate" title={expense.submittedBy}>
                        {expense.submittedBy}
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-left whitespace-nowrap">
                    <span className="block max-w-[160px] truncate" title={expense.client || clientName}>
                      {expense.client || clientName}
                    </span>
                  </TableCell>
                  <TableCell className="text-left">
                    {editingExpense === expense.id ? (
                      <Input
                        value={expense.description}
                        onChange={(e) => updateExpense(expense.id, 'description', e.target.value)}
                        onBlur={() => setEditingExpense(null)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') setEditingExpense(null);
                        }}
                        placeholder="Enter description"
                        autoFocus
                      />
                    ) : (
                      <span className="block max-w-[340px] truncate" title={expense.description}>
                        {expense.description || 'Click to edit'}
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-left whitespace-nowrap">
                    {editingExpense === expense.id ? (
                      <Input
                        value={expense.category || 'General'}
                        onChange={(e) => updateExpense(expense.id, 'category', e.target.value)}
                        onBlur={() => setEditingExpense(null)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') setEditingExpense(null);
                        }}
                        className="w-32"
                      />
                    ) : (
                      <span>{expense.category || 'General'}</span>
                    )}
                  </TableCell>
                  <TableCell className="text-left whitespace-nowrap">
                    {editingExpense === expense.id ? (
                      <Input
                        type="number"
                        step="0.01"
                        value={expense.amount}
                        onChange={(e) => updateExpense(expense.id, 'amount', parseFloat(e.target.value) || 0)}
                        onBlur={() => setEditingExpense(null)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') setEditingExpense(null);
                        }}
                        className="w-24 text-left"
                      />
                    ) : (
                      <span>{formatCurrency(expense.amount)}</span>
                    )}
                  </TableCell>
                  <TableCell className="text-left whitespace-nowrap">
                    {editingExpense === expense.id ? (
                      <Input
                        type="number"
                        step="0.1"
                        min="0"
                        max="100"
                        value={expense.vatPercentage}
                        onChange={(e) => updateExpense(expense.id, 'vatPercentage', parseFloat(e.target.value) || 0)}
                        onBlur={() => setEditingExpense(null)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') setEditingExpense(null);
                        }}
                        className="w-16 text-left"
                      />
                    ) : (
                      <span>{expense.vatPercentage}%</span>
                    )}
                  </TableCell>
                  <TableCell className="text-left whitespace-nowrap">
                    <span>{formatCurrency(vatAmount)}</span>
                  </TableCell>
                  <TableCell className="text-left whitespace-nowrap">
                    <span className="font-semibold">{formatCurrency(expense.totalAmount)}</span>
                  </TableCell>
                  <TableCell className="text-left whitespace-nowrap">
                    {getStatusBadge(expense.status || 'not invoiced')}
                  </TableCell>
                  <TableCell className="text-center whitespace-nowrap">
                  {expense.attachments && expense.attachments.length > 0 ? (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-6 w-6 p-0 text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                        onClick={() => {
                          setSelectedReceipt(expense.attachments![0]);
                          setReceiptDialogOpen(true);
                        }}
                        title="View Receipt"
                      >
                        <Paperclip className="h-4 w-4" />
                      </Button>
                    ) : (
                      <span className="text-muted-foreground">N/A</span>
                    )}
                  </TableCell>
                  {/* <TableCell className="text-center whitespace-nowrap">
                    <div className="flex items-center justify-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditingExpense(expense.id)}
                        className="h-6 w-6 p-0 text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeExpense(expense.id)}
                        className="h-6 w-6 p-0 text-red-600 hover:text-red-800 hover:bg-red-50"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  </TableCell> */}
                </TableRow>
                );
              })}
            </TableBody>
          </Table>
          </div>
          <div className="flex items-center justify-between">
            {/* <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={addExpense}>
                + Expense
              </Button>
            </div> */}
            <p className="font-semibold">
              Total: {formatCurrency(totalExpenses)}
            </p>
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
          {selectedReceipt ? (
            <img
              src={`${import.meta.env.VITE_BACKEND_BASE_URL}${selectedReceipt}`}
              alt="Receipt"
              className="max-w-full h-auto border border-gray-200 rounded-lg shadow-lg"
            />
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
    </>
  );
};

export default ActiveExpensesDialog;