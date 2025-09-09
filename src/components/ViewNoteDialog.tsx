import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface ViewNoteDialogProps {
  isOpen: boolean;
  onClose: () => void;
  note: string;
  employeeName: string;
}

const ViewNoteDialog = ({ isOpen, onClose, note, employeeName }: ViewNoteDialogProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{employeeName} - Notes</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <p className="text-sm text-muted-foreground">{note}</p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ViewNoteDialog;