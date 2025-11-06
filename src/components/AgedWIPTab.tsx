import React from 'react';
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DashboardCard, DashboardGrid } from "@/components/ui/dashboard-card";
import { formatCurrency } from '@/lib/currency';
import ClientNameLink from './ClientNameLink';
import ClientDetailsDialog from '@/components/ClientDetailsDialog';
import { useGetClientQuery } from '@/store/clientApi';
import { useGetAgedWipQuery } from '@/store/wipApi';

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
}

const AgedWIPTab = () => {
  const { data, isLoading } = useGetAgedWipQuery();

  const agedWIPData: AgedWIPEntry[] = (data?.data?.clients || []).map((c: any) => ({
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
  }));

  const [selectedClientId, setSelectedClientId] = React.useState<string | null>(null);
  const [showClientDetailsDialog, setShowClientDetailsDialog] = React.useState(false);
  const { data: selectedClientData } = useGetClientQuery(selectedClientId as string, { skip: !selectedClientId });

  const totals = data?.data?.summary ? {
    wipBalance: data.data.summary.totalWIPBalance,
    days30: data.data.summary.current0_30Days,
    days60: data.data.summary.days31_60,
    days90: 0,
    days120: 0,
    days150: 0,
    days180Plus: data.data.summary.days60Plus,
  } : {
    wipBalance: 0,
    days30: 0,
    days60: 0,
    days90: 0,
    days120: 0,
    days150: 0,
    days180Plus: 0,
  };

  return (
    <div className="space-y-6">
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
        <CardHeader>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="font-medium">Client Ref</TableHead>
                  <TableHead className="font-medium">Client Name</TableHead>
                  <TableHead className="font-medium text-right">WIP Balance</TableHead>
                  <TableHead className="font-medium text-right">30 Days</TableHead>
                  <TableHead className="font-medium text-right">60 Days</TableHead>
                  <TableHead className="font-medium text-right">90 Days</TableHead>
                  <TableHead className="font-medium text-right">120 Days</TableHead>
                  <TableHead className="font-medium text-right">150 Days</TableHead>
                  <TableHead className="font-medium text-right">180 Days +</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {agedWIPData.map((entry) => (
                  <TableRow key={entry.clientRef} className="hover:bg-muted/50">
                    <TableCell className="font-medium">{entry.clientRef}</TableCell>
                    <TableCell>
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
                    <TableCell className="text-right font-medium">
                      {formatCurrency(entry.wipBalance)}
                    </TableCell>
                    <TableCell className="text-right">
                      {entry.days30 > 0 ? formatCurrency(entry.days30) : '-'}
                    </TableCell>
                    <TableCell className="text-right">
                      {entry.days60 > 0 ? formatCurrency(entry.days60) : '-'}
                    </TableCell>
                    <TableCell className="text-right">
                      {entry.days90 > 0 ? formatCurrency(entry.days90) : '-'}
                    </TableCell>
                    <TableCell className="text-right">
                      {entry.days120 > 0 ? formatCurrency(entry.days120) : '-'}
                    </TableCell>
                    <TableCell className="text-right">
                      {entry.days150 > 0 ? formatCurrency(entry.days150) : '-'}
                    </TableCell>
                    <TableCell className="text-right">
                      {entry.days180Plus > 0 ? formatCurrency(entry.days180Plus) : '-'}
                    </TableCell>
                  </TableRow>
                ))}
                {/* Totals row */}
                <TableRow className="bg-muted font-medium border-t-2">
                  <TableCell colSpan={2} className="font-bold">Total</TableCell>
                  <TableCell className="text-right font-bold">
                    {formatCurrency(totals.wipBalance)}
                  </TableCell>
                  <TableCell className="text-right font-bold">
                    {formatCurrency(totals.days30)}
                  </TableCell>
                  <TableCell className="text-right font-bold">
                    {formatCurrency(totals.days60)}
                  </TableCell>
                  <TableCell className="text-right font-bold">
                    {formatCurrency(totals.days90)}
                  </TableCell>
                  <TableCell className="text-right font-bold">
                    {formatCurrency(totals.days120)}
                  </TableCell>
                  <TableCell className="text-right font-bold">
                    {formatCurrency(totals.days150)}
                  </TableCell>
                  <TableCell className="text-right font-bold">
                    {formatCurrency(totals.days180Plus)}
                  </TableCell>
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

    </div>
  );
};

export default AgedWIPTab;

