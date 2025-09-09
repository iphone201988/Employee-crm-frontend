
import React from 'react';
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { TimeEntry } from '@/types/timeEntry';
import { formatDate } from '@/utils/dateFormat';
import ClientNameLink from './ClientNameLink';

interface GroupedTimeLogsTableProps {
  entries: TimeEntry[];
  onStatusToggle: (entryId: string, newStatus: 'unbilled' | 'billed', assignedTo?: string) => void;
  selectedEntries: string[];
  onEntrySelect: (entryId: string, selected: boolean) => void;
  onSelectAll: (selected: boolean) => void;
  onMoveToInvoiced?: (entryId: string) => void;
}

const GroupedTimeLogsTable = ({ entries, onStatusToggle, selectedEntries, onEntrySelect, onSelectAll, onMoveToInvoiced }: GroupedTimeLogsTableProps) => {
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

  // Group entries by client name
  const groupedEntries = entries.reduce((groups, entry) => {
    const clientName = entry.client;
    if (!groups[clientName]) {
      groups[clientName] = [];
    }
    groups[clientName].push(entry);
    return groups;
  }, {} as Record<string, TimeEntry[]>);

  // Calculate totals for each client group
  const getClientTotals = (clientEntries: TimeEntry[]) => {
    const billable = clientEntries.filter(e => e.billableStatus === 'billable');
    const nonBillable = clientEntries.filter(e => e.billableStatus === 'non-billable');
    const unknown = clientEntries.filter(e => e.billableStatus === 'unknown');

    const billableTime = billable.reduce((sum, e) => sum + e.hours, 0);
    const billableValue = billable.reduce((sum, e) => sum + e.amount, 0);
    const nonBillableTime = nonBillable.reduce((sum, e) => sum + e.hours, 0);
    const unknownTime = unknown.reduce((sum, e) => sum + e.hours, 0);

    return { billableTime, billableValue, nonBillableTime, unknownTime };
  };

  const allSelected = entries.length > 0 && selectedEntries.length === entries.length;

  return (
    <div className="w-full">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="text-left p-4 font-medium text-muted-foreground w-12">
                <Checkbox 
                  checked={allSelected}
                  onCheckedChange={(checked) => onSelectAll(!!checked)}
                />
              </th>
              <th className="text-left p-4 font-medium text-muted-foreground">Date</th>
              <th className="text-left p-4 font-medium text-muted-foreground">Client No.</th>
              <th className="text-left p-4 font-medium text-muted-foreground">Job Type</th>
              <th className="text-left p-4 font-medium text-muted-foreground">Job No.</th>
              <th className="text-left p-4 font-medium text-muted-foreground">Job Name</th>
              <th className="text-left p-4 font-medium text-muted-foreground">Status</th>
              <th className="text-left p-4 font-medium text-muted-foreground">Purpose</th>
              <th className="text-left p-4 font-medium text-muted-foreground">Description</th>
              <th className="text-left p-4 font-medium text-muted-foreground">Logged</th>
              <th className="text-right p-4 font-medium text-muted-foreground">Duration</th>
              <th className="text-right p-4 font-medium text-muted-foreground">Rate</th>
              <th className="text-right p-4 font-medium text-muted-foreground">Amount</th>
              <th className="text-center p-4 font-medium text-muted-foreground">Invoiced</th>
              <th className="text-left p-4 font-medium text-muted-foreground">Assign</th>
            </tr>
          </thead>
        <tbody>
          {Object.entries(groupedEntries).map(([clientName, clientEntries]) => {
            const totals = getClientTotals(clientEntries);
            return (
            <React.Fragment key={clientName}>
              {/* Client Group Header */}
              <tr className="bg-muted border-b-2 border-border">
                <td colSpan={15} className="p-4">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                    <span className="font-semibold text-foreground text-base">
                      <ClientNameLink clientName={clientName} />
                      <span className="text-sm text-muted-foreground ml-2">
                        ({clientEntries.length} {clientEntries.length === 1 ? 'entry' : 'entries'})
                      </span>
                    </span>
                    <div className="flex flex-wrap gap-4 text-sm">
                      <span className="px-2 py-1 bg-green-100 text-green-700 rounded-md">
                        Billable: {formatDuration(totals.billableTime)} (€{totals.billableValue.toFixed(2)})
                      </span>
                      <span className="px-2 py-1 bg-red-100 text-red-700 rounded-md">
                        Non-billable: {formatDuration(totals.nonBillableTime)}
                      </span>
                      {totals.unknownTime > 0 && (
                        <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded-md">
                          Unknown: {formatDuration(totals.unknownTime)}
                        </span>
                      )}
                    </div>
                  </div>
                </td>
              </tr>
              {/* Client Entries */}
              {clientEntries.map((entry) => (
                <tr key={entry.id} className="border-b hover:bg-muted/30 transition-colors">
                  <td className="p-4">
                    <Checkbox 
                      checked={selectedEntries.includes(entry.id)}
                      onCheckedChange={(checked) => onEntrySelect(entry.id, !!checked)}
                    />
                  </td>
                  <td className="p-4 text-sm text-foreground">{formatDate(entry.date)}</td>
                  <td className="p-4 text-sm text-foreground">{entry.clientNo}</td>
                  <td className="p-4 text-sm text-foreground">{entry.jobType || '-'}</td>
                  <td className="p-4 text-sm text-foreground">{entry.jobCode}</td>
                  <td className="p-4 text-sm">
                    <a href="#" className="text-primary hover:text-primary/80 underline font-medium">
                      {entry.jobName}
                    </a>
                  </td>
                  <td className="p-4 text-sm">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${getStatusColor(entry.billableStatus || 'unknown')}`}>
                      {entry.billableStatus || 'unknown'}
                    </span>
                  </td>
                  <td className="p-4 text-sm text-foreground capitalize">{entry.purpose}</td>
                  <td className="p-4 text-sm text-foreground max-w-xs truncate" title={entry.description}>
                    {entry.description}
                  </td>
                  <td className="p-4 text-sm text-foreground">{entry.staff}</td>
                  <td className="p-4 text-sm text-right font-mono text-foreground">{formatDuration(entry.hours)}</td>
                  <td className="p-4 text-sm text-right text-foreground">€{entry.rate}</td>
                  <td className="p-4 text-sm text-right font-semibold text-foreground">€{entry.amount.toFixed(2)}</td>
                  <td className="p-4 text-center">
                    <Switch
                      checked={entry.status === 'billed'}
                      onCheckedChange={(checked) => handleStatusChange(entry.id, checked)}
                    />
                  </td>
                  <td className="p-4 text-sm text-foreground">{entry.assignedTo || '-'}</td>
                </tr>
              ))}
            </React.Fragment>
            )
          })}
        </tbody>
        </table>
      </div>
      {Object.keys(groupedEntries).length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <p className="text-lg font-medium">No time entries found</p>
          <p className="text-sm mt-1">Try adjusting your filters or add a new entry</p>
        </div>
      )}
    </div>
  );
};

export default GroupedTimeLogsTable;
