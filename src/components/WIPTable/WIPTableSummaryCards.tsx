import React from 'react';
import { DashboardCard, DashboardGrid } from "@/components/ui/dashboard-card";
import { formatCurrency } from '@/lib/currency';

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
    <DashboardGrid columns={4}>
      <DashboardCard
        title="Current WIP Clients"
        value={totalClients}
      />
      <DashboardCard
        title="Total WIP Jobs"
        value={totalJobs}
      />
      <DashboardCard
        title="Current WIP"
        value={formatCurrency(totalWIP)}
      />
      <DashboardCard
        title="WIP Ready to Invoice"
        value={`${readyToInvoice} (${formatCurrency(readyToInvoiceAmount)})`}
      />
    </DashboardGrid>
  );
};