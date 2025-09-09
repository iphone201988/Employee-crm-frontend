import React, { useState } from 'react';
import { TableRow, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getStatusColor, getPurposeColor, formatDuration } from '@/utils/approvalTimeLogsUtils';
import { formatCurrency } from '@/lib/currency';
import { getProfileImage, getUserInitials } from "@/utils/profiles";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Edit } from 'lucide-react';

interface ApprovalTimeLogsEntryRowProps {
  entry: any;
  isSelected: boolean;
  onSelectionChange: (entryId: string, checked: boolean) => void;
}

const ApprovalTimeLogsEntryRow = ({
  entry,
  isSelected,
  onSelectionChange
}: ApprovalTimeLogsEntryRowProps) => {
  const [editingStatus, setEditingStatus] = useState(false);
  const [currentStatus, setCurrentStatus] = useState(entry.billable);

  const handleStatusChange = (newStatus: string) => {
    setCurrentStatus(newStatus);
    setEditingStatus(false);
    // Update the entry status - in a real app, this would call an API
  };

  // Format date to 01/01/2025
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  return (
    <TableRow>
      <TableCell>
        <Checkbox
          checked={isSelected}
          onCheckedChange={(checked) => onSelectionChange(entry.entryId, !!checked)}
          aria-label={`Select ${entry.description}`}
        />
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          <Avatar className="w-6 h-6">
            <AvatarImage src={getProfileImage(entry.memberName)} alt={entry.memberName} />
            <AvatarFallback className="text-xs">
              {getUserInitials(entry.memberName)}
            </AvatarFallback>
          </Avatar>
          <span>{entry.memberName}</span>
        </div>
      </TableCell>
      <TableCell>{formatDate(entry.date)}</TableCell>
      <TableCell>{entry.client}</TableCell>
      <TableCell className="font-medium">
        {entry.jobName || `${entry.client} Project`}
      </TableCell>
      <TableCell>
        {editingStatus ? (
          <Select value={currentStatus} onValueChange={handleStatusChange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="billable">Billable</SelectItem>
              <SelectItem value="non-billable">Non-billable</SelectItem>
              <SelectItem value="unknown">Unknown</SelectItem>
            </SelectContent>
          </Select>
        ) : (
          <Badge 
            className={`${getStatusColor(currentStatus)} cursor-pointer`}
            onClick={() => setEditingStatus(true)}
          >
            {currentStatus}
          </Badge>
        )}
      </TableCell>
      <TableCell>
        <span className="text-sm">
          {entry.purpose}
        </span>
      </TableCell>
      <TableCell className="max-w-xs truncate">
        {entry.description}
      </TableCell>
      <TableCell>{formatDuration(entry.hours)}</TableCell>
      <TableCell>{formatCurrency(parseFloat(entry.rate))}</TableCell>
      <TableCell className="font-medium">
        {entry.billable === 'billable' ? formatCurrency(parseFloat(entry.amount)) : 'N/A'}
      </TableCell>
    </TableRow>
  );
};

export default ApprovalTimeLogsEntryRow;