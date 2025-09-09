
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TimeEntry } from '@/types/timeEntry';
import TimeLogsSummaryCards from './TimeLogsSummaryCards';
import TimeLogsFilters from './TimeLogsFilters';
import TimeLogsTable from './TimeLogsTable';

interface InvoicedTabProps {
  invoicedEntries: TimeEntry[];
  onStatusToggle: (entryId: string, newStatus: 'unbilled' | 'billed', assignedTo?: string) => void;
}

const InvoicedTab = ({ invoicedEntries, onStatusToggle }: InvoicedTabProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedEntries, setSelectedEntries] = useState<string[]>([]);

  const handleEntrySelect = (entryId: string, selected: boolean) => {
    setSelectedEntries(prev => 
      selected 
        ? [...prev, entryId]
        : prev.filter(id => id !== entryId)
    );
  };

  const handleSelectAll = (selected: boolean) => {
    setSelectedEntries(selected ? filteredEntries.map(entry => entry.id) : []);
  };

  const filteredEntries = invoicedEntries.filter(entry => {
    const matchesSearch = entry.client.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         entry.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || entry.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalUnbilled = invoicedEntries
    .filter(entry => entry.status === 'unbilled')
    .reduce((sum, entry) => sum + entry.amount, 0);

  const totalBilled = invoicedEntries
    .filter(entry => entry.status === 'billed')
    .reduce((sum, entry) => sum + entry.amount, 0);

  return (
    <div className="space-y-6">
      <TimeLogsSummaryCards 
        totalUnbilled={totalUnbilled}
        totalBilled={totalBilled}
        totalEntries={invoicedEntries.length}
      />

      <Card>
        <CardHeader>
          <CardTitle>Invoiced Entries</CardTitle>
          <TimeLogsFilters
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            statusFilter={statusFilter}
            onStatusFilterChange={setStatusFilter}
          />
        </CardHeader>
        <CardContent>
          <TimeLogsTable
            entries={filteredEntries}
            onStatusToggle={onStatusToggle}
            selectedEntries={selectedEntries}
            onEntrySelect={handleEntrySelect}
            onSelectAll={handleSelectAll}
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default InvoicedTab;
