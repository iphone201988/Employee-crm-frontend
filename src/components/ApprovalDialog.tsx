import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { formatDate } from '@/utils/dateFormat';

interface ApprovalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedMember: any;
}

const ApprovalDialog = ({ open, onOpenChange, selectedMember }: ApprovalDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{selectedMember?.name}'s Timesheet</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="bg-green-50 p-4 rounded-lg space-y-2">
            <div className="flex justify-between">
              <span className="font-medium text-gray-700">Approved by:</span>
              <span className="text-green-700">John Manager</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium text-gray-700">Date:</span>
              <span className="text-green-700">{formatDate(new Date())}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium text-gray-700">Time:</span>
              <span className="text-green-700">{new Date().toLocaleTimeString()}</span>
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ApprovalDialog;