import React from 'react';
import { TableRow, TableCell } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { calculateClientSummary } from '@/utils/approvalTimeLogsUtils';

interface ApprovalTimeLogsClientHeaderProps {
  clientName: string;
  entries: any[];
  isSelected: boolean;
  onSelectionChange: (clientName: string, checked: boolean) => void;
}

const ApprovalTimeLogsClientHeader = ({
  clientName,
  entries,
  isSelected,
  onSelectionChange
}: ApprovalTimeLogsClientHeaderProps) => {
  const clientSummary = calculateClientSummary(entries);

  return (
    <TableRow>
      <TableCell className="p-4">
        <Checkbox
          checked={isSelected}
          onCheckedChange={(checked) => onSelectionChange(clientName, !!checked)}
          aria-label={`Select all ${clientName} entries`}
        />
      </TableCell>
      <TableCell colSpan={11} className="font-bold text-gray-800 p-4">
        <div className="flex justify-between items-center">
          <span>{clientName} ({entries.length} entries)</span>
          <div className="text-sm font-bold space-x-4">
            <span className="text-green-700 font-bold">
              Billable: {clientSummary.billable} (€{clientSummary.billableAmount})
            </span>
            <span className="text-red-700 font-bold">
              Non-billable: {clientSummary.nonBillable}
            </span>
            <span className="text-gray-700 font-bold">
              Unknown: {clientSummary.unknown}
            </span>
          </div>
        </div>
      </TableCell>
    </TableRow>
  );
};

export default ApprovalTimeLogsClientHeader;