
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, UserCheck } from 'lucide-react';
import { TimeEntry } from '@/types/timeEntry';
import TimeLogsFilters from './TimeLogsFilters';
import GroupedTimeLogsTable from './GroupedTimeLogsTable';
import AddTimeEntryDialog from './AddTimeEntryDialog';
import AssignDialog from './AssignDialog';

interface TimeEntriesTableSectionProps {
  timeEntries: TimeEntry[];
  onStatusToggle: (entryId: string, newStatus: 'unbilled' | 'billed', assignedTo?: string) => void;
  onAddEntry: (newEntry: Omit<TimeEntry, 'id' | 'amount'>) => void;
  onAssign: (selectedEntries: string[], assignTo: string) => void;
  onMoveToInvoiced: (entryId: string) => void;
}

const TimeEntriesTableSection = ({
  timeEntries,
  onStatusToggle,
  onAddEntry,
  onAssign,
  onMoveToInvoiced
}: TimeEntriesTableSectionProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showAssignDialog, setShowAssignDialog] = useState(false);
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

  const handleAssign = (assignTo: string) => {
    onAssign(selectedEntries, assignTo);
    setSelectedEntries([]);
  };

  const filteredEntries = timeEntries.filter(entry => {
    const matchesSearch = entry.client.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         entry.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || entry.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const selectedEntriesData = timeEntries.filter(entry => selectedEntries.includes(entry.id));

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="pb-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <CardTitle className="text-lg font-semibold text-foreground">Time Entries</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Manage and track your billable hours
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <Button 
              onClick={() => setShowAssignDialog(true)}
              disabled={selectedEntries.length === 0}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <UserCheck className="h-4 w-4" />
              Assign ({selectedEntries.length})
            </Button>
            <Button 
              onClick={() => setShowAddDialog(true)}
              size="sm"
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Add Entry
            </Button>
          </div>
        </div>
        <TimeLogsFilters
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
        />
      </CardHeader>
      <CardContent className="px-0">
        <div className="border rounded-lg overflow-hidden">
          <GroupedTimeLogsTable
            entries={filteredEntries}
            onStatusToggle={onStatusToggle}
            selectedEntries={selectedEntries}
            onEntrySelect={handleEntrySelect}
            onSelectAll={handleSelectAll}
            onMoveToInvoiced={onMoveToInvoiced}
          />
        </div>
      </CardContent>

      <AddTimeEntryDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        onAddEntry={onAddEntry}
      />

      <AssignDialog
        open={showAssignDialog}
        onOpenChange={setShowAssignDialog}
        selectedEntries={selectedEntriesData}
        onAssign={handleAssign}
      />
    </Card>
  );
};

export default TimeEntriesTableSection;
