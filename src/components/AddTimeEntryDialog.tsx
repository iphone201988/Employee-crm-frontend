
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { TimeEntry } from '@/types/timeEntry';
import { useTimeEntryForm } from '@/hooks/useTimeEntryForm';
import TimeEntryBasicFields from './TimeEntryBasicFields';
import TimeEntryFinancialFields from './TimeEntryFinancialFields';

interface AddTimeEntryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddEntry: (entry: Omit<TimeEntry, 'id' | 'amount'>) => void;
}

const AddTimeEntryDialog = ({ open, onOpenChange, onAddEntry }: AddTimeEntryDialogProps) => {
  const { formData, resetForm, updateField } = useTimeEntryForm();

  const handleSubmit = () => {
    onAddEntry(formData);
    resetForm();
    onOpenChange(false);
  };

  const handleFieldChange = (field: keyof typeof formData, value: any) => {
    updateField(field, value);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add Time Entry</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <TimeEntryBasicFields 
            formData={formData}
            onFieldChange={handleFieldChange}
          />
          <TimeEntryFinancialFields 
            formData={formData}
            onFieldChange={handleFieldChange}
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>Add Entry</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddTimeEntryDialog;
