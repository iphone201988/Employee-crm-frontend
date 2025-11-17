import React, { useState, useMemo } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { ChevronDown, ChevronRight, Check, X, AlertTriangle, ArrowRightLeft, ArrowUpDown } from 'lucide-react';
import ActiveExpensesDialog from '@/components/ActiveExpensesDialog';
import TimeLogsBreakdownDialog from '@/components/TimeLogsBreakdownDialog';
import { formatCurrency } from '@/lib/currency';
import { WIPClient } from '@/types/wipTable';
import {  formatDate } from '@/utils/wipTableUtils';
import { InvoicePreviewDialog } from '@/components/InvoicePreviewDialog';
import WIPOpeningBalanceDialog from '@/components/WIPOpeningBalanceDialog';
import { useGetDropdownOptionsQuery } from '@/store/teamApi';
import { useAddWipOpenBalanceMutation, useAttachWipTargetMutation } from '@/store/wipApi';
import { toast } from 'sonner';
import ClientDetailsDialog from '@/components/ClientDetailsDialog';
import { useGetClientQuery } from '@/store/clientApi';
import { Label } from "@/components/ui/label";
import { JobDetailsDialog } from '@/components/JobDetailsDialog';

interface WIPTableProps {
  wipData: WIPClient[];
  expandedClients: Set<string>;
  onToggleClient: (clientId: string) => void;
  targetMetFilter?: string;
  onInvoiceCreate?: (invoice: any) => void;
  onWriteOff?: (writeOffEntry: any) => void;
  showManualReviewOnly?: boolean;
  warningPercentage?: number;
  showWarningJobsOnly?: boolean;
  onWipMutated?: () => void;
}

export const WIPTable = ({ wipData, expandedClients, onToggleClient, targetMetFilter = 'all', onInvoiceCreate, onWriteOff, showManualReviewOnly = false, warningPercentage = 80, showWarningJobsOnly = false, onWipMutated }: WIPTableProps) => {
  const [invoiceLevel, setInvoiceLevel] = useState<{ [key: string]: 'client' | 'job' }>({});
  const [clientTriggers, setClientTriggers] = useState<{ [key: string]: string }>({});
  const [jobTriggers, setJobTriggers] = useState<{ [key: string]: string }>({});
  const [showInvoiceDialog, setShowInvoiceDialog] = useState(false);
  const [selectedInvoiceData, setSelectedInvoiceData] = useState<any>(null);
  const [showWIPBalanceDialog, setShowWIPBalanceDialog] = useState(false);
  const [wipBalanceData, setWIPBalanceData] = useState<any>(null);
  const [showActiveExpensesDialog, setShowActiveExpensesDialog] = useState(false);
  const [selectedExpensesData, setSelectedExpensesData] = useState<any>(null);
  const [showTimeLogsDialog, setShowTimeLogsDialog] = useState(false);
  const [selectedTimeLogsData, setSelectedTimeLogsData] = useState<any>(null);
  const [showTransferDialog, setShowTransferDialog] = useState(false);
  const [transferData, setTransferData] = useState<any>(null);
  const [showInvoiceOptionsDialog, setShowInvoiceOptionsDialog] = useState(false);
  const [pendingInvoiceData, setPendingInvoiceData] = useState<any>(null);
  const [openLogInvoiceOnly, setOpenLogInvoiceOnly] = useState(false);
  const [addWipOpenBalance] = useAddWipOpenBalanceMutation();
  const [attachWipTarget] = useAttachWipTargetMutation();

  // Client details dialog state
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [showClientDetailsDialog, setShowClientDetailsDialog] = useState(false);
  const { data: selectedClientData } = useGetClientQuery(selectedClientId as string, { skip: !selectedClientId });

  // Job details dialog state
  const [viewingJob, setViewingJob] = useState<any | null>(null);
  const [viewJobDialogOpen, setViewJobDialogOpen] = useState(false);

  // Fetch dynamic WIP target amount options
  const { data: wipTargetsResp } = useGetDropdownOptionsQuery('wipTargetAmount');
  const wipTargetAmountOptions = (wipTargetsResp?.data?.wipTargetAmount || []).map((item: any) => ({
    value: `threshold-${item.amount}`,
    label: `WIP of €${Number(item.amount).toLocaleString()}`
  }));

  const resolveWipTargetId = (triggerValue: string) => {
    if (!triggerValue?.includes('threshold')) return undefined;
    const amountStr = triggerValue.split('-')[1];
    const amountNum = Number(amountStr);
    const found = (wipTargetsResp?.data?.wipTargetAmount || []).find((it: any) => Number(it.amount) === amountNum);
    return found?._id;
  };

  // Helper function to format combined last invoiced info
  const formatLastInvoiced = (date: string | null, daysSince: number | null) => {
    if (!date) return 'Never';
    const formattedDate = formatDate(date);
    if (daysSince !== null && daysSince > 0) {
      return `${formattedDate} (${daysSince} days ago)`;
    }
    return formattedDate;
  };

  const getWarningIcon = (job: any) => {
    const wipPercentage = (job.wipAmount / job.jobFee) * 100;
    return wipPercentage >= warningPercentage ? (
      <AlertTriangle className="h-4 w-4  text-red-500 ml-1 " />
    ) : null;
  };

  const handleInvoiceNow = (client: any, job?: any) => {
    // Build itemized team breakdown for invoice (deduped for client-level)
    const buildMembersBreakdown = () => {
      const toSeconds = (v: any) => Number(v || 0);
      if (job) {
        const jb: any = job as any;
        const breakdown = Array.isArray(jb.wipBreakdown) ? jb.wipBreakdown : [];
        // Compute strictly from this job's tasks per user to avoid any cross-client mixing
        return breakdown.map((m: any) => {
          const tasks = Array.isArray(m.tasks) ? m.tasks : [];
          const seconds = tasks.reduce((sum: number, t: any) => sum + toSeconds(t.duration), 0);
          return {
            userName: m.userName || 'Team Member',
            seconds,
            billableRate: Number(m.billableRate || 0),
          };
        });
      }
      // Client-level: merge client and jobs, dedupe tasks by timeLogId
      const clientBreakdown = Array.isArray((client as any).wipBreakdown) ? (client as any).wipBreakdown : [];
      const jobsBreakdowns = (client.jobs || []).flatMap((j: any) => Array.isArray(j.wipBreakdown) ? j.wipBreakdown : []);
      const merged = [...clientBreakdown, ...jobsBreakdowns];
      const taskSeen = new Set<string>();
      const userAgg: Record<string, { seconds: number; billableRate?: number }> = {};
      merged.forEach((member: any) => {
        const tasks = Array.isArray(member.tasks) ? member.tasks : [];
        tasks.forEach((t: any) => {
          const id = String(t.timeLogId || `${member._id}-${t.date}-${t.amount}`);
          if (taskSeen.has(id)) return;
          taskSeen.add(id);
          const key = member.userName || 'Team Member';
          if (!userAgg[key]) userAgg[key] = { seconds: 0, billableRate: undefined };
          userAgg[key].seconds += toSeconds(t.duration);
          const rateNum = Number(member.billableRate || 0);
          if (!userAgg[key].billableRate && rateNum > 0) {
            userAgg[key].billableRate = rateNum;
          }
        });
      });
      return Object.entries(userAgg).map(([userName, v]) => ({ userName, seconds: v.seconds, billableRate: v.billableRate }));
    };
    const collectTimeLogIds = (): string[] => {
      const ids = new Set<string>();
      const addFrom = (arr: any[]) => {
        arr.forEach((m: any) => (Array.isArray(m.tasks) ? m.tasks : []).forEach((t: any) => t.timeLogId && ids.add(String(t.timeLogId))));
      };
      if (job) {
        addFrom(((job as any).wipBreakdown) || []);
      } else {
        addFrom(((client as any).wipBreakdown) || []);
        (client.jobs || []).forEach((j: any) => addFrom(j.wipBreakdown || []));
      }
      return Array.from(ids);
    };
    const collectWipOpenBalanceIds = (): string[] => {
      if (job) return Array.isArray((job as any).wipOpenBalanceIds) ? (job as any).wipOpenBalanceIds : [];
      const clientIds = Array.isArray((client as any).clientWipOpenBalanceIds) ? (client as any).clientWipOpenBalanceIds : [];
      const jobIds = (client.jobs || []).flatMap((j: any) => Array.isArray(j.wipOpenBalanceIds) ? j.wipOpenBalanceIds : []);
      return Array.from(new Set<string>([...clientIds, ...jobIds]));
    };
    const collectExpenseIds = (): string[] => (client.activeExpenses || []).map((e: any) => String(e.id || e._id)).filter(Boolean);
    const invoiceData = {
      invoiceNumber: String(Math.floor(Math.random() * 90000) + 10000), // Generate 5-digit number
      clientName: client.clientName,
      clientCode: client.clientCode,
      clientAddress: client.address || '',
      amount: job ? job.wipAmount : (client as any).clientWipBalance || 0,
      date: new Date().toISOString(),
      status: 'issued' as const,
      jobName: job?.jobName,
      company: client.company || undefined,
      members: buildMembersBreakdown(),
      expenses: (client.activeExpenses || []).map((e: any) => ({
        id: e.id || String(Math.random()),
        description: e.description || '',
        amount: Number(e.totalAmount || e.amount || 0),
        vatPercentage: Number(e.vatPercentage || 0),
        locked: true
      })),
      clientId: client.id,
      scope: job ? 'job' : 'client',
      jobId: job?.id,
      timeLogIdsBase: collectTimeLogIds(),
      expenseIdsBase: collectExpenseIds(),
      wipOpenBalanceIdsBase: collectWipOpenBalanceIds(),
    };
    setPendingInvoiceData(invoiceData);
    setShowInvoiceOptionsDialog(true);
  };

  const handleGenerateInvoice = () => {
    setSelectedInvoiceData(pendingInvoiceData);
    setShowInvoiceOptionsDialog(false);
    setOpenLogInvoiceOnly(false);
    setShowInvoiceDialog(true);
  };

  const handleLogInvoiceOnly = () => {
    setSelectedInvoiceData(pendingInvoiceData);
    setShowInvoiceOptionsDialog(false);
    setOpenLogInvoiceOnly(true);
    setShowInvoiceDialog(true);
  };

  const handleInvoiceCreated = (invoice: any) => {
    if (onInvoiceCreate) {
      onInvoiceCreate(invoice);
    }

    // Calculate WIP balance after invoice
    const totalWIP = selectedInvoiceData?.amount || 0;
    const invoicedAmount = invoice.amount;
    const wipBalance = totalWIP - invoicedAmount;

    setShowInvoiceDialog(false);

    if (wipBalance > 0) {
      setWIPBalanceData({
        clientName: selectedInvoiceData?.clientName,
        wipBalance: wipBalance,
        invoiceNumber: invoice.invoiceNumber
      });
      setShowWIPBalanceDialog(true);
    } else {
      setSelectedInvoiceData(null);
    }
  };

  const handleCloseDialog = () => {
    setShowInvoiceDialog(false);
    setSelectedInvoiceData(null);
  };

  const handleCarryForward = () => {
    setShowWIPBalanceDialog(false);
    setWIPBalanceData(null);
    setSelectedInvoiceData(null);
  };

  const handleTransferWIP = (fromClient: string, toClient: string, amount: number) => {
    console.log(`Transferring ${formatCurrency(amount)} from ${fromClient} to ${toClient}`);
    setShowTransferDialog(false);
    setTransferData(null);
  };

  const [wipTableData, setWipTableData] = useState<WIPClient[]>(wipData);

  React.useEffect(() => {
    setWipTableData(wipData);
  }, [wipData]);

  const handleAddWIPBalance = async (clientId: string, amount: number, jobId?: string) => {
    try {
      const payload: any = jobId
        ? { type: 'job', amount, jobId }
        : { type: 'client', amount, clientId };
      await addWipOpenBalance(payload).unwrap();
      if (onWipMutated) onWipMutated();

      setWipTableData(prevData =>
        prevData.map(client => {
          if (client.id === clientId) {
            if (jobId) {
              // Update job WIP and recalculate client total
              const updatedJobs = client.jobs.map(job =>
                job.id === jobId
                  ? { ...job, wipAmount: job.wipAmount + amount }
                  : job
              );

              // Recalculate client WIP balance from all jobs
              const totalJobsWIP = updatedJobs.reduce((sum, job) => sum + job.wipAmount, 0);

              return {
                ...client,
                jobs: updatedJobs,
                clientWipBalance: totalJobsWIP + ((client as any).clientWipBalance || 0) - client.jobs.reduce((sum, job) => sum + job.wipAmount, 0)
              } as any;
            } else {
              // For client-level, increase client WIP balance
              const currentBalance = (client as any).clientWipBalance || 0;
              return {
                ...client,
                clientWipBalance: currentBalance + amount
              } as any;
            }
          }
          return client;
        })
      );

      toast.success('WIP balance added successfully');
    } catch (e) {
      console.error('Failed to add WIP balance', e);
      toast.error('Failed to add WIP balance');
    }
  };

  const handleWriteOff = () => {
    if (wipBalanceData && onWriteOff) {
      const writeOffEntry = {
        id: Date.now().toString(),
        clientName: wipBalanceData.clientName,
        amount: wipBalanceData.wipBalance,
        dateWrittenOff: new Date().toISOString(),
        reason: 'WIP Balance Write-off',
        invoiceNumber: wipBalanceData.invoiceNumber
      };
      onWriteOff(writeOffEntry);
    }
    setShowWIPBalanceDialog(false);
    setWIPBalanceData(null);
    setSelectedInvoiceData(null);
  };

  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);

  const handleSort = (key: string) => {
    setSortConfig(current => {
      if (current?.key === key) {
        return current.direction === 'desc'
          ? { key, direction: 'asc' }
          : null;
      }
      return { key, direction: 'desc' };
    });
  };

  const getSortIcon = (key: string) => {
    if (sortConfig?.key !== key) {
      return <ArrowUpDown className="ml-1 !h-3 !w-3 opacity-50" />;
    }
    return <ArrowUpDown className={`ml-1 !h-3 !w-3 ${sortConfig.direction === 'desc' ? 'rotate-180' : ''}`} />;
  };

  // Filter data based on filters
  const filteredWipData = wipTableData.filter(client => {
    // Manual review filter
    if (showManualReviewOnly) {
      const hasManualReviewJobs = client.jobs.some(job => job.trigger === 'manual-review');
      if (!hasManualReviewJobs) return false;
    }

    // Warning jobs filter
    if (showWarningJobsOnly) {
      const hasWarningJobs = client.jobs.some(job => {
        const wipPercentage = (job.wipAmount / job.jobFee) * 100;
        return wipPercentage >= warningPercentage;
      });
      if (!hasWarningJobs) return false;
    }

    if (targetMetFilter === 'all') return true;

    const clientInvoiceLevel = invoiceLevel[client.id] || 'client';

    let passesTargetMetFilter = true;

    if (clientInvoiceLevel === 'client') {
      const currentTrigger = (clientTriggers[client.id] || (client as any).trigger) as string | undefined;
      const isThreshold = !!currentTrigger && currentTrigger.includes('threshold');
      const totalWIP = client.jobs.reduce((sum, job) => sum + job.wipAmount, 0);
      const reached = isThreshold ? (totalWIP >= parseFloat(currentTrigger!.split('-')[1])) : undefined;

      if (targetMetFilter === 'yes') passesTargetMetFilter = isThreshold && reached === true;
      else if (targetMetFilter === 'no') passesTargetMetFilter = isThreshold && reached === false;
      else if (targetMetFilter === 'na') passesTargetMetFilter = !isThreshold;
      else passesTargetMetFilter = true;
    } else {
      // invoiceLevel === 'job' → match ANY job for the selected filter
      const anyMatch = client.jobs.some(job => {
        const currentTrigger = (jobTriggers[job.id] || job.trigger) as string | undefined;
        const isThreshold = !!currentTrigger && currentTrigger.includes('threshold');
        const reached = isThreshold ? (job.wipAmount >= parseFloat(currentTrigger!.split('-')[1])) : undefined;

        if (targetMetFilter === 'yes') return isThreshold && reached === true;
        if (targetMetFilter === 'no') return isThreshold && reached === false;
        if (targetMetFilter === 'na') return !isThreshold;
        return true;
      });
      passesTargetMetFilter = anyMatch;
    }

    return passesTargetMetFilter;
  });

  // Sort filtered data
  const sortedWipData = useMemo(() => {
    if (!sortConfig) return filteredWipData;
    return [...filteredWipData].sort((a, b) => {
      let aValue: any;
      let bValue: any;
      
      switch (sortConfig.key) {
        case 'clientName':
          aValue = a.clientName;
          bValue = b.clientName;
          break;
        case 'jobs':
          aValue = a.jobs.length;
          bValue = b.jobs.length;
          break;
        case 'wipBalance':
          aValue = (a as any).clientWipBalance || 0;
          bValue = (b as any).clientWipBalance || 0;
          break;
        case 'expenses':
          aValue = a.activeExpenses.reduce((sum, exp) => sum + exp.amount, 0);
          bValue = b.activeExpenses.reduce((sum, exp) => sum + exp.amount, 0);
          break;
        case 'lastInvoiced':
          aValue = a.lastInvoiced ? new Date(a.lastInvoiced).getTime() : 0;
          bValue = b.lastInvoiced ? new Date(b.lastInvoiced).getTime() : 0;
          break;
        default:
          return 0;
      }

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
  }, [filteredWipData, sortConfig]);

  // Get trigger options based on invoice level
  const getClientTriggerOptions = () => wipTargetAmountOptions;

  const getJobTriggerOptions = () => [
    { value: 'job-closed', label: 'Job Closed' },
    ...wipTargetAmountOptions
  ];
  return (
    <>
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b">
                <tr className='!bg-[#edecf4] text-[#381980]'>
                  <th className="text-left p-4 font-medium text-[12px] text-[hsl(var(--table-header))]">
                    <Button
                      variant="ghost"
                      onClick={() => handleSort('clientName')}
                      className="h-8 px-1 font-medium justify-start text-[12px] hover:bg-transparent hover:text-inherit !text-[#381980]"
                    >
                      Client Name / Job Name {getSortIcon('clientName')}
                    </Button>
                  </th>
                  <th className="text-center p-4 font-medium text-[12px] text-[hsl(var(--table-header))]">
                    <Button
                      variant="ghost"
                      onClick={() => handleSort('jobs')}
                      className="h-8 px-1 font-medium justify-start text-[12px] hover:bg-transparent hover:text-inherit !text-[#381980]"
                    >
                      Jobs {getSortIcon('jobs')}
                    </Button>
                  </th>
                  <th className="text-left p-4 font-medium text-[12px] text-[hsl(var(--table-header))]">
                    <Button
                      variant="ghost"
                      onClick={() => handleSort('wipBalance')}
                      className="h-8 px-1 font-medium justify-start text-[12px] hover:bg-transparent hover:text-inherit !text-[#381980]"
                    >
                      WIP Balance {getSortIcon('wipBalance')}
                    </Button>
                  </th>
                  <th className="text-center p-4 font-medium text-[12px] text-[hsl(var(--table-header))]">
                    <Button
                      variant="ghost"
                      onClick={() => handleSort('expenses')}
                      className="h-8 px-1 font-medium justify-start text-[12px] hover:bg-transparent hover:text-inherit !text-[#381980]"
                    >
                      Expenses {getSortIcon('expenses')}
                    </Button>
                  </th>
                  <th className="text-center p-4 font-medium text-[12px] text-[hsl(var(--table-header))]">
                    <Button
                      variant="ghost"
                      onClick={() => handleSort('lastInvoiced')}
                      className="h-8 px-1 font-medium justify-start text-[12px] hover:bg-transparent hover:text-inherit !text-[#381980]"
                    >
                      Last Invoiced {getSortIcon('lastInvoiced')}
                    </Button>
                  </th>
                  <th className="text-center p-4 font-medium text-[12px] text-[hsl(var(--table-header))]">Invoice Level</th>
                  <th className="text-left p-4 font-medium text-[12px] text-[hsl(var(--table-header))]">WIP Target</th>
                  <th className="text-center p-4 font-medium text-[12px] text-[hsl(var(--table-header))]">WIP Target Met</th>
                  <th className="text-center p-4 font-medium text-[12px] text-[hsl(var(--table-header))]">Ready To Invoice</th>
                </tr>
              </thead>
              <tbody>
                {sortedWipData.map((client) => (
                  <React.Fragment key={client.id}>
                    {/* Client Row */}
                    <tr className="border-b hover:bg-muted/50 bg-muted/20 h-14">
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => onToggleClient(client.id)}
                            className="flex items-center gap-1 hover:text-primary"
                          >
                            {expandedClients.has(client.id) ? (
                              <ChevronDown className="h-4 w-4" />
                            ) : (
                              <ChevronRight className="h-4 w-4" />
                            )}
                          </button>
                          <div className="font-semibold">
                            <span
                              className="cursor-pointer text-blue-600 hover:text-blue-800 hover:underline"
                              onClick={() => { setSelectedClientId(client.id); setShowClientDetailsDialog(true); }}
                            >
                              {client.clientName}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-center">
                        <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                          {client.jobs.length}
                        </Badge>
                      </td>
                      <td className="p-4 text-left">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => {
                              // Map API wipBreakdown to dialog timeLogs
                              const breakdown = (client as any).wipBreakdown || [];
                              const timeLogs = breakdown.flatMap((member: any) => {
                                const tasks = Array.isArray(member.tasks) ? member.tasks : [];
                                return tasks.map((t: any, idx: number) => ({
                                  id: String(t.timeLogId || `${member._id}-${idx}`),
                                  teamMember: member.userName || 'Team Member',
                                  hours: Number(t.duration || 0) / 3600,
                                  billableRate: Number(member.billableRate || 0),
                                  amount: Number(t.amount || 0),
                                  date: t.date,
                                  description: t.jobName || '',
                                }));
                              });
                              setSelectedTimeLogsData({
                                clientName: client.clientName,
                                timeLogs,
                                totalAmount: client.jobs.reduce((sum, job) => sum + job.wipAmount, 0)
                              });
                              setShowTimeLogsDialog(true);
                            }}
                            className={`inline-flex items-center px-2 py-1 rounded-full text-sm font-semibold cursor-pointer hover:opacity-80 ${(invoiceLevel[client.id] || 'client') === 'client'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-blue-100 text-blue-800'
                              }`}
                          >
                            {formatCurrency((client as any).clientWipBalance || 0)}
                          </button>
                          {(() => {
                            const totalWIP = client.jobs.reduce((sum, job) => sum + job.wipAmount, 0);
                            const totalJobFee = client.jobs.reduce((sum, job) => sum + job.jobFee, 0);
                            return null; // Remove warning icon from client row
                          })()}
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-6 w-6 p-0 rounded-full"
                            onClick={() => {
                              setWIPBalanceData({
                                clientName: client.clientName,
                                wipBalance: client.jobs.reduce((sum, job) => sum + job.wipAmount, 0),
                                clientId: client.id,
                                onAddBalance: (amount: number) => handleAddWIPBalance(client.id, amount)
                              });
                              setShowWIPBalanceDialog(true);
                            }}
                          >
                            +
                          </Button>
                        </div>
                      </td>
                      <td className="p-4 text-center">
                        <button
                          onClick={() => {
                            setSelectedExpensesData({
                              clientName: client.clientName,
                              expenses: client.activeExpenses
                            });
                            setShowActiveExpensesDialog(true);
                          }}
                          className={`inline-flex items-center px-2 py-1 rounded-full text-sm font-semibold cursor-pointer hover:opacity-80 ${
                            client.activeExpenses.reduce((sum, exp) => sum + exp.amount, 0) > 0
                              ? 'bg-orange-100 text-orange-800'
                              : 'bg-gray-100 text-gray-500'
                          }`}
                        >
                          {(() => {
                            const total = client.activeExpenses.reduce((sum, exp) => sum + exp.amount, 0);
                            return total > 0 ? formatCurrency(total) : 'N/A';
                          })()}
                        </button>
                      </td>
                      <td className="p-4 text-center">{formatLastInvoiced(client.lastInvoiced, client.daysSinceLastInvoice)}</td>
                      <td className="p-4 text-center">
                        <div className="inline-flex items-center justify-center">
                          <button
                            onClick={() =>
                              setInvoiceLevel(prev => ({ ...prev, [client.id]: 'client' }))
                            }
                            className={`px-3 py-1.5 h-7 text-xs font-medium border transition-colors
        ${(invoiceLevel[client.id] || 'client') === 'client'
                                ? 'bg-[#5f46b9] text-white border-[#5f46b9]'
                                : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-100'
                              }
        rounded-l-full`}
                          >
                            Client
                          </button>

                          <button
                            onClick={() => {
                              setInvoiceLevel(prev => ({ ...prev, [client.id]: 'job' }));
                              if (!expandedClients.has(client.id)) {
                                onToggleClient(client.id);
                              }
                            }}
                            className={`px-3 py-1.5 h-7 text-xs font-medium border transition-colors
        ${(invoiceLevel[client.id] || 'client') === 'job'
                                ? 'bg-[#5f46b9] text-white border-[#5f46b9]'
                                : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-100'
                              }
        rounded-r-full -ml-px`}
                          >
                            Job
                          </button>
                        </div>
                      </td>

                      <td className="p-4 text-center">
                        {(invoiceLevel[client.id] || 'client') === 'client' ? (
                          <Select
                            value={clientTriggers[client.id] || client.trigger || 'threshold-1000'}
                            onValueChange={async (value) => {
                              setClientTriggers(prev => ({ ...prev, [client.id]: value }));
                              const wipTargetId = resolveWipTargetId(value);
                              if (wipTargetId) {
                                try {
                                  await attachWipTarget({ type: 'client', clientId: client.id, wipTargetId }).unwrap();
                                } catch (err) {
                                  // noop: keep UI state, backend failure won't break other flows
                                }
                              }
                            }}
                          >
                            <SelectTrigger className="w-40 h-8 text-xs">
                              <SelectValue placeholder="Select trigger" />
                            </SelectTrigger>
                            <SelectContent>
                              {getClientTriggerOptions().map(option => (
                                <SelectItem key={option.value} value={option.value}>
                                  {option.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          '-'
                        )}
                      </td>
                      <td className="p-4 text-center">
                        {(invoiceLevel[client.id] || 'client') === 'client' ? (
                          <div className="flex justify-center">
                            {(() => {
                              // Use clientWipBalance which includes client open balance + all jobs' wipAmount + job open balances
                              const totalWIP = (client as any).clientWipBalance || 0;
                              const currentTrigger = (clientTriggers[client.id] || (client as any).trigger) as string | undefined;
                              const isThreshold = !!currentTrigger && currentTrigger.includes('threshold');
                              if (!isThreshold) {
                                return <span className="text-xs text-muted-foreground">N/A</span>;
                              }
                              const triggerMet = totalWIP >= parseFloat(currentTrigger.split('-')[1]);
                              return triggerMet ? (
                                <Check className="h-4 w-4 text-green-600" />
                              ) : (
                                <X className="h-4 w-4 text-red-600" />
                              );
                            })()}
                          </div>
                        ) : (
                          '-'
                        )}
                      </td>
                      <td className="p-4 text-center">
                        {(invoiceLevel[client.id] || 'client') === 'client' ? (
                          (() => {
                            // Use clientWipBalance which includes client open balance + all jobs' wipAmount + job open balances
                            const totalWIP = (client as any).clientWipBalance || 0;
                            const currentTrigger = (clientTriggers[client.id] || (client as any).trigger) as string | undefined;
                            const isThreshold = !!currentTrigger && currentTrigger.includes('threshold');
                            if (!isThreshold) {
                              return <Badge variant="secondary" className="bg-gray-100 text-gray-800 text-xs">N/A</Badge>;
                            }
                            const triggerMet = totalWIP >= parseFloat(currentTrigger.split('-')[1]);
                            return triggerMet ? (
                              <Badge
                                variant="secondary"
                                className="bg-green-100 text-green-800 text-xs cursor-pointer hover:bg-green-200"
                                onClick={() => handleInvoiceNow(client)}
                              >
                                Invoice Now
                              </Badge>
                            ) : (
                              <Badge variant="secondary" className="bg-red-100 text-red-800 text-xs">
                                Not Ready
                              </Badge>
                            );
                          })()
                        ) : (
                          '-'
                        )}
                      </td>
                    </tr>


                    {/* Job Rows */}
                    {expandedClients.has(client.id) && client.jobs.map((job) => (
                      <tr key={job.id} className="border-b hover:bg-muted/50 h-14" style={{ backgroundColor: '#F5F3F9' }}>
                        <td className="p-4 pl-12 text-sm">
                          <div className="flex items-center">
                            <span
                              className="cursor-pointer text-blue-600 hover:text-blue-800 hover:underline"
                              onClick={() => {
                                setViewingJob({
                                  jobId: job.id,
                                  name: job.jobName,
                                  jobCost: job.jobFee,
                                  actualCost: job.wipAmount,
                                  status: job.jobStatus,
                                  clientName: client.clientName,
                                  hoursLogged: job.hoursLogged || 0,
                                });
                                setViewJobDialogOpen(true);
                              }}
                            >
                              {job.jobName}
                            </span>
                            {getWarningIcon(job)}
                          </div>
                        </td>
                        <td className="p-4 text-center text-sm">
                          <div className="flex flex-col items-center gap-2">
                            <div className="text-xs text-muted-foreground">
                              Job Fee: {job.jobFee > 0 ? formatCurrency(job.jobFee) : 'N/A'}
                            </div>
                            {/* Progress Bar */}
                            {job.jobFee > 0 && (
                              <div className="flex flex-col items-center">
                                <div className="w-20 bg-gray-200 rounded-full h-2">
                                  <div
                                    className={`h-2 rounded-full transition-all duration-300 ${(job.wipAmount / job.jobFee) * 100 >= warningPercentage
                                      ? 'bg-red-500'
                                      : ''
                                      }`}
                                    style={{
                                      backgroundColor: (job.wipAmount / job.jobFee) * 100 < warningPercentage ? '#38A24B' : undefined,
                                      width: `${Math.min((job.wipAmount / job.jobFee) * 100, 100)}%`
                                    }}
                                  ></div>
                                </div>
                                <div className="text-xs text-center mt-1 text-muted-foreground">
                                  {Math.round((job.wipAmount / job.jobFee) * 100)}%
                                </div>
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="p-4 text-center text-sm">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => {
                                const j: any = job as any;
                                const breakdown = j.wipBreakdown || [];
                                const timeLogs = breakdown.flatMap((member: any) => {
                                  const tasks = Array.isArray(member.tasks) ? member.tasks : [];
                                  return tasks.map((t: any, idx: number) => ({
                                    id: String(t.timeLogId || `${member._id}-${idx}`),
                                    teamMember: member.userName || 'Team Member',
                                    hours: Number(t.duration || 0) / 3600,
                                    billableRate: Number(member.billableRate || 0),
                                    amount: Number(t.amount || 0),
                                    date: t.date,
                                    description: t.jobName || '',
                                  }));
                                });
                                setSelectedTimeLogsData({
                                  clientName: client.clientName,
                                  jobName: job.jobName,
                                  timeLogs,
                                  totalAmount: job.wipAmount
                                });
                                setShowTimeLogsDialog(true);
                              }}
                              className={`inline-flex items-center px-2 py-1 rounded-full text-sm font-semibold cursor-pointer hover:opacity-80 ${(invoiceLevel[client.id] || 'client') === 'job'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-blue-100 text-blue-800'
                                }`}
                            >
                              {formatCurrency(job.wipAmount)}
                            </button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-6 w-6 p-0 rounded-full"
                              onClick={() => {
                                setWIPBalanceData({
                                  clientName: client.clientName,
                                  jobName: job.jobName,
                                  wipBalance: job.wipAmount,
                                  clientId: client.id,
                                  jobId: job.id,
                                  jobStartDate: (job as any).startDate,
                                  jobEndDate: (job as any).endDate,
                                  onAddBalance: (amount: number) => handleAddWIPBalance(client.id, amount, job.id)
                                });
                                setShowWIPBalanceDialog(true);
                              }}
                            >
                              +
                            </Button>
                          </div>
                        </td>
                        <td className="p-4 text-center text-sm">
                          <span className="text-sm text-muted-foreground">-</span>
                        </td>
                        <td className="p-4 text-center text-sm">{formatLastInvoiced(job.lastInvoiced, job.daysSinceLastInvoice)}</td>
                        <td className="p-4 text-center">
                          <span className="text-sm text-muted-foreground">-</span>
                        </td>
                        <td className="p-4 text-center">
                          {(invoiceLevel[client.id] || 'client') === 'job' ? (
                            <Select
                              value={jobTriggers[job.id] || job.trigger || 'job-closed'}
                              onValueChange={async (value) => {
                                setJobTriggers(prev => ({ ...prev, [job.id]: value }));
                                const wipTargetId = resolveWipTargetId(value);
                                if (wipTargetId) {
                                  try {
                                    await attachWipTarget({ type: 'job', jobId: job.id, wipTargetId }).unwrap();
                                  } catch (err) {
                                    // noop
                                  }
                                }
                              }}
                            >
                              <SelectTrigger className="w-40 h-8 text-xs">
                                <SelectValue placeholder="Select trigger" />
                              </SelectTrigger>
                              <SelectContent>
                                {getJobTriggerOptions().map(option => (
                                  <SelectItem key={option.value} value={option.value}>
                                    {option.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          ) : (
                            '-'
                          )}
                        </td>
                        <td className="p-4 text-center">
                          {(invoiceLevel[client.id] || 'client') === 'job' ? (
                            <div className="flex justify-center">
                              {(() => {
                                const currentTrigger = (jobTriggers[job.id] || job.trigger) as string | undefined;
                                const isThreshold = !!currentTrigger && currentTrigger.includes('threshold');
                                if (!isThreshold) {
                                  return <span className="text-xs text-muted-foreground">N/A</span>;
                                }
                                const triggerMet = job.wipAmount >= parseFloat(currentTrigger.split('-')[1]);
                                return triggerMet ? (
                                  <Check className="h-4 w-4 text-green-600" />
                                ) : (
                                  <X className="h-4 w-4 text-red-600" />
                                );
                              })()}
                            </div>
                          ) : (
                            '-'
                          )}
                        </td>
                        <td className="p-4 text-center">
                          {(invoiceLevel[client.id] || 'client') === 'job' ? (
                            (() => {
                              const currentTrigger = (jobTriggers[job.id] || job.trigger) as string | undefined;
                              const isThreshold = !!currentTrigger && currentTrigger.includes('threshold');
                              if (!isThreshold) {
                                return <Badge variant="secondary" className="bg-gray-100 text-gray-800 text-xs">N/A</Badge>;
                              }
                              const triggerMet = job.wipAmount >= parseFloat(currentTrigger.split('-')[1]);
                              return triggerMet ? (
                                <Badge
                                  variant="secondary"
                                  className="bg-green-100 text-green-800 text-xs cursor-pointer hover:bg-green-200"
                                  onClick={() => handleInvoiceNow(client, job)}
                                >
                                  Invoice Now
                                </Badge>
                              ) : (
                                <Badge variant="secondary" className="bg-red-100 text-red-800 text-xs">
                                  Not Ready
                                </Badge>
                              );
                            })()
                          ) : (
                            '-'
                          )}
                        </td>
                      </tr>
                    ))}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
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

      {viewingJob && (
        <JobDetailsDialog
          isOpen={viewJobDialogOpen}
          onClose={() => setViewJobDialogOpen(false)}
          jobId={viewingJob.jobId}
          jobName={viewingJob.name}
          jobFee={viewingJob.jobCost}
          wipAmount={viewingJob.actualCost}
          hoursLogged={viewingJob.hoursLogged}
        />
      )}

      {selectedInvoiceData && (
        <InvoicePreviewDialog
          isOpen={showInvoiceDialog}
          onClose={handleCloseDialog}
          invoiceData={selectedInvoiceData}
          onInvoiceCreate={handleInvoiceCreated}
          openLogInvoiceOnly={openLogInvoiceOnly}
        />
      )}

      {showWIPBalanceDialog && wipBalanceData && (
        <WIPOpeningBalanceDialog
          isOpen={showWIPBalanceDialog}
          onClose={() => setShowWIPBalanceDialog(false)}
          clientName={wipBalanceData.clientName}
          currentWIPBalance={wipBalanceData.wipBalance}
          jobName={wipBalanceData.jobName}
          jobStartDate={wipBalanceData.jobStartDate}
          jobEndDate={wipBalanceData.jobEndDate}
          onAddBalance={wipBalanceData.onAddBalance || ((amount) => {
            const clientId = wipTableData.find(c => c.clientName === wipBalanceData.clientName)?.id;
            if (clientId) {
              handleAddWIPBalance(clientId, amount);
            }
            setShowWIPBalanceDialog(false);
            setWIPBalanceData(null);
          })}
        />
      )}

      {selectedExpensesData && (
        <ActiveExpensesDialog
          isOpen={showActiveExpensesDialog}
          onClose={() => setShowActiveExpensesDialog(false)}
          clientName={selectedExpensesData.clientName}
          expenses={selectedExpensesData.expenses}
        />
      )}

      {selectedTimeLogsData && (
        <TimeLogsBreakdownDialog
          open={showTimeLogsDialog}
          onOpenChange={setShowTimeLogsDialog}
          clientName={selectedTimeLogsData.clientName}
          jobName={selectedTimeLogsData.jobName}
          timeLogs={selectedTimeLogsData.timeLogs}
          totalAmount={selectedTimeLogsData.totalAmount}
        />
      )}


      {/* Invoice Options Dialog */}
      <Dialog open={showInvoiceOptionsDialog} onOpenChange={setShowInvoiceOptionsDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Invoice Options</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="space-y-3">
              <Button
                onClick={handleGenerateInvoice}
                className="w-full justify-start bg-blue-600 hover:bg-blue-700 text-white"
                variant="outline"
              >
                Generate Invoice
              </Button>
              <Button
                onClick={handleLogInvoiceOnly}
                className="w-full justify-start bg-blue-600 hover:bg-blue-700 text-white"
                variant="outline"
              >
                Log Invoice Only
              </Button>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowInvoiceOptionsDialog(false)}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};