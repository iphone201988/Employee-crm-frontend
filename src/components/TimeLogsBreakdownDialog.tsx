import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChevronDown, ChevronRight, ExpandIcon, Printer, Mail } from 'lucide-react';
import { formatCurrency } from '@/lib/currency';

interface TimeLogEntry {
  id: string;
  teamMember: string;
  hours: number;
  billableRate: number;
  amount: number;
  date: string;
  description?: string;
}

interface TeamMemberGroup {
  teamMember: string;
  totalHours: number;
  totalAmount: number;
  billableRate: number;
  timeLogs: TimeLogEntry[];
}

interface TimeLogsBreakdownDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientName?: string;
  jobName?: string;
  timeLogs: TimeLogEntry[];
  totalAmount: number;
  importedWipBalance?: number;
  openBalanceSections?: OpenBalanceSection[];
}

interface OpenBalanceItem {
  id: string;
  amount: number;
  type?: string;
  status?: string;
  createdAt?: string;
  jobId?: string;
}

interface OpenBalanceSection {
  title: string;
  items: OpenBalanceItem[];
}

const formatHoursToHHMMSS = (hours: number) => {
  const totalSeconds = Math.max(0, Math.round((hours || 0) * 3600));
  const hh = Math.floor(totalSeconds / 3600).toString().padStart(2, '0');
  const mm = Math.floor((totalSeconds % 3600) / 60).toString().padStart(2, '0');
  const ss = (totalSeconds % 60).toString().padStart(2, '0');
  return `${hh}:${mm}:${ss}`;
};

const TimeLogsBreakdownDialog = ({
  open,
  onOpenChange,
  clientName,
  jobName,
  timeLogs,
  totalAmount,
  importedWipBalance = 0,
  openBalanceSections = []
}: TimeLogsBreakdownDialogProps) => {
  const [expandedMembers, setExpandedMembers] = useState<Set<string>>(new Set());
  const [showEmailInput, setShowEmailInput] = useState(false);
  const [emailAddress, setEmailAddress] = useState('');

  // Derive date range from provided timeLogs for job breakdown title
  const dateRange = timeLogs.length > 0 ? timeLogs.reduce((acc, log) => {
    const logDate = new Date(log.date);
    if (!acc.min || logDate < acc.min) acc.min = logDate;
    if (!acc.max || logDate > acc.max) acc.max = logDate;
    return acc;
  }, { min: null as Date | null, max: null as Date | null }) : null;

  const formatDate = (date: Date | null) => {
    if (!date) return '';
    return date.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };
  const formatDateString = (value?: string) => {
    if (!value) return '';
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return '';
    return formatDate(parsed);
  };
  const formatStatus = (status?: string) => {
    if (!status) return '';
    const normalized = status.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/_/g, ' ');
    return normalized.charAt(0).toUpperCase() + normalized.slice(1);
  };
  const formattedStartDate = dateRange ? formatDate(dateRange.min) : '';
  const formattedEndDate = dateRange ? formatDate(dateRange.max) : '';

  // Group time logs by team member
  const groupedTimeLogs = timeLogs.reduce((acc, log) => {
    if (!acc[log.teamMember]) {
      acc[log.teamMember] = {
        teamMember: log.teamMember,
        totalHours: 0,
        totalAmount: 0,
        billableRate: log.billableRate,
        timeLogs: []
      };
    }
    acc[log.teamMember].totalHours += log.hours;
    acc[log.teamMember].totalAmount += log.amount;
    acc[log.teamMember].timeLogs.push(log);
    return acc;
  }, {} as Record<string, TeamMemberGroup>);

  // Calculate totals including imported WIP
  const timeLogsTotal = timeLogs.reduce((sum, log) => sum + log.amount, 0);
  const timeLogsTotalHours = timeLogs.reduce((sum, log) => sum + log.hours, 0);
  const openBalanceTotal = openBalanceSections
    .flatMap(section => section.items || [])
    .reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const computedTotalAmount = timeLogsTotal + importedWipBalance + openBalanceTotal;
  const finalTotalAmount = typeof totalAmount === 'number' ? totalAmount : computedTotalAmount;
  const hasOpenBalanceSections = openBalanceSections.some(section => (section.items || []).length > 0);

  const toggleMember = (memberName: string) => {
    setExpandedMembers(prev => {
      const newSet = new Set(prev);
      if (newSet.has(memberName)) {
        newSet.delete(memberName);
      } else {
        newSet.add(memberName);
      }
      return newSet;
    });
  };

  const toggleExpandAll = () => {
    const allMembers = Object.keys(groupedTimeLogs);
    const allExpanded = allMembers.every(member => expandedMembers.has(member));
    
    if (allExpanded) {
      setExpandedMembers(new Set());
    } else {
      setExpandedMembers(new Set(allMembers));
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleEmailClick = () => {
    setShowEmailInput(true);
  };

  const handleSendEmail = () => {
    const subject = `Time Breakdown - ${jobName ? `${clientName} - ${jobName}` : clientName}`;
    const body = `Please find attached the time breakdown for ${formatCurrency(finalTotalAmount)}.`;
    window.location.href = `mailto:${emailAddress}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    setShowEmailInput(false);
    setEmailAddress('');
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>WIP Breakdown</DialogTitle>
          <DialogDescription>
            {jobName
              ? (
                <span>
                  {clientName} / {jobName}
                  {formattedStartDate && formattedEndDate ? ` (${formattedStartDate} - ${formattedEndDate})` : ''}
                </span>
              )
              : clientName}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Print-only styles for clean export report appearance */}
          <style>{`
            @media print {
              .print-hidden { display: none !important; }
              .print-container { 
                padding: 20px; 
                margin: 0; 
                font-family: Arial, sans-serif;
              }
              .print-header {
                text-align: center;
                margin-bottom: 30px;
                border-bottom: 2px solid #000;
                padding-bottom: 20px;
              }
              .print-title {
                font-size: 24px;
                font-weight: bold;
                margin-bottom: 10px;
              }
              .print-subtitle {
                font-size: 16px;
                color: #666;
              }
              .print-table {
                width: 100%;
                border-collapse: collapse;
                margin-top: 20px;
              }
              .print-table th,
              .print-table td {
                border: 1px solid #000;
                padding: 8px;
                text-align: left;
              }
              .print-table th {
                background-color: #f0f0f0;
                font-weight: bold;
              }
              .print-total {
                background-color: #e0e0e0 !important;
                font-weight: bold;
              }
              .print-summary {
                margin-top: 20px;
                padding: 15px;
                border: 2px solid #000;
                text-align: right;
              }
            }
          `}</style>
          
          <div className="space-y-2 print-hidden">
            <div className="flex gap-2 justify-end">
              <Button variant="outline" size="sm" onClick={toggleExpandAll} style={{ backgroundColor: '#381980', color: 'white' }}>
                <ExpandIcon className="h-4 w-4 mr-2" />
                {Object.keys(groupedTimeLogs).every(member => expandedMembers.has(member)) ? 'Collapse All' : 'Expand All'}
              </Button>
              <Button variant="outline" size="sm" onClick={handlePrint} style={{ backgroundColor: '#381980', color: 'white' }}>
                <Printer className="h-4 w-4 mr-2" />
                Print PDF
              </Button>
              {/* <Button variant="outline" size="sm" onClick={handleEmailClick} style={{ backgroundColor: '#381980', color: 'white' }}>
                <Mail className="h-4 w-4 mr-2" />
                Email PDF
              </Button> */}
            </div>
            
            {showEmailInput && (
              <div className="flex gap-2 justify-end">
                <Input
                  type="email"
                  placeholder="Enter email address"
                  value={emailAddress}
                  onChange={(e) => setEmailAddress(e.target.value)}
                  className="w-64"
                />
                <Button 
                  size="sm" 
                  onClick={handleSendEmail}
                  disabled={!emailAddress}
                  style={{ backgroundColor: '#381980', color: 'white' }}
                >
                  Send
                </Button>
              </div>
            )}
          </div>
          
          {/* Print-optimized header */}
          <div className="hidden print:block print-container">
            <div className="print-header">
              <div className="print-title">Time Breakdown Report</div>
              <div className="print-subtitle">{jobName ? `${clientName} - ${jobName}` : clientName}</div>
              <div className="print-subtitle">Generated on {new Date().toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' })}</div>
            </div>
          </div>
          
          <div className="border rounded-lg overflow-hidden">
            <table className="w-full print-table">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left p-3 font-semibold">Team Member</th>
                  <th className="text-center p-3 font-semibold">Date</th>
                  <th className="text-center p-3 font-semibold">Hours</th>
                  <th className="text-center p-3 font-semibold">Billable Rate</th>
                  <th className="text-center p-3 font-semibold">Amount</th>
                </tr>
              </thead>
              <tbody>
                {Object.values(groupedTimeLogs).map((group, groupIndex) => (
                  <React.Fragment key={group.teamMember}>
                    {/* Team Member Summary Row */}
                    <tr 
                      className={`cursor-pointer hover:bg-muted/70 ${groupIndex % 2 === 0 ? 'bg-muted/30' : 'bg-muted/50'} print:cursor-default print:hover:bg-transparent`}
                      onClick={() => toggleMember(group.teamMember)}
                    >
                      <td className="p-3 font-bold">
                        <div className="flex items-center gap-2">
                          <span className="print-hidden">
                            {expandedMembers.has(group.teamMember) ? (
                              <ChevronDown className="h-4 w-4" />
                            ) : (
                              <ChevronRight className="h-4 w-4" />
                            )}
                          </span>
                          {group.teamMember}
                        </div>
                      </td>
                      <td className="p-3 text-center">-</td>
                      <td className="p-3 text-center font-bold">{formatHoursToHHMMSS(group.totalHours)}</td>
                      <td className="p-3 text-center">{formatCurrency(group.billableRate)}/hr</td>
                      <td className="p-3 text-center font-bold">{formatCurrency(group.totalAmount)}</td>
                    </tr>
                    
                    {/* Individual Time Log Rows - Always show in print */}
                    {(expandedMembers.has(group.teamMember) || typeof window !== 'undefined' && window.matchMedia && window.matchMedia('print').matches) && group.timeLogs.map((log, logIndex) => (
                      <tr key={log.id} className="bg-background border-l-4 border-l-primary/20 print:border-l-0">
                        <td className="p-3 pl-12 text-sm text-muted-foreground print:pl-6">
                          {log.description || 'Time entry'}
                        </td>
                        <td className="p-3 text-center text-sm">{new Date(log.date).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })}</td>
                        <td className="p-3 text-center text-sm">{formatHoursToHHMMSS(log.hours)}</td>
                        <td className="p-3 text-center text-sm">-</td>
                        <td className="p-3 text-center text-sm">{formatCurrency(log.amount)}</td>
                      </tr>
                    ))}
                  </React.Fragment>
                ))}
              </tbody>
              {importedWipBalance > 0 && (
                <tbody>
                  <tr className="bg-blue-50 border-t-2 border-blue-200">
                    <td className="p-3 font-bold text-blue-900">Imported WIP</td>
                    <td className="p-3 text-center">-</td>
                    <td className="p-3 text-center">-</td>
                    <td className="p-3 text-center">-</td>
                    <td className="p-3 text-center font-bold text-blue-900">{formatCurrency(importedWipBalance)}</td>
                  </tr>
                </tbody>
              )}
              {hasOpenBalanceSections && openBalanceSections.map((section, sectionIdx) => (
                <tbody key={`${section.title}-${sectionIdx}`}>
                  <tr className="bg-purple-50 border-t-2 border-purple-200">
                    <td className="p-3 font-bold text-purple-900" colSpan={5}>{section.title}</td>
                  </tr>
                  {(section.items || []).map((item) => (
                    <tr key={item.id} className="bg-background border-l-4 border-l-purple-200">
                      <td className="p-3 pl-12 text-sm font-semibold text-purple-900">{formatCurrency(item.amount)}</td>
                      <td className="p-3 text-center text-sm text-muted-foreground">{formatDateString(item.createdAt) || '-'}</td>
                      <td className="p-3 text-center text-sm text-muted-foreground">-</td>
                      <td className="p-3 text-center text-sm text-muted-foreground">{formatStatus(item.status)}</td>
                      <td className="p-3 text-center text-sm font-semibold text-purple-900">{formatCurrency(item.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              ))}
              <tfoot className="bg-muted/30 border-t-2 print-total">
                <tr>
                  <td className="p-3 font-bold">Total</td>
                  <td className="p-3 text-center">-</td>
                  <td className="p-3 text-center font-bold">
                    {formatHoursToHHMMSS(timeLogsTotalHours)}
                  </td>
                  <td className="p-3 text-center">-</td>
                  <td className="p-3 text-center font-bold">{formatCurrency(finalTotalAmount)}</td>
                </tr>
              </tfoot>
            </table>
          </div>

          {hasOpenBalanceSections && (
          <div className="space-y-3"></div>
          )}
          
          {/* Print-only summary section */}
          <div className="hidden print:block print-summary">
            <div style={{ fontSize: '18px', fontWeight: 'bold' }}>
              Total Hours: {formatHoursToHHMMSS(timeLogsTotalHours)}
            </div>
            {importedWipBalance > 0 && (
              <div style={{ fontSize: '16px', fontWeight: 'normal', color: '#1e40af' }}>
                Imported WIP: {formatCurrency(importedWipBalance)}
              </div>
            )}
            {openBalanceTotal > 0 && (
              <div style={{ fontSize: '16px', fontWeight: 'normal', color: '#1e40af' }}>
                Open Balances: {formatCurrency(openBalanceTotal)}
              </div>
            )}
            <div style={{ fontSize: '18px', fontWeight: 'bold' }}>
              Total Amount: {formatCurrency(finalTotalAmount)}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TimeLogsBreakdownDialog;