import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatCurrency } from '@/lib/currency';

interface WIPTransferDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fromClient: string;
  wipAmount: number;
  availableClients: string[];
  onTransfer: (fromClient: string, toClient: string, amount: number) => void;
}

const WIPTransferDialog = ({
  open,
  onOpenChange,
  fromClient,
  wipAmount,
  availableClients,
  onTransfer
}: WIPTransferDialogProps) => {
  const [selectedClient, setSelectedClient] = useState('');

  const handleTransfer = () => {
    if (selectedClient && fromClient) {
      onTransfer(fromClient, selectedClient, wipAmount);
      setSelectedClient('');
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Transfer WIP to Another Client</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>From Client:</span>
                <span className="font-medium">{fromClient}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>WIP Amount:</span>
                <span className="font-medium">{formatCurrency(wipAmount)}</span>
              </div>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Transfer to Client:</label>
            <Select value={selectedClient} onValueChange={setSelectedClient}>
              <SelectTrigger>
                <SelectValue placeholder="Select client" />
              </SelectTrigger>
              <SelectContent>
                {availableClients
                  .filter(client => client !== fromClient)
                  .map((client) => (
                    <SelectItem key={client} value={client}>
                      {client}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          {selectedClient && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">Transfer Summary</h4>
              <div className="space-y-1 text-sm text-blue-800">
                <p>• WIP amount of {formatCurrency(wipAmount)} will be transferred</p>
                <p>• From: {fromClient}</p>
                <p>• To: {selectedClient}</p>
                <p>• This action cannot be undone</p>
              </div>
            </div>
          )}

          <div className="flex justify-end space-x-2 pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleTransfer}
              disabled={!selectedClient}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Confirm Transfer
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default WIPTransferDialog;