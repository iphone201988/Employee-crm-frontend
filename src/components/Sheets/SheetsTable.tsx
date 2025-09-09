import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { CheckCircle, Clock, AlertTriangle, ChevronUp, ChevronDown, Info } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { TimesheetEntry } from "@/types/sheets";
import { getProfileImage, getUserInitials } from "@/utils/profiles";

interface SheetsTableProps {
  filteredData: TimesheetEntry[];
  sortField: string;
  sortDirection: 'asc' | 'desc';
  hiddenReminders: string[];
  filterStatus: string;
  onSort: (field: string) => void;
  onSendReminder: (entryId: string) => void;
  onNoteClick: (note: string, name: string) => void;
}

export const SheetsTable = ({ 
  filteredData, 
  sortField, 
  sortDirection, 
  hiddenReminders,
  filterStatus,
  onSort, 
  onSendReminder,
  onNoteClick 
}: SheetsTableProps) => {
  const [showApprovalDialog, setShowApprovalDialog] = useState(false);
  const [selectedApproval, setSelectedApproval] = useState<{ name: string; approver: string; timestamp: string } | null>(null);
  const getStatusColor = (status: TimesheetEntry['status']) => {
    switch (status) {
      case 'submitted':
        return 'bg-blue-100 text-blue-800';
      case 'awaiting':
        return 'bg-yellow-100 text-yellow-800';
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: TimesheetEntry['status']) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="h-4 w-4" />;
      case 'awaiting':
        return <Clock className="h-4 w-4" />;
      case 'rejected':
        return <AlertTriangle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getSortIcon = (field: string) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />;
  };

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12"></TableHead>
            <TableHead 
              className="cursor-pointer hover:bg-gray-50 select-none"
              onClick={() => onSort('name')}
            >
              <div className="flex items-center gap-1 font-bold text-[hsl(var(--table-header))]">
                Name
                {getSortIcon('name')}
              </div>
            </TableHead>
            <TableHead 
              className="text-center cursor-pointer hover:bg-gray-50 select-none"
              onClick={() => onSort('capacity')}
            >
              <div className="flex items-center gap-1 justify-center font-bold text-[hsl(var(--table-header))]">
                Capacity
                {getSortIcon('capacity')}
              </div>
            </TableHead>
            <TableHead 
              className="text-center cursor-pointer hover:bg-gray-50 select-none"
              onClick={() => onSort('totalHours')}
            >
              <div className="flex items-center gap-1 justify-center font-bold text-[hsl(var(--table-header))]">
                Total Hours
                {getSortIcon('totalHours')}
              </div>
            </TableHead>
            <TableHead 
              className="text-center cursor-pointer hover:bg-gray-50 select-none"
              onClick={() => onSort('variance')}
            >
              <div className="flex items-center gap-1 justify-center font-bold text-[hsl(var(--table-header))]">
                Variance
                {getSortIcon('variance')}
              </div>
            </TableHead>
            <TableHead 
              className="text-center cursor-pointer hover:bg-gray-50 select-none"
              onClick={() => onSort('status')}
            >
              <div className="flex items-center gap-1 justify-center font-bold text-[hsl(var(--table-header))]">
                Status
                {getSortIcon('status')}
              </div>
            </TableHead>
            <TableHead>
              <div className="font-bold text-[hsl(var(--table-header))]">Notes</div>
            </TableHead>
            <TableHead 
              className="cursor-pointer hover:bg-gray-50 select-none"
              onClick={() => onSort('submittedDate')}
            >
              <div className="flex items-center gap-1 font-bold text-[hsl(var(--table-header))]">
                Submitted
                {getSortIcon('submittedDate')}
              </div>
            </TableHead>
            <TableHead className="text-center">
              <div className="font-bold text-[hsl(var(--table-header))]">Actions</div>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredData.map((entry) => (
            <TableRow key={entry.id}>
              <TableCell>
                <Avatar className="h-8 w-8">
                  <AvatarImage src={getProfileImage(entry.name)} />
                  <AvatarFallback className="text-xs">{getUserInitials(entry.name)}</AvatarFallback>
                </Avatar>
              </TableCell>
              <TableCell className="font-medium">{entry.name}</TableCell>
              
              <TableCell className="text-center font-medium">
                {Math.floor(entry.capacity)}:{String(Math.round((entry.capacity % 1) * 60)).padStart(2, '0')}
              </TableCell>
              <TableCell className="text-center">
                {Math.floor(entry.totalHours)}:{String(Math.round((entry.totalHours % 1) * 60)).padStart(2, '0')}
              </TableCell>
              <TableCell className="text-center font-medium">
                {(() => {
                  const variance = entry.capacity - entry.totalHours;
                  const hours = Math.floor(Math.abs(variance));
                  const minutes = Math.round((Math.abs(variance) % 1) * 60);
                  const formattedVariance = `${hours}:${String(minutes).padStart(2, '0')}`;
                  const isOverCapacity = variance < 0; // Negative variance means over capacity
                  const isUnderCapacity = variance > 0; // Positive variance means under capacity
                  
                  return (
                    <span className={
                      isOverCapacity ? 'text-green-600' : 
                      isUnderCapacity ? 'text-red-600' : 
                      'text-gray-900'
                    }>
                      {isOverCapacity ? '+' : isUnderCapacity ? '-' : ''}{formattedVariance}
                    </span>
                  );
                })()}
              </TableCell>
              <TableCell className="text-center">
                <Badge variant="secondary" className={`${getStatusColor(entry.status)} w-fit mx-auto`}>
                  {entry.status === 'awaiting' ? 'Not Submitted' : 
                   entry.status === 'submitted' ? 'For Review' :
                   entry.status.charAt(0).toUpperCase() + entry.status.slice(1)}
                </Badge>
              </TableCell>
              <TableCell className="text-center">
                {entry.notes ? (
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-6 w-6 p-0 text-xs"
                    onClick={() => onNoteClick(entry.notes!, entry.name)}
                  >
                    1
                  </Button>
                ) : (
                  '-'
                )}
              </TableCell>
              <TableCell>{entry.submittedDate || '-'}</TableCell>
              <TableCell>
                <div className="flex items-center gap-2 justify-start">
                  {entry.status === 'awaiting' ? (
                    <div className="w-32"></div>
                  ) : (
                    <Link to="/?tab=time">
                      <Button size="sm" variant="dashboard-blue" className="w-32 bg-blue-600 hover:bg-blue-700 text-white">
                        View Timesheets
                      </Button>
                    </Link>
                  )}
                  {filterStatus === 'approved' && (
                    <Button 
                      size="sm" 
                      variant="outline"
                      className="w-8 h-8 p-0"
                      onClick={() => {
                        setSelectedApproval({
                          name: entry.name,
                          approver: 'Manager Name',
                          timestamp: new Date().toLocaleString()
                        });
                        setShowApprovalDialog(true);
                      }}
                    >
                      <Info className="h-4 w-4" />
                    </Button>
                  )}
                  {(entry.status === 'awaiting' || entry.status === 'rejected') && !hiddenReminders.includes(entry.id) && (
                    <Button 
                      size="sm" 
                      variant="dashboard-blue"
                      className="w-16 bg-orange-600 hover:bg-orange-700 text-white"
                      onClick={() => onSendReminder(entry.id)}
                    >
                      Remind
                    </Button>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {filteredData.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No timesheets found matching your criteria.
        </div>
      )}
      
      <Dialog open={showApprovalDialog} onOpenChange={setShowApprovalDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approval Information</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <p><strong>Employee:</strong> {selectedApproval?.name}</p>
              <p><strong>Approved by:</strong> {selectedApproval?.approver}</p>
              <p><strong>Date & Time:</strong> {selectedApproval?.timestamp}</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};