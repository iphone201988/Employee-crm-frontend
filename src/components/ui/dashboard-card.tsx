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
    <Card className={`border border-border h-20 sm:h-24 lg:h-28 ${className}`}>
      <CardContent className="p-3 sm:p-4 lg:p-6 h-full flex flex-col justify-center">
        <div className="space-y-1">
          <p className="text-xs sm:text-sm font-medium text-muted-foreground truncate">{title}</p>
          <p className={`text-lg sm:text-xl lg:text-2xl font-bold ${valueColor} truncate`}>
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
  className?: string;
}

export const DashboardGrid = ({ children, columns = 4, className = "" }: DashboardGridProps) => {
  const gridCols = {
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
    5: 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5',
    6: 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6'
  };

  return (
    <div className={`grid ${gridCols[columns as keyof typeof gridCols] || gridCols[4]} gap-2 sm:gap-3 lg:gap-4 ${className}`}>
      {children}
    </div>
  );
};