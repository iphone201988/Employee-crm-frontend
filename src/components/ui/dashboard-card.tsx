import React from 'react';
import { Card, CardContent } from "@/components/ui/card";

interface DashboardCardProps {
  title: string;
  value: string | number | React.ReactNode;
  className?: string;
  valueColor?: string;
}

export const DashboardCard = ({ 
  title, 
  value, 
  className = "", 
  valueColor = "text-[hsl(var(--dashboard-blue))]" 
}: DashboardCardProps) => {
  return (
    <Card className={`border border-border h-24 ${className}`}>
      <CardContent className="p-6 h-full flex flex-col justify-center">
        <div className="space-y-1">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className={`text-2xl font-bold ${valueColor}`}>
            {value}
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

interface DashboardGridProps {
  children: React.ReactNode;
  columns?: number;
}

export const DashboardGrid = ({ children, columns = 4 }: DashboardGridProps) => {
  const gridCols = {
    3: 'grid-cols-1 md:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-4',
    5: 'grid-cols-1 md:grid-cols-5'
  };

  return (
    <div className={`grid ${gridCols[columns as keyof typeof gridCols] || gridCols[4]} gap-4`}>
      {children}
    </div>
  );
};