import React from 'react';
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { formatCurrency } from '@/lib/currency';
import { WIPData } from '@/types/wip';
import { getTriggerLabel, formatDate, getJobStatusColor } from '@/utils/wipUtils';

interface WIPEditableCellProps {
  job: WIPData;
  field: keyof WIPData;
  value: any;
  isEditing: boolean;
  onUpdate: (id: string, field: keyof WIPData, value: any) => void;
}

export const WIPEditableCell: React.FC<WIPEditableCellProps> = ({
  job,
  field,
  value,
  isEditing,
  onUpdate
}) => {
  if (!isEditing) {
    if (field === 'billingTrigger') return <span>{getTriggerLabel(value)}</span>;
    if (field === 'jobStatus') {
      return (
        <Badge className={getJobStatusColor(value)}>
          {value}
        </Badge>
      );
    }
    if (field.includes('Amount') || field === 'wipAmount') return <span>{formatCurrency(value)}</span>;
    if (field === 'lastInvoiceDate') return <span>{formatDate(value)}</span>;
    if (field === 'hoursLogged') return <span>{value}h</span>;
    return <span>{value}</span>;
  }

  if (field === 'billingTrigger') {
    return (
      <Select value={value} onValueChange={(newValue) => onUpdate(job.id, field, newValue)}>
        <SelectTrigger className="w-[150px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="monthly">Monthly</SelectItem>
          <SelectItem value="job-completion">Job Completion</SelectItem>
          <SelectItem value="manual-review">Manual Review</SelectItem>
          <SelectItem value="threshold-500">Threshold €500</SelectItem>
          <SelectItem value="threshold-1000">Threshold €1000</SelectItem>
          <SelectItem value="30-days">30 Days</SelectItem>
        </SelectContent>
      </Select>
    );
  }

  if (field === 'jobStatus') {
    return (
      <Select value={value} onValueChange={(newValue) => onUpdate(job.id, field, newValue)}>
        <SelectTrigger className="w-[120px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="active">Active</SelectItem>
          <SelectItem value="completed">Completed</SelectItem>
          <SelectItem value="on-hold">On Hold</SelectItem>
        </SelectContent>
      </Select>
    );
  }

  if (field === 'hoursLogged' || field.includes('Amount') || field === 'wipAmount') {
    return (
      <Input
        type="number"
        value={value}
        onChange={(e) => onUpdate(job.id, field, parseFloat(e.target.value) || 0)}
        className="w-[100px]"
        step={field === 'hoursLogged' ? '0.25' : '0.01'}
      />
    );
  }

  return (
    <Input
      value={value || ''}
      onChange={(e) => onUpdate(job.id, field, e.target.value)}
      className="w-[120px]"
    />
  );
};