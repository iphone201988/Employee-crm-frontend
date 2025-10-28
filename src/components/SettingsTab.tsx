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
import { useUpdateSettingsMutation } from '@/store/teamApi';
import { toast } from 'sonner';
import { useLazyGetTabAccessQuery, useGetCurrentUserQuery } from '@/store/authApi';
import Avatars from './Avatars';
import { usePermissionTabs } from '@/hooks/usePermissionTabs';



interface SettingsTabProps {
  autoApproveTimesheets: boolean;
  onAutoApproveChange: (enabled: boolean) => void;
  wipWarningPercentage: number;
  onWipWarningPercentageChange: (percentage: number) => void;
  onSettingsUpdate?: () => void;
}



// Define all possible tabs in a constant
const allTabs = [
  { id: 'general', label: 'General' },
  { id: 'tags', label: 'Categories' },
  { id: 'clientImport', label: 'Client Import' },
  { id: 'jobImport', label: 'Job Import' },
  { id: 'timeLogsImport', label: 'Time Logs Import' },
  { id: 'integrations', label: 'Integrations' }
];



const SettingsTab = ({
  autoApproveTimesheets,
  onAutoApproveChange,
  wipWarningPercentage,
  onWipWarningPercentageChange,
  onSettingsUpdate
}: SettingsTabProps) => {
  const [newJobType, setNewJobType] = useState('');
  const [activeTab, setActiveTab] = useState<string>('');
  const [newDepartment, setNewDepartment] = useState('');
  const [newService, setNewService] = useState('');
  const [newTimeTag, setNewTimeTag] = useState('');
  const [newBusinessType, setNewBusinessType] = useState('');
  const [newWipAmount, setNewWipAmount] = useState('');
  const [isServiceDialogOpen, setIsServiceDialogOpen] = useState(false);
  const [isTimeDialogOpen, setIsTimeDialogOpen] = useState(false);
  const [isBusinessDialogOpen, setIsBusinessDialogOpen] = useState(false);
  const [isJobDialogOpen, setIsJobDialogOpen] = useState(false);
  const [isDepartmentDialogOpen, setIsDepartmentDialogOpen] = useState(false);
  const [isWipDialogOpen, setIsWipDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isCannotDeletePopupOpen, setIsCannotDeletePopupOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<{ type: string; id: string } | null>(null);
  const { visibleTabs, isLoading } = usePermissionTabs(allTabs);
  const { data: currentUserData } = useGetCurrentUserQuery<any>();
  const [getTabAccess, { data: currentTabsUsers }] = useLazyGetTabAccessQuery();



  const { data: categories, isLoading: isLoadingCategories, isError } = useGetAllCategorieasQuery("all");
  const [addCategory, { isLoading: isAdding }] = useAddCategoryMutation();
  const [deleteCategory, { isLoading: isDeleting }] = useDeleteCategoryMutation();
  const [updateSettings, { isLoading: isUpdatingSettings }] = useUpdateSettingsMutation();



  useEffect(() => {
    if (visibleTabs.length > 0 && !visibleTabs.some(tab => tab.id === activeTab)) {
      setActiveTab(visibleTabs[0].id);
    }
  }, [visibleTabs, activeTab]);



  useEffect(() => {
    if (activeTab) {
      getTabAccess(activeTab).unwrap().catch(err => console.error("Failed to get tab access:", err));
    }
  }, [activeTab, getTabAccess]);



  const handleAddNewCategory = async (type: 'service' | 'department' | 'time' | 'bussiness' | 'job' | 'wipTargetAmount') => {
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
      case 'wipTargetAmount':
        // For WIP amounts, we send amount instead of name
        name = newWipAmount;
        resetInput = () => setNewWipAmount('');
        closeDialog = setIsWipDialogOpen;
        break;
    }


    if (!name.trim()) return;

    try {
      if (type === 'wipTargetAmount') {
        // For WIP, send amount as a number
        await addCategory({ type, amount: Number(name) } as any).unwrap();
      } else {
        await addCategory({ type, name } as any).unwrap();
      }
      toast.success('Category added successfully!');
      resetInput();
      closeDialog(false);
    } catch (err) {
      console.error(`Failed to add category: ${type}`, err);
      toast.error('Failed to add category. Please try again.');
    }
  };


  const openDeleteConfirmation = (type: string, id: string, count: number) => {
    if (count > 0) {
      setIsCannotDeletePopupOpen(true);
    } else {
      setCategoryToDelete({ type, id });
      setIsDeleteDialogOpen(true);
    }
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

  const handleUpdateSettings = async () => {
    try {
      await updateSettings({
        wipWarningPercentage,
        autoApproveTimesheets
      }).unwrap();
      toast.success('Settings updated successfully!');
      // Refetch user data to get updated settings
      if (onSettingsUpdate) {
        onSettingsUpdate();
      }
    } catch (err) {
      console.error('Failed to update settings:', err);
      toast.error('Failed to update settings. Please try again.');
    }
  };

  // Sorts categories alphabetically, placing "other" at the end
  const sortCategoriesByName = (items: { name: string }[]) => {
    const itemsCopy = [...items];
    itemsCopy.sort((a, b) => {
      if (a.name.toLowerCase() === 'other') return 1;
      if (b.name.toLowerCase() === 'other') return -1;
      return a.name.localeCompare(b.name);
    });
    return itemsCopy;
  };


  const renderCategoryCard = (
    title: string,
    categoryType: 'service' | 'department' | 'time' | 'bussiness' | 'job',
    items: { _id: string; name: string; count: number }[],
    dialogOpen: boolean,
    setDialogOpen: (open: boolean) => void,
    newValue: string,
    setNewValue: (value: string) => void
  ) => {
    const sortedItems = sortCategoriesByName(items);
    return (
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
          {sortedItems.map((item: any) => (
            <Badge
              key={item._id}
              variant="secondary"
              className={`border ${item.count === 0
                ? "bg-gray-200 text-gray-700 border-gray-400"
                : "bg-blue-100 text-blue-800 border-blue-200"
                }`}
            >
              {item.name}
              <span className="mr-2 font-semibold">
                &nbsp;({item.count})
              </span>
              <button
                onClick={() => openDeleteConfirmation(categoryType, item._id, item.count)}
                disabled={isDeleting}
                className="ml-2 cursor-pointer"
              >
                <X size={14} />
              </button>
            </Badge>
          ))}
        </CardContent>
      </Card>
    );
  }


  return (
    <div className="space-y-6 p-6">
      <div className="mb-6">
        <Avatars activeTab={activeTab} title={"Settings"} />
        <CustomTabs tabs={visibleTabs} activeTab={activeTab} setActiveTab={setActiveTab} />
      </div>


      {activeTab === "general" && (
        <>
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
          <Card>
            <CardHeader>
              <CardTitle>WIP Warning Percentage</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2">
                <Input 
                  type="number" 
                  value={wipWarningPercentage} 
                  onChange={(e) => onWipWarningPercentageChange(Number(e.target.value))}
                  className="w-20" 
                  min="0"
                  max="100"
                />
                <span>%</span>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <CardTitle>WIP Target Amounts ({categories?.data?.wipTargetAmount?.length ?? 0})</CardTitle>
                <Dialog open={isWipDialogOpen} onOpenChange={setIsWipDialogOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm" className="w-full sm:w-auto">
                      <Plus className="h-4 w-4 mr-2" />
                      Add WIP Amount
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add WIP Amount</DialogTitle>
                    </DialogHeader>
                    <Input 
                      type="number"
                      placeholder="Enter amount" 
                      value={newWipAmount} 
                      onChange={(e) => setNewWipAmount(e.target.value)} 
                    />
                    <Button 
                      onClick={() => handleAddNewCategory('wipTargetAmount')} 
                      disabled={isAdding} 
                      className="w-full"
                    >
                      {isAdding ? 'Adding...' : 'Add WIP Amount'}
                    </Button>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              {categories?.data?.wipTargetAmount?.map((item: any) => (
                <Badge
                  key={item._id}
                  variant="secondary"
                  className={`border ${item.count === 0
                    ? "bg-gray-200 text-gray-700 border-gray-400"
                    : "bg-blue-100 text-blue-800 border-blue-200"
                  }`}
                >
                  ${item.amount?.toLocaleString()}
                  <span className="mr-2 font-semibold">
                    &nbsp;({item.count})
                  </span>
                  <button
                    onClick={() => openDeleteConfirmation('wipTargetAmount', item._id, item.count)}
                    disabled={isDeleting}
                    className="ml-2 cursor-pointer"
                  >
                    <X size={14} />
                  </button>
                </Badge>
              ))}
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <Button 
                onClick={handleUpdateSettings} 
                disabled={isUpdatingSettings}
                className="w-full sm:w-auto"
              >
                {isUpdatingSettings ? 'Saving...' : 'Save Settings'}
              </Button>
            </CardContent>
          </Card>
        </>

      )}


      {activeTab === "tags" && (
        <div className='space-y-6 pt-6'>
          {isLoadingCategories && <div className="text-center p-4">Loading...</div>}
          {isError && <div className="text-center p-4 text-red-500">Failed to load categories.</div>}
          {!isLoadingCategories && !isError && categories && (
            <div className="space-y-6">
              {renderCategoryCard('Business Types', 'bussiness', categories?.data?.bussiness ?? [], isBusinessDialogOpen, setIsBusinessDialogOpen, newBusinessType, setNewBusinessType)}
              {renderCategoryCard('Departments', 'department', categories?.data?.departments ?? [], isDepartmentDialogOpen, setIsDepartmentDialogOpen, newDepartment, setNewDepartment)}
              {renderCategoryCard('Job Types', 'job', categories?.data?.jobs ?? [], isJobDialogOpen, setIsJobDialogOpen, newJobType, setNewJobType)}
              {/* {renderCategoryCard('Services', 'service', categories?.data?.services ?? [], isServiceDialogOpen, setIsServiceDialogOpen, newService, setNewService)} */}
              {renderCategoryCard('Time Purpose ', 'time', categories?.data?.times ?? [], isTimeDialogOpen, setIsTimeDialogOpen, newTimeTag, setNewTimeTag)}
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

      <Dialog open={isCannotDeletePopupOpen} onOpenChange={setIsCannotDeletePopupOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className='text-red-500'>Cannot Delete Category</DialogTitle>
            <DialogDescription>
              You can't delete this category because it contains items.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={() => setIsCannotDeletePopupOpen(false)}>Close</Button>
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
      {activeTab === "jobImport" && (
        <Card>
          <CardContent className="py-8">
            <div className="text-center text-muted-foreground">
              job Import functionality coming soon.
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
      {
        activeTab === '' && (
          <div>YOU HAVE NO ACCESS</div>
        )
      }
    </div>
  );
};


export default SettingsTab;

