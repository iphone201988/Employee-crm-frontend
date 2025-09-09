import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus } from 'lucide-react';
import { formatCurrency } from '@/lib/currency';
import NewJobDialog from './NewJobDialog';

interface TimeLog {
  id: string;
  date: string;
  teamMember: string;
  category: 'client work' | 'meeting' | 'phone call' | 'event' | 'training' | 'other';
  description: string;
  hours: number;
  rate: number;
  amount: number;
  billable: boolean;
  status: 'not-invoiced' | 'invoiced' | 'paid';
}

interface Job {
  id: string;
  name: string;
  type: string;
  logged: number;
  billable: number;
  nonBillable: number;
  wipValue: number;
  timeLogs: TimeLog[];
}

interface ClientJobsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientName: string;
  jobs: Job[];
  onAddJob?: (jobData: { name: string; type: string; fee: number }) => void;
}

const ClientJobsDialog = ({ open, onOpenChange, clientName, jobs, onAddJob }: ClientJobsDialogProps) => {
  const [showNewJobDialog, setShowNewJobDialog] = useState(false);
  const getCategoryBadge = (category: TimeLog['category']) => {
    const variants = {
      'client work': 'bg-blue-100 text-blue-800',
      'meeting': 'bg-green-100 text-green-800',
      'phone call': 'bg-yellow-100 text-yellow-800',
      'event': 'bg-purple-100 text-purple-800',
      'training': 'bg-orange-100 text-orange-800',
      'other': 'bg-gray-100 text-gray-800'
    };
    return (
      <Badge variant="secondary" className={variants[category]}>
        {category.charAt(0).toUpperCase() + category.slice(1)}
      </Badge>
    );
  };

  const getStatusBadge = (status: TimeLog['status']) => {
    switch (status) {
      case 'not-invoiced':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Not Invoiced</Badge>;
      case 'invoiced':
        return <Badge variant="secondary" className="bg-blue-100 text-blue-800">Invoiced</Badge>;
      case 'paid':
        return <Badge variant="secondary" className="bg-green-100 text-green-800">Paid</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const totalInvoicedBalance = jobs.reduce((sum, job) => 
    sum + job.timeLogs.filter(log => log.status === 'invoiced' || log.status === 'paid').reduce((logSum, log) => logSum + log.amount, 0), 0
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex justify-between items-start">
            <div>
              <DialogTitle className="text-xl font-bold">
                Jobs for {clientName}
              </DialogTitle>
              <div className="text-sm text-muted-foreground">
                Total Invoiced Balance: {formatCurrency(totalInvoicedBalance)}
              </div>
            </div>
            <Button
              onClick={() => setShowNewJobDialog(true)}
              size="sm"
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              New Job
            </Button>
          </div>
        </DialogHeader>
        
        <div className="space-y-6">
          {jobs.map((job) => (
            <div key={job.id} className="border rounded-lg p-4">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h3 className="text-lg font-semibold">{job.name}</h3>
                  <p className="text-sm text-muted-foreground">{job.type}</p>
                </div>
                <div className="text-right">
                  <div className="text-sm text-muted-foreground">WIP Value</div>
                  <div className="font-semibold">{formatCurrency(job.wipValue)}</div>
                </div>
              </div>
              
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead>Date</TableHead>
                      <TableHead>Team Member</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead className="text-right">Hours</TableHead>
                      <TableHead className="text-right">Rate</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead className="text-center">Billable</TableHead>
                      <TableHead className="text-center">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {job.timeLogs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell>
                          {new Date(log.date).toLocaleDateString('en-GB')}
                        </TableCell>
                        <TableCell>{log.teamMember}</TableCell>
                        <TableCell>{getCategoryBadge(log.category)}</TableCell>
                        <TableCell className="max-w-[300px]">{log.description}</TableCell>
                        <TableCell className="text-right">{log.hours.toFixed(1)}h</TableCell>
                        <TableCell className="text-right">{formatCurrency(log.rate)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(log.amount)}</TableCell>
                        <TableCell className="text-center">
                          <Badge variant={log.billable ? "default" : "secondary"}>
                            {log.billable ? "Yes" : "No"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          {getStatusBadge(log.status)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
      
      <NewJobDialog
        open={showNewJobDialog}
        onOpenChange={setShowNewJobDialog}
        onSave={(jobData) => {
          // Transform the new job data format to the expected format
          const transformedData = {
            name: jobData.jobName,
            type: jobData.jobType,
            fee: jobData.estimatedCost
          };
          onAddJob?.(transformedData);
          setShowNewJobDialog(false);
        }}
      />
    </Dialog>
  );
};

export default ClientJobsDialog;