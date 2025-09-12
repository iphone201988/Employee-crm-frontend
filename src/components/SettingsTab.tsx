import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Plus,  X } from 'lucide-react';
import CustomTabs from './Tabs';
import { useGetAllCategorieasQuery, useAddCategoryMutation, useDeleteCategoryMutation } from '@/store/categoryApi';
import { toast } from 'sonner';
import { usePermissionTabs } from '@/hooks/usePermissionTabs';
interface SettingsTabProps {
  autoApproveTimesheets: boolean;
  onAutoApproveChange: (enabled: boolean) => void;
}
interface User {
  id: string;
  name: string;
  email: string;
  visibleTabs: string[];
}

const defaultJobTypes = ['Accounts', 'Audit', 'Bookkeeping', 'Company Secretary', 'Corporation Tax', 'Management Accounts', 'Payroll', 'Personal Tax', 'VAT', 'Other'];

 const tabs = [
    {
      id: 'general',
      label: 'General'
    },
    {
      id: 'tags',
      label: 'Categories'
    },
    {
      id: 'clientImport',
      label: 'Client Import'
    },
    {
      id: 'timeLogsImport',
      label: 'Time Logs Import'
    },
    {
      id: 'integrations',
      label: 'Integrations'
    }
  ]
const SettingsTab = ({
  autoApproveTimesheets,
  onAutoApproveChange
}: SettingsTabProps) => {
  const [newJobType, setNewJobType] = useState('');
  const [jobTypes, setJobTypes] = useState(defaultJobTypes);
  const [activeTab, setActiveTab] = useState<string>('general');
  const [newDepartment, setNewDepartment] = useState('');
  const [departments, setDepartments] = useState(['VAT', 'Payroll', 'Admin', 'Management', 'Audit', 'Tax']);
  const [newService, setNewService] = useState('');
  const [services, setServices] = useState(['Annual Returns', 'Audit', 'Bookkeeping', 'CGT', 'Income Tax', 'Payroll', 'VAT']);
  const [timeTags, setTimeTags] = useState(['Client Work', 'Training', 'Admin', 'Team Meeting', 'Client Meeting', 'Phone Call']);
  const [newTimeTag, setNewTimeTag] = useState('');
  const [businessTypes, setBusinessTypes] = useState(['CLG', 'Landlord', 'Limited Company', 'Sole Trader', 'Partnership', 'Other']);
  const [newBusinessType, setNewBusinessType] = useState('');
  const [generateInvoices, setGenerateInvoices] = useState(true);
    const { visibleTabs, isLoading } = usePermissionTabs(tabs);
  
    useEffect(() => {
      if (visibleTabs.length > 0 && !visibleTabs.some(tab => tab.id === activeTab)) {
        setActiveTab(visibleTabs[0].id);
      }
    }, [visibleTabs, activeTab]);
  // Dialog open states
  const [isServiceDialogOpen, setIsServiceDialogOpen] = useState(false);
  const [isTimeDialogOpen, setIsTimeDialogOpen] = useState(false);
  const [isBusinessDialogOpen, setIsBusinessDialogOpen] = useState(false);
  const [isJobDialogOpen, setIsJobDialogOpen] = useState(false);
  const [isDepartmentDialogOpen, setIsDepartmentDialogOpen] = useState(false);
  
  const { data: categories, isLoading: isLoadingCategories, isError } = useGetAllCategorieasQuery("all");
  const [addCategory, { isLoading: isAdding }] = useAddCategoryMutation();
  const [deleteCategory, { isLoading: isDeleting }] = useDeleteCategoryMutation();

 
  const handleAddNewCategory = async (type: 'service' | 'department' | 'time' | 'bussiness' | 'job') => {
    let name = '';
    switch (type) {
      case 'service': name = newService; break;
      case 'department': name = newDepartment; break;
      case 'time': name = newTimeTag; break;
      case 'bussiness': name = newBusinessType; break;
      case 'job': name = newJobType; break;
    }

    if (!name.trim()) return;

    try {
      await addCategory({ type, name }).unwrap();
      toast.success('Category added successfully!');
      // Reset input field on success
      switch (type) {
        case 'service': 
          setNewService(''); 
          setIsServiceDialogOpen(false);
          break;
        case 'department': 
          setNewDepartment(''); 
          setIsDepartmentDialogOpen(false);
          break;
        case 'time': 
          setNewTimeTag(''); 
          setIsTimeDialogOpen(false);
          break;
        case 'bussiness': 
          setNewBusinessType(''); 
          setIsBusinessDialogOpen(false);
          break;
        case 'job': 
          setNewJobType(''); 
          setIsJobDialogOpen(false);
          break;
      }
    } catch (err) {
      console.error(`Failed to add category: ${type}`, err);
      toast.error('Failed to add category. Please try again.');
    }
  };


  const handleDeleteCategory = async (type: string, id: string) => {
    try {
      await deleteCategory({ type, id }).unwrap();
      toast.success('Category deleted successfully!');
    } catch (err) {
      console.error(`Failed to delete category: ${type}`, err);
      toast.error('Failed to delete category. Please try again.');
    }
  };


 


  return <div className="space-y-6">
    <CustomTabs
      tabs={visibleTabs}
      activeTab={activeTab}
      setActiveTab={setActiveTab}

    />
    {activeTab === "tags" && (
      <div className='space-y-6 pt-6'>
        {isLoadingCategories && <div className="text-center p-4">Loading...</div>}
        {isError && <div className="text-center p-4 text-red-500">Failed to load categories.</div>}
        {!isLoadingCategories && !isError && (
          <Card>
            <CardContent className="space-y-6 pt-6">
              {/* --- Services Card --- */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Services</CardTitle>
                    <Dialog open={isServiceDialogOpen} onOpenChange={setIsServiceDialogOpen}>
                      <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-2" />Service</Button></DialogTrigger>
                      <DialogContent>
                        <DialogHeader><DialogTitle>Add Service</DialogTitle></DialogHeader>
                        <Input placeholder="Enter service name" value={newService} onChange={(e) => setNewService(e.target.value)} />
                        <Button onClick={() => handleAddNewCategory("service")} disabled={isAdding} className="w-full">{isAdding ? 'Adding...' : 'Add Service'}</Button>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardHeader>
                <CardContent className="flex flex-wrap gap-2">
                  {(categories?.data?.services ?? []).map((item) => (
                    <Badge key={item._id} variant="secondary" className="bg-blue-100 text-blue-800 border-blue-200">
                      {item.name}
                      <button onClick={() => handleDeleteCategory('service', item._id)} disabled={isDeleting} className="ml-2 cursor-pointer"><X size={14} /></button>
                    </Badge>
                  ))}
                </CardContent>
              </Card>

              {/* --- Time Card --- */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Time</CardTitle>
                    <Dialog open={isTimeDialogOpen} onOpenChange={setIsTimeDialogOpen}>
                      <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-2" />Time</Button></DialogTrigger>
                      <DialogContent>
                        <DialogHeader><DialogTitle>Add Time Tag</DialogTitle></DialogHeader>
                        <Input placeholder="Enter time tag name" value={newTimeTag} onChange={(e) => setNewTimeTag(e.target.value)} />
                        <Button onClick={() => handleAddNewCategory("time")} disabled={isAdding} className="w-full">{isAdding ? 'Adding...' : 'Add Time Tag'}</Button>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardHeader>
                <CardContent className="flex flex-wrap gap-2">
                  {(categories?.data?.times ?? []).map((item) => (
                    <Badge key={item._id} variant="secondary" className="bg-blue-100 text-blue-800 border-blue-200">
                      {item.name}
                      <button onClick={() => handleDeleteCategory('time', item._id)} disabled={isDeleting} className="ml-2 cursor-pointer"><X size={14} /></button>
                    </Badge>
                  ))}
                </CardContent>
              </Card>

              {/* --- Business Type Card --- */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Business Type</CardTitle>
                    <Dialog open={isBusinessDialogOpen} onOpenChange={setIsBusinessDialogOpen}>
                      <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-2" />Business Type</Button></DialogTrigger>
                      <DialogContent>
                        <DialogHeader><DialogTitle>Add Business Type</DialogTitle></DialogHeader>
                        <Input placeholder="Enter business type" value={newBusinessType} onChange={(e) => setNewBusinessType(e.target.value)} />
                        <Button onClick={() => handleAddNewCategory("bussiness")} disabled={isAdding} className="w-full">{isAdding ? 'Adding...' : 'Add Business Type'}</Button>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardHeader>
                <CardContent className="flex flex-wrap gap-2">
                  {(categories?.data?.bussiness ?? []).map((item) => (
                    <Badge key={item._id} variant="secondary" className="bg-blue-100 text-blue-800 border-blue-200">
                      {item.name}
                      <button onClick={() => handleDeleteCategory('bussiness', item._id)} disabled={isDeleting} className="ml-2 cursor-pointer"><X size={14} /></button>
                    </Badge>
                  ))}
                </CardContent>
              </Card>

              {/* --- Job Types Card --- */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Job Types</CardTitle>
                    <Dialog open={isJobDialogOpen} onOpenChange={setIsJobDialogOpen}>
                      <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-2" />Job Type</Button></DialogTrigger>
                      <DialogContent>
                        <DialogHeader><DialogTitle>Add Job Type</DialogTitle></DialogHeader>
                        <Input placeholder="Enter job type" value={newJobType} onChange={(e) => setNewJobType(e.target.value)} />
                        <Button onClick={() => handleAddNewCategory("job")} disabled={isAdding} className="w-full">{isAdding ? 'Adding...' : 'Add Job Type'}</Button>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardHeader>
                <CardContent className="flex flex-wrap gap-2">
                  {(categories?.data?.jobs ?? []).map((item) => (
                    <Badge key={item._id} variant="secondary" className="bg-blue-100 text-blue-800 border-blue-200">
                      {item.name}
                      <button onClick={() => handleDeleteCategory('job', item._id)} disabled={isDeleting} className="ml-2 cursor-pointer"><X size={14} /></button>
                    </Badge>
                  ))}
                </CardContent>
              </Card>

              {/* --- Department Types Card --- */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Department Types</CardTitle>
                    <Dialog open={isDepartmentDialogOpen} onOpenChange={setIsDepartmentDialogOpen}>
                      <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-2" />Department</Button></DialogTrigger>
                      <DialogContent>
                        <DialogHeader><DialogTitle>Add Department</DialogTitle></DialogHeader>
                        <Input placeholder="Enter department name" value={newDepartment} onChange={(e) => setNewDepartment(e.target.value)} />
                        <Button onClick={() => handleAddNewCategory("department")} disabled={isAdding} className="w-full">{isAdding ? 'Adding...' : 'Add Department'}</Button>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardHeader>
                <CardContent className="flex flex-wrap gap-2">
                  {(categories?.data?.departments ?? []).map((item) => (
                    <Badge key={item._id} variant="secondary" className="bg-blue-100 text-blue-800 border-blue-200">
                      {item.name}
                      <button onClick={() => handleDeleteCategory('department', item._id)} disabled={isDeleting} className="ml-2 cursor-pointer"><X size={14} /></button>
                    </Badge>
                  ))}
                </CardContent>
              </Card>

            </CardContent>
          </Card>
        )}
      </div>
    )}

    {
      activeTab == "clientImport" && <>
        <Card>
          <CardContent>
            <div className="text-center py-8 text-muted-foreground">
              Client Import functionality coming soon
            </div>
          </CardContent>
        </Card>
      </>
    }

    {
      activeTab == "timeLogsImport" && <Card>
        <CardHeader>
          <CardTitle>Time Logs Import</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            Time Logs Import functionality coming soon
          </div>
        </CardContent>
      </Card>
    }

    {
      activeTab == "integrations" && <Card>
        <CardContent className="space-y-6 p-6">
          <Card className="pt-6">
            <CardHeader>
              <CardTitle>QuickBooks Integration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Connect to QuickBooks</Label>
                  <div className="text-sm text-muted-foreground">
                    Sync data with QuickBooks for seamless accounting
                  </div>
                </div>
                <Button variant="outline">
                  Connect
                </Button>
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Auto-sync invoices</Label>
                  <div className="text-sm text-muted-foreground">
                    Automatically sync invoices to QuickBooks
                  </div>
                </div>
                <Switch />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Sync time entries</Label>
                  <div className="text-sm text-muted-foreground">
                    Sync time tracking data to QuickBooks
                  </div>
                </div>
                <Switch />
              </div>
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    }

  </div>;
};
export default SettingsTab;