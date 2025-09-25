import React, { useEffect, useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Plus, X } from 'lucide-react';
import CustomTabs from './Tabs';
import { useGetAllCategorieasQuery, useAddCategoryMutation, useDeleteCategoryMutation } from '@/store/categoryApi';
import { toast } from 'sonner';
import { useLazyGetTabAccessQuery, useGetCurrentUserQuery } from '@/store/authApi';
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@radix-ui/react-tooltip';

interface SettingsTabProps {
  autoApproveTimesheets: boolean;
  onAutoApproveChange: (enabled: boolean) => void;
}

// Define all possible tabs in a constant
const allTabs = [
  { id: 'general', label: 'General' },
  { id: 'tags', label: 'Categories' },
  { id: 'clientImport', label: 'Client Import' },
  { id: 'timeLogsImport', label: 'Time Logs Import' },
  { id: 'integrations', label: 'Integrations' }
];

const SettingsTab = ({
  autoApproveTimesheets,
  onAutoApproveChange
}: SettingsTabProps) => {
  const [newJobType, setNewJobType] = useState('');
  const [activeTab, setActiveTab] = useState<string>('');
  const [newDepartment, setNewDepartment] = useState('');
  const [newService, setNewService] = useState('');
  const [newTimeTag, setNewTimeTag] = useState('');
  const [newBusinessType, setNewBusinessType] = useState('');
  const [isServiceDialogOpen, setIsServiceDialogOpen] = useState(false);
  const [isTimeDialogOpen, setIsTimeDialogOpen] = useState(false);
  const [isBusinessDialogOpen, setIsBusinessDialogOpen] = useState(false);
  const [isJobDialogOpen, setIsJobDialogOpen] = useState(false);
  const [isDepartmentDialogOpen, setIsDepartmentDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<{ type: string; id: string } | null>(null);

  const { data: currentUserData } = useGetCurrentUserQuery<any>();
  const [getTabAccess, { data: currentTabsUsers }] = useLazyGetTabAccessQuery();

  // Conditionally filter the tabs based on the user's role
  const visibleTabs = useMemo(() => {

    return allTabs;

  }, [currentUserData]);

  // Conditionally fetch categories only if the user is a superAdmin
  const { data: categories, isLoading: isLoadingCategories, isError } = useGetAllCategorieasQuery("all");

  const [addCategory, { isLoading: isAdding }] = useAddCategoryMutation();
  const [deleteCategory, { isLoading: isDeleting }] = useDeleteCategoryMutation();

  // Effect to set the active tab correctly when visible tabs change
  useEffect(() => {
    if (visibleTabs.length > 0 && !visibleTabs.some(tab => tab.id === activeTab)) {
      setActiveTab(visibleTabs[0].id);
    }
  }, [visibleTabs, activeTab]);

  // Effect to fetch access data for the active tab
  useEffect(() => {
    if (activeTab) {
      getTabAccess(activeTab).unwrap().catch(err => console.error("Failed to get tab access:", err));
    }
  }, [activeTab, getTabAccess]);

  const handleAddNewCategory = async (type: 'service' | 'department' | 'time' | 'bussiness' | 'job') => {
    let name = '';
    let resetInput: () => void;
    let closeDialog: (isOpen: boolean) => void;

    switch (type) {
      case 'service':
        name = newService;
        resetInput = () => setNewService('');
        closeDialog = setIsServiceDialogOpen;
        break;
      case 'department':
        name = newDepartment;
        resetInput = () => setNewDepartment('');
        closeDialog = setIsDepartmentDialogOpen;
        break;
      case 'time':
        name = newTimeTag;
        resetInput = () => setNewTimeTag('');
        closeDialog = setIsTimeDialogOpen;
        break;
      case 'bussiness':
        name = newBusinessType;
        resetInput = () => setNewBusinessType('');
        closeDialog = setIsBusinessDialogOpen;
        break;
      case 'job':
        name = newJobType;
        resetInput = () => setNewJobType('');
        closeDialog = setIsJobDialogOpen;
        break;
    }

    if (!name.trim()) return;

    try {
      await addCategory({ type, name }).unwrap();
      toast.success('Category added successfully!');
      resetInput();
      closeDialog(false);
    } catch (err) {
      console.error(`Failed to add category: ${type}`, err);
      toast.error('Failed to add category. Please try again.');
    }
  };

  const openDeleteConfirmation = (type: string, id: string) => {
    setCategoryToDelete({ type, id });
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!categoryToDelete) return;

    try {
      await deleteCategory(categoryToDelete).unwrap();
      toast.success('Category deleted successfully!');
      setIsDeleteDialogOpen(false);
      setCategoryToDelete(null);
    } catch (err) {
      console.error(`Failed to delete category: ${categoryToDelete.type}`, err);
      toast.error('Failed to delete category. Please try again.');
      setIsDeleteDialogOpen(false);
      setCategoryToDelete(null);
    }
  };

  const renderCategoryCard = (
    title: string,
    categoryType: 'service' | 'department' | 'time' | 'bussiness' | 'job',
    items: { _id: string; name: string }[],
    dialogOpen: boolean,
    setDialogOpen: (open: boolean) => void,
    newValue: string,
    setNewValue: (value: string) => void
  ) => (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <CardTitle>{title} ({items.length})</CardTitle>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild><Button size="sm" className="w-full sm:w-auto"><Plus className="h-4 w-4 mr-2" />Add {title.slice(0, -1)}</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Add {title.slice(0, -1)}</DialogTitle></DialogHeader>
              <Input placeholder={`Enter ${title.toLowerCase().slice(0, -1)} name`} value={newValue} onChange={(e) => setNewValue(e.target.value)} />
              <Button onClick={() => handleAddNewCategory(categoryType)} disabled={isAdding} className="w-full">{isAdding ? 'Adding...' : `Add ${title.slice(0, -1)}`}</Button>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-2">
        {items.map((item: any) => (
          <Badge key={item._id} variant="secondary" className="bg-blue-100 text-blue-800 border-blue-200">
            <span className='mr-2 font-semibold '>{item.count}</span>{item.name}
            <button onClick={() => openDeleteConfirmation(categoryType, item._id)} disabled={isDeleting} className="ml-2 cursor-pointer"><X size={14} /></button>
          </Badge>
        ))}
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6 p-6">
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <h1 className="text-xl sm:text-2xl font-semibold text-foreground">Settings</h1>
            <div className="flex -space-x-2 overflow-x-auto pb-2 sm:pb-0">
              <TooltipProvider>
                {currentTabsUsers?.result?.map((user: any, index: number) => (
                  <Tooltip key={user?.id || index} delayDuration={100}>
                    <TooltipTrigger asChild>
                      <Avatar
                        className="border-2 border-background w-8 h-8 sm:w-10 sm:h-10 flex-shrink-0 rounded-full"
                      >
                        <AvatarImage
                          src={
                            import.meta.env.VITE_BACKEND_BASE_URL + user?.avatarUrl
                          }
                          className="rounded-full"
                        />
                        <AvatarFallback className="text-xs rounded-full bg-gray-400">
                          {user?.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{user?.name}</p>
                    </TooltipContent>
                  </Tooltip>
                ))}
              </TooltipProvider>
            </div>
          </div>
        </div>

        <CustomTabs tabs={visibleTabs} activeTab={activeTab} setActiveTab={setActiveTab} />
      </div>

      {activeTab === "general" && (
        <Card>
          <CardHeader>
            <CardTitle>General Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <Label htmlFor="auto-approve" className="text-base">Auto-approve timesheets</Label>
                <p className="text-sm text-muted-foreground">
                  Enable to automatically approve all submitted timesheets.
                </p>
              </div>
              <Switch
                id="auto-approve"
                checked={autoApproveTimesheets}
                onCheckedChange={onAutoApproveChange}
                className="self-start sm:self-center"
              />
            </div>
          </CardContent>
        </Card>
      )}

      {activeTab === "tags" && (
        <div className='space-y-6 pt-6'>
          {isLoadingCategories && <div className="text-center p-4">Loading...</div>}
          {isError && <div className="text-center p-4 text-red-500">Failed to load categories.</div>}
          {!isLoadingCategories && !isError && categories && (
            <div className="space-y-6">
              {renderCategoryCard('Services', 'service', categories?.data?.services ?? [], isServiceDialogOpen, setIsServiceDialogOpen, newService, setNewService)}
              {renderCategoryCard('Time Tags', 'time', categories?.data?.times ?? [], isTimeDialogOpen, setIsTimeDialogOpen, newTimeTag, setNewTimeTag)}
              {renderCategoryCard('Business Types', 'bussiness', categories?.data?.bussiness ?? [], isBusinessDialogOpen, setIsBusinessDialogOpen, newBusinessType, setNewBusinessType)}
              {renderCategoryCard('Job Types', 'job', categories?.data?.jobs ?? [], isJobDialogOpen, setIsJobDialogOpen, newJobType, setNewJobType)}
              {renderCategoryCard('Departments', 'department', categories?.data?.departments ?? [], isDepartmentDialogOpen, setIsDepartmentDialogOpen, newDepartment, setNewDepartment)}
            </div>
          )}
        </div>
      )}

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Are you sure?</DialogTitle>
            <DialogDescription>
              This action cannot be undone. This will permanently delete the category.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={confirmDelete} disabled={isDeleting}>
              {isDeleting ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {activeTab === "clientImport" && (
        <Card>
          <CardContent className="py-8">
            <div className="text-center text-muted-foreground">
              Client Import functionality coming soon.
            </div>
          </CardContent>
        </Card>
      )}

      {activeTab === "timeLogsImport" && (
        <Card>
          <CardHeader>
            <CardTitle>Time Logs Import</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-muted-foreground">
              Time Logs Import functionality coming soon.
            </div>
          </CardContent>
        </Card>
      )}

      {activeTab === "integrations" && (
        <Card>
          <CardContent className="space-y-6 p-6">
            <Card className="pt-6">
              <CardHeader>
                <CardTitle>QuickBooks Integration</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">Connect to QuickBooks</Label>
                    <p className="text-sm text-muted-foreground">Sync data with QuickBooks for seamless accounting.</p>
                  </div>
                  <Button variant="outline" className="w-full sm:w-auto">Connect</Button>
                </div>
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">Auto-sync invoices</Label>
                    <p className="text-sm text-muted-foreground">Automatically sync new invoices to QuickBooks.</p>
                  </div>
                  <Switch className="self-start sm:self-center" />
                </div>
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">Sync time entries</Label>
                    <p className="text-sm text-muted-foreground">Sync time tracking data to QuickBooks.</p>
                  </div>
                  <Switch className="self-start sm:self-center" />
                </div>
              </CardContent>
            </Card>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default SettingsTab;
