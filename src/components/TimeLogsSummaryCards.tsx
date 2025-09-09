
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface TimeLogsSummaryCardsProps {
  totalUnbilled: number;
  totalBilled: number;
  totalEntries: number;
}

const TimeLogsSummaryCards = ({ totalUnbilled, totalBilled, totalEntries }: TimeLogsSummaryCardsProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <Card className="border-l-4 border-l-orange-500">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground">Not Invoiced</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="text-3xl font-bold text-orange-600">€{totalUnbilled.toFixed(2)}</div>
        </CardContent>
      </Card>
      <Card className="border-l-4 border-l-green-500">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground">Invoiced</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="text-3xl font-bold text-green-600">€{totalBilled.toFixed(2)}</div>
        </CardContent>
      </Card>
      <Card className="border-l-4 border-l-blue-500">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground">Total Entries</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="text-3xl font-bold text-foreground">{totalEntries}</div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TimeLogsSummaryCards;
