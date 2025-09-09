import React from 'react';
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

interface InvoiceOptionsSectionProps {
  itemizeTimeLogs: boolean;
  onItemizeTimeLogsChange: (value: boolean) => void;
  includeExpenses: boolean;
  onIncludeExpensesChange: (value: boolean) => void;
}

export const InvoiceOptionsSection = ({
  itemizeTimeLogs,
  onItemizeTimeLogsChange,
  includeExpenses,
  onIncludeExpensesChange,
}: InvoiceOptionsSectionProps) => {
  return (
    <div className="flex items-center gap-6 p-4 bg-gray-50 rounded-lg">
      <div className="flex items-center space-x-2">
        <Switch 
          id="itemize-time-logs"
          checked={itemizeTimeLogs}
          onCheckedChange={onItemizeTimeLogsChange}
        />
        <Label htmlFor="itemize-time-logs">Itemise time logs</Label>
      </div>
      
      <div className="flex items-center space-x-2">
        <Switch 
          id="include-expenses"
          checked={includeExpenses}
          onCheckedChange={onIncludeExpensesChange}
        />
        <Label htmlFor="include-expenses">Include expenses</Label>
      </div>
    </div>
  );
};