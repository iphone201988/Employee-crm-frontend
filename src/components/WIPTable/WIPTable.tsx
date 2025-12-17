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
import { formatDate } from '@/utils/wipTableUtils';
import { InvoicePreviewDialog } from '@/components/InvoicePreviewDialog';
import WIPOpeningBalanceDialog from '@/components/WIPOpeningBalanceDialog';
import { useGetDropdownOptionsQuery } from '@/store/teamApi';
import { useAddWipOpenBalanceMutation, useAttachWipTargetMutation } from '@/store/wipApi';
import { useDeleteImportedWipBalanceMutation } from '@/store/wipApi';
import { toast } from 'sonner';
import ClientDetailsDialog from '@/components/ClientDetailsDialog';
import { useGetClientQuery } from '@/store/clientApi';
import { Label } from "@/components/ui/label";
import { JobDetailsDialog } from '@/components/JobDetailsDialog';
import { useUpdateJobMutation } from '@/store/jobApi';
import { Checkbox } from "@/components/ui/checkbox";

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
  const getClientTargetStatus = (client: WIPClient) => {
    // Use clientTargetMet directly from backend - no frontend calculation
    // This is the backend's calculation based on clientTotalWipAmount vs client target
    // Values: '0' = no target, '1' = target not met, '2' = target met
    const rawStatus = client.clientTargetMet ?? '0';
    const status = String(rawStatus || '0');

    return {
      status,
      hasTarget: status !== '0' && status !== 'null' && status !== 'undefined',
      // Status '2' means target is met (WIP >= target amount)
      // Status '1' means target exists but not met
      // Status '0' means no target set
      met: status === '2' || Number(status) === 2
    };
  };

  const getJobTargetStatus = (job: any) => {
    // Get status and normalize to string for consistent comparison
    const rawStatus = job.targetMetStatus ?? (job.triggerMet ? '2' : '0');
    const status = String(rawStatus || '0');

    return {
      status,
      hasTarget: status !== '0' && status !== 'null' && status !== 'undefined',
      // Status '2' means target is met
      met: status === '2' || Number(status) === 2
    };
  };
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
  const [deleteImportedWipBalance] = useDeleteImportedWipBalanceMutation();
  const [updateJob] = useUpdateJobMutation();

  // Job completion dialog state
  const [showJobCompletionDialog, setShowJobCompletionDialog] = useState(false);
  const [jobsToComplete, setJobsToComplete] = useState<Array<{ id: string; name: string; selected: boolean }>>([]);
  const [isUpdatingJobStatus, setIsUpdatingJobStatus] = useState(false);

  // Client details dialog state
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [showClientDetailsDialog, setShowClientDetailsDialog] = useState(false);
  const { data: selectedClientData } = useGetClientQuery(selectedClientId as string, { skip: !selectedClientId });

  // Job details dialog state
  const [viewingJob, setViewingJob] = useState<any | null>(null);
  const [viewJobDialogOpen, setViewJobDialogOpen] = useState(false);

  // Fetch dynamic WIP target amount options
  const { data: wipTargetsResp } = useGetDropdownOptionsQuery('wipTargetAmount');
  const wipTargetAmountOptions = useMemo(() => {
    const options = (wipTargetsResp?.data?.wipTargetAmount || [])
      .map((item: any) => ({
        value: `threshold-${item.amount}`,
        label: `WIP of €${Number(item.amount).toLocaleString()}`,
        amount: Number(item.amount)
      }))
      .sort((a, b) => a.amount - b.amount); // Sort numerically by amount (ascending)
    return options;
  }, [wipTargetsResp?.data?.wipTargetAmount]);

  // Get the first (lowest) value as default
  const defaultWipTargetValue = wipTargetAmountOptions.length > 0
    ? wipTargetAmountOptions[0].value
    : 'threshold-1000'; // Fallback if no options available

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
    const jobFee = Number(job.jobFee || 0);
    if (jobFee <= 0) return null;
    const wipPercentage = (job.wipAmount / jobFee) * 100;
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
    const wipAmount = job ? job.wipAmount : (client as any).clientWipBalance || 0;
    const invoiceData = {
      invoiceNumber: String(Math.floor(Math.random() * 90000) + 10000), // Generate 5-digit number
      clientName: client.clientName,
      clientCode: client.clientCode,
      clientAddress: client.address || '',
      amount: wipAmount,
      wipAmount,
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
      jobId: job?.id,
      scope: job ? 'job' : 'client',
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

    // Check if we need to show job completion dialog
    const scope = selectedInvoiceData?.scope; // 'job' or 'client'
    const jobId = selectedInvoiceData?.jobId;
    const clientId = selectedInvoiceData?.clientId;

    // Find the client from wipData to get jobs
    const client = wipData.find(c => c.id === clientId);

    if (scope === 'job' && jobId) {
      // Single job invoice - show dialog for that job
      const job = client?.jobs.find(j => j.id === jobId);
      const originalStatus = (job as any)?.originalStatus || 'queued';
      if (job && originalStatus !== 'completed') {
        setJobsToComplete([{ id: job.id, name: job.jobName, selected: false }]);
        setShowJobCompletionDialog(true);
      } else if (wipBalance > 0) {
        setWIPBalanceData({
          clientName: selectedInvoiceData?.clientName,
          wipBalance: wipBalance,
          invoiceNumber: invoice.invoiceNumber
        });
        setShowWIPBalanceDialog(true);
      } else {
        setSelectedInvoiceData(null);
      }
    } else if (scope === 'client' && client) {
      // Client-level invoice - show dialog for all jobs that aren't completed
      const incompleteJobs = client.jobs
        .filter(job => {
          const originalStatus = (job as any)?.originalStatus || 'queued';
          return originalStatus !== 'completed';
        })
        .map(job => ({ id: job.id, name: job.jobName, selected: false }));

      if (incompleteJobs.length > 0) {
        setJobsToComplete(incompleteJobs);
        setShowJobCompletionDialog(true);
      } else if (wipBalance > 0) {
        setWIPBalanceData({
          clientName: selectedInvoiceData?.clientName,
          wipBalance: wipBalance,
          invoiceNumber: invoice.invoiceNumber
        });
        setShowWIPBalanceDialog(true);
      } else {
        setSelectedInvoiceData(null);
      }
    } else if (wipBalance > 0) {
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

  const handleJobCompletionConfirm = async () => {
    const selectedJobs = jobsToComplete.filter(j => j.selected);
    if (selectedJobs.length === 0) {
      // No jobs selected, just close dialog
      setShowJobCompletionDialog(false);
      setJobsToComplete([]);

      // Check if we need to show WIP balance dialog
      const totalWIP = selectedInvoiceData?.amount || 0;
      const invoicedAmount = selectedInvoiceData?.wipAmount || 0;
      const wipBalance = totalWIP - invoicedAmount;

      if (wipBalance > 0) {
        setWIPBalanceData({
          clientName: selectedInvoiceData?.clientName,
          wipBalance: wipBalance,
          invoiceNumber: selectedInvoiceData?.invoiceNumber
        });
        setShowWIPBalanceDialog(true);
      } else {
        setSelectedInvoiceData(null);
      }
      return;
    }

    setIsUpdatingJobStatus(true);
    try {
      // Update all selected jobs to completed
      await Promise.all(
        selectedJobs.map(job =>
          updateJob({
            jobId: job.id,
            jobData: { status: 'completed' }
          }).unwrap()
        )
      );

      toast.success(`${selectedJobs.length} job(s) marked as completed`);

      // Refresh WIP data
      if (onWipMutated) {
        onWipMutated();
      }

      setShowJobCompletionDialog(false);
      setJobsToComplete([]);

      // Check if we need to show WIP balance dialog
      const totalWIP = selectedInvoiceData?.amount || 0;
      const invoicedAmount = selectedInvoiceData?.wipAmount || 0;
      const wipBalance = totalWIP - invoicedAmount;

      if (wipBalance > 0) {
        setWIPBalanceData({
          clientName: selectedInvoiceData?.clientName,
          wipBalance: wipBalance,
          invoiceNumber: selectedInvoiceData?.invoiceNumber
        });
        setShowWIPBalanceDialog(true);
      } else {
        setSelectedInvoiceData(null);
      }
    } catch (error: any) {
      console.error('Failed to update job status', error);
      toast.error(error?.data?.message || 'Failed to update job status');
    } finally {
      setIsUpdatingJobStatus(false);
    }
  };

  const handleJobCompletionCancel = () => {
    setShowJobCompletionDialog(false);
    setJobsToComplete([]);

    // Check if we need to show WIP balance dialog
    const totalWIP = selectedInvoiceData?.amount || 0;
    const invoicedAmount = selectedInvoiceData?.wipAmount || 0;
    const wipBalance = totalWIP - invoicedAmount;

    if (wipBalance > 0) {
      setWIPBalanceData({
        clientName: selectedInvoiceData?.clientName,
        wipBalance: wipBalance,
        invoiceNumber: selectedInvoiceData?.invoiceNumber
      });
      setShowWIPBalanceDialog(true);
    } else {
      setSelectedInvoiceData(null);
    }
  };

  const toggleJobSelection = (jobId: string) => {
    setJobsToComplete(prev =>
      prev.map(job =>
        job.id === jobId ? { ...job, selected: !job.selected } : job
      )
    );
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

  const handleDeleteImportedWip = async (clientId: string) => {
    try {
      await deleteImportedWipBalance(clientId).unwrap();
      toast.success('Imported WIP removed successfully');
      setShowTimeLogsDialog(false);
      if (onWipMutated) {
        onWipMutated();
      }
      // Optionally re-open to show refreshed data
      setTimeout(() => {
        setSelectedTimeLogsData(null);
      }, 150);
    } catch (error: any) {
      console.error('Failed to delete imported WIP', error);
      toast.error(error?.data?.message || 'Failed to delete imported WIP');
    }
  };

  const [wipTableData, setWipTableData] = useState<WIPClient[]>(wipData);

  React.useEffect(() => {
    setWipTableData(wipData);
  }, [wipData]);

  const handleAddWIPBalance = async (clientId: string, amount: number, jobId?: string, entryDate?: string) => {
    try {
      const payload: any = jobId
        ? { type: 'job', amount, jobId }
        : { type: 'client', amount, clientId };
      if (entryDate) {
        payload.date = entryDate;
      }
      await addWipOpenBalance(payload).unwrap();
      if (onWipMutated) onWipMutated();
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
      const hasManualReviewJobs = client.jobs
        .filter((job) => {
          // Exclude completed jobs from manual review filter
          const originalStatus = (job as any).originalStatus || 'queued';
          return originalStatus !== 'completed';
        })
        .some(job => job.trigger === 'manual-review');
      if (!hasManualReviewJobs) return false;
    }

    // Warning jobs filter
    if (showWarningJobsOnly) {
      const hasWarningJobs = client.jobs
        .filter((job) => {
          // Exclude completed jobs from warning filter
          const originalStatus = (job as any).originalStatus || 'queued';
          return originalStatus !== 'completed';
        })
        .some(job => {
          const jobFee = Number(job.jobFee || 0);
          if (jobFee <= 0) return false;
          const wipPercentage = (job.wipAmount / jobFee) * 100;
          return wipPercentage >= warningPercentage;
        });
      if (!hasWarningJobs) return false;
    }

    if (targetMetFilter === 'all') return true;

    // For filtering, use clientTargetMet from backend (client status) and job statuses
    // Exclude completed jobs from target met filtering
    const clientStatus = getClientTargetStatus(client);
    const activeJobs = client.jobs.filter((job) => {
      const originalStatus = (job as any).originalStatus || 'queued';
      return originalStatus !== 'completed';
    });
    const jobStatuses = activeJobs.map(getJobTargetStatus);
    const hasTarget = clientStatus.hasTarget || jobStatuses.some(s => s.hasTarget);
    const met = clientStatus.met || jobStatuses.some(s => s.met);

    if (targetMetFilter === 'yes') {
      return met;
    }

    if (targetMetFilter === 'no') {
      return hasTarget && !met;
    }

    if (targetMetFilter === 'na') {
      return !hasTarget;
    }

    return true;
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
          // Exclude completed jobs from count for sorting
          aValue = a.jobs.filter((job) => {
            const originalStatus = (job as any).originalStatus || 'queued';
            return originalStatus !== 'completed';
          }).length;
          bValue = b.jobs.filter((job) => {
            const originalStatus = (job as any).originalStatus || 'queued';
            return originalStatus !== 'completed';
          }).length;
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

  // Get trigger options based on invoice level (already sorted numerically)
  const getClientTriggerOptions = () => [
    { value: 'none', label: '- Select -' }, // Option to clear/remove WIP target
    ...wipTargetAmountOptions
  ];

  const getJobTriggerOptions = () => [
    { value: 'none', label: '- Select -' }, // Option to clear/remove WIP target
    // { value: 'job-closed', label: 'Job Closed' },
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
                  <th className="text-center p-4 font-medium text-[12px] text-[hsl(var(--table-header))]">JOB STATUS</th>
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
                  {/* <th className="text-center p-4 font-medium text-[12px] text-[hsl(var(--table-header))]">
                    <Button
                      variant="ghost"
                      onClick={() => handleSort('lastInvoiced')}
                      className="h-8 px-1 font-medium justify-start text-[12px] hover:bg-transparent hover:text-inherit !text-[#381980]"
                    >
                      Last Invoiced {getSortIcon('lastInvoiced')}
                    </Button>
                  </th> */}
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
                          {client.jobs.filter((job) => {
                            // Exclude completed jobs from count
                            const originalStatus = (job as any).originalStatus || 'queued';
                            return originalStatus !== 'completed';
                          }).length}
                        </Badge>
                      </td>
                      <td className="p-4 text-center">
                        <span className="text-sm text-muted-foreground">-</span>
                      </td>
                      <td className="p-4 text-left">
                        <div className="flex items-center justify-start gap-2">
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
                              const importedWipBalance = (client as any).importedWipBalance || 0;
                              const timeLogsTotal = client.jobs.reduce((sum, job) => sum + job.wipAmount, 0);
                              const clientOpenBalances = Array.isArray((client as any).clientOpenBalances) ? (client as any).clientOpenBalances : [];
                              const clientOpenBalanceTotal = clientOpenBalances.reduce((sum: number, ob: any) => sum + Number(ob.amount || 0), 0);
                              const openBalanceSections: Array<{ title: string; items: any[] }> = [];
                              if (clientOpenBalances.length) {
                                openBalanceSections.push({
                                  title: 'Client Open Balances',
                                  items: clientOpenBalances,
                                });
                              }
                              (client.jobs || []).forEach((job: any) => {
                                if (Array.isArray(job.openBalances) && job.openBalances.length) {
                                  openBalanceSections.push({
                                    title: `${job.jobName} Open Balances`,
                                    items: job.openBalances,
                                  });
                                }
                              });
                              const totalAmount = typeof (client as any).clientWipBalance === 'number'
                                ? (client as any).clientWipBalance
                                : timeLogsTotal + importedWipBalance + clientOpenBalanceTotal;
                              setSelectedTimeLogsData({
                                clientName: client.clientName,
                                clientId: client.id,
                                timeLogs,
                                totalAmount,
                                importedWipBalance,
                                importedWipDate: (client as any).importedWipDate,
                                openBalanceSections,
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
                              // Calculate total WIP balance including imported WIP and open balances
                              const clientWipBalance = typeof (client as any).clientWipBalance === 'number'
                                ? (client as any).clientWipBalance
                                : (() => {
                                  const timeLogsTotal = client.jobs.reduce((sum, job) => sum + job.wipAmount, 0);
                                  const importedWipBalance = Number((client as any).importedWipBalance || 0);
                                  const clientOpenBalances = Array.isArray((client as any).clientOpenBalances) ? (client as any).clientOpenBalances : [];
                                  const clientOpenBalanceTotal = clientOpenBalances.reduce((sum: number, ob: any) => sum + Number(ob.amount || 0), 0);
                                  return timeLogsTotal + importedWipBalance + clientOpenBalanceTotal;
                                })();
                              setWIPBalanceData({
                                clientName: client.clientName,
                                wipBalance: clientWipBalance,
                                clientId: client.id,
                                onAddBalance: (amount: number, date?: string) => handleAddWIPBalance(client.id, amount, undefined, date)
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
                          className={`inline-flex items-center px-2 py-1 rounded-full text-sm font-semibold cursor-pointer hover:opacity-80 ${client.activeExpenses.reduce((sum, exp) => sum + exp.amount, 0) > 0
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
                      {/* <td className="p-4 text-center">{formatLastInvoiced(client.lastInvoiced, client.daysSinceLastInvoice)}</td> */}
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
                            value={clientTriggers[client.id] || (client.trigger?.trim() || 'none')}
                            onValueChange={async (value) => {
                              setClientTriggers(prev => ({ ...prev, [client.id]: value }));

                              // Handle clearing the target
                              if (value === 'none') {
                                try {
                                  await attachWipTarget({ type: 'client', clientId: client.id, wipTargetId: null }).unwrap();
                                  if (onWipMutated) onWipMutated();
                                } catch (err) {
                                  console.error('Failed to clear WIP target', err);
                                  // Revert UI state on error
                                  setClientTriggers(prev => {
                                    const updated = { ...prev };
                                    delete updated[client.id];
                                    return updated;
                                  });
                                }
                                return;
                              }

                              const wipTargetId = resolveWipTargetId(value);
                              if (wipTargetId) {
                                try {
                                  await attachWipTarget({ type: 'client', clientId: client.id, wipTargetId }).unwrap();
                                  if (onWipMutated) onWipMutated();
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
                              // Use clientTargetMet directly from backend (no frontend calculation)
                              const targetState = getClientTargetStatus(client);
                              if (!targetState.hasTarget) {
                                return <span className="text-xs text-muted-foreground">N/A</span>;
                              }
                              return targetState.met ? (
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
                            // Use clientTargetMet directly from backend for "Ready To Invoice" status
                            // No frontend calculation - depends solely on backend's clientTargetMet value
                            const targetState = getClientTargetStatus(client);
                            if (!targetState.hasTarget) {
                              return <Badge variant="secondary" className="bg-gray-100 text-gray-800 text-xs">N/A</Badge>;
                            }
                            return targetState.met ? (
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


                    {/* Job Rows - Filter out completed jobs */}
                    {expandedClients.has(client.id) && client.jobs
                      .filter((job) => {
                        // Filter out completed jobs
                        const originalStatus = (job as any).originalStatus || 'queued';
                        return originalStatus !== 'completed';
                      })
                      .map((job) => (
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
                          <td className="p-4 text-center">
                            {/* Job Status Dropdown - Always show for jobs */}
                            <Select
                              value={(job as any).originalStatus || 'queued'}
                              onValueChange={async (value: 'queued' | 'awaitingRecords' | 'inProgress' | 'withClient' | 'forApproval' | 'completed') => {
                                try {
                                  await updateJob({
                                    jobId: job.id,
                                    jobData: { status: value }
                                  }).unwrap();
                                  toast.success('Job status updated successfully');
                                  if (onWipMutated) {
                                    onWipMutated();
                                  }
                                } catch (error: any) {
                                  console.error('Failed to update job status', error);
                                  toast.error(error?.data?.message || 'Failed to update job status');
                                }
                              }}
                            >
                              <SelectTrigger className="w-36 h-8 text-xs">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="queued">Queued</SelectItem>
                                <SelectItem value="awaitingRecords">Awaiting Records</SelectItem>
                                <SelectItem value="inProgress">In Progress</SelectItem>
                                <SelectItem value="withClient">With Client</SelectItem>
                                <SelectItem value="forApproval">For Approval</SelectItem>
                                <SelectItem value="completed">Completed</SelectItem>
                              </SelectContent>
                            </Select>
                          </td>
                          <td className="p-4 text-left text-sm">
                            <div className="flex items-center justify-start gap-2">
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
                                  const openBalanceSections = Array.isArray(j.openBalances) && j.openBalances.length
                                    ? [{
                                      title: `${job.jobName} Open Balances`,
                                      items: j.openBalances
                                    }]
                                    : [];
                                  setSelectedTimeLogsData({
                                    clientName: client.clientName,
                                    jobName: job.jobName,
                                    timeLogs,
                                    totalAmount: job.wipAmount,
                                    openBalanceSections
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
                            </div>
                          </td>
                          <td className="p-4 text-center text-sm">
                            <span className="text-sm text-muted-foreground">-</span>
                          </td>
                          <td className="p-4 text-center">
                            {/* Invoice Level column - always show '-' for jobs */}
                            <span className="text-sm text-muted-foreground">-</span>
                          </td>
                          <td className="p-4 text-center">
                            {(invoiceLevel[client.id] || 'client') === 'job' ? (
                              <Select
                                value={jobTriggers[job.id] || (job.trigger?.trim() || 'none')}
                                onValueChange={async (value) => {
                                  setJobTriggers(prev => ({ ...prev, [job.id]: value }));

                                  // Handle clearing the target
                                  if (value === 'none') {
                                    try {
                                      await attachWipTarget({ type: 'job', jobId: job.id, wipTargetId: null }).unwrap();
                                      if (onWipMutated) onWipMutated();
                                    } catch (err) {
                                      console.error('Failed to clear WIP target', err);
                                      // Revert UI state on error
                                      setJobTriggers(prev => {
                                        const updated = { ...prev };
                                        delete updated[job.id];
                                        return updated;
                                      });
                                    }
                                    return;
                                  }

                                  const wipTargetId = resolveWipTargetId(value);
                                  if (wipTargetId) {
                                    try {
                                      await attachWipTarget({ type: 'job', jobId: job.id, wipTargetId }).unwrap();
                                      if (onWipMutated) onWipMutated();
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
                              <span className="text-sm text-muted-foreground">-</span>
                            )}
                          </td>
                          <td className="p-4 text-center">
                            {(invoiceLevel[client.id] || 'client') === 'job' ? (
                              <div className="flex justify-center">
                                {(() => {
                                  const targetState = getJobTargetStatus(job);
                                  if (!targetState.hasTarget) {
                                    return <span className="text-xs text-muted-foreground">N/A</span>;
                                  }
                                  return targetState.met ? (
                                    <Check className="h-4 w-4 text-green-600" />
                                  ) : (
                                    <X className="h-4 w-4 text-red-600" />
                                  );
                                })()}
                              </div>
                            ) : (
                              <span className="text-sm text-muted-foreground">-</span>
                            )}
                          </td>
                          <td className="p-4 text-center">
                            {(invoiceLevel[client.id] || 'client') === 'job' ? (
                              (() => {
                                const targetState = getJobTargetStatus(job);
                                if (!targetState.hasTarget) {
                                  return <Badge variant="secondary" className="bg-gray-100 text-gray-800 text-xs">N/A</Badge>;
                                }
                                return targetState.met ? (
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
                              <span className="text-sm text-muted-foreground">-</span>
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
          onAddBalance={wipBalanceData.onAddBalance || ((amount, entryDate) => {
            const clientId = wipTableData.find(c => c.clientName === wipBalanceData.clientName)?.id;
            if (clientId) {
              handleAddWIPBalance(clientId, amount, undefined, entryDate);
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
          importedWipBalance={selectedTimeLogsData.importedWipBalance || 0}
          importedWipDate={selectedTimeLogsData.importedWipDate}
          openBalanceSections={selectedTimeLogsData.openBalanceSections || []}
          onDeleteImportedWip={selectedTimeLogsData.clientId ? () => handleDeleteImportedWip(selectedTimeLogsData.clientId) : undefined}
          onDeleteOpenBalance={() => {
            // Refresh WIP data after deletion
            if (onWipMutated) {
              onWipMutated();
            }
            // Close and reopen dialog to refresh data
            setShowTimeLogsDialog(false);
            setTimeout(() => {
              // Reopen with fresh data - the parent component will need to refresh
              // For now, just trigger the refresh callback
            }, 100);
          }}
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

      {/* Job Completion Dialog */}
      <Dialog open={showJobCompletionDialog} onOpenChange={handleJobCompletionCancel}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Mark Jobs as Completed?</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <p className="text-sm text-muted-foreground">
              The invoice has been created successfully. Would you like to mark any of these jobs as completed?
            </p>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {jobsToComplete.map((job) => (
                <div key={job.id} className="flex items-center space-x-2 p-2 hover:bg-muted/50 rounded">
                  <Checkbox
                    id={`job-${job.id}`}
                    checked={job.selected}
                    onCheckedChange={() => toggleJobSelection(job.id)}
                  />
                  <label
                    htmlFor={`job-${job.id}`}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex-1"
                  >
                    {job.name}
                  </label>
                </div>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={handleJobCompletionCancel}
              disabled={isUpdatingJobStatus}
            >
              Skip
            </Button>
            <Button
              onClick={handleJobCompletionConfirm}
              disabled={isUpdatingJobStatus}
            >
              {isUpdatingJobStatus ? 'Updating...' : 'Mark Selected as Completed'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};