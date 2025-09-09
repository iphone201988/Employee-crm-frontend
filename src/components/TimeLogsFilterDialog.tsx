import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

interface TimeLogsFilterDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  timeEntries: any[];
  totalHours: string;
  totalValue?: number;
}

const TimeLogsFilterDialog = ({ 
  open, 
  onOpenChange, 
  title, 
  timeEntries, 
  totalHours,
  totalValue 
}: TimeLogsFilterDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>{title} Time Logs</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex justify-between items-center bg-gray-50 p-3 rounded-lg">
            <span className="font-medium">Total Time:</span>
            <span className="font-bold">{totalHours}</span>
          </div>
          {totalValue !== undefined && (
            <div className="flex justify-between items-center bg-green-50 p-3 rounded-lg">
              <span className="font-medium">Total Value:</span>
              <span className="font-bold text-green-700">€{totalValue.toFixed(2)}</span>
            </div>
          )}
          <ScrollArea className="h-[400px] w-full">
            <div className="space-y-2">
              {timeEntries.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No time entries found</p>
              ) : (
                timeEntries.map((entry, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-3 space-y-2">
                    <div className="flex justify-between items-start">
                      <div className="text-left">
                        <div className="font-medium text-left">{entry.client}</div>
                        <div className="text-sm text-gray-600 text-left">{entry.description}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">{entry.hours}</div>
                        <div className="text-xs text-gray-500">{entry.date}</div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TimeLogsFilterDialog;