import React from 'react';
import { Input } from "@/components/ui/input";
import { Search } from 'lucide-react';

interface SheetsFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
}

export const SheetsFilters = ({ 
  searchTerm, 
  onSearchChange 
}: SheetsFiltersProps) => {
  return (
    <div className="flex flex-col sm:flex-row gap-2 w-full lg:w-auto">
      <div className="relative flex-1 lg:w-80">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <Input
          placeholder="Search by name"
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10"
        />
      </div>
    </div>
  );
};