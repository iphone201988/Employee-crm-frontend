import React from 'react';
import { SortableTableHeader } from '@/components/ui/sortable-table-header';
import { TableHeader, TableHead, TableRow } from '@/components/ui/table';

interface TimeTableHeaderProps {
  visibleDays: string[];
}

export const TimeTableHeader: React.FC<TimeTableHeaderProps> = ({ visibleDays }) => {
  return (
    <TableHeader>
      <TableRow>
        <TableHead className="w-16">
          <SortableTableHeader>REF</SortableTableHeader>
        </TableHead>
        <TableHead>
          <SortableTableHeader>CLIENT NAME</SortableTableHeader>
        </TableHead>
        <TableHead>
          <SortableTableHeader>JOB NAME</SortableTableHeader>
        </TableHead>
        <TableHead>
          <SortableTableHeader>CATEGORY</SortableTableHeader>
        </TableHead>
        <TableHead>
          <SortableTableHeader>DESCRIPTION</SortableTableHeader>
        </TableHead>
        <TableHead className="text-center">
          <SortableTableHeader>BILLABLE</SortableTableHeader>
        </TableHead>
        <TableHead className="text-center">
          <SortableTableHeader>RATE</SortableTableHeader>
        </TableHead>
        {visibleDays.map(day => (
          <TableHead key={day} className="text-center w-20">
            <SortableTableHeader>{day}</SortableTableHeader>
          </TableHead>
        ))}
        <TableHead className="text-center">
          <SortableTableHeader sortable={false}>ACTIONS</SortableTableHeader>
        </TableHead>
      </TableRow>
    </TableHeader>
  );
};