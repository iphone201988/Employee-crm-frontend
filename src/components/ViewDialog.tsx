import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { getTimeSummary } from "@/utils/timesheetUtils";

interface ViewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedMember: any;
  currentWeek: string;
}

const ViewDialog = ({ open, onOpenChange, selectedMember, currentWeek }: ViewDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px]">
        <DialogHeader>
          <DialogTitle>Time Entries for {selectedMember?.name} - {currentWeek}</DialogTitle>
        </DialogHeader>
        {selectedMember && (
          <div className="space-y-4">
            {/* Summary Cards */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-green-50 p-3 rounded-lg text-center">
                <div className="text-sm text-green-600 font-medium">Billable</div>
                <div className="text-lg font-bold text-green-700">{getTimeSummary(selectedMember).billable}</div>
              </div>
              <div className="bg-red-50 p-3 rounded-lg text-center">
                <div className="text-sm text-red-600 font-medium">Non-Billable</div>
                <div className="text-lg font-bold text-red-700">{getTimeSummary(selectedMember).nonBillable}</div>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg text-center">
                <div className="text-sm text-gray-600 font-medium">Unknown</div>
                <div className="text-lg font-bold text-gray-700">{getTimeSummary(selectedMember).unknown}</div>
              </div>
            </div>

            {/* Time Entries Table */}
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-gray-200">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="border border-gray-200 p-3 text-left font-medium text-gray-600">Date</th>
                    <th className="border border-gray-200 p-3 text-left font-medium text-gray-600">Client</th>
                    <th className="border border-gray-200 p-3 text-left font-medium text-gray-600">Description</th>
                    <th className="border border-gray-200 p-3 text-center font-medium text-gray-600">Hours</th>
                    <th className="border border-gray-200 p-3 text-center font-medium text-gray-600">Billable</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedMember.timeEntries.map((entry: any, index: number) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="border border-gray-200 p-3">{entry.date}</td>
                      <td className="border border-gray-200 p-3">{entry.client}</td>
                      <td className="border border-gray-200 p-3">{entry.description}</td>
                      <td className="border border-gray-200 p-3 text-center">{entry.hours}</td>
                      <td className="border border-gray-200 p-3 text-center">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          entry.billable === 'billable' 
                            ? 'bg-green-100 text-green-700'
                            : entry.billable === 'non-billable'
                            ? 'bg-red-100 text-red-700'
                            : 'bg-gray-100 text-gray-700'
                        }`}>
                          {entry.billable}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ViewDialog;