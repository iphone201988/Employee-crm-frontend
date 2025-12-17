import React, { useEffect, useMemo, useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatCurrency } from '@/lib/currency';
import { Edit, Plus, Trash2, Clock, Save, X } from 'lucide-react';
import { useGetJobQuery, useUpdateJobMutation } from '@/store/jobApi';
import { useGetDropdownOptionsQuery } from '@/store/teamApi';
import { useGetNotesQuery, useAddNoteMutation, useUpdateNoteMutation, useDeleteNoteMutation } from '@/store/notesApi';
import { toast } from 'sonner';

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
  jobId: string;
  jobName: string;
  jobFee: number;
  wipAmount: number;
  hoursLogged: number;
  timeEntries?: TimeEntry[];
}

export const JobDetailsDialog: React.FC<JobDetailsDialogProps> = ({
  isOpen,
  onClose,
  jobId,
  jobName,
  jobFee,
  wipAmount,
  hoursLogged,
  timeEntries = []
}) => {
  const [activeTab, setActiveTab] = useState("job-details");
  const { data: jobResp, isLoading } = useGetJobQuery(jobId, { skip: !jobId });
  const [updateJob, { isLoading: isUpdating }] = useUpdateJobMutation();
  const {
    data: jobNotesResp,
    isFetching: isJobNotesLoading,
    refetch: refetchJobNotes,
  } = useGetNotesQuery({ jobId }, { skip: !jobId || !isOpen });
  const [addNote] = useAddNoteMutation();
  const [updateNoteMutation] = useUpdateNoteMutation();
  const [deleteNoteMutation] = useDeleteNoteMutation();
  const jobNotes = jobNotesResp?.data ?? [];
  const [newNote, setNewNote] = useState('');
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editableJob, setEditableJob] = useState<any | null>(null);
  const [showClientSuggestions, setShowClientSuggestions] = useState(false);
  const [clientNameInput, setClientNameInput] = useState('');
  const clientInputContainerRef = useRef<HTMLDivElement>(null);
  const { data: jobTypeOptionsResp } = useGetDropdownOptionsQuery('job');
  const { data: teamOptionsResp } = useGetDropdownOptionsQuery('team');
  const { data: clientOptionsResp } = useGetDropdownOptionsQuery('client');
  
  const apiJob = jobResp?.data;
  const apiLogs = jobResp?.timeLogs || [];
  const timeLogEntries: TimeEntry[] = useMemo(() => {
    // Normalize various duration shapes (seconds, hours, or HH:MM:SS) to hours
    const parseDurationToHours = (value: any): number => {
      if (value === null || value === undefined) return 0;
      if (typeof value === 'number') {
        // Heuristic: large numbers are likely seconds; small numbers (<=10) are hours
        return value > 10 ? value / 3600 : value;
      }
      if (typeof value === 'string') {
        if (value.includes(':')) {
          const [h = '0', m = '0', s = '0'] = value.split(':');
          const hours = Number(h) || 0;
          const minutes = Number(m) || 0;
          const seconds = Number(s) || 0;
          return hours + minutes / 60 + seconds / 3600;
        }
        const num = Number(value);
        if (!Number.isNaN(num)) {
          return num > 10 ? num / 3600 : num;
        }
      }
      return 0;
    };

    if (apiLogs.length > 0) {
      return apiLogs.map((l: any) => ({
        id: l._id,
        date: l.date,
        description: l.description || '',
        // prefer explicit hours, else seconds from API aggregate (durationSeconds), else raw duration
        hours: parseDurationToHours(l.durationHours ?? l.durationSeconds ?? l.duration),
        rate: Number(l.rate || 0),
        amount: Number(l.amount || 0),
        employee: l.user?.name || '—'
      }));
    }
    if (timeEntries.length > 0) return timeEntries;
    return [];
  }, [apiLogs, timeEntries]);

  const jobTypeOptions = useMemo(
    () => (jobTypeOptionsResp?.data?.jobCategories || jobTypeOptionsResp?.data?.jobs || [])
      .map((jt: any) => ({ value: jt._id, label: jt.name })),
    [jobTypeOptionsResp]
  );

  const jobManagerOptions = useMemo(
    () => (teamOptionsResp?.data?.teams || []).map((member: any) => ({ value: member._id, label: member.name })),
    [teamOptionsResp]
  );

  const clientOptions = useMemo(
    () => (clientOptionsResp?.data?.clients || []).map((client: any) => ({ _id: client._id, name: client.name })),
    [clientOptionsResp]
  );

  const teamMemberOptions = useMemo(
    () => (teamOptionsResp?.data?.teams || []).map((member: any) => ({ _id: member._id, name: member.name })),
    [teamOptionsResp]
  );

  const filteredClients = useMemo(() => {
    if (!clientNameInput) return [];
    return clientOptions.filter(client => client.name.toLowerCase().includes(clientNameInput.toLowerCase()));
  }, [clientNameInput, clientOptions]);

  const statusOptions: { value: string; label: string }[] = [
    { value: 'queued', label: 'Queued' },
    { value: 'awaitingRecords', label: 'Awaiting Records' },
    { value: 'inProgress', label: 'In Progress' },
    { value: 'withClient', label: 'With Client' },
    { value: 'forApproval', label: 'For Approval' },
    { value: 'completed', label: 'Completed' },
  ];

  const priorityOptions: { value: string; label: string }[] = [
    { value: 'low', label: 'Low' },
    { value: 'medium', label: 'Medium' },
    { value: 'high', label: 'High' },
    { value: 'urgent', label: 'Urgent' },
  ];

  const getIdValue = (value: any) => {
    if (!value) return '';
    if (typeof value === 'string') return value;
    return value._id || '';
  };

  useEffect(() => {
    if (apiJob) {
      setEditableJob(apiJob);
      // Set client name input when job data loads
      if (apiJob.clientId?.name) {
        setClientNameInput(apiJob.clientId.name);
      }
    }
  }, [apiJob]);

  useEffect(() => {
    if (!isOpen) {
      setShowClientSuggestions(false);
      setClientNameInput('');
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      setIsEditing(false);
      setShowClientSuggestions(false);
    }
  }, [isOpen]);

  // Handle click outside for client suggestions
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (clientInputContainerRef.current && !clientInputContainerRef.current.contains(event.target as Node)) {
        setShowClientSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => { document.removeEventListener("mousedown", handleClickOutside); };
  }, []);

  const handleEditableChange = (field: string, value: any) => {
    setEditableJob((prev: any) => (prev ? { ...prev, [field]: value } : prev));
  };

  const handleClientNameChange = (value: string) => {
    setClientNameInput(value);
    setShowClientSuggestions(true);
    // Clear clientId when user types
    setEditableJob((prev: any) => (prev ? { ...prev, clientId: '' } : prev));
  };

  const handleClientSuggestionClick = (client: { _id: string; name: string }) => {
    setClientNameInput(client.name);
    setShowClientSuggestions(false);
    setEditableJob((prev: any) => (prev ? { ...prev, clientId: client._id } : prev));
  };

  const normalizeDateValue = (value?: string) => {
    if (!value) return '';
    if (value.includes('T')) return value.split('T')[0];
    return value;
  };

  const handleSaveJob = async () => {
    if (!editableJob || !jobId) return;

    const payload = {
      name: editableJob.name || '',
      description: editableJob.description || '',
      clientId: getIdValue(editableJob.clientId),
      jobTypeId: getIdValue(editableJob.jobTypeId),
      jobManagerId: getIdValue(editableJob.jobManagerId),
      startDate: normalizeDateValue(editableJob.startDate),
      endDate: normalizeDateValue(editableJob.endDate),
      jobCost: Number(editableJob.jobCost) || 0,
      teamMembers: Array.isArray(editableJob.teamMembers)
        ? editableJob.teamMembers.map((member: any) => getIdValue(member))
        : [],
      status: editableJob.status || 'queued',
      priority: editableJob.priority || 'medium',
    };

    if (!payload.clientId || !payload.jobTypeId || !payload.jobManagerId) {
      toast.error('Client, job type, and job manager are required.');
      return;
    }

    try {
      await updateJob({ jobId, jobData: payload }).unwrap();
      toast.success('Job details updated successfully');
      setIsEditing(false);
    } catch (error: any) {
      toast.error(error?.data?.message || 'Failed to update job');
    }
  };

  const handleStartJobEdit = () => {
    setIsEditing(true);
    // Initialize client name input when editing starts
    if (apiJob?.clientId?.name) {
      setClientNameInput(apiJob.clientId.name);
    } else {
      setClientNameInput('');
    }
  };

  const handleCancelJobEdit = () => {
    setIsEditing(false);
    setEditableJob(apiJob || null);
    // Reset client name input
    if (apiJob?.clientId?.name) {
      setClientNameInput(apiJob.clientId.name);
    } else {
      setClientNameInput('');
    }
    setShowClientSuggestions(false);
  };

  const displayPriority = () => {
    const priority = apiJob?.priority || editableJob?.priority || 'medium';
    const option = priorityOptions.find(opt => opt.value === priority);
    return option?.label || priority;
  };

  const formatHoursToHHMMSS = (hours: number = 0) => {
    const totalSeconds = Math.max(0, Math.round(hours * 3600));
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const handleAddNote = async () => {
    if (!newNote.trim() || !jobId) return;
    try {
      await addNote({ note: newNote.trim(), jobId }).unwrap();
      setNewNote('');
      toast.success('Note added successfully');
      refetchJobNotes();
    } catch (error: any) {
      toast.error(error?.data?.message || 'Failed to add note');
    }
  };

  const handleStartEdit = (noteId: string, currentValue: string) => {
    setEditingNoteId(noteId);
    setEditingValue(currentValue);
  };

  const handleCancelEdit = () => {
    setEditingNoteId(null);
    setEditingValue('');
  };

  const handleUpdateNote = async () => {
    if (!editingNoteId || !editingValue.trim()) return;
    try {
      await updateNoteMutation({ noteId: editingNoteId, note: editingValue.trim() }).unwrap();
      toast.success('Note updated successfully');
      handleCancelEdit();
      refetchJobNotes();
    } catch (error: any) {
      toast.error(error?.data?.message || 'Failed to update note');
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    try {
      await deleteNoteMutation(noteId).unwrap();
      toast.success('Note deleted successfully');
      if (editingNoteId === noteId) {
        handleCancelEdit();
      }
      refetchJobNotes();
    } catch (error: any) {
      toast.error(error?.data?.message || 'Failed to delete note');
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-GB') + ' at ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="flex flex-row items-center justify-between">
          <DialogTitle className="text-xl font-semibold">
            {apiJob?.name || jobName}
          </DialogTitle>
          {activeTab === 'job-details' && (
            <div className="flex gap-2">
              {isEditing ? (
                <>
                  <Button variant="outline" size="sm" onClick={handleCancelJobEdit} disabled={isUpdating}>
                    <X className="h-4 w-4 mr-1" />
                    Cancel
                  </Button>
                  <Button size="sm" onClick={handleSaveJob} disabled={isUpdating}>
                    {isUpdating ? 'Saving...' : (
                      <>
                        <Save className="h-4 w-4 mr-1" />
                        Save
                      </>
                    )}
                  </Button>
                </>
              ) : (
                <Button variant="outline" size="sm" onClick={handleStartJobEdit} disabled={isLoading || !apiJob}>
                  <Edit className="h-4 w-4 mr-1" />
                  Edit
                </Button>
              )}
            </div>
          )}
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="job-details">Job Details</TabsTrigger>
            <TabsTrigger value="time-logs">Time Logs ({timeLogEntries.length})</TabsTrigger>
            <TabsTrigger value="notes">Notes ({jobNotes.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="job-details" className="mt-6">
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* 1. Job Name */}
                <div className="space-y-2">
                  <Label>Job Name</Label>
                  {isEditing ? (
                    <Input
                      value={editableJob?.name || ''}
                      onChange={(e) => handleEditableChange('name', e.target.value)}
                    />
                  ) : (
                    <Input value={apiJob?.name || jobName} readOnly className="bg-muted" />
                  )}
                </div>
                
                {/* 2. Client Name */}
                <div className="space-y-2 relative" ref={clientInputContainerRef}>
                  <Label>Client Name</Label>
                  {isEditing ? (
                    <>
                      <Input
                        value={clientNameInput}
                        onChange={(e) => handleClientNameChange(e.target.value)}
                        onFocus={() => setShowClientSuggestions(true)}
                        autoComplete="off"
                      />
                      {showClientSuggestions && (
                        <ul className="absolute z-10 w-full bg-background border border-border rounded-md mt-1 max-h-40 overflow-y-auto shadow-lg">
                          {filteredClients.length > 0 ? (
                            filteredClients.map((client) => (
                              <li
                                key={client._id}
                                onClick={() => handleClientSuggestionClick(client)}
                                className="px-3 py-2 cursor-pointer hover:bg-muted"
                              >
                                {client.name}
                              </li>
                            ))
                          ) : (
                            <li className="px-3 py-2 text-muted-foreground">
                              Type client name.{" "}
                              <a
                                href="/clients"
                                className="text-primary hover:underline font-medium"
                              >
                                Add new client
                              </a>
                            </li>
                          )}
                        </ul>
                      )}
                    </>
                  ) : (
                    <Input value={apiJob?.clientId?.name || '—'} readOnly className="bg-muted" />
                  )}
                </div>
                
                {/* 3. Job Type */}
                <div className="space-y-2">
                  <Label>Job Type</Label>
                  {isEditing ? (
                    <Select
                      value={getIdValue(editableJob?.jobTypeId)}
                      onValueChange={(value) => handleEditableChange('jobTypeId', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select job type" />
                      </SelectTrigger>
                      <SelectContent>
                        {jobTypeOptions.map(option => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Input value={apiJob?.jobTypeId?.name || '—'} readOnly className="bg-muted" />
                  )}
                </div>
                
                {/* 4. Job Fee */}
                <div className="space-y-2">
                  <Label>Job Fee</Label>
                  {isEditing ? (
                    <Input
                      type="number"
                      value={editableJob?.jobCost ?? 0}
                      onChange={(e) => handleEditableChange('jobCost', e.target.value)}
                    />
                  ) : (
                    <Input value={formatCurrency(apiJob?.jobCost ?? jobFee)} readOnly className="bg-muted" />
                  )}
                </div>
                
                {/* 5. Start Date */}
                <div className="space-y-2">
                  <Label>Start Date</Label>
                  {isEditing ? (
                    <Input
                      type="date"
                      value={normalizeDateValue(editableJob?.startDate)}
                      onChange={(e) => handleEditableChange('startDate', e.target.value)}
                    />
                  ) : (
                    <Input
                      value={apiJob?.startDate ? new Date(apiJob.startDate).toLocaleDateString('en-GB') : '—'}
                      readOnly
                      className="bg-muted"
                    />
                  )}
                </div>
                
                {/* 6. End Date */}
                <div className="space-y-2">
                  <Label>End Date</Label>
                  {isEditing ? (
                    <Input
                      type="date"
                      value={normalizeDateValue(editableJob?.endDate)}
                      onChange={(e) => handleEditableChange('endDate', e.target.value)}
                    />
                  ) : (
                    <Input
                      value={apiJob?.endDate ? new Date(apiJob.endDate).toLocaleDateString('en-GB') : '—'}
                      readOnly
                      className="bg-muted"
                    />
                  )}
                </div>
                
                {/* 7. Priority */}
                <div className="space-y-2">
                  <Label>Priority</Label>
                  {isEditing ? (
                    <Select
                      value={editableJob?.priority || 'medium'}
                      onValueChange={(value) => handleEditableChange('priority', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select priority" />
                      </SelectTrigger>
                      <SelectContent>
                        {priorityOptions.map(option => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Input value={displayPriority()} readOnly className="bg-muted" />
                  )}
                </div>
                
                {/* 8. Status */}
                <div className="space-y-2">
                  <Label>Status</Label>
                  {isEditing ? (
                    <Select
                      value={editableJob?.status || 'queued'}
                      onValueChange={(value) => handleEditableChange('status', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        {statusOptions.map(option => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Input
                      value={(apiJob?.status || 'Active').replace(/([a-z])([A-Z])/g, '$1 $2')}
                      readOnly
                      className="bg-muted"
                    />
                  )}
                </div>
                
                {/* 9. Job Manager */}
                <div className="space-y-2">
                  <Label>Job Manager</Label>
                  {isEditing ? (
                    <Select
                      value={getIdValue(editableJob?.jobManagerId)}
                      onValueChange={(value) => handleEditableChange('jobManagerId', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select job manager" />
                      </SelectTrigger>
                      <SelectContent>
                        {jobManagerOptions.map(option => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Input value={apiJob?.jobManagerId?.name || '—'} readOnly className="bg-muted" />
                  )}
                </div>

                {/* 10. Team Members */}
                <div className="space-y-2">
                  <Label>Team Members *</Label>
                  {isEditing ? (
                    <>
                      <Select
                        onValueChange={(value) => {
                          const currentMembers = Array.isArray(editableJob?.teamMembers) 
                            ? editableJob.teamMembers.map((m: any) => getIdValue(m))
                            : [];
                          if (value && !currentMembers.includes(value)) {
                            handleEditableChange('teamMembers', [...currentMembers, value]);
                          }
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Add team member" />
                        </SelectTrigger>
                        <SelectContent>
                          {teamMemberOptions.map(member => (
                            <SelectItem key={member._id} value={member._id}>
                              {member.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {(Array.isArray(editableJob?.teamMembers) ? editableJob.teamMembers : []).map((member: any) => {
                          const memberId = getIdValue(member);
                          const memberName = teamMemberOptions.find(tm => tm._id === memberId)?.name || memberId;
                          return (
                            <Badge key={memberId} variant="secondary" className="text-xs">
                              {memberName}
                              <button
                                type="button"
                                onClick={() => {
                                  const currentMembers = editableJob.teamMembers.map((m: any) => getIdValue(m));
                                  handleEditableChange('teamMembers', currentMembers.filter((id: string) => id !== memberId));
                                }}
                                className="ml-1 font-bold"
                              >
                                ×
                              </button>
                            </Badge>
                          );
                        })}
                      </div>
                    </>
                  ) : (
                    <div className="flex flex-wrap gap-1">
                      {(Array.isArray(apiJob?.teamMembers) ? apiJob.teamMembers : []).map((member: any) => {
                        const memberName = typeof member === 'object' ? member.name : teamMemberOptions.find(tm => tm._id === member)?.name || member;
                        return (
                          <Badge key={typeof member === 'object' ? member._id : member} variant="secondary" className="text-xs">
                            {memberName}
                          </Badge>
                        );
                      })}
                      {(!apiJob?.teamMembers || apiJob.teamMembers.length === 0) && (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </div>
                  )}
                </div>

              </div>
              
              {/* 11. Description - Full width */}
              <div className="space-y-2">
                <Label>Description</Label>
                {isEditing ? (
                  <Textarea
                    className="w-full"
                    rows={3}
                    value={editableJob?.description || ''}
                    onChange={(e) => handleEditableChange('description', e.target.value)}
                    placeholder="Job description..."
                  />
                ) : (
                  <textarea 
                    className="w-full p-3 border border-input bg-muted rounded-md resize-none" 
                    rows={3} 
                    value={apiJob?.description || '—'}
                    readOnly
                  />
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="time-logs" className="mt-6">
            <div className="space-y-4">
              <div className="overflow-x-auto">
                {timeLogEntries.length === 0 ? (
                  <div className="text-center py-10 text-muted-foreground">
                    No time logs available for this job.
                  </div>
                ) : (
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
                      {timeLogEntries.map((entry) => (
                        <TableRow key={entry.id}>
                          <TableCell>{entry.date ? new Date(entry.date).toLocaleDateString('en-GB') : '—'}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{entry.employee || '—'}</Badge>
                          </TableCell>
                          <TableCell className="max-w-xs">{entry.description || '—'}</TableCell>
                          <TableCell className="text-right">{formatHoursToHHMMSS(entry.hours)}</TableCell>
                          <TableCell className="text-right">{formatCurrency(entry.rate)}</TableCell>
                          <TableCell className="text-right font-medium">{formatCurrency(entry.amount)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </div>
              
              <div className="pt-4 border-t">
                <div className="flex justify-between items-center">
                  <span className="font-medium">Total Amount:</span>
                  <span className="text-lg font-bold">{formatCurrency(timeLogEntries.reduce((sum, entry) => sum + entry.amount, 0))}</span>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="notes" className="mt-6">
            <Card>
              <CardContent className="space-y-4 pt-6">
                <div className="flex flex-col sm:flex-row gap-2">
                  <Textarea
                    placeholder="Enter your note here..."
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    className="min-h-[80px]"
                  />
                  <Button
                    onClick={handleAddNote}
                    disabled={!newNote.trim()}
                    className="sm:w-32"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add Note
                  </Button>
                </div>
                <div className="border-t pt-4">
                  {isJobNotesLoading ? (
                    <div className="text-center py-8 text-muted-foreground">Loading notes...</div>
                  ) : jobNotes.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">No notes available for this job.</div>
                  ) : (
                    <div className="space-y-4">
                      {jobNotes.map((note) => (
                        <div key={note._id} className="relative pl-6 pb-4 border-l border-border">
                          <div className="absolute left-0 top-1 w-3 h-3 rounded-full bg-primary"></div>
                          <div className="flex justify-between items-start gap-2">
                            {editingNoteId === note._id ? (
                              <Textarea
                                value={editingValue}
                                onChange={(e) => setEditingValue(e.target.value)}
                                className="min-h-[80px]"
                              />
                            ) : (
                              <p className="text-sm text-foreground">{note.note}</p>
                            )}
                            <div className="flex gap-2">
                              {editingNoteId === note._id ? (
                                <>
                                  <Button size="icon" variant="ghost" onClick={handleUpdateNote}>
                                    <Save className="h-4 w-4" />
                                  </Button>
                                  <Button size="icon" variant="ghost" onClick={handleCancelEdit}>
                                    <X className="h-4 w-4" />
                                  </Button>
                                </>
                              ) : (
                                <>
                                  <Button size="icon" variant="ghost" onClick={() => handleStartEdit(note._id, note.note)}>
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button size="icon" variant="ghost" className="text-red-500 hover:text-red-700" onClick={() => handleDeleteNote(note._id)}>
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </>
                              )}
                            </div>
                          </div>
                          <div className="mt-2 text-xs text-muted-foreground flex items-center gap-2">
                            <Clock className="h-3 w-3" />
                            <span>{formatTimestamp(note.createdAt)} by {note.createdBy?.name || 'Unknown'}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};