
import React from 'react';
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { TIME_ENTRY_OPTIONS } from '@/constants/timeEntryOptions';

interface TimeEntryBasicFieldsProps {
  formData: {
    date: string;
    client: string;
    clientNo: string;
    jobCode: string;
    jobName: string;
    description: string;
    purpose: string;
    staff: string;
  };
  onFieldChange: (field: string, value: string) => void;
}

const TimeEntryBasicFields = ({ formData, onFieldChange }: TimeEntryBasicFieldsProps) => {
  return (
    <>
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="date" className="text-right">Date</Label>
        <Input
          id="date"
          type="date"
          value={formData.date}
          onChange={(e) => onFieldChange('date', e.target.value)}
          className="col-span-3"
        />
      </div>
      
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="client" className="text-right">Client</Label>
        <Select value={formData.client} onValueChange={(value) => onFieldChange('client', value)}>
          <SelectTrigger className="col-span-3">
            <SelectValue placeholder="Select client" />
          </SelectTrigger>
          <SelectContent>
            {TIME_ENTRY_OPTIONS.clients.map((client) => (
              <SelectItem key={client} value={client}>{client}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="clientNo" className="text-right">Client No.</Label>
        <Select value={formData.clientNo} onValueChange={(value) => onFieldChange('clientNo', value)}>
          <SelectTrigger className="col-span-3">
            <SelectValue placeholder="Select client no." />
          </SelectTrigger>
          <SelectContent>
            {TIME_ENTRY_OPTIONS.clientNumbers.map((clientNo) => (
              <SelectItem key={clientNo} value={clientNo}>{clientNo}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="jobCode" className="text-right">Job Code</Label>
        <Select value={formData.jobCode} onValueChange={(value) => onFieldChange('jobCode', value)}>
          <SelectTrigger className="col-span-3">
            <SelectValue placeholder="Select job code" />
          </SelectTrigger>
          <SelectContent>
            {TIME_ENTRY_OPTIONS.jobCodes.map((jobCode) => (
              <SelectItem key={jobCode} value={jobCode}>{jobCode}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="jobName" className="text-right">Job Name</Label>
        <Select value={formData.jobName} onValueChange={(value) => onFieldChange('jobName', value)}>
          <SelectTrigger className="col-span-3">
            <SelectValue placeholder="Select job name" />
          </SelectTrigger>
          <SelectContent>
            {TIME_ENTRY_OPTIONS.jobNames.map((jobName) => (
              <SelectItem key={jobName} value={jobName}>{jobName}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="purpose" className="text-right">Purpose</Label>
        <Select value={formData.purpose} onValueChange={(value) => onFieldChange('purpose', value)}>
          <SelectTrigger className="col-span-3">
            <SelectValue placeholder="Select purpose" />
          </SelectTrigger>
          <SelectContent>
            {TIME_ENTRY_OPTIONS.purposes.map((purpose) => (
              <SelectItem key={purpose} value={purpose}>{purpose}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="description" className="text-right">Description</Label>
        <Input
          id="description"
          value={formData.description}
          onChange={(e) => onFieldChange('description', e.target.value)}
          className="col-span-3"
        />
      </div>

      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="staff" className="text-right">Staff</Label>
        <Select value={formData.staff} onValueChange={(value) => onFieldChange('staff', value)}>
          <SelectTrigger className="col-span-3">
            <SelectValue placeholder="Select staff" />
          </SelectTrigger>
          <SelectContent>
            {TIME_ENTRY_OPTIONS.staff.map((staff) => (
              <SelectItem key={staff} value={staff}>{staff}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </>
  );
};

export default TimeEntryBasicFields;
