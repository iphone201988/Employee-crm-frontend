import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Settings, DollarSign, AlertTriangle, MoreHorizontal, ArrowRightLeft } from 'lucide-react';
import { WIPData } from '@/types/wip';
import { WIPEditableCell } from './WIPEditableCell';
import { WIPActionButtons } from './WIPActionButtons';
import { groupByClient } from '@/utils/wipUtils';
import { wipSampleData } from '@/data/wipSampleData';
import ClientNameLink from './ClientNameLink';
import JobNameLink from './JobNameLink';
import ClientDetailsDialog from './ClientDetailsDialog';

const WIPTab = () => {
  const [viewByClient, setViewByClient] = useState(false);
  const [showWarningDialog, setShowWarningDialog] = useState(false);
  const [warningPercentage, setWarningPercentage] = useState(80);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedClient, setSelectedClient] = useState<string | null>(null);
  const [isClientDialogOpen, setIsClientDialogOpen] = useState(false);
  const [showTransferDialog, setShowTransferDialog] = useState(false);
  const [selectedTransferClient, setSelectedTransferClient] = useState('');
  const [transferWIPData, setTransferWIPData] = useState<WIPData | null>(null);
  
  const [wipData, setWipData] = useState<WIPData[]>(wipSampleData);

  const updateWIPData = (id: string, field: keyof WIPData, value: any) => {
    setWipData(prev => prev.map(item => 
      item.id === id ? { ...item, [field]: value } : item
    ));
  };

  const clientGroupedData = groupByClient(wipData);

  const getWarningIcon = (job: WIPData) => {
    const wipPercentage = (job.wipAmount / job.jobFee) * 100;
    return wipPercentage >= warningPercentage ? (
      <AlertTriangle className="h-4 w-4 text-orange-500 ml-1" />
    ) : null;
  };

  const handleWarningPercentageChange = (value: string) => {
    const numValue = parseFloat(value);
    if (!isNaN(numValue) && numValue >= 0 && numValue <= 100) {
      setWarningPercentage(numValue);
    }
  };

  const handleClientClick = (clientName: string) => {
    setSelectedClient(clientName);
    setIsClientDialogOpen(true);
  };

  const getClientData = (clientName: string) => {
    const mockClientData = {
      clientRef: clientName.substring(0, 3).toUpperCase() + '-001',
      name: clientName,
      customerNumber: 'CUST-' + Math.floor(Math.random() * 1000),
      clientType: 'Corporate',
      address: '123 Business Street, Business City, BC 12345',
      contactPerson: 'Contact Person',
      email: 'contact@example.com',
      phone: '+1 234 567 8900',
      takeOnDate: '2024-01-01',
      clientTags: ['Active', 'Corporate'],
      taxes: ['VAT', 'CT', 'PAYE-EMP']
    };
    return mockClientData;
  };

  const handleTransferWIP = () => {
    if (transferWIPData && selectedTransferClient) {
      console.log(`Transferring WIP from ${transferWIPData.clientName} to ${selectedTransferClient}`);
      setShowTransferDialog(false);
      setSelectedTransferClient('');
      setTransferWIPData(null);
    }
  };

  const availableClients = ['Green Gardens Limited', 'Water Savers Limited', 'Smith & Associates', 'TechFlow Solutions', 'EcoClean Services'];

  return (
    <div className="space-y-6">
      {/* View Toggle */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Work In Progress
            </CardTitle>
            <div className="flex items-center gap-2">
              <Dialog open={showWarningDialog} onOpenChange={setShowWarningDialog}>
                <DialogTrigger asChild>
                  <Button
                    size="sm"
                    variant="outline"
                    className="px-3 py-1 h-8 text-sm gap-1"
                  >
                    <Settings className="h-3 w-3" />
                    Job WIP Warning %
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Set Job WIP Warning Percentage</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="percentage">Warning Percentage</Label>
                      <Input
                        id="percentage"
                        type="number"
                        min="0"
                        max="100"
                        value={warningPercentage}
                        onChange={(e) => handleWarningPercentageChange(e.target.value)}
                        className="mt-1"
                      />
                      <p className="text-sm text-muted-foreground mt-1">
                        Warning icon will appear when WIP amount reaches this percentage of job fee
                      </p>
                    </div>
                    <Button onClick={() => setShowWarningDialog(false)} className="w-full">
                      Save
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
              <Button
                size="sm"
                variant={!viewByClient ? 'default' : 'outline'}
                onClick={() => setViewByClient(false)}
                className="px-3 py-1 h-8 text-sm"
              >
                Job
              </Button>
              <Button
                size="sm"
                variant={viewByClient ? 'default' : 'outline'}
                onClick={() => setViewByClient(true)}
                className="px-3 py-1 h-8 text-sm"
              >
                Client
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowTransferDialog(true)}
                className="px-3 py-1 h-8 text-sm gap-1"
              >
                <ArrowRightLeft className="h-3 w-3" />
                Transfer
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Data Table */}
      <Card>
        <CardContent className="pt-6">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="border-r p-3 font-medium text-foreground h-10">Client Name</TableHead>
                  <TableHead className="border-r p-3 font-medium text-foreground h-10">Job Name</TableHead>
                  <TableHead className="border-r p-3 font-medium text-foreground h-10">Job Status</TableHead>
                  <TableHead className="border-r p-3 font-medium text-foreground h-10">Hours Logged</TableHead>
                  <TableHead className="border-r p-3 font-medium text-foreground h-10">Job Fee</TableHead>
                  <TableHead className="border-r p-3 font-medium text-foreground h-10">WIP Amount</TableHead>
                  <TableHead className="border-r p-3 font-medium text-foreground h-10">Invoiced Amount</TableHead>
                  <TableHead className="border-r p-3 font-medium text-foreground h-10">Unbilled Amount</TableHead>
                  <TableHead className="border-r p-3 font-medium text-foreground h-10">Outstanding Amount</TableHead>
                  <TableHead className="border-r p-3 font-medium text-foreground h-10">Last Invoice Date</TableHead>
                  <TableHead className="border-r p-3 font-medium text-foreground h-10">Days Since Last Invoice</TableHead>
                  <TableHead className="border-r p-3 font-medium text-foreground h-10">Billing Trigger</TableHead>
                  <TableHead className="border-r p-3 font-medium text-foreground h-10">Trigger Met</TableHead>
                  <TableHead className="p-3 font-medium text-foreground h-10">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {viewByClient ? (
                  // Client-grouped view
                  clientGroupedData.map((client, clientIndex) => (
                    <React.Fragment key={client.clientName}>
                      {client.jobs.map((job, jobIndex) => (
                        <TableRow key={job.id}>
                           <TableCell className="font-medium border-r">
                             {jobIndex === 0 ? (
                               <div>
                                 <div>
                         <ClientNameLink clientName={client.clientName} />
                                 </div>
                                 <div className="text-sm text-muted-foreground">
                                   Total Fee: <Badge variant="outline">N/A</Badge>
                                 </div>
                               </div>
                             ) : ''}
                           </TableCell>
                          <TableCell className="border-r">
                            {editingId === job.id ? (
                              <WIPEditableCell 
                                job={job} 
                                field="jobName" 
                                value={job.jobName} 
                                isEditing={true} 
                                onUpdate={updateWIPData}
                              />
                            ) : (
                              <JobNameLink 
                                
                                jobName={job.jobName}
                                jobFee={job.jobFee}
                                wipAmount={job.wipAmount}
                                hoursLogged={job.hoursLogged}
                                jobId={job.id}
                              />
                            )}
                          </TableCell>
                          <TableCell className="border-r">
                            <WIPEditableCell 
                              job={job} 
                              field="jobStatus" 
                              value={job.jobStatus} 
                              isEditing={editingId === job.id} 
                              onUpdate={updateWIPData}
                            />
                          </TableCell>
                          <TableCell className="border-r">
                            <WIPEditableCell 
                              job={job} 
                              field="hoursLogged" 
                              value={job.hoursLogged} 
                              isEditing={editingId === job.id} 
                              onUpdate={updateWIPData}
                            />
                          </TableCell>
                          <TableCell className="border-r">
                            <WIPEditableCell 
                              job={job} 
                              field="jobFee" 
                              value={job.jobFee} 
                              isEditing={editingId === job.id} 
                              onUpdate={updateWIPData}
                            />
                          </TableCell>
                          <TableCell className="border-r">
                            <div className="flex items-center">
                              <WIPEditableCell 
                                job={job} 
                                field="wipAmount" 
                                value={job.wipAmount} 
                                isEditing={editingId === job.id} 
                                onUpdate={updateWIPData}
                              />
                              {getWarningIcon(job)}
                            </div>
                          </TableCell>
                          <TableCell className="border-r">
                            <WIPEditableCell 
                              job={job} 
                              field="invoicedAmount" 
                              value={job.invoicedAmount} 
                              isEditing={editingId === job.id} 
                              onUpdate={updateWIPData}
                            />
                          </TableCell>
                          <TableCell className="border-r">
                            <WIPEditableCell 
                              job={job} 
                              field="unbilledAmount" 
                              value={job.unbilledAmount} 
                              isEditing={editingId === job.id} 
                              onUpdate={updateWIPData}
                            />
                          </TableCell>
                          <TableCell className="border-r">
                            <WIPEditableCell 
                              job={job} 
                              field="outstandingAmount" 
                              value={job.outstandingAmount} 
                              isEditing={editingId === job.id} 
                              onUpdate={updateWIPData}
                            />
                          </TableCell>
                          <TableCell className="border-r">
                            <WIPEditableCell 
                              job={job} 
                              field="lastInvoiceDate" 
                              value={job.lastInvoiceDate} 
                              isEditing={editingId === job.id} 
                              onUpdate={updateWIPData}
                            />
                          </TableCell>
                          <TableCell className="border-r">{job.daysSinceLastInvoice || 'N/A'}</TableCell>
                          <TableCell className="border-r">
                            <WIPEditableCell 
                              job={job} 
                              field="billingTrigger" 
                              value={job.billingTrigger} 
                              isEditing={editingId === job.id} 
                              onUpdate={updateWIPData}
                            />
                          </TableCell>
                          <TableCell className="border-r">
                            <Badge className={job.triggerMet ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                              {job.triggerMet ? 'Yes' : 'No'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <WIPActionButtons 
                              job={job} 
                              editingId={editingId} 
                              onEditToggle={setEditingId}
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </React.Fragment>
                  ))
                ) : (
                  // Job view
                  wipData.map((job) => (
                    <TableRow key={job.id}>
                      <TableCell className="font-medium border-r">
                        {editingId === job.id ? (
                          <WIPEditableCell 
                            job={job} 
                            field="clientName" 
                            value={job.clientName} 
                            isEditing={true} 
                            onUpdate={updateWIPData}
                          />
                         ) : (
                            <ClientNameLink clientName={job.clientName} />
                         )}
                      </TableCell>
                      <TableCell className="border-r">
                        {editingId === job.id ? (
                          <WIPEditableCell 
                            job={job} 
                            field="jobName" 
                            value={job.jobName} 
                            isEditing={true} 
                            onUpdate={updateWIPData}
                          />
                        ) : (
                          <JobNameLink 
                            jobName={job.jobName}
                            jobFee={job.jobFee}
                            wipAmount={job.wipAmount}
                            hoursLogged={job.hoursLogged}
                            jobId={job.id}
                          />
                        )}
                      </TableCell>
                      <TableCell className="border-r">
                        <WIPEditableCell 
                          job={job} 
                          field="jobStatus" 
                          value={job.jobStatus} 
                          isEditing={editingId === job.id} 
                          onUpdate={updateWIPData}
                        />
                      </TableCell>
                      <TableCell className="border-r">
                        <WIPEditableCell 
                          job={job} 
                          field="hoursLogged" 
                          value={job.hoursLogged} 
                          isEditing={editingId === job.id} 
                          onUpdate={updateWIPData}
                        />
                      </TableCell>
                      <TableCell className="border-r">
                        <WIPEditableCell 
                          job={job} 
                          field="jobFee" 
                          value={job.jobFee} 
                          isEditing={editingId === job.id} 
                          onUpdate={updateWIPData}
                        />
                      </TableCell>
                      <TableCell className="border-r">
                        <div className="flex items-center">
                          <WIPEditableCell 
                            job={job} 
                            field="wipAmount" 
                            value={job.wipAmount} 
                            isEditing={editingId === job.id} 
                            onUpdate={updateWIPData}
                          />
                          {getWarningIcon(job)}
                        </div>
                      </TableCell>
                      <TableCell className="border-r">
                        <WIPEditableCell 
                          job={job} 
                          field="invoicedAmount" 
                          value={job.invoicedAmount} 
                          isEditing={editingId === job.id} 
                          onUpdate={updateWIPData}
                        />
                      </TableCell>
                      <TableCell className="border-r">
                        <WIPEditableCell 
                          job={job} 
                          field="unbilledAmount" 
                          value={job.unbilledAmount} 
                          isEditing={editingId === job.id} 
                          onUpdate={updateWIPData}
                        />
                      </TableCell>
                      <TableCell className="border-r">
                        <WIPEditableCell 
                          job={job} 
                          field="outstandingAmount" 
                          value={job.outstandingAmount} 
                          isEditing={editingId === job.id} 
                          onUpdate={updateWIPData}
                        />
                      </TableCell>
                      <TableCell className="border-r">
                        <WIPEditableCell 
                          job={job} 
                          field="lastInvoiceDate" 
                          value={job.lastInvoiceDate} 
                          isEditing={editingId === job.id} 
                          onUpdate={updateWIPData}
                        />
                      </TableCell>
                      <TableCell className="border-r">{job.daysSinceLastInvoice || 'N/A'}</TableCell>
                      <TableCell className="border-r">
                        <WIPEditableCell 
                          job={job} 
                          field="billingTrigger" 
                          value={job.billingTrigger} 
                          isEditing={editingId === job.id} 
                          onUpdate={updateWIPData}
                        />
                      </TableCell>
                      <TableCell className="border-r">
                        <Badge className={job.triggerMet ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                          {job.triggerMet ? 'Yes' : 'No'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <WIPActionButtons 
                          job={job} 
                          editingId={editingId} 
                          onEditToggle={setEditingId}
                        />
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Client Details Dialog */}
      {selectedClient && (
        <ClientDetailsDialog
          open={isClientDialogOpen}
          onOpenChange={setIsClientDialogOpen}
          clientData={getClientData(selectedClient)}
        />
      )}

      {/* Transfer WIP Dialog */}
      <Dialog open={showTransferDialog} onOpenChange={setShowTransferDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Transfer WIP to Another Client</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="newClient">Select New Client</Label>
              <Select value={selectedTransferClient} onValueChange={setSelectedTransferClient}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Choose a client" />
                </SelectTrigger>
                <SelectContent>
                  {availableClients.map((client) => (
                    <SelectItem key={client} value={client}>{client}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {selectedTransferClient && (
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">Transfer Summary</h4>
                <p className="text-sm text-blue-800">
                  This action will transfer the selected WIP entries to <strong>{selectedTransferClient}</strong>.
                  The transfer will be logged for audit purposes and cannot be undone.
                </p>
              </div>
            )}
            
            <div className="flex justify-end space-x-2 pt-4">
              <Button variant="outline" onClick={() => setShowTransferDialog(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleTransferWIP}
                disabled={!selectedTransferClient}
              >
                Confirm Transfer
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default WIPTab;