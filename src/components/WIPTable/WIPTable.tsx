import React, { useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { ChevronDown, ChevronRight, Check, X, AlertTriangle, ArrowRightLeft } from 'lucide-react';
import ActiveExpensesDialog from '@/components/ActiveExpensesDialog';
import TimeLogsBreakdownDialog from '@/components/TimeLogsBreakdownDialog';
import { formatCurrency } from '@/lib/currency';
import { WIPClient } from '@/types/wipTable';
import { getJobStatusColor, getActionStatusColor, formatDate } from '@/utils/wipTableUtils';
import { InvoicePreviewDialog } from '@/components/InvoicePreviewDialog';
import WIPOpeningBalanceDialog from '@/components/WIPOpeningBalanceDialog';
import { useGetDropdownOptionsQuery } from '@/store/teamApi';
import { useAddWipOpenBalanceMutation, useAttachWipTargetMutation } from '@/store/wipApi';
import { toast } from 'sonner';

import JobNameLink from '@/components/JobNameLink';
import ClientNameLink from '@/components/ClientNameLink';

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
}

export const WIPTable = ({ wipData, expandedClients, onToggleClient, targetMetFilter = 'all', onInvoiceCreate, onWriteOff, showManualReviewOnly = false, warningPercentage = 80, showWarningJobsOnly = false }: WIPTableProps) => {
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
    const invoiceData = {
      invoiceNumber: String(Math.floor(Math.random() * 90000) + 10000), // Generate 5-digit number
      clientName: client.clientName,
      clientCode: client.clientCode,
      clientAddress: client.address || "123 Business Street, Business City, BC 12345",
      amount: job ? job.wipAmount : (client as any).clientWipBalance || 0,
      date: new Date().toISOString(),
      status: 'issued' as const,
      jobName: job?.jobName
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
                <tr>
                  <th className="text-left p-4 font-bold text-[hsl(var(--table-header))]">Client Name / Job Name</th>
                  <th className="text-center p-4 font-bold text-[hsl(var(--table-header))]">Jobs</th>
                  <th className="text-center p-4 font-bold text-[hsl(var(--table-header))]">WIP Balance</th>
                  <th className="text-center p-4 font-bold text-[hsl(var(--table-header))]">Expenses</th>
                  <th className="text-center p-4 font-bold text-[hsl(var(--table-header))]">Last Invoiced</th>
                  <th className="text-center p-4 font-bold text-[hsl(var(--table-header))]">Invoice Level</th>
                  <th className="text-left p-4 font-bold text-[hsl(var(--table-header))]">WIP Target</th>
                  <th className="text-center p-4 font-bold text-[hsl(var(--table-header))]">Target Met</th>
                  <th className="text-center p-4 font-bold text-[hsl(var(--table-header))]">Invoice Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredWipData.map((client) => (
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
                            <ClientNameLink clientName={client.clientName} />
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-center">
                        <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                          {client.jobs.length}
                        </Badge>
                      </td>
                      <td className="p-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => {
                              const mockTimeLogs = [
                                { id: '1', teamMember: 'John Smith', hours: 4.5, billableRate: 75, amount: 337.50, date: '2024-12-01', description: 'VAT return preparation' },
                                { id: '2', teamMember: 'John Smith', hours: 4.0, billableRate: 75, amount: 300.00, date: '2024-12-02', description: 'Client consultation' },
                                { id: '3', teamMember: 'Sarah Johnson', hours: 3.0, billableRate: 85, amount: 255.00, date: '2024-12-02', description: 'Document review' },
                                { id: '4', teamMember: 'Sarah Johnson', hours: 3.0, billableRate: 85, amount: 255.00, date: '2024-12-03', description: 'Compliance check' },
                                { id: '5', teamMember: 'Mike Wilson', hours: 6.5, billableRate: 90, amount: 585.00, date: '2024-12-03', description: 'Tax calculations' },
                                { id: '6', teamMember: 'Mike Wilson', hours: 6.0, billableRate: 90, amount: 540.00, date: '2024-12-04', description: 'Report finalization' },
                              ];
                              setSelectedTimeLogsData({
                                clientName: client.clientName,
                                timeLogs: mockTimeLogs,
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
                          className="inline-flex items-center px-2 py-1 rounded-full text-sm font-semibold cursor-pointer hover:opacity-80 bg-orange-100 text-orange-800"
                        >
                          {formatCurrency(client.activeExpenses.reduce((sum, exp) => sum + exp.amount, 0))}
                        </button>
                      </td>
                      <td className="p-4 text-center">{formatLastInvoiced(client.lastInvoiced, client.daysSinceLastInvoice)}</td>
                      <td className="p-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Button
                            size="sm"
                            variant={(invoiceLevel[client.id] || 'client') === 'client' ? 'default' : 'outline'}
                            onClick={() => setInvoiceLevel(prev => ({ ...prev, [client.id]: 'client' }))}
                            className="px-2 py-1 h-7 text-xs"
                          >
                            Client
                          </Button>
                          <Button
                            size="sm"
                            variant={(invoiceLevel[client.id] || 'client') === 'job' ? 'default' : 'outline'}
                            onClick={() => {
                              setInvoiceLevel(prev => ({ ...prev, [client.id]: 'job' }));
                              if (!expandedClients.has(client.id)) {
                                onToggleClient(client.id);
                              }
                            }}
                            className="px-2 py-1 h-7 text-xs"
                          >
                            Job
                          </Button>
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
                  const totalWIP = client.jobs.reduce((sum, job) => sum + job.wipAmount, 0);
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
                const totalWIP = client.jobs.reduce((sum, job) => sum + job.wipAmount, 0);
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
                            <JobNameLink
                              jobName={job.jobName}
                              jobFee={job.jobFee}
                              wipAmount={job.wipAmount}
                              hoursLogged={job.hoursLogged || 0}
                            />
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
                                const mockTimeLogs = [
                                  { id: '1', teamMember: 'John Smith', hours: 2.0, billableRate: 75, amount: 150.00, date: '2024-12-01', description: 'Initial setup' },
                                  { id: '2', teamMember: 'John Smith', hours: 2.0, billableRate: 75, amount: 150.00, date: '2024-12-02', description: 'Data entry' },
                                  { id: '3', teamMember: 'Sarah Johnson', hours: 1.5, billableRate: 85, amount: 127.50, date: '2024-12-02', description: 'Quality review' },
                                  { id: '4', teamMember: 'Sarah Johnson', hours: 2.0, billableRate: 85, amount: 170.00, date: '2024-12-03', description: 'Final checks' },
                                ];
                                setSelectedTimeLogsData({
                                  clientName: client.clientName,
                                  jobName: job.jobName,
                                  timeLogs: mockTimeLogs,
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