
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TimeEntry } from '@/types/timeEntry';

interface AssignDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedEntries: TimeEntry[];
  onAssign: (assignTo: string) => void;
}

const AssignDialog = ({ open, onOpenChange, selectedEntries, onAssign }: AssignDialogProps) => {
  const [assignTo, setAssignTo] = useState('');

  const handleAssign = () => {
    if (assignTo) {
      onAssign(assignTo);
      setAssignTo('');
      onOpenChange(false);
    }
  };

  const assignOptions = [
    'Bertie O\'Mahony',
    'AAIPAL Ltd',
    'AGNORG Ltd',
    'Smith & Associates',
    'Tech Solutions Ltd',
    'Green Gardens Ltd',
    'Johnson Retail',
    'Creative Agency Ltd',
    'Wilson & Co',
    'Brown Enterprises',
    'VAT (01/01/2025 - 28/02/2025)',
    'Income Tax 2024',
    'CT1 2024',
    'Payroll - W4 2025'
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Assign Selected Entries</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <p className="text-sm text-gray-600 mb-4">
            Assigning {selectedEntries.length} selected entries
          </p>
          <Select value={assignTo} onValueChange={setAssignTo}>
            <SelectTrigger>
              <SelectValue placeholder="Select client or job" />
            </SelectTrigger>
            <SelectContent>
              {assignOptions.map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleAssign} disabled={!assignTo}>
            Assign
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AssignDialog;
