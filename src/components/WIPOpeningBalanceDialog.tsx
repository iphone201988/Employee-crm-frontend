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
  onAddBalance: (amount: number) => void;
  jobName?: string;
}

const WIPOpeningBalanceDialog = ({ 
  isOpen, 
  onClose, 
  clientName, 
  currentWIPBalance, 
  onAddBalance,
  jobName 
}: WIPOpeningBalanceDialogProps) => {
  const [amount, setAmount] = useState('');

  const handleSubmit = () => {
    const amountValue = parseFloat(amount);
    if (!isNaN(amountValue)) {
      onAddBalance(amountValue);
      setAmount('');
      onClose();
    }
  };

  const handleClose = () => {
    setAmount('');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add WIP Opening Balance{jobName ? ` - ${jobName}` : ''}</DialogTitle>
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