
import React from 'react';
import { TimeEntry } from '@/types/timeEntry';
import TimeLogsSummaryCards from './TimeLogsSummaryCards';
import TimeEntriesTableSection from './TimeEntriesTableSection';
import { useTimeEntries } from '@/hooks/useTimeEntries';

interface TimeLogsTabProps {
  onMoveToInvoiced?: (entry: TimeEntry) => void;
}

const TimeLogsTab = ({ onMoveToInvoiced }: TimeLogsTabProps) => {
  const {
    timeEntries,
    handleStatusToggle,
    handleAddEntry,
    handleAssign,
    handleMoveToInvoiced,
    getTotals
  } = useTimeEntries(onMoveToInvoiced);

  const { totalUnbilled, totalBilled, totalEntries } = getTotals();

  return (
    <div className="space-y-6">
      <TimeLogsSummaryCards 
        totalUnbilled={totalUnbilled}
        totalBilled={totalBilled}
        totalEntries={totalEntries}
      />

      <TimeEntriesTableSection
        timeEntries={timeEntries}
        onStatusToggle={handleStatusToggle}
        onAddEntry={handleAddEntry}
        onAssign={handleAssign}
        onMoveToInvoiced={handleMoveToInvoiced}
      />
    </div>
  );
};

export default TimeLogsTab;
