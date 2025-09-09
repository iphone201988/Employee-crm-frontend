import React, { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Lock, Unlock, Plus, ChevronUp, ChevronDown, ArrowRightLeft } from "lucide-react";
import { formatCurrency } from '@/lib/currency';
import { WIPClientSummary } from '@/types/wipReport';
import WIPOpeningBalanceDialog from './WIPOpeningBalanceDialog';
import WIPTransferDialog from './WIPTransferDialog';

interface WIPClientTableProps {
  clientSummary: WIPClientSummary;
  openingBalances: Record<string, number>;
  invoiceAmounts: Record<string, number>;
  lockedInvoiceAmounts: Record<string, boolean>;
  updatedClients: Record<string, boolean>;
  activeOpeningBalanceFields: Record<string, boolean>;
  onOpeningBalanceChange: (clientName: string, value: string) => void;
  onInvoiceAmountChange: (clientName: string, value: string) => void;
  onToggleInvoiceAmountLock: (clientName: string) => void;
  onProcessClick: (clientName: string) => void;
  onUpdatedClick: (clientName: string) => void;
  onToggleOpeningBalanceField: (clientName: string) => void;
  onUpdateTotalWIP: (clientName: string) => void;
  onTransferWIP: (fromClient: string, toClient: string, amount: number) => void;
}

const WIPClientTable = ({
  clientSummary,
  openingBalances,
  invoiceAmounts,
  lockedInvoiceAmounts,
  updatedClients,
  activeOpeningBalanceFields,
  onOpeningBalanceChange,
  onInvoiceAmountChange,
  onToggleInvoiceAmountLock,
  onProcessClick,
  onUpdatedClick,
  onToggleOpeningBalanceField,
  onUpdateTotalWIP,
  onTransferWIP
}: WIPClientTableProps) => {
  const [sortField, setSortField] = useState<'clientName' | 'currentWIP' | 'totalWIP'>('clientName');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [wipBalanceDialog, setWipBalanceDialog] = useState<{
    isOpen: boolean;
    clientName: string;
    currentBalance: number;
  }>({ isOpen: false, clientName: '', currentBalance: 0 });
  
  const [transferDialog, setTransferDialog] = useState<{
    isOpen: boolean;
    fromClient: string;
    wipAmount: number;
  }>({ isOpen: false, fromClient: '', wipAmount: 0 });

  const handleSort = (field: 'clientName' | 'currentWIP' | 'totalWIP') => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getSortIcon = (field: 'clientName' | 'currentWIP' | 'totalWIP') => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />;
  };

  const sortedClients = Object.entries(clientSummary).sort(([nameA, dataA], [nameB, dataB]) => {
    let valueA: any, valueB: any;
    
    switch (sortField) {
      case 'clientName':
        valueA = nameA.toLowerCase();
        valueB = nameB.toLowerCase();
        break;
      case 'currentWIP':
        valueA = dataA.total;
        valueB = dataB.total;
        break;
      case 'totalWIP':
        valueA = (openingBalances[nameA] || 0) + dataA.total;
        valueB = (openingBalances[nameB] || 0) + dataB.total;
        break;
      default:
        return 0;
    }

    if (valueA < valueB) return sortDirection === 'asc' ? -1 : 1;
    if (valueA > valueB) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  const handleWipBalanceClick = (clientName: string, currentBalance: number) => {
    setWipBalanceDialog({
      isOpen: true,
      clientName,
      currentBalance
    });
  };

  const handleAddWipBalance = (amount: number) => {
    onOpeningBalanceChange(wipBalanceDialog.clientName, amount.toString());
    onUpdateTotalWIP(wipBalanceDialog.clientName);
  };

  const handleTransferClick = (clientName: string, wipAmount: number) => {
    setTransferDialog({
      isOpen: true,
      fromClient: clientName,
      wipAmount
    });
  };

  const handleTransfer = (fromClient: string, toClient: string, amount: number) => {
    onTransferWIP(fromClient, toClient, amount);
  };

  const availableClients = Object.keys(clientSummary);
  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th 
                className="text-left p-3 font-bold text-foreground h-10 cursor-pointer hover:bg-muted/70 transition-colors border-r"
                onClick={() => handleSort('clientName')}
              >
                <div className="flex items-center gap-1">
                  Client Name
                  {getSortIcon('clientName')}
                </div>
              </th>
              <th 
                className="text-right p-3 font-bold text-foreground h-10 cursor-pointer hover:bg-muted/70 transition-colors border-r"
                onClick={() => handleSort('currentWIP')}
              >
                <div className="flex items-center justify-end gap-1">
                  Current WIP
                  {getSortIcon('currentWIP')}
                </div>
              </th>
              <th className="text-right p-3 font-bold text-foreground h-10 border-r">WIP Balance</th>
              <th 
                className="text-right p-3 font-bold text-foreground h-10 cursor-pointer hover:bg-muted/70 transition-colors border-r"
                onClick={() => handleSort('totalWIP')}
              >
                <div className="flex items-center justify-end gap-1">
                  Total WIP
                  {getSortIcon('totalWIP')}
                </div>
              </th>
              <th className="text-right p-3 font-bold text-foreground h-10 border-r">WIP Target</th>
              <th className="text-center p-3 font-bold text-foreground h-10">Target Met</th>
            </tr>
          </thead>
          <tbody>
            {sortedClients.map(([clientName, data]: [string, any]) => (
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
                      onClick={() => handleWipBalanceClick(clientName, openingBalances[clientName] || 0)}
                      className="p-1 h-6 w-6 hover:bg-muted/50"
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleTransferClick(clientName, (openingBalances[clientName] || 0) + data.total)}
                      className="p-1 h-6 w-6 hover:bg-muted/50"
                    >
                      <ArrowRightLeft className="h-3 w-3" />
                    </Button>
                  </div>
                </td>
                <td className="p-4 text-right font-bold border-r">
                  <div className="flex items-center justify-end gap-2">
                    <span className="text-foreground">{formatCurrency((openingBalances[clientName] || 0) + data.total)}</span>
                    {updatedClients[clientName] && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onUpdatedClick(clientName)}
                        className="h-6 px-2 text-xs bg-green-100 text-green-700 hover:bg-green-200"
                      >
                        Updated
                      </Button>
                    )}
                  </div>
                </td>
                <td className={`p-4 text-right border-r ${invoiceAmounts[clientName] ? 'bg-success/10' : ''} ${lockedInvoiceAmounts[clientName] ? 'bg-[#E0F2DE]' : ''}`}>
                  <div className="flex items-center justify-end gap-2">
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="€00.00"
                      value={invoiceAmounts[clientName] || ''}
                      onChange={(e) => onInvoiceAmountChange(clientName, e.target.value)}
                      className="w-32"
                      disabled={lockedInvoiceAmounts[clientName]}
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onToggleInvoiceAmountLock(clientName)}
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
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        // Remove all functionality - just a visual button now
                        console.log('Generate Invoice button clicked - functionality disabled');
                      }}
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

      <WIPOpeningBalanceDialog
        isOpen={wipBalanceDialog.isOpen}
        onClose={() => setWipBalanceDialog({ ...wipBalanceDialog, isOpen: false })}
        clientName={wipBalanceDialog.clientName}
        currentWIPBalance={wipBalanceDialog.currentBalance}
        onAddBalance={handleAddWipBalance}
      />

      <WIPTransferDialog
        open={transferDialog.isOpen}
        onOpenChange={(open) => setTransferDialog({ ...transferDialog, isOpen: open })}
        fromClient={transferDialog.fromClient}
        wipAmount={transferDialog.wipAmount}
        availableClients={availableClients}
        onTransfer={handleTransfer}
      />
    </>
  );
};

export default WIPClientTable;