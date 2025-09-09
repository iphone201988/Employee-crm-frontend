import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatCurrency } from '@/lib/currency';

interface DebtorsBalanceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientName: string;
  onAddBalance: (amount: number) => void;
}

const DebtorsBalanceDialog = ({
  open,
  onOpenChange,
  clientName,
  onAddBalance
}: DebtorsBalanceDialogProps) => {
  const [amount, setAmount] = useState('');

  const handleSubmit = () => {
    const numAmount = parseFloat(amount);
    if (!isNaN(numAmount) && numAmount > 0) {
      onAddBalance(numAmount);
      setAmount('');
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add Debtors Balance</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="flex justify-between text-sm">
              <span>Client:</span>
              <span className="font-medium">{clientName}</span>
            </div>
          </div>

          <div>
            <Label htmlFor="debtors-amount">Debtors Balance Amount</Label>
            <Input
              id="debtors-amount"
              type="number"
              step="0.01"
              min="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className="mt-1"
            />
          </div>

          {amount && !isNaN(parseFloat(amount)) && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex justify-between text-sm">
                <span className="font-medium">Amount to add:</span>
                <span className="font-bold text-green-800">
                  {formatCurrency(parseFloat(amount))}
                </span>
              </div>
            </div>
          )}

          <div className="flex justify-end space-x-2 pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit}
              disabled={!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0}
            >
              Add Balance
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DebtorsBalanceDialog;