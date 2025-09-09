import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { formatCurrency } from '@/lib/currency';
import { formatDate } from '@/utils/dateFormat';
import { ExpensesSection, ExpenseItem } from './ExpensesSection';

interface InvoicePreviewSectionProps {
  invoiceData: {
    invoiceNumber: string;
    clientName: string;
    clientCode: string;
    clientAddress: string;
    amount: number;
    date: string;
    jobName?: string;
  };
  invoiceNumber: string;
  onInvoiceNumberChange: (value: string) => void;
  itemizeTimeLogs: boolean;
  includeTimeAmount: boolean;
  includeValueAmount: boolean;
  includeBillableRate: boolean;
  includeExpenses: boolean;
  expenses: ExpenseItem[];
  onAddExpense: () => void;
  onRemoveExpense: (id: string) => void;
  onUpdateExpense: (id: string, field: keyof ExpenseItem, value: string | number | boolean) => void;
  totalExpenses: number;
  totalAmount: number;
  onAddLoggedExpenses?: () => void;
}

export const InvoicePreviewSection = ({
  invoiceData,
  invoiceNumber,
  onInvoiceNumberChange,
  itemizeTimeLogs,
  includeTimeAmount,
  includeValueAmount,
  includeBillableRate,
  includeExpenses,
  expenses,
  onAddExpense,
  onRemoveExpense,
  onUpdateExpense,
  totalExpenses,
  totalAmount,
  onAddLoggedExpenses,
}: InvoicePreviewSectionProps) => {
  return (
    <Card className="border-2 border-gray-800">
      <CardContent className="pt-6">
        <div className="space-y-6">
          {/* Practice Header */}
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-xl font-bold">ABC Accounting</h3>
              <p className="text-muted-foreground">
                Main Street<br />
                Dublin, Co. Dublin<br />
                D56GH66<br />
                Phone: (01) 1234567
              </p>
            </div>
            <div className="text-right">
              <h4 className="text-lg font-semibold">INVOICE</h4>
              <div className="flex items-center space-x-2">
                <span className="text-muted-foreground">#</span>
                <Input
                  value={invoiceNumber}
                  onChange={(e) => onInvoiceNumberChange(e.target.value)}
                  className="w-32 text-right"
                />
              </div>
              <p className="text-muted-foreground">Date: {formatDate(invoiceData.date)}</p>
            </div>
          </div>

          <Separator />

          {/* Client Details */}
          <div>
            <h4 className="font-semibold mb-2">Invoice To:</h4>
            <p className="text-muted-foreground">
              {invoiceData.clientName} ({invoiceData.clientCode})<br />
              {invoiceData.clientAddress}
            </p>
          </div>

          <Separator />

          {/* Invoice Items */}
          <div>
            <h4 className="font-semibold mb-4">Description</h4>
            <div className="space-y-2">
              {itemizeTimeLogs ? (
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Professional services rendered:</p>
                  <div className="space-y-1">
                    <div className="flex justify-between items-center text-sm">
                      <span>• Time logged for {invoiceData.jobName || 'various matters'}</span>
                      <div className="flex gap-4">
                        {includeTimeAmount && <span>2.5 hours</span>}
                        {includeBillableRate && <span>€150/hour</span>}
                        {includeValueAmount && <span>{formatCurrency(invoiceData.amount * 0.4)}</span>}
                      </div>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span>• Legal consultation and advice</span>
                      <div className="flex gap-4">
                        {includeTimeAmount && <span>1.5 hours</span>}
                        {includeBillableRate && <span>€200/hour</span>}
                        {includeValueAmount && <span>{formatCurrency(invoiceData.amount * 0.3)}</span>}
                      </div>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span>• Document preparation and review</span>
                      <div className="flex gap-4">
                        {includeTimeAmount && <span>1.0 hours</span>}
                        {includeBillableRate && <span>€175/hour</span>}
                        {includeValueAmount && <span>{formatCurrency(invoiceData.amount * 0.3)}</span>}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <p>Professional services rendered for {invoiceData.jobName || 'various matters'}</p>
              )}
              
              <div className="flex justify-between items-center pt-2">
                <span>Professional Services</span>
                <span className="font-semibold">{formatCurrency(invoiceData.amount)}</span>
              </div>
            </div>
          </div>

          {/* Expenses Section */}
          {includeExpenses && (
            <ExpensesSection
              expenses={expenses}
              onAddExpense={onAddExpense}
              onRemoveExpense={onRemoveExpense}
              onUpdateExpense={onUpdateExpense}
              totalExpenses={totalExpenses}
              onAddLoggedExpenses={onAddLoggedExpenses}
            />
          )}

          <Separator />

          {/* VAT and Total */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span>VAT at 23%</span>
              <span>{formatCurrency((totalAmount - totalAmount / 1.23) || 0)}</span>
            </div>
            <div className="flex justify-between items-center text-lg font-bold">
              <span>Total Amount</span>
              <span>{formatCurrency(totalAmount)}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};