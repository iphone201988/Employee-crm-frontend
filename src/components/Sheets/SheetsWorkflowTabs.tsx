import React from 'react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SummaryData } from "@/types/sheets";
import { useNavigate } from 'react-router-dom';

interface SheetsWorkflowTabsProps {
  filterStatus: string;
  summary: SummaryData;
  onFilterChange: (status: string) => void;
}

export const SheetsWorkflowTabs = ({ filterStatus, summary, onFilterChange }: SheetsWorkflowTabsProps) => {
  const navigate = useNavigate();

  const handleTabClick = (status: string) => {
    onFilterChange(status);
  };

  return (
    <div className="flex gap-1 bg-muted p-1 rounded-lg">
      <Button
        variant={filterStatus === 'all' ? 'purple-dark' : 'ghost'}
        size="sm"
        onClick={() => handleTabClick('all')}
        className="gap-2"
      >
        All
        <Badge variant="secondary" className="text-xs">{summary.total}</Badge>
      </Button>
      <Button
        variant={filterStatus === 'awaiting' ? 'purple-dark' : 'ghost'}
        size="sm"
        onClick={() => handleTabClick('awaiting')}
        className="gap-2"
      >
        Not Submitted
        <Badge variant="secondary" className="text-xs">{summary.awaiting}</Badge>
      </Button>
      <Button
        variant={filterStatus === 'submitted' ? 'purple-dark' : 'ghost'}
        size="sm"
        onClick={() => handleTabClick('submitted')}
        className="gap-2"
      >
        For Review
        <Badge variant="secondary" className="text-xs">{summary.submitted}</Badge>
      </Button>
      <Button
        variant={filterStatus === 'rejected' ? 'purple-dark' : 'ghost'}
        size="sm"
        onClick={() => handleTabClick('rejected')}
        className="gap-2"
      >
        Rejected
        <Badge variant="secondary" className="text-xs">{summary.rejected}</Badge>
      </Button>
      <Button
        variant={filterStatus === 'approved' ? 'purple-dark' : 'ghost'}
        size="sm"
        onClick={() => handleTabClick('approved')}
        className="gap-2"
      >
        Approved
        <Badge variant="secondary" className="text-xs">{summary.approved}</Badge>
      </Button>
    </div>
  );
};