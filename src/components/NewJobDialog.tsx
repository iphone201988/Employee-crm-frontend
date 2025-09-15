import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {useGetDropdownOptionsQuery} from '@/store/teamApi';
interface NewJobDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (jobData: { 
    jobName: string; 
    clientName: string;
    jobType: string; 
    startDate: string;
    endDate: string;
    estimatedCost: number;
    actualCost: number;
    status: string;
    jobManager: string;
    team: string[];
    description: string;
  }) => void;
}

const NewJobDialog = ({ open, onOpenChange, onSave }: NewJobDialogProps) => {
  const [jobName, setJobName] = useState('');
  const [clientName, setClientName] = useState('');
  const [jobType, setJobType] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [estimatedCost, setEstimatedCost] = useState('');
  const [actualCost, setActualCost] = useState('0');
  const [status, setStatus] = useState('queued');
  const [jobManager, setJobManager] = useState('');
  const [team, setTeam] = useState<string[]>([]);
  const [description, setDescription] = useState('');
 
  const { data: categoriesData } = useGetDropdownOptionsQuery("job");
  console.log('=================================',categoriesData);

  const jobTypes = [
    'Income Tax',
    'VAT',
    'Audit', 
    'Bookkeeping',
    'Payroll',
    'Management Accounts',
    'Accounts Preparation',
    'Tax Advisory'
  ];

  const teamMembers = ['John Smith', 'Sarah Johnson', 'Mike Wilson', 'Emily Davis', 'Lisa Thompson'];
  const statuses = ['queued', 'in-progress', 'with-client', 'for-approval', 'completed'];

  const handleSave = () => {
    if (jobName && clientName && jobType && estimatedCost && startDate && endDate && jobManager) {
      onSave({
        jobName,
        clientName,
        jobType,
        startDate,
        endDate,
        estimatedCost: parseFloat(estimatedCost),
        actualCost: parseFloat(actualCost),
        status,
        jobManager,
        team,
        description
      });
      // Reset form
      setJobName('');
      setClientName('');
      setJobType('');
      setStartDate('');
      setEndDate('');
      setEstimatedCost('');
      setActualCost('0');
      setStatus('queued');
      setJobManager('');
      setTeam([]);
      setDescription('');
      onOpenChange(false);
    }
  };

  const handleCancel = () => {
    setJobName('');
    setClientName('');
    setJobType('');
    setStartDate('');
    setEndDate('');
    setEstimatedCost('');
    setActualCost('0');
    setStatus('queued');
    setJobManager('');
    setTeam([]);
    setDescription('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Job</DialogTitle>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="jobName">Job Nameasdsasdasdasdasdasd</Label>
              <Input
                id="jobName"
                value={jobName}
                onChange={(e) => setJobName(e.target.value)}
                placeholder="Enter job name"
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="clientName">Client Name</Label>
              <Input
                id="clientName"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                placeholder="Enter client name"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="jobType">Job Type</Label>
              <Select value={jobType} onValueChange={setJobType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select job type" />
                </SelectTrigger>
                <SelectContent className="bg-popover border border-border">
                  {jobTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="jobManager">Job Manager</Label>
              <Select value={jobManager} onValueChange={setJobManager}>
                <SelectTrigger>
                  <SelectValue placeholder="Select job manager" />
                </SelectTrigger>
                <SelectContent className="bg-popover border border-border">
                  {teamMembers.map((member) => (
                    <SelectItem key={member} value={member}>
                      {member}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="endDate">End Date</Label>
              <Input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="estimatedCost">Estimated Cost</Label>
              <Input
                id="estimatedCost"
                type="number"
                step="0.01"
                min="0"
                value={estimatedCost}
                onChange={(e) => setEstimatedCost(e.target.value)}
                placeholder="Enter estimated cost"
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="status">Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent className="bg-popover border border-border">
                  {statuses.map((stat) => (
                    <SelectItem key={stat} value={stat}>
                      {stat.charAt(0).toUpperCase() + stat.slice(1).replace('-', ' ')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter job description"
            />
          </div>
        </div>
        
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button 
            onClick={handleSave}
            disabled={!jobName || !clientName || !jobType || !estimatedCost || !startDate || !endDate || !jobManager}
          >
            Add Job
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default NewJobDialog;