import { useEffect, useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { getProfileImage, getUserInitials } from '@/utils/profiles';
import { TeamMember as ApiTeamMember } from '@/types/APIs/teamApiType';
import { useGetAllTeamMembersQuery, useUpdateTeamMembersMutation } from '@/store/teamApi';

interface ServiceRatesTeamMember {
    id: string;
    name: string;
    email: string;
    avatarUrl: string;
    department: string;
    defaultRate: number;
    hourlyRate: number;
    isDefaultRateLocked: boolean;
    rates: {
        accounts: number | string;
        audits: number | string;
        bookkeeping: number | string;
        companySecretarial: number | string;
        payroll: number | string;
        vat: number | string;
        cgt: number | string;
    };
    permissions: {
        approveTimesheets: boolean;
        editServices: boolean;
        editJobBuilder: boolean;
        editJobTemplates: boolean;
    };
}

const transformApiTeamMember = (apiMember: ApiTeamMember): ServiceRatesTeamMember => {
  return {
    id: apiMember._id,
    name: apiMember.name,
    email: apiMember.email,
    avatarUrl: apiMember.avatarUrl || '',
    department: apiMember.department?.name || 'Unknown',
    defaultRate: apiMember.billableRate || apiMember.hourlyRate * 2,
    hourlyRate: apiMember.hourlyRate,
    isDefaultRateLocked: false,
    rates: {
      accounts: (apiMember as any).accounts || 0,
      audits: (apiMember as any).audits || 0,
      bookkeeping: (apiMember as any).bookkeeping || 0,
      companySecretarial: (apiMember as any).companySecretarial || 0,
      payroll: (apiMember as any).payroll || 0,
      vat: (apiMember as any).vat || 0,
      cgt: (apiMember as any).cgt || 0,
    },
    permissions: {
      approveTimesheets: apiMember.permission?.approveTimesheets || false,
      editServices: apiMember.permission?.editServices || false,
      editJobBuilder: apiMember.permission?.editJobBuilder || false,
      editJobTemplates: apiMember.permission?.editJobTemplates || false,
    }
  };
};

const ApprovalsContent = () => {
  const [teamMembers, setTeamMembers] = useState<ServiceRatesTeamMember[]>([]);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const { data: teamData, isLoading, error } = useGetAllTeamMembersQuery({ page, limit });
  const [updateTeamMembers] = useUpdateTeamMembersMutation();

  const pagination = teamData?.data?.pagination;

  useEffect(() => {
    if (teamData?.data?.teamMembers) {
      const transformedMembers = teamData.data.teamMembers.map(transformApiTeamMember);
      setTeamMembers(transformedMembers);
    }
  }, [teamData]);

  useEffect(() => {
    setPage(1);
  }, [limit]);

  const handlePermissionChange = (memberId: string, permissionKey: keyof ServiceRatesTeamMember['permissions'], checked: boolean) => {
    setTeamMembers(prev =>
      prev.map(member =>
        member.id === memberId
          ? {
            ...member,
            permissions: {
              ...member.permissions,
              [permissionKey]: checked
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

    const allChecked = Object.values(member.permissions).every(value => value);
    const newPermissions = {
      approveTimesheets: !allChecked,
      editServices: !allChecked,
      editJobBuilder: !allChecked,
      editJobTemplates: !allChecked,
    };

    setTeamMembers(prev =>
      prev.map(m =>
        m.id === memberId
          ? { ...m, permissions: newPermissions }
          : m
      )
    );
    setHasUnsavedChanges(true);
  };

  const handleSaveChanges = async () => {
    try {
      const permissionUpdates = teamMembers.map(member => ({
        userId: member.id,
        approveTimesheets: member.permissions.approveTimesheets,
        editServices: member.permissions.editServices,
        editJobBuilder: member.permissions.editJobBuilder,
        editJobTemplates: member.permissions.editJobTemplates,
      }));

      await updateTeamMembers({ permissions: permissionUpdates }).unwrap();
      setHasUnsavedChanges(false);
    } catch (error) {
      console.error('Failed to update team member permissions:', error);
    }
  };

  const permissions = [
    { key: 'approveTimesheets', label: 'Approve Timesheets' },
    { key: 'editServices', label: 'Edit Services' },
    { key: 'editJobBuilder', label: 'Edit Job Builder' },
    { key: 'editJobTemplates', label: 'Edit Job Templates' }
  ];

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
                  <TableHead className="w-[400px] p-4 font-medium text-base text-left border-r">
                    Team Member
                  </TableHead>
                  {permissions.map((permission) => (
                    <TableHead key={permission.key} className="p-4 font-medium text-base text-left border-r flex-1">
                      {permission.label}
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
                          checked={Object.values(member.permissions).every(value => value)}
                          onCheckedChange={() => handleSelectAllForMember(member.id)}
                          className="h-4 w-4"
                        />
                      </div>
                    </TableCell>
                    {permissions.map((permission) => (
                      <TableCell key={permission.key} className="p-4 border-r">
                        <div className="flex justify-start">
                          <Checkbox
                            id={`${member.id}-${permission.key}`}
                            checked={member.permissions[permission.key as keyof typeof member.permissions]}
                            onCheckedChange={(checked) =>
                              handlePermissionChange(member.id, permission.key as keyof ServiceRatesTeamMember['permissions'], !!checked)
                            }
                            className="h-4 w-4"
                          />
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

export default ApprovalsContent