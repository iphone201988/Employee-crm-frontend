import React, { useEffect, useMemo, useState } from 'react';
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
  const { data: jobTypeOptionsResp } = useGetDropdownOptionsQuery('job');
  const { data: teamOptionsResp } = useGetDropdownOptionsQuery('team');
  
  const apiJob = jobResp?.data;
  const apiLogs = jobResp?.timeLogs || [];
  const timeLogEntries: TimeEntry[] = useMemo(() => {
    if (apiLogs.length > 0) {
      return apiLogs.map((l: any) => ({
        id: l._id,
        date: l.date,
        description: l.description || '',
        hours: typeof l.durationHours === 'number' ? l.durationHours : Number(l.duration || 0) / 3600,
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
    }
  }, [apiJob]);

  useEffect(() => {
    if (!isOpen) {
      setIsEditing(false);
    }
  }, [isOpen]);

  const handleEditableChange = (field: string, value: any) => {
    setEditableJob((prev: any) => (prev ? { ...prev, [field]: value } : prev));
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

  const handleCancelJobEdit = () => {
    setIsEditing(false);
    setEditableJob(apiJob || null);
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
                <Button variant="outline" size="sm" onClick={() => setIsEditing(true)} disabled={isLoading || !apiJob}>
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
                
                <div className="space-y-2">
                  <Label>Job Status</Label>
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
                
                <div className="space-y-2">
                  <Label>Assigned To</Label>
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
              </div>
              
              <div className="space-y-2">
                <Label>Job Description</Label>
                {isEditing ? (
                  <Textarea
                    className="w-full"
                    rows={3}
                    value={editableJob?.description || ''}
                    onChange={(e) => handleEditableChange('description', e.target.value)}
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

              <div className="space-y-2">
                <Label>Job Tags</Label>
                <div className="flex gap-2">
                  <Badge variant="secondary">{displayPriority()}</Badge>
                </div>
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