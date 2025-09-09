import React from 'react';
import { TimeEntry, EditingCell } from '@/types/timeTab';
import { TimeTableHeader } from './TimeTableHeader';
import { TimeTableRow } from './TimeTableRow';
import { TimeTableFooter } from './TimeTableFooter';

interface TimeTableProps {
  timeEntries: TimeEntry[];
  editingCell: EditingCell | null;
  hideWeekend: boolean;
  showMonetary: boolean;
  visibleDays: string[];
  chargeableTotals: number[];
  nonChargeableTotals: number[];
  chargeableMonetaryTotals: number[];
  visibleCapacity: number[];
  onCellClick: (entryId: string, field: string, dayIndex?: number) => void;
  onCellBlur: () => void;
  onUpdateField: (entryId: string, field: string, value: string, dayIndex?: number) => void;
  onToggleBillable: (entryId: string) => void;
  onTogglePass: (entryId: string) => void;
  onRemoveRow: (entryId: string) => void;
}

export const TimeTable: React.FC<TimeTableProps> = ({
  timeEntries,
  editingCell,
  hideWeekend,
  showMonetary,
  visibleDays,
  chargeableTotals,
  nonChargeableTotals,
  chargeableMonetaryTotals,
  visibleCapacity,
  onCellClick,
  onCellBlur,
  onUpdateField,
  onToggleBillable,
  onTogglePass,
  onRemoveRow
}) => {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse border border-gray-300">
        <TimeTableHeader visibleDays={visibleDays} />
        <tbody>
          {timeEntries.map((entry) => (
            <TimeTableRow
              key={entry.id}
              entry={entry}
              editingCell={editingCell}
              hideWeekend={hideWeekend}
              showMonetary={showMonetary}
              onCellClick={onCellClick}
              onCellBlur={onCellBlur}
              onUpdateField={onUpdateField}
              onToggleBillable={onToggleBillable}
              onTogglePass={onTogglePass}
              onRemoveRow={onRemoveRow}
            />
          ))}
          <TimeTableFooter
            chargeableTotals={chargeableTotals}
            nonChargeableTotals={nonChargeableTotals}
            chargeableMonetaryTotals={chargeableMonetaryTotals}
            hideWeekend={hideWeekend}
            showMonetary={showMonetary}
            visibleCapacity={visibleCapacity}
          />
        </tbody>
      </table>
    </div>
  );
};