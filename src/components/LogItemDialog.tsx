import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { CalendarIcon } from 'lucide-react';
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface LogItemDialogProps {
  isOpen: boolean;
  onClose: () => void;
  clientName: string;
  onSave: (item: any) => void;
}

const LogItemDialog = ({ isOpen, onClose, clientName, onSave }: LogItemDialogProps) => {
  const [date, setDate] = useState<Date>();
  const [itemType, setItemType] = useState<string>('');
  const [refNumber, setRefNumber] = useState<string>('');
  const [debitAmount, setDebitAmount] = useState<string>('');
  const [creditAmount, setCreditAmount] = useState<string>('');
  const [description, setDescription] = useState<string>('');

  const handleSave = () => {
    const newItem = {
      date: date ? format(date, 'dd/MM/yyyy') : '',
      type: itemType,
      refNo: refNumber,
      debit: parseFloat(debitAmount) || 0,
      credit: parseFloat(creditAmount) || 0,
      description,
    };
    onSave(newItem);
    onClose();
    // Reset form
    setDate(undefined);
    setItemType('');
    setRefNumber('');
    setDebitAmount('');
    setCreditAmount('');
    setDescription('');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Log Item - {clientName}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? format(date, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-2">
              <Label htmlFor="itemType">Item Type</Label>
              <Select value={itemType} onValueChange={setItemType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select item type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Invoice">Invoice</SelectItem>
                  <SelectItem value="Receipt">Receipt</SelectItem>
                  <SelectItem value="Credit Note">Credit Note</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="refNumber">Reference Number</Label>
            <Input
              id="refNumber"
              value={refNumber}
              onChange={(e) => setRefNumber(e.target.value)}
              placeholder="Enter reference number"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="debitAmount">Debit Amount</Label>
              <Input
                id="debitAmount"
                type="number"
                value={debitAmount}
                onChange={(e) => setDebitAmount(e.target.value)}
                placeholder="0.00"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="creditAmount">Credit Amount</Label>
              <Input
                id="creditAmount"
                type="number"
                value={creditAmount}
                onChange={(e) => setCreditAmount(e.target.value)}
                placeholder="0.00"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter description..."
              rows={3}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              Save Item
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default LogItemDialog;