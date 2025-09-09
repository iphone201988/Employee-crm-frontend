import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { ChevronUp, ChevronDown } from "lucide-react";
import { TimeEntry } from '@/types/timeEntry';
import ClientNameLink from './ClientNameLink';

interface TimeLogsTableProps {
  entries: TimeEntry[];
  onStatusToggle: (entryId: string, newStatus: 'unbilled' | 'billed', assignedTo?: string) => void;
  selectedEntries: string[];
  onEntrySelect: (entryId: string, selected: boolean) => void;
  onSelectAll: (selected: boolean) => void;
  onMoveToInvoiced?: (entryId: string) => void;
}

const TimeLogsTable = ({ entries, onStatusToggle, selectedEntries, onEntrySelect, onSelectAll, onMoveToInvoiced }: TimeLogsTableProps) => {
  const [sortField, setSortField] = useState<string>('date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getSortIcon = (field: string) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />;
  };

  const sortedEntries = [...entries].sort((a, b) => {
    let valueA: any, valueB: any;
    
    switch (sortField) {
      case 'date':
        valueA = new Date(a.date);
        valueB = new Date(b.date);
        break;
      case 'client':
        valueA = a.client.toLowerCase();
        valueB = b.client.toLowerCase();
        break;
      case 'hours':
        valueA = a.hours;
        valueB = b.hours;
        break;
      case 'amount':
        valueA = a.amount;
        valueB = b.amount;
        break;
      default:
        return 0;
    }

    if (valueA < valueB) return sortDirection === 'asc' ? -1 : 1;
    if (valueA > valueB) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  const formatDuration = (hours: number): string => {
    const totalMinutes = Math.round(hours * 60);
    const hrs = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;
    const secs = 0;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStatusChange = (entryId: string, checked: boolean) => {
    if (checked) {
      const assignedTo = prompt('Assign to (client/job name):') || entries.find(e => e.id === entryId)?.client || '';
      onStatusToggle(entryId, 'billed', assignedTo);
      if (onMoveToInvoiced) {
        onMoveToInvoiced(entryId);
      }
    } else {
      onStatusToggle(entryId, 'unbilled');
    }
  };

  const getStatusColor = (status: 'billable' | 'non-billable' | 'unknown') => {
    switch (status) {
      case 'billable':
        return 'text-green-600 bg-green-50';
      case 'non-billable':
        return 'text-red-600 bg-red-50';
      case 'unknown':
        return 'text-yellow-600 bg-yellow-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const allSelected = entries.length > 0 && selectedEntries.length === entries.length;

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-border bg-muted/50">
            <th className="text-left p-3 text-foreground w-10 h-10">
              <Checkbox 
                checked={allSelected}
                onCheckedChange={(checked) => onSelectAll(!!checked)}
              />
            </th>
            <th 
              className="text-left p-3 text-foreground h-10 cursor-pointer hover:bg-muted/70 transition-colors"
              onClick={() => handleSort('date')}
            >
              <div className="flex items-center gap-1">
                Date
                {getSortIcon('date')}
              </div>
            </th>
            <th className="text-left p-3 text-foreground h-10">Client No.</th>
            <th 
              className="text-left p-3 text-foreground h-10 cursor-pointer hover:bg-muted/70 transition-colors"
              onClick={() => handleSort('client')}
            >
              <div className="flex items-center gap-1">
                Client Name
                {getSortIcon('client')}
              </div>
            </th>
            <th className="text-left p-3 text-foreground h-10">Job No.</th>
            <th className="text-left p-3 text-foreground h-10">Job Name</th>
            <th className="text-left p-3 text-foreground h-10">Status</th>
            <th className="text-left p-3 text-foreground h-10">Purpose</th>
            <th className="text-left p-3 text-foreground h-10">Description</th>
            <th className="text-left p-3 text-foreground h-10">Logged</th>
            <th 
              className="text-right p-3 text-foreground h-10 cursor-pointer hover:bg-muted/70 transition-colors"
              onClick={() => handleSort('hours')}
            >
              <div className="flex items-center justify-end gap-1">
                Duration
                {getSortIcon('hours')}
              </div>
            </th>
            <th className="text-right p-3 text-foreground h-10">Rate</th>
            <th 
              className="text-right p-3 text-foreground h-10 cursor-pointer hover:bg-muted/70 transition-colors"
              onClick={() => handleSort('amount')}
            >
              <div className="flex items-center justify-end gap-1">
                Amount
                {getSortIcon('amount')}
              </div>
            </th>
            <th className="text-center p-3 text-foreground h-10">Invoiced</th>
            <th className="text-left p-3 text-foreground h-10">Assign</th>
          </tr>
        </thead>
        <tbody>
          {sortedEntries.map((entry) => (
            <tr key={entry.id} className="border-b border-border hover:bg-muted/30 transition-colors">
              <td className="p-4">
                <Checkbox 
                  checked={selectedEntries.includes(entry.id)}
                  onCheckedChange={(checked) => onEntrySelect(entry.id, !!checked)}
                />
              </td>
              <td className="p-4 text-foreground">{new Date(entry.date).toLocaleDateString()}</td>
              <td className="p-4 text-foreground">{entry.clientNo}</td>
              <td className="p-4 font-medium">
                <ClientNameLink clientName={entry.client} />
              </td>
              <td className="p-4 text-foreground">{entry.jobCode}</td>
              <td className="p-4">
                <a href="#" className="text-foreground hover:text-foreground underline">
                  {entry.jobName}
                </a>
              </td>
              <td className="p-4">
                <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${getStatusColor(entry.billableStatus || 'unknown')}`}>
                  {entry.billableStatus || 'unknown'}
                </span>
              </td>
              <td className="p-4 text-foreground capitalize">{entry.purpose}</td>
              <td className="p-4 text-foreground">{entry.description}</td>
              <td className="p-4 text-foreground">{entry.staff}</td>
              <td className="p-4 text-right text-foreground">{formatDuration(entry.hours)}</td>
              <td className="p-4 text-right text-foreground">€{entry.rate}</td>
              <td className="p-4 text-right text-foreground text-sm">€{entry.amount.toFixed(2)}</td>
              <td className="p-4 text-center">
                <Switch
                  checked={entry.status === 'billed'}
                  onCheckedChange={(checked) => handleStatusChange(entry.id, checked)}
                />
              </td>
              <td className="p-4 text-foreground">{entry.assignedTo || '-'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default TimeLogsTable;