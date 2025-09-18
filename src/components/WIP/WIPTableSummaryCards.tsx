import React from 'react';
import { DashboardCard, DashboardGrid } from "@/components/ui/dashboard-card";
import { formatCurrency } from '@/lib/currency';
import { Card, CardContent } from '../ui/card';

interface WIPTableSummaryCardsProps {
  totalClients: number;
  totalJobs: number;
  totalWIP: number;
  readyToInvoice: number;
  readyToInvoiceAmount: number;
}

export const WIPTableSummaryCards = ({
  totalClients,
  totalJobs,
  totalWIP,
  readyToInvoice,
  readyToInvoiceAmount
}: WIPTableSummaryCardsProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <Card className="h-full">
        <CardContent className="p-4">
          <div className="text-2xl font-bold !text-[#381980]">
            {totalClients}
          </div>
          <p className="text-sm text-muted-foreground">Current WIP Clients</p>
        </CardContent>
      </Card>
      <Card className="h-full">
        <CardContent className="p-4">
          <div className="text-2xl font-bold !text-[#381980]">
            {totalJobs}
          </div>
          <p className="text-sm text-muted-foreground">Total WIP Jobs</p>
        </CardContent>
      </Card>
      <Card className="h-full">
        <CardContent className="p-4">
          <div className="text-2xl font-bold !text-[#381980]">
            {formatCurrency(totalWIP)}
          </div>
          <p className="text-sm text-muted-foreground">Current WIP</p>
        </CardContent>
      </Card>
      <Card className="h-full">
        <CardContent className="p-4">
          <div className="text-2xl font-bold !text-[#381980]">
            {`${readyToInvoice} (${formatCurrency(readyToInvoiceAmount)})`}
          </div>
          <p className="text-sm text-muted-foreground">WIP Ready to Invoice</p>
        </CardContent>
      </Card>
    </div>

  );
};