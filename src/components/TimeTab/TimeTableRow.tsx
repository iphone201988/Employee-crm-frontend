import React from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Check, X } from 'lucide-react';
import { TimeEntry, EditingCell } from '@/types/timeTab';
import { formatCellValue, isNonChargeableActivity } from '@/utils/timeTabUtils';
import { clientNames, jobNames, categoryOptions, categoryColors } from '@/constants/timeTabConstants';

interface TimeTableRowProps {
  entry: TimeEntry;
  editingCell: EditingCell | null;
  hideWeekend: boolean;
  showMonetary: boolean;
  onCellClick: (entryId: string, field: string, dayIndex?: number) => void;
  onCellBlur: () => void;
  onUpdateField: (entryId: string, field: string, value: string, dayIndex?: number) => void;
  onToggleBillable: (entryId: string) => void;
  onTogglePass: (entryId: string) => void;
  onRemoveRow: (entryId: string) => void;
}

export const TimeTableRow: React.FC<TimeTableRowProps> = ({
  entry,
  editingCell,
  hideWeekend,
  showMonetary,
  onCellClick,
  onCellBlur,
  onUpdateField,
  onToggleBillable,
  onTogglePass,
  onRemoveRow
}) => {
  return (
    <tr className={`font-inter ${entry.pass ? 'bg-green-50' : ''}`}>
      <td
        className="border border-gray-300 p-2 text-xs cursor-pointer hover:bg-blue-50"
        onClick={() => onCellClick(entry.id, 'client')}
      >
        {editingCell?.entryId === entry.id && editingCell?.field === 'client' ? (
          <Input
            value={entry.client}
            onChange={(e) => onUpdateField(entry.id, 'client', e.target.value)}
            onBlur={onCellBlur}
            className="h-6 text-xs border-0 p-0"
            autoFocus
          />
        ) : (
          entry.client
        )}
      </td>
      <td 
        className="border border-gray-300 p-2 text-xs cursor-pointer hover:bg-blue-50"
        onClick={() => onCellClick(entry.id, 'clientName')}
      >
        {editingCell?.entryId === entry.id && editingCell?.field === 'clientName' ? (
          <div className="space-y-1">
            <Select value={entry.clientName} onValueChange={(value) => onUpdateField(entry.id, 'clientName', value)}>
              <SelectTrigger className="h-6 text-xs border-0 p-0">
                <SelectValue placeholder="Select client" />
              </SelectTrigger>
              <SelectContent>
                {clientNames.map((name) => (
                  <SelectItem key={name} value={name} className="text-xs">{name}</SelectItem>
                ))}
                <SelectItem value="N/A" className="text-xs">N/A</SelectItem>
              </SelectContent>
            </Select>
          </div>
        ) : (
          entry.clientName || 'N/A'
        )}
      </td>
      <td 
        className="border border-gray-300 p-2 text-xs cursor-pointer hover:bg-blue-50"
        onClick={() => onCellClick(entry.id, 'job')}
      >
        {editingCell?.entryId === entry.id && editingCell?.field === 'job' ? (
          <div className="space-y-1">
            <Select value={entry.job} onValueChange={(value) => onUpdateField(entry.id, 'job', value)}>
              <SelectTrigger className="h-6 text-xs border-0 p-0">
                <SelectValue placeholder="Select job" />
              </SelectTrigger>
              <SelectContent>
                {jobNames.map((job) => (
                  <SelectItem key={job} value={job} className="text-xs">{job}</SelectItem>
                ))}
                <SelectItem value="N/A" className="text-xs">N/A</SelectItem>
              </SelectContent>
            </Select>
          </div>
        ) : (
          <div className="truncate max-w-[200px]" title={entry.job || 'N/A'}>
            {entry.job || 'N/A'}
          </div>
        )}
      </td>
      <td 
        className="border border-gray-300 p-2 text-xs cursor-pointer hover:bg-blue-50"
        onClick={() => onCellClick(entry.id, 'wip')}
      >
        {editingCell?.entryId === entry.id && editingCell?.field === 'wip' ? (
          <Select value={entry.wip} onValueChange={(value) => onUpdateField(entry.id, 'wip', value)}>
            <SelectTrigger className="h-6 text-xs border-0 p-0">
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              {categoryOptions.map((category) => (
                <SelectItem key={category} value={category} className="text-xs">{category}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <span className={`px-2 py-1 rounded text-xs ${categoryColors[entry.wip] || 'bg-slate-100 text-slate-800'}`}>
            {entry.wip}
          </span>
        )}
      </td>
      <td 
        className="border border-gray-300 p-2 text-xs text-left cursor-pointer hover:bg-blue-50"
        onClick={() => onCellClick(entry.id, 'activity')}
      >
        {editingCell?.entryId === entry.id && editingCell?.field === 'activity' ? (
          <Input
            value={entry.activity}
            onChange={(e) => onUpdateField(entry.id, 'activity', e.target.value)}
            onBlur={onCellBlur}
            className="h-6 text-xs border-0 p-0"
            autoFocus
          />
        ) : (
          <div className="truncate max-w-[150px]" title={entry.activity}>
            {entry.activity}
          </div>
        )}
      </td>
      <td className="border border-gray-300 p-2 text-center">
        <Switch
          checked={entry.billable}
          onCheckedChange={() => onToggleBillable(entry.id)}
          className="data-[state=checked]:bg-green-600"
        />
      </td>
      <td className="border border-gray-300 p-2 text-xs text-center">{entry.rate}</td>
      {entry.dailyHours.slice(0, hideWeekend ? 5 : 7).map((hours, dayIndex) => (
        <td 
          key={dayIndex} 
          className={`border border-gray-300 p-2 text-xs text-center cursor-pointer hover:bg-blue-100 ${
            entry.pass ? 'bg-green-50' : 'bg-gray-100'
          }`}
          onClick={() => onCellClick(entry.id, 'dailyHours', dayIndex)}
        >
          {editingCell?.entryId === entry.id && editingCell?.field === 'dailyHours' && editingCell?.dayIndex === dayIndex ? (
            <Input
              value={hours}
              onChange={(e) => onUpdateField(entry.id, 'dailyHours', e.target.value, dayIndex)}
              onBlur={onCellBlur}
              className="h-6 text-xs border-0 p-0 text-center"
              autoFocus
            />
          ) : (
            formatCellValue(hours, entry.billableRate, isNonChargeableActivity(entry.wip, entry.billable), showMonetary)
          )}
        </td>
      ))}
      <td className="border border-gray-300 p-2 text-center">
        <div className="flex items-center justify-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onRemoveRow(entry.id)}
            className="h-6 w-6 p-0 text-red-600 hover:text-red-800"
            title="Delete Row"
          >
            <X className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onTogglePass(entry.id)}
            className="h-6 w-6 p-0"
            title={entry.pass ? "Unapprove" : "Approve"}
          >
            {entry.pass ? (
              <Check className="h-4 w-4 text-green-600" />
            ) : (
              <div className="h-4 w-4 border border-gray-300 rounded"></div>
            )}
          </Button>
        </div>
      </td>
    </tr>
  );
};