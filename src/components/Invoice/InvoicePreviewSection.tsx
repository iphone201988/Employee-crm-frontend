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
  company?: { name?: string; email?: string };
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
  vatRate?: number;
  onVatRateChange?: (value: number) => void;
  vatAmount?: number;
}

export const InvoicePreviewSection = ({
  invoiceData,
  company,
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
  vatRate,
  onVatRateChange,
  vatAmount,
}: InvoicePreviewSectionProps) => {
  return (
    <Card className="border-2 border-gray-800">
      <CardContent className="pt-6">
        <div className="space-y-6">
          {/* Practice Header */}
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-xl font-bold">{company?.name || invoiceData?.company?.name || 'ABC Accounting'}</h3>
              {(company?.email || invoiceData?.company?.email) && (
                <p className="text-muted-foreground">{company?.email || invoiceData?.company?.email}</p>
              )}
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
              {invoiceData.clientName}
              {invoiceData.clientCode ? ` (${invoiceData.clientCode})` : ''}
              {invoiceData.clientAddress ? (<><br />{invoiceData.clientAddress}</>) : null}
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
                    {(invoiceData.members || []).map((m) => {
                      const hours = (m.seconds || 0) / 3600;
                      return (
                        <div key={m.userName} className="flex justify-between items-center text-sm">
                          <span>• {m.userName}</span>
                          <div className="flex gap-4">
                            {includeTimeAmount && <span>{hours.toFixed(2)} hours</span>}
                            {includeBillableRate && m.billableRate ? <span>{formatCurrency(m.billableRate)}/hour</span> : null}
                            {includeValueAmount && m.billableRate ? <span>{formatCurrency((m.billableRate || 0) * hours)}</span> : null}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <p>Professional services rendered for {invoiceData.jobName || 'various matters'}</p>
              )}
              
              <div className="flex justify-between items-center pt-2">
                <span>Professional Services</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">Included WIP opening balance</span>
                  <span className="font-semibold">{formatCurrency(invoiceData.amount)}</span>
                </div>
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
              <div className="flex items-center gap-2">
                <span>VAT at</span>
                <input
                  type="number"
                  className="w-16 border rounded px-2 py-1 text-right"
                  value={typeof vatRate === 'number' ? vatRate : 0}
                  onChange={(e) => onVatRateChange && onVatRateChange(parseFloat(e.target.value) || 0)}
                />
                <span>%</span>
              </div>
              <span>{formatCurrency(vatAmount || 0)}</span>
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