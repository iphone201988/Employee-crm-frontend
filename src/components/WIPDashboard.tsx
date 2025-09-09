import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from '@/lib/currency';
import { WIPClientSummary } from '@/types/wipReport';

interface WIPDashboardProps {
  clientSummary: WIPClientSummary;
  openingBalances: Record<string, number>;
  invoiceAmounts: Record<string, number>;
}

const WIPDashboard = ({ clientSummary, openingBalances, invoiceAmounts }: WIPDashboardProps) => {
  // Calculate dashboard metrics
  const totalWIP = Object.entries(clientSummary).reduce((sum, [clientName, data]: [string, any]) => {
    return sum + (openingBalances[clientName] || 0) + data.total;
  }, 0);

  const totalOpeningBalance = Object.values(openingBalances).reduce((sum, balance) => sum + balance, 0);

  const readyToInvoiceAmount = Object.entries(clientSummary).reduce((sum, [clientName, data]: [string, any]) => {
    const totalClientWIP = (openingBalances[clientName] || 0) + data.total;
    const invoiceTarget = invoiceAmounts[clientName];
    if (invoiceTarget && totalClientWIP >= invoiceTarget) {
      return sum + invoiceTarget;
    }
    return sum;
  }, 0);

  return (
    <div className="grid grid-cols-2 gap-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Total WIP</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(totalWIP)}</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Ready to Invoice</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(readyToInvoiceAmount)}</div>
        </CardContent>
      </Card>
    </div>
  );
};

export default WIPDashboard;