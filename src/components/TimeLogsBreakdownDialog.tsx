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
}

const TimeLogsBreakdownDialog = ({
  open,
  onOpenChange,
  clientName,
  jobName,
  timeLogs,
  totalAmount
}: TimeLogsBreakdownDialogProps) => {
  const [expandedMembers, setExpandedMembers] = useState<Set<string>>(new Set());
  const [showEmailInput, setShowEmailInput] = useState(false);
  const [emailAddress, setEmailAddress] = useState('');

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
    const body = `Please find attached the time breakdown for ${formatCurrency(totalAmount)}.`;
    window.location.href = `mailto:${emailAddress}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    setShowEmailInput(false);
    setEmailAddress('');
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Time Breakdown</DialogTitle>
          <DialogDescription>
            {jobName ? `${clientName} - ${jobName}` : clientName}
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
              <Button variant="outline" size="sm" onClick={handleEmailClick} style={{ backgroundColor: '#381980', color: 'white' }}>
                <Mail className="h-4 w-4 mr-2" />
                Email PDF
              </Button>
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
                      <td className="p-3 text-center font-bold">{group.totalHours.toFixed(2)}</td>
                      <td className="p-3 text-center">{formatCurrency(group.billableRate)}/hr</td>
                      <td className="p-3 text-center font-bold">{formatCurrency(group.totalAmount)}</td>
                    </tr>
                    
                    {/* Individual Time Log Rows - Always show in print */}
                    {(expandedMembers.has(group.teamMember) || typeof window !== 'undefined' && window.matchMedia && window.matchMedia('print').matches) && group.timeLogs.map((log, logIndex) => (
                      <tr key={log.id} className="bg-background border-l-4 border-l-primary/20 print:border-l-0">
                        <td className="p-3 pl-12 text-sm text-muted-foreground print:pl-6">
                          {log.description || 'Time entry'}
                        </td>
                        <td className="p-3 text-center text-sm">{new Date(log.date).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' })}</td>
                        <td className="p-3 text-center text-sm">{log.hours.toFixed(2)}</td>
                        <td className="p-3 text-center text-sm">-</td>
                        <td className="p-3 text-center text-sm">{formatCurrency(log.amount)}</td>
                      </tr>
                    ))}
                  </React.Fragment>
                ))}
              </tbody>
              <tfoot className="bg-muted/30 border-t-2 print-total">
                <tr>
                  <td className="p-3 font-bold">Total</td>
                  <td className="p-3 text-center">-</td>
                  <td className="p-3 text-center font-bold">
                    {timeLogs.reduce((sum, log) => sum + log.hours, 0).toFixed(2)}
                  </td>
                  <td className="p-3 text-center">-</td>
                  <td className="p-3 text-center font-bold">{formatCurrency(totalAmount)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
          
          {/* Print-only summary section */}
          <div className="hidden print:block print-summary">
            <div style={{ fontSize: '18px', fontWeight: 'bold' }}>
              Total Hours: {timeLogs.reduce((sum, log) => sum + log.hours, 0).toFixed(2)}
            </div>
            <div style={{ fontSize: '18px', fontWeight: 'bold' }}>
              Total Amount: {formatCurrency(totalAmount)}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TimeLogsBreakdownDialog;