import React from 'react';
import { ArrowUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SortableTableHeaderProps {
  children: React.ReactNode;
  className?: string;
  sortable?: boolean;
  onClick?: () => void;
}

export const SortableTableHeader: React.FC<SortableTableHeaderProps> = ({
  children,
  className,
  sortable = true,
  onClick
}) => {
  if (!sortable) {
    return <span className={className}>{children}</span>;
  }

  return (
    <div className={cn("table-header-sortable", className)} onClick={onClick}>
      <span>{children}</span>
      <ArrowUpDown className="table-header-icon" />
    </div>
  );
};