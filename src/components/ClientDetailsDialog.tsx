import React, { useState, useEffect } from 'react';
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
import { useUpdateClientMutation } from "@/store/clientApi";
import { useGetDropdownOptionsQuery } from "@/store/teamApi";
import { toast } from 'sonner';

// Define the shape of the client data based on your API and UI
interface ClientData {
  _id?: string; // Assuming the client has a unique ID from the database
  clientRef: string;
  name: string;
  businessTypeId?: string;
  taxNumber?: string;
  croNumber?: string;
  address?: string;
  contactName?: string;
  email?: string;
  phone?: string;
  onboardedDate?: string;
  amlCompliant?: boolean;
  audit?: boolean;
  // Deprecated fields from your old props, can be removed if not needed
  customerNumber?: string;
  clientType?: any;
  contactPerson?: string;
  takeOnDate?: string;
  clientTags?: string[];
  taxes?: string[];
}

interface ClientDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientData: ClientData;
}

const ClientDetailsDialog = ({
  open,
  onOpenChange,
  clientData
}: any) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editableData, setEditableData] = useState<any>(clientData);

  // RTK Query Hooks
  const [updateClient, { isLoading: isUpdating }] = useUpdateClientMutation();
  const { data: categoriesData } = useGetDropdownOptionsQuery("bussiness");
  const businessTypes = categoriesData?.data?.bussiness || [];
 console.log("businessTypes=====================clientDataclientDataclientDataclientDataclientDataclientData", clientData);
  // Reset editable data when the dialog opens with new client data or closes
  useEffect(() => {
    if (open) {
      setEditableData(clientData);
    } else {
      setIsEditing(false); // Reset edit mode on close
    }
  }, [clientData, open]);

  const handleSave = async () => {
    try {
      // Ensure businessTypeId is set, default if needed or handle validation
      const payload = {
        clientId: editableData._id,
        clientRef: editableData.clientRef,
        name: editableData.name,
        businessTypeId: editableData.businessTypeId || '', // Or handle if it's required
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
      onOpenChange(false); // Optionally close the dialog on save
    } catch (error) {
      toast.error("Failed to update client details. Please try again.");
      console.error("Update failed:", error);
    }
  };

  const handleCancel = () => {
    setEditableData(clientData); // Revert changes
    setIsEditing(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setEditableData(prev => ({ ...prev, [id]: value }));
  };

  const [notes, setNotes] = useState([{
    id: '1',
    text: 'Initial client onboarding completed. All documents received and verified.',
    timestamp: '2024-01-15T10:30:00Z',
    user: 'John Smith'
  }]);
  const [newNote, setNewNote] = useState('');

  const handleAddNote = () => {
    if (newNote.trim()) {
      const newNoteObj = {
        id: Date.now().toString(),
        text: newNote.trim(),
        timestamp: new Date().toISOString(),
        user: 'Current User'
      };
      setNotes(prev => [newNoteObj, ...prev]);
      setNewNote('');
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString() + ' at ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="max-w-6xl max-h-[80vh] overflow-y-auto">
      <DialogHeader>
        <div className="flex items-center justify-between">
          <DialogTitle className="text-xl font-bold">{editableData.name}</DialogTitle>
          <div className="flex gap-2">
            {isEditing ? (
              <>
                <Button size="sm" variant="outline" onClick={handleCancel} disabled={isUpdating}>
                  <X className="h-4 w-4 mr-1" />
                  Cancel
                </Button>
                <Button size="sm" onClick={handleSave} disabled={isUpdating}>
                  {isUpdating ? 'Saving...' : <><Save className="h-4 w-4 mr-1" /> Save</>}
                </Button>
              </>
            ) : (
              <Button size="sm" variant="outline" onClick={() => setIsEditing(true)}>
                <Edit className="h-4 w-4 mr-1" />
                Edit
              </Button>
            )}
          </div>
        </div>
      </DialogHeader>

      <Tabs defaultValue="details" className="w-full">
        <TabsList className="grid w-full grid-cols-8">
          <TabsTrigger value="details">Client Details</TabsTrigger>
          <TabsTrigger value="time-logs">Time Logs (3)</TabsTrigger>
          <TabsTrigger value="jobs">Jobs (2)</TabsTrigger>
          <TabsTrigger value="expenses">Expenses</TabsTrigger>
          <TabsTrigger value="wip">WIP</TabsTrigger>
          <TabsTrigger value="write-off-log">Write off Log (1)</TabsTrigger>
          <TabsTrigger value="notes">Notes ({notes.length})</TabsTrigger>
          <TabsTrigger value="debtors-log">Debtors Log</TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="space-y-4">
          <Card>
            <CardContent className="grid gap-4 pt-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="clientRef">Client Ref</Label>
                  {isEditing ? <Input id="clientRef" value={editableData.clientRef} onChange={handleInputChange} /> : <div className="p-2 bg-muted rounded">{editableData.clientRef}</div>}
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="name">Client Name</Label>
                  {isEditing ? <Input id="name" value={editableData.name} onChange={handleInputChange} /> : <div className="p-2 bg-muted rounded">{editableData.name}</div>}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="businessTypeId">Business Type</Label>
                  {isEditing ? (
                    <Select value={editableData?.clientType.name || ''} onValueChange={value => setEditableData(prev => ({ ...prev, businessTypeId: value }))}>
                      <SelectTrigger><SelectValue placeholder="Select business type" /></SelectTrigger>
                      <SelectContent>{businessTypes.map((type: any) => <SelectItem key={type._id} value={type._id}>{type.name}</SelectItem>)}</SelectContent>
                    </Select>
                  ) : (
                    <div className="p-2 bg-muted rounded">{businessTypes.find((bt: any) => bt._id === editableData.businessTypeId)?.name || 'Not specified'}</div>
                  )}
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="taxNumber">Tax Number</Label>
                  {isEditing ? <Input id="taxNumber" value={editableData.taxNumber || ''} onChange={handleInputChange} /> : <div className="p-2 bg-muted rounded">{editableData.taxNumber || 'Not specified'}</div>}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="croNumber">CRO Number</Label>
                  {isEditing ? <Input id="croNumber" value={Number(editableData.croNumber) || ''} onChange={handleInputChange} /> : <div className="p-2 bg-muted rounded">{editableData.croNumber || 'Not specified'}</div>}
                </div>
                {/* <div className="grid gap-2">
                  <Label htmlFor="onboardedDate">Onboarded Date</Label>
                  {isEditing ? <Input id="onboardedDate" type="date" value={editableData.onboardedDate?.split('T')[0] || ''} onChange={handleInputChange} /> : <div className="p-2 bg-muted rounded">{editableData.onboardedDate ? new Date(editableData.onboardedDate).toLocaleDateString() : 'Not specified'}</div>}
                </div> */}
              </div>

              <div className="grid gap-2">
                <Label htmlFor="address">Address</Label>
                {isEditing ? <Textarea id="address" value={editableData.address || ''} onChange={handleInputChange} /> : <div className="p-2 bg-muted rounded">{editableData.address || 'Not specified'}</div>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="contactName">Contact Person</Label>
                  {isEditing ? <Input id="contactName" value={editableData.contactName || ''} onChange={handleInputChange} /> : <div className="p-2 bg-muted rounded">{editableData.contactName || 'Not specified'}</div>}
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  {isEditing ? <Input id="email" type="email" value={editableData.email || ''} onChange={handleInputChange} /> : <div className="p-2 bg-muted rounded">{editableData.email || 'Not specified'}</div>}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="phone">Phone</Label>
                  {isEditing ? <Input id="phone" value={editableData.phone || ''} onChange={handleInputChange} /> : <div className="p-2 bg-muted rounded">{editableData.phone || 'Not specified'}</div>}
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
                  <Button onClick={handleAddNote} disabled={!newNote.trim()} size="sm" className="h-fit">
                    <Plus className="h-4 w-4 mr-1" />
                    Add
                  </Button>
                </div>
              </div>

              <Separator />

              <div className="grid gap-2">
                <div className="min-h-[200px] max-h-[400px] overflow-y-auto">
                  {notes.length > 0 ? <div className="space-y-4">
                    {notes.map((note, index) => <div key={note.id} className="relative pl-6 pb-4">
                      {index < notes.length - 1 && <div className="absolute left-2 top-6 bottom-0 w-0.5 bg-border"></div>}
                      <div className="absolute left-0 top-1 w-4 h-4 bg-primary rounded-full border-2 border-background"></div>
                      <div className="bg-muted rounded-lg p-3">
                        <div className="flex items-center gap-2 mb-2">
                          <Clock className="h-3 w-3 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">
                            {formatTimestamp(note.timestamp)} by {note.user}
                          </span>
                        </div>
                        <p className="text-sm">{note.text}</p>
                      </div>
                    </div>)}
                  </div> : <div className="text-center py-8">
                    <span className="text-muted-foreground">No notes yet. Add your first note above.</span>
                  </div>}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notes" className="space-y-4">
          <Card>
            <CardContent className="space-y-4 pt-6">
              <div className="grid gap-2">
                <div className="flex gap-2">
                  <Textarea placeholder="Enter your note here..." value={newNote} onChange={e => setNewNote(e.target.value)} className="min-h-[80px]" />
                  <Button onClick={handleAddNote} disabled={!newNote.trim()} size="sm" className="h-fit">
                    <Plus className="h-4 w-4 mr-1" />
                    Add
                  </Button>
                </div>
              </div>

              <Separator />

              <div className="grid gap-2">
                <div className="min-h-[200px] max-h-[400px] overflow-y-auto">
                  {notes.length > 0 ? <div className="space-y-4">
                    {notes.map((note, index) => <div key={note.id} className="relative pl-6 pb-4">
                      {/* Timeline line */}
                      {index < notes.length - 1 && <div className="absolute left-2 top-6 bottom-0 w-0.5 bg-border"></div>}
                      {/* Timeline dot */}
                      <div className="absolute left-0 top-1 w-4 h-4 bg-primary rounded-full border-2 border-background"></div>

                      {/* Note content */}
                      <div className="bg-muted rounded-lg p-3">
                        <div className="flex items-center gap-2 mb-2">
                          <Clock className="h-3 w-3 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">
                            {formatTimestamp(note.timestamp)} by {note.user}
                          </span>
                        </div>
                        <p className="text-sm">{note.text}</p>
                      </div>
                    </div>)}
                  </div> : <div className="text-center py-8">
                    <span className="text-muted-foreground">No notes yet. Add your first note above.</span>
                  </div>}
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
                      <th className="text-left p-2">Category</th>
                      <th className="text-left p-2">Description</th>
                      <th className="text-right p-2">Hours</th>
                      <th className="text-right p-2">Rate</th>
                      <th className="text-right p-2">Amount</th>
                      <th className="text-left p-2">Billable</th>
                      <th className="text-left p-2">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b">
                      <td className="p-2">15/01/2024</td>
                      <td className="p-2">John Smith</td>
                      <td className="p-2">{clientData.name}</td>
                      <td className="p-2">Tax Advisory</td>
                      <td className="p-2">Tax Return</td>
                      <td className="p-2"><Badge variant="outline" className="text-xs">Client Work</Badge></td>
                      <td className="p-2">Annual tax planning consultation</td>
                      <td className="text-right p-2">2.5</td>
                      <td className="text-right p-2">€150</td>
                      <td className="text-right p-2">€375</td>
                      <td className="p-2"><Badge variant="default" className="text-xs">Yes</Badge></td>
                      <td className="p-2"><Badge variant="outline">Not Invoiced</Badge></td>
                    </tr>
                    <tr className="border-b">
                      <td className="p-2">16/01/2024</td>
                      <td className="p-2">Sarah Johnson</td>
                      <td className="p-2">{clientData.name}</td>
                      <td className="p-2">Compliance Review</td>
                      <td className="p-2">Compliance</td>
                      <td className="p-2"><Badge variant="outline" className="text-xs">Client Work</Badge></td>
                      <td className="p-2">Quarterly compliance check</td>
                      <td className="text-right p-2">3.0</td>
                      <td className="text-right p-2">€120</td>
                      <td className="text-right p-2">€360</td>
                      <td className="p-2"><Badge variant="default" className="text-xs">Yes</Badge></td>
                      <td className="p-2"><Badge variant="secondary">Invoiced</Badge></td>
                    </tr>
                    <tr className="border-b">
                      <td className="p-2">18/01/2024</td>
                      <td className="p-2">Mike Wilson</td>
                      <td className="p-2">{clientData.name}</td>
                      <td className="p-2">Financial Planning</td>
                      <td className="p-2">Advisory</td>
                      <td className="p-2"><Badge variant="outline" className="text-xs">Meeting</Badge></td>
                      <td className="p-2">Investment strategy review</td>
                      <td className="text-right p-2">4.0</td>
                      <td className="text-right p-2">€180</td>
                      <td className="text-right p-2">€720</td>
                      <td className="p-2"><Badge variant="default" className="text-xs">Yes</Badge></td>
                      <td className="p-2"><Badge variant="outline">Paid</Badge></td>
                    </tr>
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
                <div className="border rounded-lg p-4">
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="font-medium">Tax Advisory Services</h4>
                    <Badge className="bg-green-100 text-green-800">Active</Badge>
                  </div>
                  <div className="flex flex-wrap gap-6 text-sm mb-4">
                    <span><span className="text-muted-foreground">Job Fee:</span> €5,000</span>
                    <span><span className="text-muted-foreground">WIP Amount:</span> €1,455</span>
                    <span><span className="text-muted-foreground">Hours Logged:</span> 12.5h</span>
                    <span><span className="text-muted-foreground">Last Updated:</span> 18/01/2024</span>
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
                        <tr className="border-b">
                          <td className="p-2">John Smith</td>
                          <td className="p-2"><Badge variant="outline" className="text-xs">Billable</Badge></td>
                          <td className="p-2">Tax planning consultation</td>
                          <td className="text-right p-2">4.5</td>
                          <td className="text-right p-2">€120</td>
                          <td className="text-right p-2">€540</td>
                        </tr>
                        <tr className="border-b">
                          <td className="p-2">Sarah Johnson</td>
                          <td className="p-2"><Badge variant="secondary" className="text-xs">Invoiced</Badge></td>
                          <td className="p-2">Document review</td>
                          <td className="text-right p-2">3.0</td>
                          <td className="text-right p-2">€100</td>
                          <td className="text-right p-2">€300</td>
                        </tr>
                        <tr>
                          <td className="p-2">Mike Wilson</td>
                          <td className="p-2"><Badge variant="default" className="text-xs">Draft</Badge></td>
                          <td className="p-2">Financial analysis</td>
                          <td className="text-right p-2">5.0</td>
                          <td className="text-right p-2">€110</td>
                          <td className="text-right p-2">€550</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="border rounded-lg p-4">
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="font-medium">Compliance Review Q4</h4>
                    <Badge className="bg-blue-100 text-blue-800">Completed</Badge>
                  </div>
                  <div className="flex flex-wrap gap-6 text-sm mb-4">
                    <span><span className="text-muted-foreground">Job Fee:</span> €2,500</span>
                    <span><span className="text-muted-foreground">WIP Amount:</span> €0</span>
                    <span><span className="text-muted-foreground">Hours Logged:</span> 8.0h</span>
                    <span><span className="text-muted-foreground">Completed:</span> 10/01/2024</span>
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
                        <tr className="border-b">
                          <td className="p-2">Emily Davis</td>
                          <td className="p-2"><Badge variant="secondary" className="text-xs">Paid</Badge></td>
                          <td className="p-2">Compliance audit</td>
                          <td className="text-right p-2">8.0</td>
                          <td className="text-right p-2">€100</td>
                          <td className="text-right p-2">€800</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
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
                    <tr className="border-b border-border hover:bg-muted/30 transition-colors">
                      <td className="p-4 text-foreground">15/01/2024</td>
                      <td className="p-4 text-foreground">Client meeting travel expenses</td>
                      <td className="p-4 text-foreground">Travel</td>
                      <td className="p-4 text-right text-foreground">€45.50</td>
                      <td className="p-4 text-foreground">
                        <Badge variant="secondary">Reimbursed</Badge>
                      </td>
                    </tr>
                    <tr className="border-b border-border hover:bg-muted/30 transition-colors">
                      <td className="p-4 text-foreground">22/01/2024</td>
                      <td className="p-4 text-foreground">Document postage</td>
                      <td className="p-4 text-foreground">Postage</td>
                      <td className="p-4 text-right text-foreground">€12.30</td>
                      <td className="p-4 text-foreground">
                        <Badge variant="outline">Pending</Badge>
                      </td>
                    </tr>
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
                  <p className="text-lg font-semibold text-foreground">€1,455.00</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Active Jobs</p>
                  <p className="text-lg font-semibold text-foreground">2</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Hours Logged</p>
                  <p className="text-lg font-semibold text-foreground">20.5</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Avg. Rate</p>
                  <p className="text-lg font-semibold text-foreground">€135</p>
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
                    <tr className="border-b border-border hover:bg-muted/30 transition-colors">
                      <td className="p-4 font-medium text-foreground">WSL001-TAX</td>
                      <td className="p-4 font-medium text-foreground">Tax Advisory Services</td>
                      <td className="p-4 text-right text-foreground">€1,200.00</td>
                      <td className="p-4 text-right text-foreground">12.5</td>
                      <td className="p-4 text-foreground">
                        <Badge variant="default">Active</Badge>
                      </td>
                      <td className="p-4 text-foreground">18/01/2024</td>
                    </tr>
                    <tr className="border-b border-border hover:bg-muted/30 transition-colors">
                      <td className="p-4 font-medium text-foreground">WSL001-ADV</td>
                      <td className="p-4 font-medium text-foreground">Financial Planning</td>
                      <td className="p-4 text-right text-foreground">€255.00</td>
                      <td className="p-4 text-right text-foreground">8.0</td>
                      <td className="p-4 text-foreground">
                        <Badge variant="secondary">Review</Badge>
                      </td>
                      <td className="p-4 text-foreground">16/01/2024</td>
                    </tr>
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
                      <th className="text-center p-3 text-foreground h-12">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b hover:bg-gray-50 h-12">
                      <td className="p-3">
                        <div className="text-sm">WSL001-ACC</div>
                      </td>
                      <td className="p-3">
                        <div className="text-sm">Annual Accounts Preparation</div>
                      </td>
                      <td className="p-3 text-right text-sm">€450.00</td>
                      <td className="p-3 text-center">
                        <span className="inline-flex items-center justify-center h-8 w-8 rounded-full text-xs font-medium cursor-pointer hover:opacity-80 transition-colors bg-gradient-to-br from-primary/20 to-primary/30 text-primary border border-primary/20">
                          2
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        <Button size="sm" variant="outline" className="px-2 py-1 h-6 text-xs bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200">
                          Add Write Off Value to WIP Balance
                        </Button>
                      </td>
                    </tr>
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