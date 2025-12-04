import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from '@/lib/currency';
import { Paperclip, X, Edit } from 'lucide-react';

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
};

interface Expense {
  id: string;
  description: string;
  submittedBy: string;
  submitterAvatar?: string;
  amount: number;
  hasAttachment: boolean;
  dateLogged: string;
  vatPercentage: number;
  totalAmount: number;
  category?: string;
  status?: 'invoiced' | 'not invoiced' | 'paid' | 'not paid';
  client?: string;
  attachments?: string[];
  vatAmount?: number;
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
          <Table className="w-full">
            <TableHeader>
              <TableRow className='!bg-[#edecf4] text-[#381980]'>
                <TableHead className="w-24 text-left">Date</TableHead>
                <TableHead className="w-40 text-left">Submitted By</TableHead>
                <TableHead className="w-40 text-left">Client</TableHead>
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
              {expenses.map((expense) => {
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

                const vatAmount = expense.vatAmount || (expense.amount * (expense.vatPercentage / 100));
                const netAmount = expense.amount;
                const grossAmount = expense.totalAmount || (netAmount + vatAmount);

                return (
                <TableRow key={expense.id}>
                  <TableCell className="font-medium text-left px-4">{formatDate(expense.dateLogged)}</TableCell>
                  <TableCell className="text-left px-4">
                    <div className="flex items-center gap-2">
                      <Avatar className="h-8 w-8 flex-shrink-0">
                        <AvatarImage 
                          src={expense.submitterAvatar ? `${import.meta.env.VITE_BACKEND_BASE_URL}${expense.submitterAvatar}` : undefined} 
                          alt={expense.submittedBy} 
                        />
                        <AvatarFallback>{expense.submittedBy.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                      </Avatar>
                      <span className="truncate">{expense.submittedBy}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-left px-4">
                    <span className="block truncate" title={expense.client || clientName}>
                      {expense.client || clientName}
                    </span>
                  </TableCell>
                  <TableCell className="text-left px-4">
                    <span className="block truncate" title={expense.description}>
                      {expense.description}
                    </span>
                  </TableCell>
                  <TableCell className="text-left px-4">
                    <span className="truncate block">{expense.category || 'General'}</span>
                  </TableCell>
                  <TableCell className="text-left px-4 font-medium">€{netAmount.toFixed(2)}</TableCell>
                  <TableCell className="text-left px-4">{expense.vatPercentage}%</TableCell>
                  <TableCell className="text-left px-4 font-medium">€{vatAmount.toFixed(2)}</TableCell>
                  <TableCell className="text-left px-4 font-medium">€{grossAmount.toFixed(2)}</TableCell>
                  <TableCell className="text-left">
                    {getStatusBadge(expense.status || 'not invoiced')}
                  </TableCell>
                  <TableCell className="text-center px-4">
                    {expense.attachments && expense.attachments.length > 0 ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-blue-600 hover:text-blue-800"
                        onClick={() => {
                          setSelectedReceipt(expense.attachments![0]);
                          setReceiptDialogOpen(true);
                        }}
                        title="View Receipt"
                      >
                        <Paperclip className="h-4 w-4" />
                      </Button>
                    ) : (
                      <div>N/A</div>
                    )}
                  </TableCell>
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