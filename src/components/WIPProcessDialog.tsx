import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { formatCurrency } from '@/lib/currency';
import { WIPBalanceCalculation } from '@/types/wipReport';
import WriteOffLogicDialog from './WriteOffLogicDialog';

interface WIPProcessDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedClient: string;
  invoiceNumber: string;
  onInvoiceNumberChange: (value: string) => void;
  balanceData: WIPBalanceCalculation | null;
  onKeepInWIP: () => void;
  onMoveToWriteOff: () => void;
}

const WIPProcessDialog = ({
  open,
  onOpenChange,
  selectedClient,
  invoiceNumber,
  onInvoiceNumberChange,
  balanceData,
  onKeepInWIP,
  onMoveToWriteOff
}: WIPProcessDialogProps) => {
  const [invoiceSentFrom, setInvoiceSentFrom] = useState<string>('Within Kollabro');
  const [logInvoiceDialogOpen, setLogInvoiceDialogOpen] = useState(false);
  const [writeOffLogicDialogOpen, setWriteOffLogicDialogOpen] = useState(false);
  
  console.log('WIPProcessDialog render - logInvoiceDialogOpen:', logInvoiceDialogOpen);
  const [logInvoiceData, setLogInvoiceData] = useState({
    invoiceNumber: '',
    invoiceDate: '',
    net: '',
    vat: '',
    gross: '',
    includeExpenses: false
  });

  // Sample time logs data for the write-off logic dialog
  const sampleTimeLogs = [
    {
      id: '1',
      teamMember: 'John Smith',
      hours: 8.5,
      billableRate: 75,
      amount: 637.50,
      date: '2024-01-12',
      description: 'VAT return preparation'
    },
    {
      id: '2', 
      teamMember: 'John Smith',
      hours: 4.5,
      billableRate: 75,
      amount: 337.50,
      date: '2024-01-12',
      description: 'Client consultation'
    },
    {
      id: '3',
      teamMember: 'John Smith', 
      hours: 4.0,
      billableRate: 75,
      amount: 300.00,
      date: '2024-02-12',
      description: 'Document review'
    },
    {
      id: '4',
      teamMember: 'Sarah Johnson',
      hours: 6.0,
      billableRate: 65,
      amount: 390.00,
      date: '2024-02-12',
      description: 'Compliance check'
    },
    {
      id: '5',
      teamMember: 'Sarah Johnson',
      hours: 3.0,
      billableRate: 65,
      amount: 195.00,
      date: '2024-02-12',
      description: 'Document review'
    },
    {
      id: '6',
      teamMember: 'Sarah Johnson',
      hours: 3.0,
      billableRate: 65,
      amount: 195.00,
      date: '2024-03-12',
      description: 'Compliance check'
    },
    {
      id: '7',
      teamMember: 'Mike Wilson',
      hours: 12.5,
      billableRate: 90,
      amount: 1125.00,
      date: '2024-03-12',
      description: 'Tax calculations'
    },
    {
      id: '8',
      teamMember: 'Mike Wilson',
      hours: 6.5,
      billableRate: 90,
      amount: 585.00,
      date: '2024-03-12',
      description: 'Report finalization'
    },
    {
      id: '9',
      teamMember: 'Mike Wilson',
      hours: 6.0,
      billableRate: 90,
      amount: 540.00,
      date: '2024-04-12',
      description: 'Tax calculations'
    }
  ];

  const handleLogInvoiceSubmit = () => {
    console.log('Log Invoice Data:', logInvoiceData);
    setLogInvoiceDialogOpen(false);
    setLogInvoiceData({
      invoiceNumber: '',
      invoiceDate: '',
      net: '',
      vat: '',
      gross: '',
      includeExpenses: false
    });
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
        <DialogHeader>
            <DialogTitle>Assign to Invoice Number</DialogTitle>
          </DialogHeader>
        <div className="space-y-4">
          <div className="flex justify-end mb-4">
            <Button
              variant="default"
              size="sm"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('=== LOG INVOICE BUTTON CLICKED ===');
                console.log('Current logInvoiceDialogOpen state:', logInvoiceDialogOpen);
                console.log('Setting logInvoiceDialogOpen to true');
                setLogInvoiceDialogOpen(true);
                setTimeout(() => {
                  console.log('After setState - logInvoiceDialogOpen should be:', logInvoiceDialogOpen);
                }, 100);
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              Log Invoice Only
            </Button>
          </div>
          
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium">Invoice Number</label>
            <Input
              type="text"
              placeholder="Enter invoice number"
              value={invoiceNumber}
              onChange={(e) => onInvoiceNumberChange(e.target.value)}
              className="flex-1"
            />
          </div>
          
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium">Invoice sent from</label>
            <Select value={invoiceSentFrom} onValueChange={setInvoiceSentFrom}>
              <SelectTrigger className="flex-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Within Kollabro">Within Kollabro</SelectItem>
                <SelectItem value="Quickbooks">Quickbooks</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {balanceData && (
            <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
              <div className="flex justify-between text-sm">
                <span>Total WIP:</span>
                <span className="font-medium">{formatCurrency(balanceData.totalWIP)}</span>
              </div>
              
              <div className="flex justify-between text-sm">
                <span>Invoice Target:</span>
                <span className="font-medium">{formatCurrency(balanceData.invoiceTarget)}</span>
              </div>
              
              <div className="flex justify-between text-sm font-bold border-t pt-3">
                <span>Left Over Balance:</span>
                <span className="text-red-600">{formatCurrency(balanceData.balanceLeftOver)}</span>
              </div>
            </div>
          )}
          
          <div className="space-y-3">
            <h3 className="text-lg font-semibold">Remaining WIP amount</h3>
            {balanceData && (
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-lg font-bold text-yellow-800">{formatCurrency(balanceData.balanceLeftOver)}</p>
              </div>
            )}
            <div className="space-y-2">
              <Button 
                onClick={onKeepInWIP}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              >
                Carry Forward
              </Button>
              <Button 
                onClick={onMoveToWriteOff}
                className="w-full bg-red-600 hover:bg-red-700 text-white"
              >
                Write Off
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>

    {/* Log Invoice Dialog - Moved outside to prevent nesting issues */}
    {console.log('Rendering Log Invoice Dialog with open state:', logInvoiceDialogOpen)}
    <Dialog 
      open={logInvoiceDialogOpen} 
      onOpenChange={(open) => {
        console.log('=== LOG INVOICE DIALOG onOpenChange ===');
        console.log('Dialog onOpenChange called with:', open);
        console.log('Current state:', logInvoiceDialogOpen);
        setLogInvoiceDialogOpen(open);
        console.log('State should now be:', open);
      }}
    >
      <DialogContent className="max-w-md" style={{ zIndex: 9999 }}>
        <DialogHeader>
          <DialogTitle>Log Invoice Only</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-4">
          {balanceData && (
            <div className="space-y-3 p-4 bg-gray-50 rounded-lg">
              <div className="flex justify-between text-sm">
                <span className="font-medium">Total Amount:</span>
                <span className="font-bold">{formatCurrency(balanceData.totalWIP)}</span>
              </div>
            </div>
          )}
          
          <div>
            <label className="text-sm font-medium">Invoice Number</label>
            <Input
              value={logInvoiceData.invoiceNumber}
              onChange={(e) => setLogInvoiceData(prev => ({ ...prev, invoiceNumber: e.target.value }))}
              placeholder="Enter invoice number"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Invoice Date</label>
            <Input
              type="date"
              value={logInvoiceData.invoiceDate}
              onChange={(e) => setLogInvoiceData(prev => ({ ...prev, invoiceDate: e.target.value }))}
            />
          </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Net</label>
              <Input
                type="number"
                step="0.01"
                value={logInvoiceData.net}
                onChange={(e) => setLogInvoiceData(prev => ({ ...prev, net: e.target.value }))}
                placeholder="0.00"
              />
            </div>
            
            <div>
              <label className="text-sm font-medium mb-2 block">VAT</label>
              <Input
                type="number"
                step="0.01"
                value={logInvoiceData.vat}
                onChange={(e) => setLogInvoiceData(prev => ({ ...prev, vat: e.target.value }))}
                placeholder="0.00"
              />
            </div>
            
            <div>
              <label className="text-sm font-medium mb-2 block">Gross</label>
              <Input
                type="number"
                step="0.01"
                value={logInvoiceData.gross}
                onChange={(e) => setLogInvoiceData(prev => ({ ...prev, gross: e.target.value }))}
                placeholder="0.00"
              />
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="includeExpenses"
                checked={logInvoiceData.includeExpenses}
                onCheckedChange={(checked) => setLogInvoiceData(prev => ({ ...prev, includeExpenses: checked as boolean }))}
              />
              <Label htmlFor="includeExpenses" className="text-sm font-medium">
                Include expenses
              </Label>
            </div>
          
          {logInvoiceData.gross && balanceData && (
            <div className="space-y-3">
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex justify-between text-sm">
                  <span className="font-medium">Balance:</span>
                  <span className="font-bold text-blue-800">
                    {formatCurrency(balanceData.totalWIP - parseFloat(logInvoiceData.gross || '0'))}
                  </span>
                </div>
              </div>
              
              {/* Show Apply Write Off Logic button when there's a balance leftover */}
              {balanceData.totalWIP - parseFloat(logInvoiceData.gross || '0') > 0 && (
                <div className="flex justify-center">
                  <Button
                    onClick={() => setWriteOffLogicDialogOpen(true)}
                    className="bg-orange-600 hover:bg-orange-700 text-white"
                  >
                    Apply Write Off Logic
                  </Button>
                </div>
              )}
            </div>
          )}
          <div className="flex justify-end space-x-2 pt-4">
            <Button variant="outline" onClick={() => setLogInvoiceDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleLogInvoiceSubmit}
              disabled={!logInvoiceData.invoiceNumber || !logInvoiceData.invoiceDate || !logInvoiceData.gross}
            >
              Log Invoice
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>

    {/* Write Off Logic Dialog */}
    <WriteOffLogicDialog
      open={writeOffLogicDialogOpen}
      onOpenChange={setWriteOffLogicDialogOpen}
      clientName={selectedClient}
      jobName=""
      timeLogs={sampleTimeLogs}
      totalAmount={sampleTimeLogs.reduce((sum, log) => sum + log.amount, 0)}
      writeOffBalance={balanceData && logInvoiceData.gross ? 
        balanceData.totalWIP - parseFloat(logInvoiceData.gross || '0') : 0
      }
      onSave={(data) => {
        console.log('Write off saved:', data);
        // Handle the save logic here
      }}
    />
    </>
  );
};

export default WIPProcessDialog;