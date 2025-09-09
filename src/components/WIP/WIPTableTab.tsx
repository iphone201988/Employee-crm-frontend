import React, { useState, useMemo } from 'react';
import { wipTableData } from '@/data/wipTableData';
import { WIPTableSummaryCards } from './WIPTableSummaryCards';
import { WIPTable } from "@/components/WIPTable/WIPTable";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronDown, ChevronUp } from 'lucide-react';

interface WIPTableTabProps {
  onInvoiceCreate?: (invoice: any) => void;
  onWriteOff?: (writeOffEntry: any) => void;
}

const WIPTableTab = ({ onInvoiceCreate, onWriteOff }: WIPTableTabProps) => {
  const [expandedClients, setExpandedClients] = useState<Set<string>>(new Set());
  const [allCollapsed, setAllCollapsed] = useState(true);
  const [targetMetFilter, setTargetMetFilter] = useState<string>('all');
  const [showManualReviewOnly, setShowManualReviewOnly] = useState(false);
  const [showWarningJobsOnly, setShowWarningJobsOnly] = useState(false);
  const [warningPercentage] = useState<number>(80);

  const wipData = useMemo(() => wipTableData, []);

  const handleManualReviewToggle = () => {
    setShowManualReviewOnly(!showManualReviewOnly);
  };

  const toggleClient = (clientId: string) => {
    setExpandedClients(prev => {
      const newSet = new Set(prev);
      if (newSet.has(clientId)) {
        newSet.delete(clientId);
      } else {
        newSet.add(clientId);
      }
      return newSet;
    });
  };

  const toggleAllClients = () => {
    if (allCollapsed) {
      setExpandedClients(new Set(wipTableData.map(client => client.id)));
      setAllCollapsed(false);
    } else {
      setExpandedClients(new Set());
      setAllCollapsed(true);
    }
  };

  const totalClients = wipData.length;
  const totalJobs = wipData.reduce((sum, client) => sum + client.jobs.length, 0);
  const totalWIP = wipData.reduce((sum, client) => 
    sum + client.jobs.reduce((jobSum, job) => jobSum + job.wipAmount, 0), 0
  );
  const readyToInvoice = wipData.reduce((sum, client) => 
    sum + client.jobs.filter(job => job.actionStatus === 'ready-to-invoice').length, 0
  );
  const readyToInvoiceAmount = wipData.reduce((sum, client) => 
    sum + client.jobs.filter(job => job.actionStatus === 'ready-to-invoice').reduce((jobSum, job) => jobSum + job.toInvoice, 0), 0
  );

  return (
    <div className="space-y-6">

      {/* Summary Cards */}
      <WIPTableSummaryCards
        totalClients={totalClients}
        totalJobs={totalJobs}
        totalWIP={totalWIP}
        readyToInvoice={readyToInvoice}
        readyToInvoiceAmount={readyToInvoiceAmount}
      />

      {/* Filters and Controls */}
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium">Target Met:</label>
            <div className="flex items-center gap-1 bg-muted rounded-md p-1">
              <Button
                variant={targetMetFilter === 'all' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setTargetMetFilter('all')}
                className="h-8 px-3 text-xs"
              >
                All
              </Button>
              <Button
                variant={targetMetFilter === 'yes' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setTargetMetFilter('yes')}
                className="h-8 px-3 text-xs"
              >
                Yes
              </Button>
              <Button
                variant={targetMetFilter === 'no' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setTargetMetFilter('no')}
                className="h-8 px-3 text-xs"
              >
                No
              </Button>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={toggleAllClients}
            className="gap-2"
          >
            {allCollapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
            {allCollapsed ? 'Expand All' : 'Collapse All'}
          </Button>
          <Button
            variant={showWarningJobsOnly ? 'default' : 'outline'}
            size="sm"
            onClick={() => setShowWarningJobsOnly(!showWarningJobsOnly)}
          >
            WIP Warning Jobs
          </Button>
        </div>
      </div>

      {/* WIP Table */}
        <WIPTable
          wipData={wipData}
          expandedClients={expandedClients}
          onToggleClient={toggleClient}
          targetMetFilter={targetMetFilter}
          onInvoiceCreate={onInvoiceCreate}
          onWriteOff={onWriteOff}
          showManualReviewOnly={showManualReviewOnly}
          warningPercentage={warningPercentage}
          showWarningJobsOnly={showWarningJobsOnly}
        />
    </div>
  );
};

export default WIPTableTab;