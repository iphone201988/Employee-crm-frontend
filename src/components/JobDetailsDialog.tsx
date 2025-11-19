import React, { useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatCurrency } from '@/lib/currency';
import { Edit, Plus, Trash2, Clock, Save, X } from 'lucide-react';
import { useGetJobQuery } from '@/store/jobApi';
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
  
  const apiJob = jobResp?.data;
  const apiLogs = jobResp?.timeLogs || [];
  const sampleTimeEntries: TimeEntry[] = useMemo(() => {
    if (apiLogs.length > 0) {
      return apiLogs.map((l: any) => ({
        id: l._id,
        date: l.date,
        description: l.description || '',
        hours: Number(l.duration || 0) / 3600,
        rate: Number(l.rate || 0),
        amount: Number(l.amount || 0),
        employee: l.user?.name || ''
      }));
    }
    if (timeEntries.length > 0) return timeEntries;
    return [
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
  }, [apiLogs, timeEntries]);

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

  const totalAmount = sampleTimeEntries.reduce((sum, entry) => sum + entry.amount, 0);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="flex flex-row items-center justify-between">
          <DialogTitle className="text-xl font-semibold">
            {apiJob?.name || jobName}
          </DialogTitle>
          {/* <Button variant="outline" size="sm" className="flex items-center gap-2" disabled={activeTab !== 'job-details' || isLoading}>
            <Edit className="h-4 w-4" />
            Edit
          </Button> */}
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="job-details">Job Details</TabsTrigger>
            <TabsTrigger value="time-logs">Time Logs ({sampleTimeEntries.length})</TabsTrigger>
            <TabsTrigger value="notes">Notes ({jobNotes.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="job-details" className="mt-6">
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Job Name</Label>
                  <Input value={apiJob?.name || jobName} readOnly className="bg-muted" />
                </div>
                
                <div className="space-y-2">
                  <Label>Job Type</Label>
                  <Input value={apiJob?.jobTypeId?.name || '—'} readOnly className="bg-muted" />
                </div>
                
                <div className="space-y-2">
                  <Label>Job Status</Label>
                  <Input value={(apiJob?.status || 'Active').replace(/([a-z])([A-Z])/g, '$1 $2')} readOnly className="bg-muted" />
                </div>
                
                <div className="space-y-2">
                  <Label>Job Fee</Label>
                  <Input value={formatCurrency(apiJob?.jobCost ?? jobFee)} readOnly className="bg-muted" />
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
                  <Input value={apiJob?.startDate ? new Date(apiJob.startDate).toLocaleDateString('en-GB') : '—'} readOnly className="bg-muted" />
                </div>
                
                <div className="space-y-2">
                  <Label>Assigned To</Label>
                  <Input value={apiJob?.jobManagerId?.name || '—'} readOnly className="bg-muted" />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>Job Description</Label>
                <textarea 
                  className="w-full p-3 border border-input bg-muted rounded-md resize-none" 
                  rows={3} 
                  value={apiJob?.description || '—'}
                  readOnly
                />
              </div>

              <div className="space-y-2">
                <Label>Job Tags</Label>
                <div className="flex gap-2">
                  <Badge variant="secondary">{(apiJob?.priority || 'medium').replace(/([a-z])([A-Z])/g, '$1 $2')}</Badge>
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