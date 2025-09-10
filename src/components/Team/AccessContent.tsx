import { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { getProfileImage, getUserInitials } from '@/utils/profiles';
import { TeamMember as ApiTeamMember } from '@/types/APIs/teamApiType';
import { AccessTeamMember, transformToAccess } from '@/types/teamMemberTypes';
import { useGetAllTeamMembersQuery, useUpdateTeamMembersMutation } from '@/store/teamApi';

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
      { key: 'invoicing', label: 'Invoicing' },
      { key: 'tags', label: 'Tags' }
    ]
  },
  'Import/Export': {
    features: [
      { key: 'clientImport', label: 'Client Import' },
      { key: 'timeLogsImport', label: 'Time Logs Import' },
      { key: 'integrations', label: 'Integrations' }
    ]
  }
};

const AccessContent = () => {
  const [teamMembers, setTeamMembers] = useState<AccessTeamMember[]>([]);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const { data: teamData, isLoading, error } = useGetAllTeamMembersQuery({ page, limit });
  const [updateTeamMembers] = useUpdateTeamMembersMutation();

  const pagination = teamData?.data?.pagination;

  useEffect(() => {
    if (teamData?.data?.teamMembers) {
      const transformedMembers = teamData.data.teamMembers.map(transformToAccess);
      setTeamMembers(transformedMembers);
    }
  }, [teamData]);

  useEffect(() => {
    setPage(1);
  }, [limit]);

  const handlePermissionChange = (memberId: string, featureKey: keyof AccessTeamMember['featureAccess'], checked: boolean) => {
    setTeamMembers(prev =>
      prev.map(member =>
        member.id === memberId
          ? {
            ...member,
            featureAccess: {
              ...member.featureAccess,
              [featureKey]: checked
            }
          }
          : member
      )
    );
    setHasUnsavedChanges(true);
  };

  const handleSelectAllForMember = (memberId: string) => {
    const member = teamMembers.find(m => m.id === memberId);
    if (!member) return;

    const allChecked = Object.values(member.featureAccess).every(value => value);
    const newFeatureAccess = Object.keys(member.featureAccess).reduce((acc, key) => {
      acc[key as keyof AccessTeamMember['featureAccess']] = !allChecked;
      return acc;
    }, {} as AccessTeamMember['featureAccess']);

    setTeamMembers(prev =>
      prev.map(m =>
        m.id === memberId
          ? { ...m, featureAccess: newFeatureAccess }
          : m
      )
    );
    setHasUnsavedChanges(true);
  };

  const handleSaveChanges = async () => {
    try {
      const featureAccessUpdates = teamMembers.map(member => ({
        userId: member.id,
        myTimesheet: member.featureAccess.myTimesheet,
        allTimesheets: member.featureAccess.allTimesheets,
        timeLogs: member.featureAccess.timeLogs,
        WIP: member.featureAccess.WIP,
        agedWIP: member.featureAccess.agedWIP,
        invoices: member.featureAccess.invoices,
        agedDebtors: member.featureAccess.agedDebtors,
        writeOff: member.featureAccess.writeOff,
        clientList: member.featureAccess.clientList,
        clientBreakdown: member.featureAccess.clientBreakdown,
        services: member.featureAccess.services,
        jobTemplates: member.featureAccess.jobTemplates,
        jobBuilder: member.featureAccess.jobBuilder,
        jobList: member.featureAccess.jobList,
        clientExpenses: member.featureAccess.clientExpenses,
        teamExpenses: member.featureAccess.teamExpenses,
        reports: member.featureAccess.reports,
        teamList: member.featureAccess.teamList,
        rates: member.featureAccess.rates,
        permissions: member.featureAccess.permissions,
        access: member.featureAccess.access,
        general: member.featureAccess.general,
        invoicing: member.featureAccess.invoicing,
        tags: member.featureAccess.tags,
        clientImport: member.featureAccess.clientImport,
        timeLogsImport: member.featureAccess.timeLogsImport,
        integrations: member.featureAccess.integrations,
      }));

      await updateTeamMembers({ featureAccess: featureAccessUpdates }).unwrap();
      setHasUnsavedChanges(false);
    } catch (error) {
      console.error('Failed to update team member feature access:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
            <p className="mt-2 text-sm text-gray-600">Loading team members...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-end mb-4 pt-4">
        <Button
          className={`bg-primary text-primary-foreground hover:bg-primary/90 ${!hasUnsavedChanges ? 'opacity-50 cursor-not-allowed' : ''}`}
          onClick={handleSaveChanges}
          disabled={isLoading || !hasUnsavedChanges}
        >
          {isLoading ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>

      <div className="w-full">
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[300px] p-4 font-medium text-base text-left border-r">
                    Team Member
                  </TableHead>
                  {Object.entries(systemFeatures).map(([category, { features }]) => (
                    <TableHead key={category} className="p-4 font-medium text-base text-left border-r">
                      <div className="space-y-2">
                        <div className="font-semibold">{category}</div>
                        {/* <div className="space-y-1">
                          {features.map((feature) => (
                            <div key={feature.key} className="text-xs text-gray-600">
                              {feature.label}
                            </div>
                          ))}
                        </div> */}
                      </div>
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {teamMembers.map((member) => (
                  <TableRow key={member.id}>
                    <TableCell className="p-4 border-r">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage
                            src={member.avatarUrl || getProfileImage(member.name)}
                            alt={member.name}
                          />
                          <AvatarFallback className="text-xs">{getUserInitials(member.name)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="text-base font-medium">{member.name}</div>
                          <div className="text-xs text-gray-500">{member.department}</div>
                        </div>
                        <Checkbox
                          checked={Object.values(member.featureAccess).every(value => value)}
                          onCheckedChange={() => handleSelectAllForMember(member.id)}
                          className="h-4 w-4"
                        />
                      </div>
                    </TableCell>
                    {Object.entries(systemFeatures).map(([category, { features }]) => (
                      <TableCell key={category} className="p-4 border-r">
                        <div className="space-y-2">
                          {features.map((feature) => {
                            const value = member.featureAccess[feature.key as keyof AccessTeamMember['featureAccess']];
                            return (
                              <div key={feature.key} className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <Checkbox
                                    id={`${member.id}-${feature.key}`}
                                    checked={value}
                                    onCheckedChange={(checked) =>
                                      handlePermissionChange(member.id, feature.key as keyof AccessTeamMember['featureAccess'], !!checked)
                                    }
                                    className="h-4 w-4"
                                  />
                                  <span className="text-xs text-gray-600">{feature.label}</span>
                                </div>
                                {/* <div className="text-xs font-medium text-gray-800">
                                  {value ? '✓' : '✗'}
                                </div> */}
                              </div>
                            );
                          })}
                        </div>
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Pagination Controls */}
      {pagination && (
        <div className="space-y-4 mt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Show:</span>
              <select
                value={limit}
                onChange={(e) => setLimit(Number(e.target.value))}
                className="border border-gray-300 rounded px-2 py-1 text-sm"
                disabled={isLoading}
              >
                <option value={5}>5 per page</option>
                <option value={10}>10 per page</option>
                <option value={20}>20 per page</option>
                <option value={50}>50 per page</option>
              </select>
            </div>

            <div className="text-sm text-gray-500">
              Showing {((page - 1) * limit) + 1} to {Math.min(page * limit, pagination.total)} of {pagination.total} team members
            </div>
          </div>

          {pagination.totalPages > 1 && (
            <div className="flex justify-center items-center gap-2">
              <Button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1 || isLoading}
                variant="outline"
                size="sm"
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>

              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                  let pageNum;
                  if (pagination.totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (page <= 3) {
                    pageNum = i + 1;
                  } else if (page >= pagination.totalPages - 2) {
                    pageNum = pagination.totalPages - 4 + i;
                  } else {
                    pageNum = page - 2 + i;
                  }

                  return (
                    <Button
                      key={pageNum}
                      onClick={() => setPage(pageNum)}
                      disabled={isLoading}
                      variant={page === pageNum ? "default" : "outline"}
                      size="sm"
                      className="w-8 h-8 p-0"
                    >
                      {pageNum}
                    </Button>
                  );
                })}
              </div>

              <Button
                onClick={() => setPage(p => p + 1)}
                disabled={page >= pagination.totalPages || isLoading}
                variant="outline"
                size="sm"
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AccessContent;