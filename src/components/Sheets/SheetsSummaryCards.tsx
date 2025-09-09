import React from 'react';
import { DashboardCard, DashboardGrid } from "@/components/ui/dashboard-card";
import { SummaryData } from "@/types/sheets";

interface SheetsSummaryCardsProps {
  summary: SummaryData;
}

export const SheetsSummaryCards = ({ summary }: SheetsSummaryCardsProps) => {
  return (
    <DashboardGrid columns={4}>
      <DashboardCard
        title="Total Team"
        value={summary.total}
      />
      
      <DashboardCard
        title="For Review"
        value={summary.submitted}
      />
      
      <DashboardCard
        title="Rejected"
        value={summary.rejected}
      />
      
      <DashboardCard
        title="Approved"
        value={summary.approved}
      />
    </DashboardGrid>
  );
};