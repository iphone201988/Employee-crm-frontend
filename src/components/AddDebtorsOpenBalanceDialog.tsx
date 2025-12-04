import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCreateDebtorsOpenBalanceMutation } from '@/store/clientApi';
import { toast } from 'sonner';

interface AddDebtorsOpenBalanceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientId: string;
  clientName: string;
}

const AddDebtorsOpenBalanceDialog = ({
  open,
  onOpenChange,
  clientId,
  clientName
}: AddDebtorsOpenBalanceDialogProps) => {
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [createDebtorsOpenBalance, { isLoading }] = useCreateDebtorsOpenBalanceMutation();

  const handleSubmit = async () => {
    const numAmount = parseFloat(amount);
    if (!isNaN(numAmount) && numAmount > 0) {
      try {
        await createDebtorsOpenBalance({
          clientId,
          amount: numAmount,
          date: date || undefined,
        }).unwrap();
        
        toast.success('Debtors log entry added successfully');
        // Reset form
        setAmount('');
        setDate(new Date().toISOString().split('T')[0]);
        onOpenChange(false);
      } catch (error: any) {
        toast.error(error?.data?.message || 'Failed to add debtors log entry');
      }
    }
  };

  const handleClose = () => {
    // Reset form on close
    setAmount('');
    setDate(new Date().toISOString().split('T')[0]);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Debtor Log</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="flex justify-between text-sm">
              <span>Client:</span>
              <span className="font-medium">{clientName}</span>
            </div>
          </div>

          <div>
            <Label htmlFor="debtors-amount">Amount</Label>
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

          <div>
            <Label htmlFor="debtors-date">Date</Label>
            <Input
              id="debtors-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="mt-1"
            />
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button variant="outline" onClick={handleClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit}
              disabled={!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0 || isLoading}
            >
              {isLoading ? 'Adding...' : 'Add Entry'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AddDebtorsOpenBalanceDialog;

