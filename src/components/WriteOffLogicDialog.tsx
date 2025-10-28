import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ChevronDown, ChevronRight, ExpandIcon, Printer, Mail } from 'lucide-react';
import { formatCurrency } from '@/lib/currency';
import { useToast } from "@/hooks/use-toast";

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
  percentage: number;
  writeOffAmount: number;
}

interface WriteOffLogicDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientName?: string;
  jobName?: string;
  timeLogs: TimeLogEntry[];
  totalAmount: number;
  writeOffBalance: number;
  onSave?: (data: { reason: string; teamMemberGroups: Record<string, TeamMemberGroup> }) => void;
}

const WriteOffLogicDialog = ({
  open,
  onOpenChange,
  clientName,
  jobName,
  timeLogs,
  totalAmount,
  writeOffBalance,
  onSave
}: WriteOffLogicDialogProps) => {
  const { toast } = useToast();
  const [expandedMembers, setExpandedMembers] = useState<Set<string>>(new Set());
  const [isManualMode, setIsManualMode] = useState(false);
  const [teamMemberGroups, setTeamMemberGroups] = useState<Record<string, TeamMemberGroup>>({});
  const [writeOffReason, setWriteOffReason] = useState('');

  // Group time logs by team member and initialize
  useEffect(() => {
    const grouped = timeLogs.reduce((acc, log) => {
      if (!acc[log.teamMember]) {
        acc[log.teamMember] = {
          teamMember: log.teamMember,
          totalHours: 0,
          totalAmount: 0,
          billableRate: log.billableRate,
          timeLogs: [],
          percentage: 0,
          writeOffAmount: 0
        };
      }
      acc[log.teamMember].totalHours += log.hours;
      acc[log.teamMember].totalAmount += log.amount;
      acc[log.teamMember].timeLogs.push(log);
      return acc;
    }, {} as Record<string, TeamMemberGroup>);

    // Calculate proportional percentages and amounts
    const totalHours = Object.values(grouped).reduce((sum, group) => sum + group.totalHours, 0);
    Object.values(grouped).forEach(group => {
      group.percentage = totalHours > 0 ? (group.totalHours / totalHours) * 100 : 0;
      group.writeOffAmount = (group.percentage / 100) * writeOffBalance;
    });

    setTeamMemberGroups(grouped);
    
    // Default to collapsed view
    setExpandedMembers(new Set());
  }, [timeLogs, writeOffBalance]);

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
    const allMembers = Object.keys(teamMemberGroups);
    const allExpanded = allMembers.every(member => expandedMembers.has(member));
    
    if (allExpanded) {
      setExpandedMembers(new Set());
    } else {
      setExpandedMembers(new Set(allMembers));
    }
  };

  const handleSpreadProportionally = () => {
    setIsManualMode(false);
    const totalHours = Object.values(teamMemberGroups).reduce((sum, group) => sum + group.totalHours, 0);
    
    const updated = { ...teamMemberGroups };
    Object.values(updated).forEach(group => {
      group.percentage = totalHours > 0 ? (group.totalHours / totalHours) * 100 : 0;
      group.writeOffAmount = (group.percentage / 100) * writeOffBalance;
    });
    
    setTeamMemberGroups(updated);
  };

  const handleManualChoose = () => {
    setIsManualMode(true);
  };

  const updatePercentage = (memberName: string, percentage: number) => {
    const updated = { ...teamMemberGroups };
    updated[memberName].percentage = percentage;
    updated[memberName].writeOffAmount = (percentage / 100) * writeOffBalance;
    setTeamMemberGroups(updated);
  };

  const totalPercentage = Object.values(teamMemberGroups).reduce((sum, group) => sum + group.percentage, 0);
  const totalWriteOffAmount = Object.values(teamMemberGroups).reduce((sum, group) => sum + group.writeOffAmount, 0);

  const handlePrint = () => {
    window.print();
  };

  const handleSave = () => {
    if (!writeOffReason.trim()) {
      toast({
        title: "Write Off Reason Required",
        description: "Please provide a reason for the write off.",
        variant: "destructive",
      });
      return;
    }

    if (isManualMode && totalPercentage !== 100) {
      toast({
        title: "Invalid Percentage",
        description: "Total percentage must equal 100% before saving.",
        variant: "destructive",
      });
      return;
    }

    const saveData = {
      reason: writeOffReason,
      teamMemberGroups
    };

    if (onSave) {
      onSave(saveData);
    }

    toast({
      title: "Write Off Saved",
      description: "Write off logic has been successfully applied.",
    });

    onOpenChange(false);
  };
  const dateRange = timeLogs.length > 0 ? timeLogs.reduce((acc, log) => {
    const logDate = new Date(log.date);
    if (!acc.min || logDate < acc.min) {
      acc.min = logDate;
    }
    if (!acc.max || logDate > acc.max) {
      acc.max = logDate;
    }
    return acc;
  }, { min: null, max: null } as { min: Date | null, max: Date | null }) : null;

  const formatDate = (date: Date | null) => {
    if (!date) return '';
    return date.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };
  const formattedStartDate = dateRange ? formatDate(dateRange.min) : '';
  const formattedEndDate = dateRange ? formatDate(dateRange.max) : '';
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
      <DialogHeader>
          <DialogTitle>WIP Breakdown</DialogTitle>
          <DialogDescription>
            {jobName 
              ? `${clientName} / ${jobName} (${formattedStartDate} - ${formattedEndDate})` 
              : clientName}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Action buttons */}
          <div className="flex gap-2 justify-between">
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={toggleExpandAll} className="bg-[#381980] hover:bg-[#2a1260] text-white">
                <ExpandIcon className="h-4 w-4 mr-2" />
                {Object.keys(teamMemberGroups).every(member => expandedMembers.has(member)) ? 'Collapse All' : 'Expand All'}
              </Button>
              <Button variant="outline" size="sm" onClick={handlePrint} className="bg-[#381980] hover:bg-[#2a1260] text-white">
                <Printer className="h-4 w-4 mr-2" />
                Print PDF
              </Button>
              {/* <Button variant="outline" size="sm" className="bg-[#381980] hover:bg-[#2a1260] text-white">
                <Mail className="h-4 w-4 mr-2" />
                Email PDF
              </Button> */}
            </div>
            
            <div className="text-sm font-medium bg-red-50 border border-red-200 rounded px-3 py-2">
              Write Off Amount: {formatCurrency(writeOffBalance)}
            </div>
          </div>

          <div className="border rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left p-3 font-semibold">Team Member</th>
                  <th className="text-center p-3 font-semibold">Date</th>
                  <th className="text-center p-3 font-semibold">Hours</th>
                  <th className="text-center p-3 font-semibold">Billable Rate</th>
                  <th className="text-center p-3 font-semibold">Amount</th>
                  <th className="text-center p-3 font-semibold">Write Off %</th>
                  <th className="text-center p-3 font-semibold">Write Off Amount</th>
                </tr>
              </thead>
              <tbody>
                {Object.values(teamMemberGroups).map((group, groupIndex) => (
                  <React.Fragment key={group.teamMember}>
                    {/* Team Member Summary Row */}
                    <tr 
                      className={`cursor-pointer hover:bg-muted/70 ${groupIndex % 2 === 0 ? 'bg-muted/30' : 'bg-muted/50'}`}
                      onClick={() => toggleMember(group.teamMember)}
                    >
                      <td className="p-3 font-bold">
                        <div className="flex items-center gap-2">
                          <span>
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
                      <td className="p-3 text-center">{formatCurrency(group.billableRate)}</td>
                      <td className="p-3 text-center font-bold">{formatCurrency(group.totalAmount)}</td>
                      <td className="p-3 text-center">
                        {isManualMode ? (
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            max="100"
                            value={group.percentage.toFixed(2)}
                            onChange={(e) => updatePercentage(group.teamMember, parseFloat(e.target.value) || 0)}
                            className="w-20 mx-auto"
                            onClick={(e) => e.stopPropagation()}
                          />
                        ) : (
                          <span className="font-bold">{group.percentage.toFixed(2)}%</span>
                        )}
                      </td>
                      <td className="p-3 text-center font-bold text-red-600">{formatCurrency(group.writeOffAmount)}</td>
                    </tr>
                    
                    {/* Individual Time Log Rows */}
                    {expandedMembers.has(group.teamMember) && group.timeLogs.map((log, logIndex) => (
                      <tr key={log.id} className="bg-background border-l-4 border-l-primary/20">
                        <td className="p-3 pl-12 text-sm text-muted-foreground">
                          {log.description || 'Time entry'}
                        </td>
                        <td className="p-3 text-center text-sm">{new Date(log.date).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' })}</td>
                        <td className="p-3 text-center text-sm">{log.hours.toFixed(2)}</td>
                        <td className="p-3 text-center text-sm">-</td>
                        <td className="p-3 text-center text-sm">{formatCurrency(log.amount)}</td>
                        <td className="p-3 text-center text-sm">-</td>
                        <td className="p-3 text-center text-sm">-</td>
                      </tr>
                    ))}
                  </React.Fragment>
                ))}
              </tbody>
              <tfoot className="bg-muted/30 border-t-2">
                <tr>
                  <td className="p-3 font-bold">Total</td>
                  <td className="p-3 text-center">-</td>
                  <td className="p-3 text-center font-bold">
                    {timeLogs.reduce((sum, log) => sum + log.hours, 0).toFixed(2)}
                  </td>
                  <td className="p-3 text-center">-</td>
                  <td className="p-3 text-center font-bold">{formatCurrency(totalAmount)}</td>
                  <td className="p-3 text-center font-bold">
                    <span className={totalPercentage !== 100 ? 'text-red-600' : 'text-green-600'}>
                      {totalPercentage.toFixed(2)}%
                    </span>
                  </td>
                  <td className="p-3 text-center font-bold text-red-600">{formatCurrency(totalWriteOffAmount)}</td>
                </tr>
              </tfoot>
            </table>
          </div>

          {isManualMode && totalPercentage !== 100 && (
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-center">
              <span className="text-yellow-800 font-medium">
                Total percentage must equal 100%. Current: {totalPercentage.toFixed(2)}%
              </span>
            </div>
          )}

          {/* Write Off Reason Field */}
          <div className="space-y-2 pt-4 border-t">
            <Label htmlFor="writeOffReason" className="text-sm font-medium">
              Write Off Reason *
            </Label>
            <Textarea
              id="writeOffReason"
              placeholder="Please provide a reason for this write off..."
              value={writeOffReason}
              onChange={(e) => setWriteOffReason(e.target.value)}
              className="min-h-[80px]"
            />
          </div>

          {/* Action buttons at bottom */}
          <div className="flex justify-between gap-4 pt-4 border-t">
            <div className="flex gap-4">
              <Button 
                onClick={handleSpreadProportionally}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6"
                disabled={!isManualMode}
              >
                Spread Proportionally
              </Button>
              <Button 
                onClick={handleManualChoose}
                className="bg-green-600 hover:bg-green-700 text-white px-6"
                disabled={isManualMode}
              >
                Manually Choose
              </Button>
            </div>
            <Button 
              onClick={handleSave}
              className="bg-primary hover:bg-primary/90 text-white px-8"
            >
              Save Write Off
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default WriteOffLogicDialog;