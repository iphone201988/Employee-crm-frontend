
import React from 'react';
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { TIME_ENTRY_OPTIONS } from '@/constants/timeEntryOptions';

interface TimeEntryFinancialFieldsProps {
  formData: {
    hours: number;
    rate: number;
    billableStatus: 'billable' | 'non-billable' | 'unknown';
  };
  onFieldChange: (field: string, value: any) => void;
}

const TimeEntryFinancialFields = ({ formData, onFieldChange }: TimeEntryFinancialFieldsProps) => {
  return (
    <>
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="hours" className="text-right">Hours</Label>
        <Input
          id="hours"
          type="number"
          step="0.25"
          value={formData.hours}
          onChange={(e) => onFieldChange('hours', parseFloat(e.target.value) || 0)}
          className="col-span-3"
        />
      </div>

      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="rate" className="text-right">Rate (€)</Label>
        <Input
          id="rate"
          type="number"
          value={formData.rate}
          onChange={(e) => onFieldChange('rate', parseFloat(e.target.value) || 0)}
          className="col-span-3"
        />
      </div>

      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="billableStatus" className="text-right">Status</Label>
        <Select 
          value={formData.billableStatus} 
          onValueChange={(value) => onFieldChange('billableStatus', value as 'billable' | 'non-billable' | 'unknown')}
        >
          <SelectTrigger className="col-span-3">
            <SelectValue placeholder="Select status" />
          </SelectTrigger>
          <SelectContent>
            {TIME_ENTRY_OPTIONS.billableStatuses.map((status) => (
              <SelectItem key={status.value} value={status.value}>{status.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </>
  );
};

export default TimeEntryFinancialFields;
