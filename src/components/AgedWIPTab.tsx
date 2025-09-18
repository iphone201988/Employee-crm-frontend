import React from 'react';
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DashboardCard, DashboardGrid } from "@/components/ui/dashboard-card";
import { formatCurrency } from '@/lib/currency';
import ClientNameLink from './ClientNameLink';

interface AgedWIPEntry {
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

  // Sample data for aged WIP
  const agedWIPData: AgedWIPEntry[] = [
    {
      clientRef: 'ABC-23',
      clientName: 'Smith & Associates',
      wipBalance: 25000,
      days30: 8000,
      days60: 6000,
      days90: 5000,
      days120: 3000,
      days150: 2000,
      days180Plus: 1000
    },
    {
      clientRef: 'GRE-24',
      clientName: 'Green Gardens Limited',
      wipBalance: 18500,
      days30: 12000,
      days60: 4000,
      days90: 2500,
      days120: 0,
      days150: 0,
      days180Plus: 0
    },
    {
      clientRef: 'WAT-22',
      clientName: 'Water Savers Limited',
      wipBalance: 32000,
      days30: 15000,
      days60: 8000,
      days90: 5000,
      days120: 2000,
      days150: 1500,
      days180Plus: 500
    },
    {
      clientRef: 'TEC-25',
      clientName: 'TechFlow Solutions',
      wipBalance: 14200,
      days30: 10000,
      days60: 3000,
      days90: 1200,
      days120: 0,
      days150: 0,
      days180Plus: 0
    },
    {
      clientRef: 'ECO-24',
      clientName: 'EcoClean Services',
      wipBalance: 21800,
      days30: 8000,
      days60: 7000,
      days90: 4000,
      days120: 1800,
      days150: 800,
      days180Plus: 200
    }
  ];


  // Calculate totals
  const totals = agedWIPData.reduce((acc, entry) => ({
    wipBalance: acc.wipBalance + entry.wipBalance,
    days30: acc.days30 + entry.days30,
    days60: acc.days60 + entry.days60,
    days90: acc.days90 + entry.days90,
    days120: acc.days120 + entry.days120,
    days150: acc.days150 + entry.days150,
    days180Plus: acc.days180Plus + entry.days180Plus
  }), {
    wipBalance: 0,
    days30: 0,
    days60: 0,
    days90: 0,
    days120: 0,
    days150: 0,
    days180Plus: 0
  });

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
                      <ClientNameLink
                        clientName={entry.clientName}
                      />
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

    </div>
  );
};

export default AgedWIPTab;