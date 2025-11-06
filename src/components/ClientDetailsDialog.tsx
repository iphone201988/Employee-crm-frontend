import React, { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Edit, Save, X, Clock } from 'lucide-react';
import { formatCurrency } from '@/lib/currency';
import { useUpdateClientMutation } from "@/store/clientApi";
import { useGetDropdownOptionsQuery } from "@/store/teamApi";
import { useGetNotesQuery, useAddNoteMutation, Note } from "@/store/notesApi";
import { toast } from 'sonner';

// --- Interface Definitions for Type Safety ---

interface BusinessType {
  _id: string;
  name: string;
}

interface ClientTimeLogUser { _id: string; name: string; avatarUrl?: string }
interface ClientTimeLogJob { _id: string; name: string }
interface ClientTimeLogCategory { _id: string; name: string }
interface ClientTimeLog {
  _id: string;
  date: string;
  billable?: boolean;
  amount?: number;
  description?: string;
  duration?: number;
  rate?: number;
  status?: string;
  user?: ClientTimeLogUser;
  client?: { _id: string; clientRef?: string; name: string };
  job?: ClientTimeLogJob;
  jobCategory?: { _id: string; name: string };
  timeLogCategory?: ClientTimeLogCategory;
}
interface ClientJobTimeLog {
  _id: string;
  amount?: number;
  duration?: number;
  rate?: number;
  status?: string;
  user?: ClientTimeLogUser;
  timeLogCategory?: ClientTimeLogCategory;
}
interface ClientJob {
  _id: string;
  name: string;
  jobCost?: number;
  amount?: number;
  totalTimeLogHours?: number;
  status?: string;
  updatedAt?: string;
  timeLogs?: ClientJobTimeLog[];
}
interface ClientExpense {
  _id: string;
  date: string;
  expreseCategory?: string;
  description?: string;
  totalAmount?: number;
  status?: string;
}
interface ClientWriteOffOccasion {
  writeOffId: string;
  amount: number;
  date: string;
  reason: string;
  logic: string;
  by: string;
}
interface ClientWriteOffLog {
  _id: string;
  jobId: string;
  jobName: string;
  writeOffOccasions: number;
  totalWriteOffAmount: number;
  occasionDetails: ClientWriteOffOccasion[];
}
interface ClientData {
  _id: string;
  clientRef: string;
  name: string;
  businessTypeId?: BusinessType | string | null; // Can be object, string, or null
  taxNumber?: string;
  croNumber?: string;
  address?: string;
  contactName?: string;
  email?: string;
  phone?: string;
  onboardedDate?: string;
  amlCompliant?: boolean;
  audit?: boolean;
  timeLogs?: ClientTimeLog[];
  jobs?: ClientJob[];
  expenses?: ClientExpense[];
  writeOffLogs?: ClientWriteOffLog[];
  notes?: Note[];
}

interface ClientDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientData: ClientData;
  // test?: string;
}


const ClientDetailsDialog = ({
  open,
  onOpenChange,
  clientData
}: ClientDetailsDialogProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editableData, setEditableData] = useState<ClientData>(clientData);
  const [activeTab, setActiveTab] = useState('details');

  const [updateClient, { isLoading: isUpdating }] = useUpdateClientMutation();
  const { data: categoriesData } = useGetDropdownOptionsQuery("bussiness");
  const businessTypes: BusinessType[] = categoriesData?.data?.bussiness || [];
  
  // Notes API hooks
  const { data: notesResponse, refetch: refetchNotes } = useGetNotesQuery(
    { clientId: clientData?._id },
    { skip: !clientData?._id || !open }
  );
  const [addNote, { isLoading: isAddingNote }] = useAddNoteMutation();
  
  // Get notes from API response or fallback to clientData.notes
  const apiNotes = notesResponse?.data || [];
  const clientNotes = clientData?.notes || [];
  const notes = apiNotes.length > 0 ? apiNotes : clientNotes;
  useEffect(() => {
    if (open) {
      setEditableData(clientData);
    } else {
      setIsEditing(false); 
    }
  }, [clientData, open]);

  const handleSave = async () => {
    try {
      const businessTypeIdString = 
        editableData.businessTypeId && typeof editableData.businessTypeId === 'object'
          ? editableData.businessTypeId._id
          : editableData.businessTypeId || '';

      const payload = {
        clientId: editableData._id,
        clientRef: editableData.clientRef,
        name: editableData.name,
        businessTypeId: businessTypeIdString,
        taxNumber: editableData.taxNumber,
        croNumber: editableData.croNumber,
        address: editableData.address,
        contactName: editableData.contactName,
        email: editableData.email,
        phone: editableData.phone,
        onboardedDate: editableData.onboardedDate,
        amlCompliant: editableData.amlCompliant,
        audit: editableData.audit,
      };

      await updateClient(payload).unwrap();
      toast.success("Client details updated successfully!");
      setIsEditing(false);
      onOpenChange(false);
    } catch (error) {
      toast.error("Failed to update client details. Please try again.");
      console.error("Update failed:", error);
    }
  };

  const handleCancel = () => {
    setEditableData(clientData); 
    setIsEditing(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setEditableData(prev => ({ ...prev, [id]: value }));
  };

  // Note state and handlers
  const [newNote, setNewNote] = useState('');
  
  const handleAddNote = async () => {
    if (!newNote.trim() || !clientData?._id) return;
    
    try {
      await addNote({
        note: newNote.trim(),
        clientId: clientData._id,
      }).unwrap();
      toast.success('Note added successfully');
      setNewNote('');
      refetchNotes();
    } catch (error: any) {
      toast.error(error?.data?.message || 'Failed to add note');
      console.error('Failed to add note:', error);
    }
  };
  
  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString() + ' at ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (iso?: string) => iso ? new Date(iso).toLocaleDateString('en-GB') : '-';
  const secondsToHours = (s?: number) => ((Number(s || 0) / 3600).toFixed(1));
  const formatStatus = (val?: string) => {
    if (!val) return '-';
    const normalized = val
      .replace(/([a-z])([A-Z])/g, '$1 $2')
      .replace(/_/g, ' ')
      .toLowerCase()
      .trim();
    const map: Record<string, string> = {
      'partpaid': 'Part Paid',
      'inprogress': 'In Progress',
      'notinvoiced': 'Not Invoiced',
    };
    const key = normalized.replace(/\s+/g, '');
    if (map[key]) return map[key];
    return normalized.split(' ').map(w => w ? w[0].toUpperCase() + w.slice(1) : '').join(' ');
  };
  const timeLogs = useMemo(() => Array.isArray(clientData?.timeLogs) ? clientData.timeLogs : [], [clientData?.timeLogs]);
  const jobs = useMemo(() => Array.isArray(clientData?.jobs) ? clientData.jobs : [], [clientData?.jobs]);
  const expenses = useMemo(() => Array.isArray(clientData?.expenses) ? clientData.expenses : [], [clientData?.expenses]);
  const wipSummary = useMemo(() => {
    const totalAmount = jobs.reduce((sum, j) => sum + Number(j.amount || 0), 0);
    const totalHoursSec = jobs.reduce((sum, j) => sum + Number(j.totalTimeLogHours || 0), 0);
    const jobCount = jobs.length;
    const avgRate = totalHoursSec > 0 ? (totalAmount / (totalHoursSec / 3600)) : 0;
    return { totalAmount, totalHoursSec, jobCount, avgRate };
  }, [jobs]);

  return <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="max-w-6xl max-h-[80vh] overflow-y-auto">
      <DialogHeader>
        <div className="flex items-center justify-between">
          <DialogTitle className="text-xl font-bold">{editableData?.name}</DialogTitle>
          <div className="flex gap-2">
            {activeTab === 'details' && (
              isEditing ? (
                <>
                  <Button size="sm" variant="outline" onClick={handleCancel} disabled={isUpdating}><X className="h-4 w-4 mr-1" />Cancel</Button>
                  <Button size="sm" onClick={handleSave} disabled={isUpdating}>{isUpdating ? 'Saving...' : <><Save className="h-4 w-4 mr-1" /> Save</>}</Button>
                </>
              ) : (
                <Button size="sm" variant="outline" onClick={() => setIsEditing(true)}><Edit className="h-4 w-4 mr-1" />Edit</Button>
              )
            )}
          </div>
        </div>
      </DialogHeader>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-8">
          <TabsTrigger value="details">Client Details</TabsTrigger>
          <TabsTrigger value="time-logs">Time Logs</TabsTrigger>
          <TabsTrigger value="jobs">Jobs</TabsTrigger>
          <TabsTrigger value="expenses">Expenses</TabsTrigger>
          <TabsTrigger value="wip">WIP</TabsTrigger>
          <TabsTrigger value="write-off-log">Write off Log</TabsTrigger>
          <TabsTrigger value="notes">Notes ({Array.isArray(notes) ? notes.length : 0})</TabsTrigger>
          <TabsTrigger value="debtors-log">Debtors Log</TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="space-y-4">
          <Card>
            <CardContent className="grid gap-4 pt-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="clientRef">Client Ref</Label>
                  {isEditing ? <Input id="clientRef" value={editableData?.clientRef || ''} onChange={handleInputChange} /> : <div className="p-2 bg-muted rounded">{editableData?.clientRef || 'N/A'}</div>}
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="name">Client Name</Label>
                  {isEditing ? <Input id="name" value={editableData?.name || ''} onChange={handleInputChange} /> : <div className="p-2 bg-muted rounded">{editableData?.name || 'N/A'}</div>}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="businessTypeId">Business Type</Label>
                  {isEditing ? (
                    <Select
                      // Safely get the ID, whether it's an object or a string
                      value={(editableData?.businessTypeId && typeof editableData?.businessTypeId === 'object' ? editableData?.businessTypeId?._id : "") || ''}
                      onValueChange={value => setEditableData(prev => ({ ...prev, businessTypeId: value }))}
                    >
                      <SelectTrigger><SelectValue placeholder="Select business type" /></SelectTrigger>
                      <SelectContent>
                        {businessTypes.map((type) => <SelectItem key={type._id} value={type._id}>{type.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  ) : (
                    <div className="p-2 bg-muted rounded">
                      {/* Safely display the name */}
                      {(editableData?.businessTypeId && typeof editableData?.businessTypeId === 'object'
                        ? editableData?.businessTypeId.name
                        : businessTypes.find(bt => bt._id === editableData?.businessTypeId)?.name) || 'Not specified'}
                    </div>
                  )}
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="taxNumber">Tax Number</Label>
                  {isEditing ? <Input id="taxNumber" value={editableData?.taxNumber || ''} onChange={handleInputChange} /> : <div className="p-2 bg-muted rounded">{editableData?.taxNumber || 'Not specified'}</div>}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="croNumber">CRO Number</Label>
                  {isEditing ? <Input id="croNumber" value={editableData?.croNumber || ''} onChange={handleInputChange} /> : <div className="p-2 bg-muted rounded">{editableData?.croNumber || 'Not specified'}</div>}
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="onboardedDate">Onboarded Date</Label>
                  {isEditing ? <Input id="onboardedDate" type="date" value={editableData?.onboardedDate?.split('T')[0] || ''} onChange={handleInputChange} /> : <div className="p-2 bg-muted rounded">{editableData?.onboardedDate ? new Date(editableData.onboardedDate).toLocaleDateString() : 'Not specified'}</div>}
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="address">Address</Label>
                {isEditing ? <Textarea id="address" value={editableData?.address || ''} onChange={handleInputChange} /> : <div className="p-2 bg-muted rounded">{editableData?.address || 'Not specified'}</div>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="contactName">Contact Person</Label>
                  {isEditing ? <Input id="contactName" value={editableData?.contactName || ''} onChange={handleInputChange} /> : <div className="p-2 bg-muted rounded">{editableData?.contactName || 'Not specified'}</div>}
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  {isEditing ? <Input id="email" type="email" value={editableData?.email || ''} onChange={handleInputChange} /> : <div className="p-2 bg-muted rounded">{editableData?.email || 'Not specified'}</div>}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="phone">Phone</Label>
                  {isEditing ? <Input id="phone" value={editableData?.phone || ''} onChange={handleInputChange} /> : <div className="p-2 bg-muted rounded">{editableData?.phone || 'Not specified'}</div>}
                </div>
              </div>

              <Separator />

            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notes" className="space-y-4">
          <Card>
            <CardContent className="space-y-4 pt-6">
              <div className="grid gap-2">
                <div className="flex gap-2">
                  <Textarea placeholder="Enter your note here..." value={newNote} onChange={e => setNewNote(e.target.value)} className="min-h-[80px]" />
                  <Button 
                    onClick={handleAddNote} 
                    disabled={!newNote.trim() || isAddingNote} 
                    size="sm" 
                    className="h-fit"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    {isAddingNote ? 'Adding...' : 'Add'}
                  </Button>
                </div>
              </div>

              <Separator />

              <div className="grid gap-2">
                <div className="min-h-[200px] max-h-[400px] overflow-y-auto">
                  {Array.isArray(notes) && notes.length > 0 ? (
                    <div className="space-y-4">
                      {notes.map((note, index) => (
                        <div key={note._id} className="relative pl-6 pb-4">
                          {index < notes.length - 1 && (
                            <div className="absolute left-2 top-6 bottom-0 w-0.5 bg-border"></div>
                          )}
                          <div className="absolute left-0 top-1 w-4 h-4 bg-primary rounded-full border-2 border-background"></div>
                          <div className="bg-muted rounded-lg p-3">
                            <div className="flex items-center gap-2 mb-2">
                              <Clock className="h-3 w-3 text-muted-foreground" />
                              <span className="text-xs text-muted-foreground">
                                {formatTimestamp(note.createdAt)} by {note.createdBy?.name || 'Unknown'}
                              </span>
                            </div>
                            <p className="text-sm">{note.note}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <span className="text-muted-foreground">No notes yet. Add your first note above.</span>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="time-logs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Time Logs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Date</th>
                      <th className="text-left p-2">Team Member</th>
                      <th className="text-left p-2">Client</th>
                      <th className="text-left p-2">Job</th>
                      <th className="text-left p-2">Job Type</th>
                      <th className="text-left p-2">Description</th>
                      <th className="text-right p-2">Hours</th>
                      <th className="text-right p-2">Rate</th>
                      <th className="text-right p-2">Amount</th>
                      <th className="text-left p-2">Billable</th>
                      <th className="text-left p-2">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Array.isArray(timeLogs) && timeLogs.length > 0 ? (
                      timeLogs.map(tl => (
                        <tr key={tl._id} className="border-b">
                          <td className="p-2">{formatDate(tl.date)}</td>
                          <td className="p-2">{tl.user?.name || '-'}</td>
                          <td className="p-2">{clientData?.name}</td>
                          <td className="p-2">{tl.job?.name || '-'}</td>
                          <td className="p-2">{tl.jobCategory?.name || tl.timeLogCategory?.name || '-'}</td>
                          <td className="p-2">{tl.description || ''}</td>
                          <td className="text-right p-2">{secondsToHours(tl.duration)}</td>
                          <td className="text-right p-2">{formatCurrency(Number(tl.rate || 0))}</td>
                          <td className="text-right p-2">{formatCurrency(Number(tl.amount || 0))}</td>
                          <td className="p-2">{tl.billable ? 'Yes' : 'No'}</td>
                          <td className="p-2">{formatStatus(tl.status)}</td>
                        </tr>
                      ))
                    ) : (
                      <tr className="border-b"><td className="p-4 text-center" colSpan={11}>No time logs.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="jobs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Client Jobs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Array.isArray(jobs) && jobs.length > 0 ? (
                  jobs.map(job => (
                    <div key={job._id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-center mb-3">
                        <h4 className="font-medium">{job.name}</h4>
                        <Badge className="bg-green-100 text-green-800">{formatStatus(job.status) }</Badge>
                      </div>
                      <div className="flex flex-wrap gap-6 text-sm mb-4">
                        <span><span className="text-muted-foreground">Job Fee:</span> {formatCurrency(Number(job.jobCost || 0))}</span>
                        <span><span className="text-muted-foreground">WIP Amount:</span> {formatCurrency(Number(job.amount || 0))}</span>
                        <span><span className="text-muted-foreground">Hours Logged:</span> {secondsToHours(job.totalTimeLogHours)}h</span>
                        <span><span className="text-muted-foreground">Last Updated:</span> {formatDate(job.updatedAt)}</span>
                      </div>

                      <Separator className="my-3" />
                      <h5 className="font-medium mb-2">Time Logs</h5>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b">
                              <th className="text-left p-2">Team Member</th>
                              <th className="text-left p-2">Status</th>
                              <th className="text-left p-2">Purpose</th>
                              <th className="text-right p-2">Hours</th>
                              <th className="text-right p-2">Rate</th>
                              <th className="text-right p-2">Amount</th>
                            </tr>
                          </thead>
                          <tbody>
                            {Array.isArray(job.timeLogs) && job.timeLogs.length > 0 ? (
                              job.timeLogs.map(jtl => (
                                <tr key={jtl._id} className="border-b">
                                  <td className="p-2">{jtl.user?.name || '-'}</td>
                                  <td className="p-2">{formatStatus(jtl.status)}</td>
                                  <td className="p-2">{jtl.timeLogCategory?.name || '-'}</td>
                                  <td className="text-right p-2">{secondsToHours(jtl.duration)}</td>
                                  <td className="text-right p-2">{formatCurrency(Number(jtl.rate || 0))}</td>
                                  <td className="text-right p-2">{formatCurrency(Number(jtl.amount || 0))}</td>
                                </tr>
                              ))
                            ) : (
                              <tr className="border-b"><td className="p-3 text-center" colSpan={6}>No time logs for this job.</td></tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-4 text-center text-sm text-muted-foreground">No jobs.</div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="debtors-log" className="space-y-4">
          <Card>

            <CardContent className="mx-0 my-0 px-0 py-[25px]">
              <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-6">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Debtors Log Balance</p>
                  <p className="text-lg font-semibold text-foreground">€1,599.00</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Unallocated</p>
                  <p className="text-lg font-semibold text-foreground">€0.00</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Current</p>
                  <p className="text-lg font-semibold text-foreground">€0.00</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">30 Days</p>
                  <p className="text-lg font-semibold text-foreground">€0.00</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">60 Days</p>
                  <p className="text-lg font-semibold text-foreground">€0.00</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">90+ Days</p>
                  <p className="text-lg font-semibold text-destructive">€1,599.00</p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/50">
                      <th className="text-left p-3 font-medium text-foreground h-12">Date</th>
                      <th className="text-left p-3 font-medium text-foreground h-12">Item</th>
                      <th className="text-left p-3 font-medium text-foreground h-12">Reference Number</th>
                      <th className="text-right p-3 font-medium text-foreground h-12">Debit</th>
                      <th className="text-right p-3 font-medium text-foreground h-12">Credit</th>
                      <th className="text-right p-3 font-medium text-foreground h-12">Outstanding</th>
                      <th className="text-right p-3 font-medium text-foreground h-12">Balance</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-border hover:bg-muted/30 transition-colors">
                      <td className="p-4 text-foreground">28/03/2024</td>
                      <td className="p-4 text-foreground">
                        <Badge variant="default">Invoice</Badge>
                      </td>
                      <td className="p-4 text-foreground">IN-104</td>
                      <td className="p-4 text-right text-foreground">€1,599.00</td>
                      <td className="p-4 text-right text-foreground"></td>
                      <td className="p-4 text-right text-foreground">€1,599.00</td>
                      <td className="p-4 text-right font-semibold text-foreground">€1,599.00</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="expenses" className="space-y-4">
          <Card>
            <CardContent className="pt-6">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/50">
                      <th className="text-left p-3 font-medium text-foreground h-12">Date</th>
                      <th className="text-left p-3 font-medium text-foreground h-12">Description</th>
                      <th className="text-left p-3 font-medium text-foreground h-12">Category</th>
                      <th className="text-right p-3 font-medium text-foreground h-12">Amount</th>
                      <th className="text-left p-3 font-medium text-foreground h-12">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Array.isArray(expenses) && expenses.length > 0 ? (
                      expenses.map(exp => (
                        <tr key={exp._id} className="border-b border-border hover:bg-muted/30 transition-colors">
                          <td className="p-4 text-foreground">{formatDate(exp.date)}</td>
                          <td className="p-4 text-foreground">{exp.description || '-'}</td>
                          <td className="p-4 text-foreground">{exp.expreseCategory || '-'}</td>
                          <td className="p-4 text-right text-foreground">{formatCurrency(Number(exp.totalAmount || 0))}</td>
                        <td className="p-4 text-foreground">{formatStatus(exp.status)}</td>
                        </tr>
                      ))
                    ) : (
                      <tr className="border-b"><td className="p-4 text-center" colSpan={5}>No expenses.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="wip" className="space-y-4">
          <Card>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 pt-6">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Total WIP</p>
                  <p className="text-lg font-semibold text-foreground">{formatCurrency(wipSummary.totalAmount)}</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Active Jobs</p>
                  <p className="text-lg font-semibold text-foreground">{wipSummary.jobCount}</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Hours Logged</p>
                  <p className="text-lg font-semibold text-foreground">{secondsToHours(wipSummary.totalHoursSec)}h</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Avg. Rate</p>
                  <p className="text-lg font-semibold text-foreground">{formatCurrency(wipSummary.avgRate)}</p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/50">
                      <th className="text-left p-3 font-medium text-foreground h-12">Job Ref.</th>
                      <th className="text-left p-3 font-medium text-foreground h-12">Job Name</th>
                      <th className="text-right p-3 font-medium text-foreground h-12">WIP Amount</th>
                      <th className="text-right p-3 font-medium text-foreground h-12">Hours</th>
                      <th className="text-left p-3 font-medium text-foreground h-12">Status</th>
                      <th className="text-left p-3 font-medium text-foreground h-12">Last Updated</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Array.isArray(jobs) && jobs.length > 0 ? (
                      jobs.map(job => (
                        <tr key={job._id} className="border-b border-border hover:bg-muted/30 transition-colors">
                          <td className="p-4 font-medium text-foreground">-</td>
                          <td className="p-4 font-medium text-foreground">{job.name}</td>
                          <td className="p-4 text-right text-foreground">{formatCurrency(Number(job.amount || 0))}</td>
                          <td className="p-4 text-right text-foreground">{secondsToHours(job.totalTimeLogHours)}</td>
                          <td className="p-4 text-foreground">
                            <Badge variant={job.status === 'inProgress' ? 'default' : 'secondary'}>{formatStatus(job.status)}</Badge>
                          </td>
                          <td className="p-4 text-foreground">{formatDate(job.updatedAt)}</td>
                        </tr>
                      ))
                    ) : (
                      <tr className="border-b"><td className="p-4 text-center" colSpan={6}>No WIP records.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="write-off-log" className="space-y-4">
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr className="border-b bg-gray-50">
                      <th className="text-left p-3 text-foreground h-12">Job Ref.</th>
                      <th className="text-left p-3 text-foreground h-12">Job Name</th>
                      <th className="text-right p-3 text-foreground h-12">Write Off €</th>
                      <th className="text-center p-3 text-foreground h-12">Write off Occasions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Array.isArray(clientData?.writeOffLogs) && clientData.writeOffLogs.length > 0 ? (
                      clientData.writeOffLogs.map((log: ClientWriteOffLog) => (
                        <tr key={log._id || log.jobId} className="border-b hover:bg-gray-50 h-12">
                          <td className="p-3">
                            <div className="text-sm">-</div>
                          </td>
                          <td className="p-3">
                            <div className="text-sm">{log.jobName || 'N/A'}</div>
                          </td>
                          <td className="p-3 text-right text-sm">{formatCurrency(log.totalWriteOffAmount || 0)}</td>
                          <td className="p-3 text-center">
                            <span className="inline-flex items-center justify-center h-8 w-8 rounded-full text-xs font-medium cursor-pointer hover:opacity-80 transition-colors bg-gradient-to-br from-primary/20 to-primary/30 text-primary border border-primary/20">
                              {log.writeOffOccasions || 0}
                            </span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr className="border-b">
                        <td className="p-4 text-center" colSpan={4}>No write-off records found.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </DialogContent>
  </Dialog>;
};
export default ClientDetailsDialog;