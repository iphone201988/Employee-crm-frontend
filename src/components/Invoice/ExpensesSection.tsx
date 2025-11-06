import React from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, X } from 'lucide-react';
import { formatCurrency } from '@/lib/currency';

export interface ExpenseItem {
  id: string;
  description: string;
  amount: number;
  vatPercent?: number;
  locked?: boolean;
}

interface ExpensesSectionProps {
  expenses: ExpenseItem[];
  onAddExpense: () => void;
  onRemoveExpense: (id: string) => void;
  onUpdateExpense: (id: string, field: keyof ExpenseItem, value: string | number | boolean) => void;
  totalExpenses: number;
  onAddLoggedExpenses?: () => void;
}

export const ExpensesSection = ({
  expenses,
  onAddExpense,
  onRemoveExpense,
  onUpdateExpense,
  totalExpenses,
  onAddLoggedExpenses,
}: ExpensesSectionProps) => {
  return (
    <div>
      <div className="flex justify-between items-center mb-2">
        <h4 className="font-semibold">Expenses</h4>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={onAddExpense}>
            <Plus className="h-4 w-4 mr-1" />
            Expense
          </Button>
          <Button variant="outline" size="sm" onClick={onAddLoggedExpenses}>
            <Plus className="h-4 w-4 mr-1" />
            Logged Expenses
          </Button>
        </div>
      </div>
      
      <div className="space-y-2">
        {expenses.map((expense) => (
          <div key={expense.id} className="flex items-center gap-2">
            <Input
              placeholder="Description"
              value={expense.description}
              onChange={(e) => onUpdateExpense(expense.id, 'description', e.target.value)}
              className="flex-1"
              disabled={!!expense.locked}
            />
            <Input
              type="number"
              placeholder="Amount"
              value={expense.amount}
              onChange={(e) => onUpdateExpense(expense.id, 'amount', parseFloat(e.target.value) || 0)}
              className="w-32"
              disabled={!!expense.locked}
            />
            <Input
              type="number"
              placeholder="VAT %"
              value={expense.vatPercent ?? 0}
              onChange={(e) => onUpdateExpense(expense.id, 'vatPercent', parseFloat(e.target.value) || 0)}
              className="w-24"
              disabled={!!expense.locked}
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => onRemoveExpense(expense.id)}
              disabled={!!expense.locked}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ))}
        
        {expenses.length > 0 && (
          <div className="flex justify-between items-center pt-2 border-t">
            <span>Total Expenses</span>
            <span className="font-semibold">{formatCurrency(totalExpenses)}</span>
          </div>
        )}
      </div>
    </div>
  );
};