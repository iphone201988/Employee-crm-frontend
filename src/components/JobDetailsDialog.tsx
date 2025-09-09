import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatCurrency } from '@/lib/currency';
import { Edit } from 'lucide-react';

interface TimeEntry {
  id: string;
  date: string;
  description: string;
  hours: number;
  rate: number;
  amount: number;
  employee: string;
}

interface JobDetailsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  jobName: string;
  jobFee: number;
  wipAmount: number;
  hoursLogged: number;
  timeEntries?: TimeEntry[];
}

export const JobDetailsDialog: React.FC<JobDetailsDialogProps> = ({
  isOpen,
  onClose,
  jobName,
  jobFee,
  wipAmount,
  hoursLogged,
  timeEntries = []
}) => {
  const [activeTab, setActiveTab] = useState("job-details");
  
  const sampleTimeEntries: TimeEntry[] = timeEntries.length > 0 ? timeEntries : [
    {
      id: '1',
      date: '2024-01-15',
      description: 'Initial consultation and requirements gathering',
      hours: 2.5,
      rate: 150,
      amount: 375,
      employee: 'John Smith'
    },
    {
      id: '2',
      date: '2024-01-16',
      description: 'Document review and analysis',
      hours: 4.0,
      rate: 150,
      amount: 600,
      employee: 'Sarah Jones'
    },
    {
      id: '3',
      date: '2024-01-17',
      description: 'Client meeting and strategy discussion',
      hours: 1.5,
      rate: 180,
      amount: 270,
      employee: 'John Smith'
    },
    {
      id: '4',
      date: '2024-01-18',
      description: 'Research and preparation work',
      hours: 3.0,
      rate: 120,
      amount: 360,
      employee: 'Michael Brown'
    }
  ];

  const totalAmount = sampleTimeEntries.reduce((sum, entry) => sum + entry.amount, 0);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="flex flex-row items-center justify-between">
          <DialogTitle className="text-xl font-semibold">
            {jobName}
          </DialogTitle>
          <Button variant="outline" size="sm" className="flex items-center gap-2">
            <Edit className="h-4 w-4" />
            Edit
          </Button>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="job-details">Job Details</TabsTrigger>
            <TabsTrigger value="time-logs">Time Logs ({sampleTimeEntries.length})</TabsTrigger>
            <TabsTrigger value="notes">Notes (0)</TabsTrigger>
          </TabsList>

          <TabsContent value="job-details" className="mt-6">
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Job Name</Label>
                  <Input value={jobName} readOnly className="bg-muted" />
                </div>
                
                <div className="space-y-2">
                  <Label>Job Type</Label>
                  <Input value="Consulting" readOnly className="bg-muted" />
                </div>
                
                <div className="space-y-2">
                  <Label>Job Status</Label>
                  <Input value="Active" readOnly className="bg-muted" />
                </div>
                
                <div className="space-y-2">
                  <Label>Job Fee</Label>
                  <Input value={formatCurrency(jobFee)} readOnly className="bg-muted" />
                </div>
                
                <div className="space-y-2">
                  <Label>WIP Amount</Label>
                  <Input value={formatCurrency(wipAmount)} readOnly className="bg-muted" />
                </div>
                
                <div className="space-y-2">
                  <Label>Hours Logged</Label>
                  <Input value={`${hoursLogged} hours`} readOnly className="bg-muted" />
                </div>
                
                <div className="space-y-2">
                  <Label>Start Date</Label>
                  <Input value="2024-01-15" readOnly className="bg-muted" />
                </div>
                
                <div className="space-y-2">
                  <Label>Assigned To</Label>
                  <Input value="John Smith" readOnly className="bg-muted" />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>Job Description</Label>
                <textarea 
                  className="w-full p-3 border border-input bg-muted rounded-md resize-none" 
                  rows={3} 
                  value="Comprehensive consulting project including analysis, documentation, and implementation guidance."
                  readOnly
                />
              </div>

              <div className="space-y-2">
                <Label>Job Tags</Label>
                <div className="flex gap-2">
                  <Badge variant="secondary">High Priority</Badge>
                  <Badge variant="secondary">Active Client</Badge>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="time-logs" className="mt-6">
            <div className="space-y-4">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Employee</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead className="text-right">Hours</TableHead>
                      <TableHead className="text-right">Rate</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sampleTimeEntries.map((entry) => (
                      <TableRow key={entry.id}>
                        <TableCell>{new Date(entry.date).toLocaleDateString('en-GB')}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{entry.employee}</Badge>
                        </TableCell>
                        <TableCell className="max-w-xs">{entry.description}</TableCell>
                        <TableCell className="text-right">{entry.hours}h</TableCell>
                        <TableCell className="text-right">{formatCurrency(entry.rate)}</TableCell>
                        <TableCell className="text-right font-medium">{formatCurrency(entry.amount)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              
              <div className="pt-4 border-t">
                <div className="flex justify-between items-center">
                  <span className="font-medium">Total Amount:</span>
                  <span className="text-lg font-bold">{formatCurrency(totalAmount)}</span>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="notes" className="mt-6">
            <div className="text-center py-8 text-muted-foreground">
              <p>No notes available for this job.</p>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};