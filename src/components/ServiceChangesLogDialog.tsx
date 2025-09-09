import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

interface ServiceChange {
  id: string;
  timestamp: string;
  user: string;
  action: string;
  service: string;
  client: string;
  previousValue: boolean;
  newValue: boolean;
}

interface ServiceChangesLogDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ServiceChangesLogDialog = ({ open, onOpenChange }: ServiceChangesLogDialogProps) => {
  // Mock data for service changes
  const serviceChanges: ServiceChange[] = [
    {
      id: '1',
      timestamp: '2024-01-15T10:30:00Z',
      user: 'John Davis',
      action: 'enabled',
      service: 'VAT',
      client: 'Water Savers Limited',
      previousValue: false,
      newValue: true
    },
    {
      id: '2',
      timestamp: '2024-01-14T15:45:00Z',
      user: 'Sarah Johnson',
      action: 'disabled',
      service: 'Payroll',
      client: 'Green Gardens Limited',
      previousValue: true,
      newValue: false
    },
    {
      id: '3',
      timestamp: '2024-01-14T14:20:00Z',
      user: 'John Davis',
      action: 'enabled',
      service: 'Audit',
      client: 'Brown Enterprises',
      previousValue: false,
      newValue: true
    },
    {
      id: '4',
      timestamp: '2024-01-13T11:15:00Z',
      user: 'Emily Smith',
      action: 'enabled',
      service: 'CT1',
      client: 'Smith & Associates',
      previousValue: false,
      newValue: true
    },
    {
      id: '5',
      timestamp: '2024-01-13T09:30:00Z',
      user: 'David Wilson',
      action: 'disabled',
      service: 'Bookkeeping',
      client: 'Tech Solutions Inc.',
      previousValue: true,
      newValue: false
    },
    {
      id: '6',
      timestamp: '2024-01-12T16:00:00Z',
      user: 'Lisa Thompson',
      action: 'enabled',
      service: 'Income Tax',
      client: 'Financial Advisors Co.',
      previousValue: false,
      newValue: true
    }
  ];

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return {
      date: date.toLocaleDateString('en-GB'),
      time: date.toLocaleTimeString('en-GB', { 
        hour: '2-digit', 
        minute: '2-digit' 
      })
    };
  };

  const getActionColor = (action: string) => {
    return action === 'enabled' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Service Changes Log</DialogTitle>
          <DialogDescription>
            Timeline of all service changes made to client accounts
          </DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="h-[500px] w-full pr-4">
          <div className="space-y-4">
            {serviceChanges.map((change, index) => {
              const { date, time } = formatTimestamp(change.timestamp);
              
              return (
                <div key={change.id}>
                  <div className="flex items-start space-x-4 p-4 rounded-lg bg-muted/50">
                    <div className="flex-shrink-0">
                      <div className="w-2 h-2 mt-2 bg-primary rounded-full"></div>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm font-medium text-foreground">
                          {change.user} {change.action} {change.service} service for {change.client}
                        </p>
                        <Badge variant="outline" className={`text-xs ${getActionColor(change.action)}`}>
                          {change.action}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                        <span>{date}</span>
                        <span>{time}</span>
                        <span className="flex items-center space-x-2">
                          <span>Changed from:</span>
                          <Badge variant="outline" className="text-xs">
                            {change.previousValue ? 'Yes' : 'No'}
                          </Badge>
                          <span>to:</span>
                          <Badge variant="outline" className="text-xs">
                            {change.newValue ? 'Yes' : 'No'}
                          </Badge>
                        </span>
                      </div>
                      
                      <div className="mt-2">
                        <p className="text-xs text-muted-foreground">
                          Service: <span className="font-medium">{change.service}</span> • 
                          Client: <span className="font-medium">{change.client}</span>
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  {index < serviceChanges.length - 1 && (
                    <Separator className="my-4" />
                  )}
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default ServiceChangesLogDialog;