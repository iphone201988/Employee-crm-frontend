import React, { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { DashboardCard, DashboardGrid } from "@/components/ui/dashboard-card";
import { formatCurrency } from '@/lib/currency';
import { ArrowUpDown, Search } from 'lucide-react';
import ClientNameLink from './ClientNameLink';
import ClientDetailsDialog from '@/components/ClientDetailsDialog';
import { useGetClientQuery, useUpdateClientAgingDatesMutation } from '@/store/clientApi';
import { useGetAgedWipQuery } from '@/store/wipApi';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

interface AgedWIPEntry {
  clientId: string;
  clientRef: string;
  clientName: string;
  wipBalance: number;
  days30: number;
  days60: number;
  days90: number;
  days120: number;
  days150: number;
  days180Plus: number;
  hasImportedWip?: boolean;
  isImported?: boolean;
}

const AgedWIPTab = () => {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [searchValue, setSearchValue] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchValue.trim());
    }, 400);

    return () => clearTimeout(handler);
  }, [searchValue]);

  const { data, isLoading, refetch } = useGetAgedWipQuery({
    page,
    limit,
    search: debouncedSearch || undefined,
  });
  const [sortConfig, setSortConfig] = useState<{ key: keyof AgedWIPEntry; direction: 'asc' | 'desc' } | null>(null);

  // Filter out clients with name "N/A" (safety check, backend should also filter)
  const agedWIPData: AgedWIPEntry[] = (data?.data?.clients || [])
    .filter((c: any) => {
      const clientName = c?.clientName || '';
      return clientName.trim() !== 'N/A' && clientName.trim() !== '';
    })
    .map((c: any) => ({
      clientId: c.clientId,
      clientRef: c.clientRef,
      clientName: c.clientName,
      wipBalance: c.wipBalance,
      days30: c.days30,
      days60: c.days60,
      days90: c.days90,
      days120: c.days120,
      days150: c.days150,
      days180Plus: c.days180Plus,
      hasImportedWip: !!c.hasImportedWip,
      isImported: !!c.isImported,
    }));

  const [selectedClientId, setSelectedClientId] = React.useState<string | null>(null);
  const [showClientDetailsDialog, setShowClientDetailsDialog] = React.useState(false);
  const { data: selectedClientData } = useGetClientQuery(selectedClientId as string, { skip: !selectedClientId });
  const [editClientId, setEditClientId] = useState<string | null>(null);
  const [editClientName, setEditClientName] = useState('');
  const [editWipDate, setEditWipDate] = useState('');
  const [editWipBalance, setEditWipBalance] = useState<string>('');
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [updateClientAgingDates, { isLoading: isUpdatingAging }] = useUpdateClientAgingDatesMutation();
  const { data: editClientDetails } = useGetClientQuery(editClientId as string, { skip: !editClientId });

  // Populate fields when client details are loaded
  React.useEffect(() => {
    if (editClientDetails?.data && isEditDialogOpen) {
      const clientData = editClientDetails.data as any;
      if (editWipBalance === '' && 'wipBalance' in clientData && clientData.wipBalance !== undefined) {
        setEditWipBalance(clientData.wipBalance.toString());
      }
      if (editWipDate === '' && 'importedWipDate' in clientData && clientData.importedWipDate) {
        const dateValue = new Date(clientData.importedWipDate).toISOString().split('T')[0];
        setEditWipDate(dateValue);
      }
    }
  }, [editClientDetails, isEditDialogOpen, editWipBalance, editWipDate]);

  const handleSort = (key: keyof AgedWIPEntry) => {
    setSortConfig(current => {
      if (current?.key === key) {
        return current.direction === 'desc'
          ? { key, direction: 'asc' }
          : null;
      }
      return { key, direction: 'desc' };
    });
  };

  const getSortIcon = (key: keyof AgedWIPEntry) => {
    if (sortConfig?.key !== key) {
      return <ArrowUpDown className="ml-1 !h-3 !w-3 opacity-50" />;
    }
    return <ArrowUpDown className={`ml-1 !h-3 !w-3 ${sortConfig.direction === 'desc' ? 'rotate-180' : ''}`} />;
  };

  const sortedData = useMemo(() => {
    if (!sortConfig) return agedWIPData;
    return [...agedWIPData].sort((a, b) => {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortConfig.direction === 'asc' ? aValue - bValue : bValue - aValue;
      }
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortConfig.direction === 'asc' 
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }
      return 0;
    });
  }, [agedWIPData, sortConfig]);

  // Calculate totals from filtered data (excluding N/A clients) to ensure consistency
  // Backend summary should already exclude N/A clients, but we calculate from filtered data as fallback
  const totals = useMemo(() => {
    if (data?.data?.summary) {
      // Use backend summary (which should already exclude N/A clients)
      return {
        wipBalance: data.data.summary.totalWIPBalance || 0,
        days30: data.data.summary.current0_30Days || 0,
        days60: data.data.summary.days31_60 || 0,
        days90: 0, // Backend doesn't provide this breakdown
        days120: 0, // Backend doesn't provide this breakdown
        days150: 0, // Backend doesn't provide this breakdown
        days180Plus: data.data.summary.days60Plus || 0,
      };
    }
    // Fallback: calculate from filtered data (excluding N/A clients)
    return agedWIPData.reduce((acc, client) => ({
      wipBalance: acc.wipBalance + (client.wipBalance || 0),
      days30: acc.days30 + (client.days30 || 0),
      days60: acc.days60 + (client.days60 || 0),
      days90: acc.days90 + (client.days90 || 0),
      days120: acc.days120 + (client.days120 || 0),
      days150: acc.days150 + (client.days150 || 0),
      days180Plus: acc.days180Plus + (client.days180Plus || 0),
    }), {
      wipBalance: 0,
      days30: 0,
      days60: 0,
      days90: 0,
      days120: 0,
      days150: 0,
      days180Plus: 0,
    });
  }, [data?.data?.summary, agedWIPData]);

  const pagination = data?.data?.pagination;
  useEffect(() => {
    if (pagination?.totalPages && pagination.totalPages > 0 && page > pagination.totalPages) {
      setPage(pagination.totalPages);
    }
  }, [pagination?.totalPages, page]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);

  const totalRecordCount = pagination?.totalClients ?? sortedData.length;
  const pageStart = totalRecordCount > 0 ? ((page - 1) * limit) + 1 : 0;
  const pageEnd = totalRecordCount > 0 ? Math.min(page * limit, totalRecordCount) : 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            placeholder="Search clients..."
            className="pl-10 bg-white"
          />
        </div>
        <span className="text-sm text-[#381980] font-semibold whitespace-nowrap">{totalRecordCount} Rows</span>
      </div>
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="h-full">
          <CardContent className="p-4">
            <div className="text-2xl font-bold !text-[#381980]">
              {formatCurrency(totals.wipBalance)}
            </div>
            <p className="text-sm text-muted-foreground">Total WIP Balance</p>
          </CardContent>
        </Card>
        <Card className="h-full">
          <CardContent className="p-4">
            <div className="text-2xl font-bold !text-[#381980]">
              {formatCurrency(totals.days30)}
            </div>
            <p className="text-sm text-muted-foreground">Current (0-30 days)</p>
          </CardContent>
        </Card>
        <Card className="h-full">
          <CardContent className="p-4">
            <div className="text-2xl font-bold !text-[#381980]">
              {formatCurrency(totals.days60)}
            </div>
            <p className="text-sm text-muted-foreground">31-60 Days</p>
          </CardContent>
        </Card>
        <Card className="h-full">
          <CardContent className="p-4">
            <div className="text-2xl font-bold !text-[#381980]">
              {formatCurrency(totals.days90 + totals.days120 + totals.days150 + totals.days180Plus)}
            </div>
            <p className="text-sm text-muted-foreground">60+ Days</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        {/* <CardHeader>
        </CardHeader> */}
        <CardContent className='p-0'>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className=' !bg-[#edecf4] text-[#381980]'>
                  <TableHead className="font-medium">
                    <Button
                      variant="ghost"
                      onClick={() => handleSort('clientRef')}
                      className="h-8 px-1 font-medium justify-start text-[12px] hover:bg-transparent hover:text-inherit !text-[#381980]"
                    >
                      Client Ref {getSortIcon('clientRef')}
                    </Button>
                  </TableHead>
                  <TableHead className="font-medium">
                    <Button
                      variant="ghost"
                      onClick={() => handleSort('clientName')}
                      className="h-8 px-1 font-medium justify-start text-[12px] hover:bg-transparent hover:text-inherit !text-[#381980]"
                    >
                      Client Name {getSortIcon('clientName')}
                    </Button>
                  </TableHead>
                  <TableHead className="font-medium text-right">
                    <Button
                      variant="ghost"
                      onClick={() => handleSort('wipBalance')}
                      className="h-8 px-1 font-medium justify-start text-[12px] hover:bg-transparent hover:text-inherit !text-[#381980]"
                    >
                      WIP Balance {getSortIcon('wipBalance')}
                    </Button>
                  </TableHead>
                  <TableHead className="font-medium text-right">
                    <Button
                      variant="ghost"
                      onClick={() => handleSort('days30')}
                      className="h-8 px-1 font-medium justify-start text-[12px] hover:bg-transparent hover:text-inherit !text-[#381980]"
                    >
                      30 Days {getSortIcon('days30')}
                    </Button>
                  </TableHead>
                  <TableHead className="font-medium text-right">
                    <Button
                      variant="ghost"
                      onClick={() => handleSort('days60')}
                      className="h-8 px-1 font-medium justify-start text-[12px] hover:bg-transparent hover:text-inherit !text-[#381980]"
                    >
                      60 Days {getSortIcon('days60')}
                    </Button>
                  </TableHead>
                  <TableHead className="font-medium text-right">
                    <Button
                      variant="ghost"
                      onClick={() => handleSort('days90')}
                      className="h-8 px-1 font-medium justify-start text-[12px] hover:bg-transparent hover:text-inherit !text-[#381980]"
                    >
                      90 Days {getSortIcon('days90')}
                    </Button>
                  </TableHead>
                  <TableHead className="font-medium text-right">
                    <Button
                      variant="ghost"
                      onClick={() => handleSort('days120')}
                      className="h-8 px-1 font-medium justify-start text-[12px] hover:bg-transparent hover:text-inherit !text-[#381980]"
                    >
                      120 Days {getSortIcon('days120')}
                    </Button>
                  </TableHead>
                  <TableHead className="font-medium text-right">
                    <Button
                      variant="ghost"
                      onClick={() => handleSort('days150')}
                      className="h-8 px-1 font-medium justify-start text-[12px] hover:bg-transparent hover:text-inherit !text-[#381980]"
                    >
                      150 Days {getSortIcon('days150')}
                    </Button>
                  </TableHead>
                  <TableHead className="font-medium text-right">
                    <Button
                      variant="ghost"
                      onClick={() => handleSort('days180Plus')}
                      className="h-8 px-1 font-medium justify-start text-[12px] hover:bg-transparent hover:text-inherit !text-[#381980]"
                    >
                      180 Days + {getSortIcon('days180Plus')}
                    </Button>
                  </TableHead>
                  <TableHead className="font-medium text-center">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedData.map((entry) => (
                  <TableRow key={entry.clientRef} className="hover:bg-muted/50">
                    <TableCell className="font-medium px-4">{entry.clientRef}</TableCell>
                    <TableCell className='px-4'>
                      <span
                        className="cursor-pointer text-blue-600 hover:text-blue-800 hover:underline"
                        onClick={() => {
                          setSelectedClientId(entry.clientId);
                          setShowClientDetailsDialog(true);
                        }}
                      >
                        {entry.clientName}
                      </span>
                    </TableCell>
                    <TableCell className="text-right font-medium px-4">
                      {formatCurrency(entry.wipBalance)}
                    </TableCell>
                    <TableCell className="text-right px-4">
                      {entry.days30 !== 0 ? formatCurrency(entry.days30) : '-'}
                    </TableCell>
                    <TableCell className="text-right px-4">
                      {entry.days60 !== 0 ? formatCurrency(entry.days60) : '-'}
                    </TableCell>
                    <TableCell className="text-right px-4">
                      {entry.days90 !== 0 ? formatCurrency(entry.days90) : '-'}
                    </TableCell>
                    <TableCell className="text-right px-4">
                      {entry.days120 !== 0 ? formatCurrency(entry.days120) : '-'}
                    </TableCell>
                    <TableCell className="text-right px-4">
                      {entry.days150 !== 0 ? formatCurrency(entry.days150) : '-'}
                    </TableCell>
                    <TableCell className="text-right px-4">
                      {entry.days180Plus !== 0 ? formatCurrency(entry.days180Plus) : '-'}
                    </TableCell>
                    <TableCell className="text-center px-4">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 px-3 text-[12px]"
                        disabled={!entry.isImported}
                        onClick={() => {
                          if (entry.isImported) {
                            setEditClientId(entry.clientId);
                            setEditClientName(entry.clientName);
                            setEditWipDate('');
                            setEditWipBalance('');
                            setIsEditDialogOpen(true);
                          }
                        }}
                      >
                        Edit
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {/* Totals row */}
                <TableRow className="bg-muted font-medium border-t-2">
                  <TableCell colSpan={2} className="font-bold">Total</TableCell>
                  <TableCell className="text-right font-bold px-4">
                    {formatCurrency(totals.wipBalance)}
                  </TableCell>
                  <TableCell className="text-right font-bold px-4">
                    {formatCurrency(totals.days30)}
                  </TableCell>
                  <TableCell className="text-right font-bold px-4">
                    {formatCurrency(totals.days60)}
                  </TableCell>
                  <TableCell className="text-right font-bold px-4">
                    {formatCurrency(totals.days90)}
                  </TableCell>
                  <TableCell className="text-right font-bold px-4">
                    {formatCurrency(totals.days120)}
                  </TableCell>
                  <TableCell className="text-right font-bold px-4">
                    {formatCurrency(totals.days150)}
                  </TableCell>
                  <TableCell className="text-right font-bold px-4">
                    {formatCurrency(totals.days180Plus)}
                  </TableCell>
                  <TableCell className="text-center font-bold px-4"></TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {selectedClientId && (
        <ClientDetailsDialog
          open={showClientDetailsDialog}
          onOpenChange={setShowClientDetailsDialog}
          clientData={selectedClientData?.data}
        />
      )}

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Imported WIP</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-sm font-medium">Client</Label>
              <div className="text-sm text-muted-foreground">
                {editClientName || '—'}
              </div>
            </div>
            <div>
              <Label className="text-sm font-medium">Imported WIP Balance</Label>
              <Input
                type="number"
                step="0.01"
                value={editWipBalance || (editClientDetails?.data && 'wipBalance' in editClientDetails.data ? ((editClientDetails.data as any).wipBalance?.toString() || '') : '')}
                onChange={(e) => setEditWipBalance(e.target.value)}
                placeholder={editClientDetails?.data && 'wipBalance' in editClientDetails.data ? ((editClientDetails.data as any).wipBalance?.toString() || "0.00") : "0.00"}
              />
              {editClientDetails?.data && 'wipBalance' in editClientDetails.data && (
                <p className="text-xs text-muted-foreground mt-1">
                  Current: {formatCurrency((editClientDetails.data as any).wipBalance || 0)}
                </p>
              )}
            </div>
            <div>
              <Label className="text-sm font-medium">Imported WIP Reference Date</Label>
              <Input
                type="date"
                value={editWipDate || (editClientDetails?.data && 'importedWipDate' in editClientDetails.data && (editClientDetails.data as any).importedWipDate ? new Date((editClientDetails.data as any).importedWipDate).toISOString().split('T')[0] : '')}
                onChange={(e) => setEditWipDate(e.target.value)}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setIsEditDialogOpen(false);
                  setEditClientId(null);
                  setEditClientName('');
                  setEditWipDate('');
                  setEditWipBalance('');
                }}
              >
                Cancel
              </Button>
              <Button
                disabled={!editClientId || (!editWipDate && !editWipBalance) || isUpdatingAging}
                onClick={async () => {
                  if (!editClientId) return;
                  try {
                    const updatePayload: any = { clientId: editClientId };
                    if (editWipDate) {
                      updatePayload.importedWipDate = editWipDate;
                    }
                    if (editWipBalance !== '') {
                      updatePayload.wipBalance = parseFloat(editWipBalance) || 0;
                    }
                    await updateClientAgingDates(updatePayload).unwrap();
                    toast.success('WIP updated successfully');
                    setIsEditDialogOpen(false);
                    setEditClientId(null);
                    setEditClientName('');
                    setEditWipDate('');
                    setEditWipBalance('');
                    refetch();
                  } catch (error: any) {
                    toast.error(error?.data?.message || 'Failed to update WIP');
                  }
                }}
              >
                {isUpdatingAging ? 'Saving...' : 'Save'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {pagination && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Show:</span>
              <select
                value={limit}
                onChange={(e) => { setPage(1); setLimit(Number(e.target.value)); }}
                className="border border-gray-300 rounded px-2 py-1 text-sm"
                disabled={isLoading}
              >
                <option value={5}>5 per page</option>
                <option value={10}>10 per page</option>
                <option value={20}>20 per page</option>
                <option value={50}>50 per page</option>
                <option value={100}>100 per page</option>
                <option value={250}>250 per page</option>
                <option value={500}>500 per page</option>
                <option value={1000}>1000 per page</option>
              </select>
            </div>
            <div className="text-sm text-gray-500">
              {totalRecordCount > 0
                ? `Showing ${pageStart} to ${pageEnd} of ${totalRecordCount} clients`
                : 'Showing 0 clients'}
            </div>
          </div>
          {pagination.totalPages > 1 && (
            <div className="flex justify-center items-center gap-2">
              <Button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1 || isLoading}
                variant="outline"
                size="sm"
              >
                Previous
              </Button>
              <Button
                onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
                disabled={page >= pagination.totalPages || isLoading}
                variant="outline"
                size="sm"
              >
                Next
              </Button>
            </div>
          )}
        </div>
      )}

    </div>
  );
};

export default AgedWIPTab;



