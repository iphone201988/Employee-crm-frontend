import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatCurrency } from '@/lib/currency';

interface WIPBalanceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientName: string;
  wipBalance: number;
  onCarryForward: () => void;
  onWriteOff: () => void;
}

const WIPBalanceDialog = ({
  open,
  onOpenChange,
  clientName,
  wipBalance,
  onCarryForward,
  onWriteOff
}: WIPBalanceDialogProps) => {
  const [openingWIPAmount, setOpeningWIPAmount] = useState('');
  const [showOpeningWIPInput, setShowOpeningWIPInput] = useState(false);

  const openingWIPValue = openingWIPAmount ? parseFloat(openingWIPAmount) : 0;
  const totalWIPAmount = wipBalance + openingWIPValue;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>WIP Amount - {clientName}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="bg-muted p-4 rounded-lg">
            <div className="space-y-2">
              {showOpeningWIPInput && (
                <div className="flex justify-between items-center">
                  <p className="text-sm text-muted-foreground">Opening WIP Amount:</p>
                  <p className="text-lg font-semibold">{formatCurrency(openingWIPValue)}</p>
                </div>
              )}
              <div className="flex justify-between items-center">
                <p className="text-sm text-muted-foreground">Current WIP Amount:</p>
                <p className="text-lg font-semibold">{formatCurrency(wipBalance)}</p>
              </div>
              <div className="border-t pt-2">
                <div className="flex justify-between items-center">
                  <p className="text-sm font-medium">Total WIP Amount:</p>
                  <p className="text-2xl font-bold text-primary">{formatCurrency(totalWIPAmount)}</p>
                </div>
              </div>
            </div>
          </div>
          
          {!showOpeningWIPInput && (
            <div className="space-y-2">
              <Label htmlFor="openingWIP">Add Opening WIP Amount (Optional)</Label>
              <div className="flex gap-2">
                <Input
                  id="openingWIP"
                  type="number"
                  placeholder="0.00"
                  value={openingWIPAmount}
                  onChange={(e) => setOpeningWIPAmount(e.target.value)}
                />
                <Button
                  variant="outline"
                  onClick={() => setShowOpeningWIPInput(true)}
                  disabled={!openingWIPAmount}
                >
                  Add
                </Button>
              </div>
            </div>
          )}
          
          {showOpeningWIPInput && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setShowOpeningWIPInput(false);
                setOpeningWIPAmount('');
              }}
            >
              Remove Opening WIP
            </Button>
          )}
          
          <div className="space-y-2">
            <p className="text-sm font-medium">What would you like to do with this WIP amount?</p>
            <div className="space-y-2">
              <Button 
                onClick={onCarryForward}
                className="w-full"
                variant="outline"
              >
                Carry Forward (Continue)
              </Button>
              <Button 
                onClick={onWriteOff}
                className="w-full"
                variant="destructive"
              >
                Write Off
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default WIPBalanceDialog;