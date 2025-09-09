import React from 'react';
import { DashboardCard, DashboardGrid } from "@/components/ui/dashboard-card";
import { CategoryBreakdownItem } from '@/types/timeTab';
import { formatMoney, formatHours } from '@/utils/timeTabUtils';
// import { categoryColors } from '@/constants/timeTabConstants';

interface DashboardCardsProps {
  showMonetary: boolean;
  visibleCapacity: number[];
  totalChargeable: number;
  totalChargeableMoney: number;
  chargeablePercentage: number;
  grandTotal: number;
  categoryBreakdown: CategoryBreakdownItem[];
  timeEntries: any[];
}

export const DashboardCards: React.FC<DashboardCardsProps> = ({
  showMonetary,
  visibleCapacity,
  totalChargeable,
  totalChargeableMoney,
  chargeablePercentage,
  grandTotal,
  categoryBreakdown,
  timeEntries
}) => {
  // Calculate actual non-billable hours from entries where billable is false
  const totalNonBillable = timeEntries.reduce((sum, entry) => {
    if (!entry.billable) {
      const entryTotal = entry.dailyHours.reduce((daySum, hours) => daySum + (parseFloat(hours) || 0), 0);
      return sum + entryTotal;
    }
    return sum;
  }, 0);

  // Calculate total capacity
  const totalCapacity = visibleCapacity.reduce((sum, cap) => sum + cap, 0);
  
  // Calculate variance (capacity - logged)
  const variance = totalCapacity - grandTotal;

  return (
    <DashboardGrid columns={4}>
      <DashboardCard
        title="Billable"
        value={
          <span className="flex items-baseline gap-1">
            {showMonetary ? formatMoney(totalChargeableMoney) : totalChargeable.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",")} 
            <span className="text-sm leading-none" style={{ fontSize: '0.75em' }}>({(chargeablePercentage * 0.75).toFixed(1)}%)</span>
          </span>
        }
      />
      
      <DashboardCard
        title="Non-Billable"
        value={
          <span className="flex items-baseline gap-1">
            {totalNonBillable.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",")} 
            <span className="text-sm leading-none" style={{ fontSize: '0.75em' }}>({(totalNonBillable / grandTotal * 100 * 0.75).toFixed(1)}%)</span>
          </span>
        }
      />
      
      <DashboardCard
        title="Total Logged"
        value={
          <span className="flex items-baseline gap-1">
            {grandTotal.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",")} 
            <span className="text-sm leading-none" style={{ fontSize: '0.75em' }}>({(grandTotal / totalCapacity * 100 * 0.75).toFixed(1)}%)</span>
          </span>
        }
      />
      
      <DashboardCard
        title="Variance"
        value={
          <span className="flex items-baseline gap-1">
            {Math.abs(variance).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",")} {variance < 0 ? 'under' : ''} 
            <span className="text-sm leading-none" style={{ fontSize: '0.75em' }}>({Math.abs(variance / totalCapacity * 100 * 0.75).toFixed(1)}%)</span>
          </span>
        }
      />
    </DashboardGrid>
  );
};