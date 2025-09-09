import React, { useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { DashboardCard, DashboardGrid } from "@/components/ui/dashboard-card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, ArrowRightLeft, Lock, Unlock } from "lucide-react";
import { formatCurrency } from '@/lib/currency';
import WIPDashboard from './WIPDashboard';
import WIPClientTable from './WIPClientTable';
import WIPProcessDialog from './WIPProcessDialog';
import { useWIPReport } from '@/hooks/useWIPReport';
import { WIPReportTabProps } from '@/types/wipReport';

interface WIPReportTabPropsExtended extends WIPReportTabProps {
  onInvoiceEntry: (entry: any) => void;
}

const WIPReportTab = ({ wipEntries, onWriteOffEntry, onInvoiceEntry }: WIPReportTabPropsExtended) => {
  const [invoiceStatusFilter, setInvoiceStatusFilter] = useState<string>('all');
  const [logInvoiceDialogOpen, setLogInvoiceDialogOpen] = useState(false);
  const [logInvoiceData, setLogInvoiceData] = useState({
    invoiceNumber: '',
    invoiceDate: '',
    invoiceAmountExVAT: '',
    invoiceAmountIncVAT: ''
  });
  const {
    openingBalances,
    invoiceAmounts,
    lockedInvoiceAmounts,
    updatedClients,
    activeOpeningBalanceFields,
    processDialogOpen,
    selectedClient,
    invoiceNumber,
    clientSummary,
    setProcessDialogOpen,
    setInvoiceNumber,
    handleOpeningBalanceChange,
    handleInvoiceAmountChange,
    toggleInvoiceAmountLock,
    handleProcessClick,
    handleKeepInWIP,
    handleMoveToWriteOff,
    handleUpdatedClick,
    handleToggleOpeningBalanceField,
    handleUpdateTotalWIP,
    getSelectedClientData
  } = useWIPReport(wipEntries, onWriteOffEntry, onInvoiceEntry);

  const totalWIP = Object.values(clientSummary).reduce((sum, client) => sum + client.total, 0);
  const totalClients = Object.keys(clientSummary).length;
  const totalOpeningBalance = Object.values(openingBalances).reduce((sum, balance) => sum + (balance || 0), 0);
  const totalInvoiceAmount = Object.values(invoiceAmounts).reduce((sum, amount) => sum + (amount || 0), 0);

  const handleLogInvoiceSubmit = () => {
    const invoice = {
      id: Date.now().toString(),
      invoiceNumber: logInvoiceData.invoiceNumber,
      invoiceDate: logInvoiceData.invoiceDate,
      clientName: 'Manual Entry',
      invoiceTotal: parseFloat(logInvoiceData.invoiceAmountIncVAT),
      status: 'issued' as const
    };
    
    if (onInvoiceEntry) {
      onInvoiceEntry(invoice);
    }
    
    setLogInvoiceDialogOpen(false);
    setLogInvoiceData({
      invoiceNumber: '',
      invoiceDate: '',
      invoiceAmountExVAT: '',
      invoiceAmountIncVAT: ''
    });
  };

  return (
    <div className="space-y-6">
      {/* Dashboard Cards */}
      <DashboardGrid columns={4}>
        <DashboardCard
          title="Total Clients"
          value={totalClients}
        />
        
        <DashboardCard
          title="Total WIP"
          value={`€${totalWIP.toFixed(2)}`}
        />
        
        <DashboardCard
          title="Opening Balance"
          value={`€${totalOpeningBalance.toFixed(2)}`}
        />
        
        <DashboardCard
          title="Invoice Amount"
          value={`€${totalInvoiceAmount.toFixed(2)}`}
        />
      </DashboardGrid>

      {/* Invoice Status Filter and Log Invoice Button */}
      <div className="flex justify-between items-center">
        <div></div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium">Invoice Status:</label>
            <Select value={invoiceStatusFilter} onValueChange={setInvoiceStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="invoiced">Invoiced</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button 
            onClick={() => setLogInvoiceDialogOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            Log Invoice Only
          </Button>
        </div>
      </div>

        <Card>
        <CardContent className="pt-6">
          {Object.keys(clientSummary).length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No WIP entries yet.</p>
              <p className="text-sm text-gray-400 mt-1">
                Move approved time logs to WIP to see them here.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="text-left p-3 font-bold text-foreground h-10 border-r">Client Name</th>
                    <th className="text-right p-3 font-bold text-foreground h-10 border-r">Current WIP</th>
                    <th className="text-right p-3 font-bold text-foreground h-10 border-r">WIP Balance</th>
                    <th className="text-right p-3 font-bold text-foreground h-10 border-r">Total WIP</th>
                    <th className="text-right p-3 font-bold text-foreground h-10 border-r">WIP Target</th>
                    <th className="text-center p-3 font-bold text-foreground h-10">Target Met</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(clientSummary).map(([clientName, data]: [string, any]) => (
                    <tr key={clientName} className="border-b border-border hover:bg-muted/30 transition-colors">
                      <td className="p-4 font-medium text-foreground border-r">{clientName}</td>
                      <td className="p-4 text-right text-foreground border-r">{formatCurrency(data.total)}</td>
                      <td className="p-4 text-right border-r">
                        <div className="flex items-center justify-end gap-2">
                          <span className="text-foreground">
                            {formatCurrency(openingBalances[clientName] || 0)}
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="p-1 h-6 w-6 hover:bg-muted/50"
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="p-1 h-6 w-6 hover:bg-muted/50"
                          >
                            <ArrowRightLeft className="h-3 w-3" />
                          </Button>
                        </div>
                      </td>
                      <td className="p-4 text-right font-bold border-r">
                        <span className="text-foreground">{formatCurrency((openingBalances[clientName] || 0) + data.total)}</span>
                      </td>
                      <td className={`p-4 text-right border-r ${invoiceAmounts[clientName] ? 'bg-success/10' : ''} ${lockedInvoiceAmounts[clientName] ? 'bg-[#E0F2DE]' : ''}`}>
                        <div className="flex items-center justify-end gap-2">
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="€00.00"
                            value={invoiceAmounts[clientName] || ''}
                            onChange={(e) => handleInvoiceAmountChange(clientName, e.target.value)}
                            className="w-32"
                            disabled={lockedInvoiceAmounts[clientName]}
                          />
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleInvoiceAmountLock(clientName)}
                            className="p-1 h-8 w-8"
                          >
                            {lockedInvoiceAmounts[clientName] ? (
                              <Lock className="h-4 w-4" />
                            ) : (
                              <Unlock className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </td>
                      <td className="p-4 text-center">
                        {invoiceAmounts[clientName] && ((openingBalances[clientName] || 0) + data.total) >= invoiceAmounts[clientName] ? (
                          <Button 
                            variant="default" 
                            size="sm"
                            className="bg-green-600 hover:bg-green-700"
                            onClick={() => handleProcessClick(clientName)}
                          >
                            Generate Invoice
                          </Button>
                        ) : (
                          <span className="text-muted-foreground">Not ready</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Process Dialog */}
      <WIPProcessDialog
        open={processDialogOpen}
        onOpenChange={setProcessDialogOpen}
        selectedClient={selectedClient}
        invoiceNumber={invoiceNumber}
        onInvoiceNumberChange={setInvoiceNumber}
        balanceData={getSelectedClientData()}
        onKeepInWIP={handleKeepInWIP}
        onMoveToWriteOff={handleMoveToWriteOff}
      />

      {/* Log Invoice Dialog */}
      <Dialog open={logInvoiceDialogOpen} onOpenChange={setLogInvoiceDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Log Invoice Only</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <Label htmlFor="invoice-number" className="mb-3 block">Invoice Number</Label>
              <Input
                id="invoice-number"
                value={logInvoiceData.invoiceNumber}
                onChange={(e) => setLogInvoiceData(prev => ({ ...prev, invoiceNumber: e.target.value }))}
                placeholder="Enter invoice number"
              />
            </div>
            <div>
              <Label htmlFor="invoice-date">Invoice Date</Label>
              <Input
                id="invoice-date"
                type="date"
                value={logInvoiceData.invoiceDate}
                onChange={(e) => setLogInvoiceData(prev => ({ ...prev, invoiceDate: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="invoice-amount-ex-vat">Invoice Amount (ex VAT)</Label>
              <Input
                id="invoice-amount-ex-vat"
                type="number"
                step="0.01"
                value={logInvoiceData.invoiceAmountExVAT}
                onChange={(e) => setLogInvoiceData(prev => ({ ...prev, invoiceAmountExVAT: e.target.value }))}
                placeholder="0.00"
              />
            </div>
            <div>
              <Label htmlFor="invoice-amount-inc-vat">Invoice Amount (+ VAT)</Label>
              <Input
                id="invoice-amount-inc-vat"
                type="number"
                step="0.01"
                value={logInvoiceData.invoiceAmountIncVAT}
                onChange={(e) => setLogInvoiceData(prev => ({ ...prev, invoiceAmountIncVAT: e.target.value }))}
                placeholder="0.00"
              />
            </div>
            <div className="flex justify-end space-x-2 pt-4">
              <Button variant="outline" onClick={() => setLogInvoiceDialogOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleLogInvoiceSubmit}
                disabled={!logInvoiceData.invoiceNumber || !logInvoiceData.invoiceDate || !logInvoiceData.invoiceAmountIncVAT}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                Log Invoice
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default WIPReportTab;