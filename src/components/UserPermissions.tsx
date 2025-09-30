import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import { useGetCurrentUserQuery } from '@/store/authApi';
import { useUpdateTeamMembersMutation } from '@/store/teamApi';
import { toast } from 'sonner';
import { getUserInitials } from '@/utils/profiles';

// This structure is taken directly from your old component to replicate the UI
const systemFeatures = {
  'Time': {
    features: [
      { key: 'myTimesheet', label: 'My Timesheet' },
      { key: 'allTimesheets', label: 'All Timesheets' },
      { key: 'timeLogs', label: 'Time Logs' }
    ]
  },
  'WIP & Debtors': {
    features: [
      { key: 'WIP', label: 'WIP' },
      { key: 'agedWIP', label: 'Aged WIP' },
      { key: 'invoices', label: 'Invoices' },
      { key: 'agedDebtors', label: 'Aged Debtors' },
      { key: 'writeOff', label: 'Write Off' }
    ]
  },
  'Clients': {
    features: [
      { key: 'clientList', label: 'Client List' },
      { key: 'clientBreakdown', label: 'Client Breakdown' }
    ]
  },
  'Services': {
    features: [
      { key: 'services', label: 'Services' },
      { key: 'jobTemplates', label: 'Job Templates' },
      { key: 'jobBuilder', label: 'Job Builder' },
      { key: 'jobList', label: 'Job List' }
    ]
  },
  'Expenses': {
    features: [
      { key: 'clientExpenses', label: 'Client Expenses' },
      { key: 'teamExpenses', label: 'Team Expenses' }
    ]
  },
  'Reports': {
    features: [
      { key: 'reports', label: 'Reports' }
    ]
  },
  'Team Management': {
    features: [
      { key: 'teamList', label: 'Team List' },
      { key: 'rates', label: 'Rates' },
      { key: 'permissions', label: 'Permissions' },
      { key: 'access', label: 'Access' }
    ]
  },
  'Settings': {
    features: [
      { key: 'general', label: 'General' },
      { key: 'tags', label: 'Tags' },
      { key: 'clientImport', label: 'Client Import' },
      { key: 'timeLogsImport', label: 'Time Logs Import' },
      { key: 'jobImport', label: 'Job Import' },
      { key: 'integrations', label: 'Integrations' }
    ]
  },
};

const UserPermissions = (companyData:any) => {
  const { data: currentUserData, isLoading, isError }:any = useGetCurrentUserQuery();
  const [updateTeamMembers, { isLoading: isUpdating }] = useUpdateTeamMembersMutation();

  const [localPermissions, setLocalPermissions] = useState<Record<string, boolean>>({});
  const [initialPermissions, setInitialPermissions] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (companyData?.data?.features) {
      const features = { ...currentUserData.data.features };
      // Clean up the object to only contain permission flags
      delete features._id;
      delete features.userId;
      delete features.__v;
      setLocalPermissions(features);
      setInitialPermissions(features);
    }
  }, [companyData]);
  
  const hasUnsavedChanges = useMemo(() => {
    return JSON.stringify(localPermissions) !== JSON.stringify(initialPermissions);
  }, [localPermissions, initialPermissions]);

  const handlePermissionChange = (featureKey: string, checked: boolean) => {
    setLocalPermissions(prev => ({ ...prev, [featureKey]: checked }));
  };
  
  const handleSelectAllForUser = () => {
    const allChecked = Object.values(localPermissions).every(value => value);
    const newPermissions = Object.keys(localPermissions).reduce((acc, key) => {
        acc[key] = !allChecked;
        return acc;
    }, {} as Record<string, boolean>);
    setLocalPermissions(newPermissions);
  };

  const handleSaveChanges = useCallback(async () => {
    if (!currentUserData?.data?._id) {
        toast.error("User data not available.");
        return;
    }
    
    // Construct the payload to match the old component's structure
    const featureAccessUpdates = [{
        userId: currentUserData.data._id,
        ...localPermissions // Spread the permissions directly
    }];

    try {
      // Send the payload with the 'featureAccess' key
      await updateTeamMembers({ featureAccess: featureAccessUpdates }).unwrap();
      setInitialPermissions(localPermissions); // Set the new state as the baseline
      toast.success("Permissions updated successfully!");
    } catch (error: any) {
      toast.error(error?.data?.message || 'Failed to update permissions.');
    }
  }, [localPermissions, currentUserData, updateTeamMembers]);

  const handleDiscardChanges = useCallback(() => {
    setLocalPermissions(initialPermissions);
    toast.info("Changes have been discarded.");
  }, [initialPermissions]);

  if (isLoading) {
    return <p>Loading user permissions...</p>;
  }

  if (isError || !currentUserData?.data) {
      return <p className="text-red-500">Failed to load user data.</p>;
  }
  
  const user = currentUserData.data;

  return (
    <div className="space-y-4">
      {hasUnsavedChanges && (
        <div className="flex justify-end pt-4">
          <Button onClick={handleSaveChanges} disabled={isUpdating}>
            {isUpdating ? 'Saving...' : 'Save Changes'}
          </Button>
          <Button variant="ghost" onClick={handleDiscardChanges} disabled={isUpdating} className="ml-2">
            Discard
          </Button>
        </div>
      )}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="sticky left-0 z-10 w-[250px] border-r bg-white">
                    Team Member
                  </TableHead>
                  {Object.keys(systemFeatures).map(category => (
                    <TableHead key={category} className="w-[200px] border-r">
                      {category}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="sticky left-0 z-10 border-r bg-white p-2">
                      <div className="flex items-center gap-3">
                        <Checkbox
                          checked={Object.values(localPermissions).every(value => value)}
                          onCheckedChange={handleSelectAllForUser}
                          className="h-4 w-4"
                        />
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={user.avatarUrl} alt={user.name} />
                          <AvatarFallback>{getUserInitials(user.name)}</AvatarFallback>
                        </Avatar>
                        <span className="font-medium">{user.name}</span>
                      </div>
                  </TableCell>
                  {Object.entries(systemFeatures).map(([category, { features }]) => (
                    <TableCell key={category} className="border-r p-2 align-top">
                      <div className="space-y-2">
                        {features.map(feature => (
                          <div key={feature.key} className="flex items-center gap-2">
                            <Checkbox
                              id={`${user._id}-${feature.key}`}
                              checked={!!localPermissions[feature.key]}
                              onCheckedChange={(checked) =>
                                handlePermissionChange(feature.key, !!checked)
                              }
                              className="h-4 w-4"
                            />
                            <label htmlFor={`${user._id}-${feature.key}`} className="text-xs font-normal">
                              {feature.label}
                            </label>
                          </div>
                        ))}
                      </div>
                    </TableCell>
                  ))}
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default UserPermissions;
