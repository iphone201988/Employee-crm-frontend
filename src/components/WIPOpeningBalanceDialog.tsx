import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface WIPOpeningBalanceDialogProps {
  isOpen: boolean;
  onClose: () => void;
  clientName: string;
  currentWIPBalance: number;
  onAddBalance: (amount: number, entryDate?: string) => void;
  jobName?: string;
  jobStartDate?: string | null;
  jobEndDate?: string | null;
}

const WIPOpeningBalanceDialog = ({ 
  isOpen, 
  onClose, 
  clientName, 
  currentWIPBalance, 
  onAddBalance,
  jobName,
  jobStartDate,
  jobEndDate
}: WIPOpeningBalanceDialogProps) => {
  const [amount, setAmount] = useState('');
  const [entryDate, setEntryDate] = useState('');

  const handleSubmit = () => {
    const amountValue = parseFloat(amount);
    if (!isNaN(amountValue)) {
      onAddBalance(amountValue, entryDate || undefined);
      setAmount('');
      setEntryDate('');
      onClose();
    }
  };

  const handleClose = () => {
    setAmount('');
    setEntryDate('');
    onClose();
  };

  // Format dates for display (DD/MM/YYYY)
  const formatDateForDisplay = (dateString: string | null | undefined): string => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  // Build title with job dates if available
  const getDialogTitle = () => {
    const name = jobName || clientName;
    if (jobName && jobStartDate && jobEndDate) {
      const startDate = formatDateForDisplay(jobStartDate);
      const endDate = formatDateForDisplay(jobEndDate);
      return `Add Opening WIP Balance ${name} (${startDate} - ${endDate})`;
    }
    return `Add Opening WIP Balance ${name}`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{getDialogTitle()}</DialogTitle>
        </DialogHeader>
        <div className="space-y-6 mt-4">
          <div>
            <Label htmlFor="current-wip" className="text-sm font-medium">Current WIP Balance</Label>
            <div className="mt-1 p-2 bg-gray-50 rounded border text-sm font-semibold">
              {currentWIPBalance.toLocaleString('en-IE', { style: 'currency', currency: 'EUR' })}
            </div>
          </div>
          <div>
            <Label htmlFor="wip-amount" className="text-sm font-medium">WIP Opening Balance</Label>
            <Input
              id="wip-amount"
              type="number"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Enter WIP opening balance"
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="wip-date" className="text-sm font-medium">Effective Date</Label>
            <Input
              id="wip-date"
              type="date"
              value={entryDate}
              onChange={(e) => setEntryDate(e.target.value)}
              className="mt-1"
            />
          </div>
          
          
          <div className="flex justify-end space-x-2 pt-4">
            <Button variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit}
              disabled={!amount || isNaN(parseFloat(amount))}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              Add Balance
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default WIPOpeningBalanceDialog;