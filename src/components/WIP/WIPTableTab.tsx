import React, { useState, useMemo, useEffect } from 'react';
import { WIPTableSummaryCards } from './WIPTableSummaryCards';
import { WIPTable } from "@/components/WIPTable/WIPTable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronDown, ChevronUp, Search } from 'lucide-react';
import { useGetWipQuery } from '@/store/wipApi';
import { useDebounce } from 'use-debounce';
import { useGetCurrentUserQuery } from '@/store/authApi';
import { WIPClient } from '@/types/wipTable';

interface WIPTableTabProps {
  onInvoiceCreate?: (invoice: any) => void;
  onWriteOff?: (writeOffEntry: any) => void;
}

const WIPTableTab = ({ onInvoiceCreate, onWriteOff }: WIPTableTabProps) => {
  const [expandedClients, setExpandedClients] = useState<Set<string>>(new Set());
  const [allCollapsed, setAllCollapsed] = useState(false);
  const [targetMetFilter, setTargetMetFilter] = useState<string>('all');
  const [showManualReviewOnly, setShowManualReviewOnly] = useState(false);
  const [showWarningJobsOnly, setShowWarningJobsOnly] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [debouncedSearch] = useDebounce(searchQuery, 400);
  const { data: wipResp, refetch: refetchWip } = useGetWipQuery({
    page,
    limit,
    serach: debouncedSearch || undefined,
    targetMetCondition: targetMetFilter === 'yes' ? '2' : targetMetFilter === 'no' ? '1' : undefined,
    WIPWarningJobs: showWarningJobsOnly || undefined,
  });
  const { data: currentUserResp }: any = useGetCurrentUserQuery();

  const warningPercentage = useMemo(() => {
    const settings = currentUserResp?.data?.settings;
    const pct = Array.isArray(settings) && settings[0]?.wipWarningPercentage;
    return typeof pct === 'number' ? pct : 80;
  }, [currentUserResp]);

  const wipData: WIPClient[] = useMemo(() => {
    const raw = wipResp?.data || [];
    const mapOpenBalances = (balances: any[]): { id: string; amount: number; type?: string; status?: string; createdAt?: string; jobId?: string }[] => {
      if (!Array.isArray(balances)) return [];
      return balances.map((ob: any) => ({
        id: String(ob._id || ob.id || Math.random()),
        amount: Number(ob.amount || 0),
        type: ob.type || undefined,
        status: ob.status || undefined,
        createdAt: ob.createdAt || undefined,
        jobId: ob.jobId ? String(ob.jobId) : undefined,
      }));
    };
    return raw.map((client: any) => {
      const triggerAmount = client?.clientWipTraget?.amount;
      
      // Calculate total WIP for client: sum of all jobs' wipAmount + wipTotalOpenBalance + clientWipTotalOpenBalance + importedWipBalance
      const clientWIPBalance = Number(client.clientWipTotalOpenBalance || 0);
      const importedWipBalance = Number(client.importedWipBalance || 0);
      const jobsTotalWIP = (client.jobs || []).reduce((sum: number, job: any) => {
        const jobWipAmount = Number(job.wipAmount || 0);
        const jobWipOpenBalance = Number(job.wipTotalOpenBalance || 0);
        return sum + jobWipAmount + jobWipOpenBalance;
      }, 0);
      const totalClientWIP = clientWIPBalance + jobsTotalWIP + importedWipBalance;
      
      const clientOpenBalances = mapOpenBalances(client.clientWipOpenBalance);

      return {
        id: client._id,
        clientName: client.name,
        clientCode: client.clientRef,
        address: client.address || '',
        company: client.company || undefined,
        clientWipOpenBalanceIds: Array.isArray(client.clientWipOpenBalance)
          ? client.clientWipOpenBalance.map((ob: any) => ob._id)
          : [],
        clientOpenBalances,
        trigger: triggerAmount ? `threshold-${triggerAmount}` : null,
        lastInvoiced: null,
        daysSinceLastInvoice: null,
        activeExpenses: Array.isArray(client?.expensesData) && client.expensesData.length > 0
          ? client.expensesData.map((exp: any) => ({
              id: exp._id,
              description: exp.description || '',
              submittedBy: exp.submittedBy || '',
              amount: Number(exp.netAmount || 0),
              hasAttachment: Array.isArray(exp.attachments) && exp.attachments.length > 0,
              dateLogged: exp.date,
              vatPercentage: Number(exp.vatPercentage || 0),
              totalAmount: Number(exp.totalAmount || 0),
              category: exp.expreseCategory || 'General',
              status: exp.status === 'yes' ? 'invoiced' : 'not invoiced',
              client: client.name,
              attachments: exp.attachments || [],
            }))
          : [],
        jobs: (client.jobs || []).map((job: any) => {
          const status = job.status === 'completed' ? 'completed' : job.status === 'inProgress' ? 'active' : 'on-hold';
          // For each job: wipAmount + wipTotalOpenBalance
          const jobWipAmount = Number(job.wipAmount || 0);
          const jobWipOpenBalance = Number(job.wipTotalOpenBalance || 0);
          const totalJobWIP = jobWipAmount + jobWipOpenBalance;
          const jobTriggerAmount = job?.jobWipTraget?.amount;
          const jobOpenBalances = mapOpenBalances(job.wipopenbalances);
          return {
            id: job._id,
            jobName: job.name,
            jobStatus: status,
            hoursLogged: (job.wipDuration || 0) / 3600,
            wipAmount: totalJobWIP,
            invoicedToDate: 0,
            toInvoice: 0,
            lastInvoiced: null,
            daysSinceLastInvoice: null,
            trigger: jobTriggerAmount ? `threshold-${jobTriggerAmount}` : null,
            triggerMet: false,
            actionStatus: 'upcoming',
            jobFee: Number(job.jobCost || 0),
            wipBreakdown: job.wipBreakdown || [],
            wipOpenBalanceIds: Array.isArray(job.wipopenbalances)
              ? job.wipopenbalances.map((ob: any) => ob._id)
              : [],
            openBalances: jobOpenBalances,
            startDate: job.startDate || null,
            endDate: job.endDate || null,
          };
        }),
        clientWipBalance: totalClientWIP,
        wipBreakdown: client.wipBreakdown || [],
        importedWipBalance: importedWipBalance
      } as WIPClient;
    });
  }, [wipResp]);


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
      setAllCollapsed(newSet.size === 0);
      return newSet;
    });
  };

  const filteredWipData = wipData;

  useEffect(() => {
    setExpandedClients(prev => {
      const availableIds = filteredWipData.map(client => client.id);
      const next = new Set<string>();
      prev.forEach(id => {
        if (availableIds.includes(id)) next.add(id);
      });
      if (!allCollapsed && next.size === 0) {
        availableIds.forEach(id => next.add(id));
      }
      return next;
    });
  }, [filteredWipData, allCollapsed]);

  const toggleAllClients = () => {
    if (allCollapsed) {
      setExpandedClients(new Set(filteredWipData.map(client => client.id)));
      setAllCollapsed(false);
    } else {
      setExpandedClients(new Set());
      setAllCollapsed(true);
    }
  };

  const apiSummary = (wipResp as any)?.summary || {};
  const totalClients = typeof apiSummary.totalClients === 'number' ? apiSummary.totalClients : filteredWipData.length;
  const totalJobs = typeof apiSummary.totalJobs === 'number' ? apiSummary.totalJobs : filteredWipData.reduce((sum, client) => sum + client.jobs.length, 0);
  const totalWIP = typeof apiSummary.totalWipAmount === 'number' ? apiSummary.totalWipAmount : filteredWipData.reduce((sum, client) =>
    sum + client.jobs.reduce((jobSum, job) => jobSum + job.wipAmount, 0), 0
  );
  const readyToInvoiceAmount = typeof apiSummary.totalInvoicedAmount === 'number' ? apiSummary.totalInvoicedAmount : 0;
  const readyToInvoice = Array.isArray((wipResp as any)?.data)
    ? ((wipResp as any).data as any[]).filter((c: any) => c.clientTargetMet === '2').length
    : 0;

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
      <div className="flex justify-between items-center mb-4 p-[6px] rounded-sm bg-[#E7E5F2] ">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium">Target Met:</label>
            <div className="flex items-center gap-1 bg-muted rounded-md p-1">
              <Button
                variant={targetMetFilter === 'all' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setTargetMetFilter('all')}
                className="h-8 px-3 text-xs rounded-sm"
              >
                N/A
              </Button>
              <Button
                variant={targetMetFilter === 'yes' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setTargetMetFilter('yes')}
                className="h-8 px-3 text-xs rounded-sm"
              >
                Yes
              </Button>
              <Button
                variant={targetMetFilter === 'no' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setTargetMetFilter('no')}
                className="h-8 px-3 text-xs rounded-sm"
              >
                No
              </Button>
            </div>
          </div>
          <div className="relative flex-1 w-full max-w-[200px]">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Search..." 
              className="pl-10 w-[200px] bg-white text-[#381980] font-semibold placeholder:text-[#381980]" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
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
            Show WIP Warning
          </Button>
        </div>
      </div>

      {/* WIP Table */}
        <WIPTable
          wipData={filteredWipData}
          expandedClients={expandedClients}
          onToggleClient={toggleClient}
          targetMetFilter={targetMetFilter}
          onInvoiceCreate={(invoice) => { if (onInvoiceCreate) onInvoiceCreate(invoice); refetchWip(); }}
          onWriteOff={onWriteOff}
          showManualReviewOnly={showManualReviewOnly}
          warningPercentage={warningPercentage}
          showWarningJobsOnly={showWarningJobsOnly}
          onWipMutated={() => { refetchWip(); }}
        />
      {/* Pagination Controls */}
      {wipResp?.pagination && (
        <div className="space-y-4 mt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Show:</span>
              <select
                value={limit}
                onChange={(e) => { setPage(1); setLimit(Number(e.target.value)); }}
                className="border border-gray-300 rounded px-2 py-1 text-sm"
              >
                <option value={5}>5 per page</option>
                <option value={10}>10 per page</option>
                <option value={20}>20 per page</option>
                <option value={50}>50 per page</option>
                <option value={100}>100 per page</option>
                <option value={250}>250 per page</option>
                <option value={500}>500 per page</option>
              </select>
            </div>
            <div className="text-sm text-gray-500">
              {(() => {
                const total = wipResp.pagination!.totalCount;
                const start = total > 0 ? ((page - 1) * limit) + 1 : 0;
                const end = Math.min(page * limit, total);
                return `Showing ${start} to ${end} of ${total} clients`;
              })()}
            </div>
          </div>
          {(() => {
            const totalPages = Math.max(1, Math.ceil((wipResp.pagination!.totalCount || 0) / limit));
            if (totalPages <= 1) return null;
            return (
              <div className="flex justify-center items-center gap-2">
                <Button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} variant="outline" size="sm">Previous</Button>
                <Button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages} variant="outline" size="sm">Next</Button>
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
};

export default WIPTableTab;