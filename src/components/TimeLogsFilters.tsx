
import React from 'react';
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Filter } from 'lucide-react';

interface TimeLogsFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  statusFilter: string;
  onStatusFilterChange: (value: string) => void;
}

const TimeLogsFilters = ({ searchTerm, onSearchChange, statusFilter, onStatusFilterChange }: TimeLogsFiltersProps) => {
  return (
    <div className="flex flex-col sm:flex-row gap-4">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search clients, descriptions, or job names..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10 h-10"
        />
      </div>
      <Select value={statusFilter} onValueChange={onStatusFilterChange}>
        <SelectTrigger className="w-full sm:w-48 h-10">
          <Filter className="h-4 w-4 mr-2 text-muted-foreground" />
          <SelectValue placeholder="Filter by status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Status</SelectItem>
          <SelectItem value="unbilled">Not Invoiced</SelectItem>
          <SelectItem value="billed">Invoiced</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
};

export default TimeLogsFilters;
