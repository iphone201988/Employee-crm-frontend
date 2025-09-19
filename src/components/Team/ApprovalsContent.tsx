import { useEffect, useState, useCallback, useRef } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { getProfileImage, getUserInitials } from '@/utils/profiles';
import { ApprovalsTeamMember, transformToApprovals } from '@/types/teamMemberTypes';
import { useGetAllTeamMembersQuery, useUpdateTeamMembersMutation } from '@/store/teamApi';

const permissions = [
  { key: 'approveTimesheets', label: 'Approve Timesheets' },
  { key: 'editServices', label: 'Edit Services' },
  { key: 'editJobBuilder', label: 'Edit Job Builder' },
  { key: 'editJobTemplates', label: 'Edit Job Templates' }
];

interface ApprovalsContentProps {
  onUnsavedChangesChange?: (
    hasChanges: boolean,
    saveFn?: () => Promise<void>,
    discardFn?: () => void,
    tabId?: string
  ) => void;
}

const ApprovalsContent: React.FC<ApprovalsContentProps> = ({ onUnsavedChangesChange }) => {
  const [teamMembers, setTeamMembers] = useState<ApprovalsTeamMember[]>([]);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const teamMembersRef = useRef<ApprovalsTeamMember[]>([]);

  const { data: teamData, isLoading, error } = useGetAllTeamMembersQuery({ page, limit });
  const [updateTeamMembers] = useUpdateTeamMembersMutation();

  const pagination = teamData?.data?.pagination;

  useEffect(() => {
    if (teamData?.data?.teamMembers) {
      const transformedMembers = teamData.data.teamMembers.map(transformToApprovals);
      setTeamMembers(transformedMembers);
    }
  }, [teamData]);

  useEffect(() => {
    teamMembersRef.current = teamMembers;
  }, [teamMembers]);

  useEffect(() => {
    if (teamMembers.length > 0 && !hasUnsavedChanges) {
    }
  }, [teamMembers, hasUnsavedChanges]);

  useEffect(() => {
    setPage(1);
  }, [limit]);

  const handlePermissionChange = (memberId: string, permissionKey: keyof ApprovalsTeamMember['permissions'], checked: boolean) => {
    const originalMember = teamData?.data?.teamMembers?.find(m => m._id === memberId);
    if (!originalMember) return;

    const originalValue = originalMember.permission[permissionKey as keyof typeof originalMember.permission];

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

    const hasChanges = checked !== originalValue;

    setHasUnsavedChanges(hasChanges);

    if (onUnsavedChangesChange) {
      onUnsavedChangesChange(hasChanges, handleSaveChanges, handleDiscardChanges, 'permissions');
    }
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

    if (onUnsavedChangesChange) {
      onUnsavedChangesChange(true, handleSaveChanges, handleDiscardChanges, 'permissions');
    }
  };

  const handleSaveChanges = useCallback(async () => {

    try {

      const permissionUpdates = teamMembersRef.current.map(member => ({
        userId: member.id,
        approveTimesheets: member.permissions.approveTimesheets,
        editServices: member.permissions.editServices,
        editJobBuilder: member.permissions.editJobBuilder,
        editJobTemplates: member.permissions.editJobTemplates,
      }));


      await updateTeamMembers({ permissions: permissionUpdates }).unwrap();

      setHasUnsavedChanges(false);

      if (onUnsavedChangesChange) {
        onUnsavedChangesChange(false);
      }
    } catch (error) {
      console.error('Failed to update team member permissions:', error);
      throw error;
    }
  }, [updateTeamMembers, onUnsavedChangesChange]);

  const handleDiscardChanges = useCallback(() => {

    if (teamData?.data?.teamMembers) {
      const transformedMembers = teamData.data.teamMembers.map(transformToApprovals);
      setTeamMembers(transformedMembers);
    }
    setHasUnsavedChanges(false);

    if (onUnsavedChangesChange) {
      onUnsavedChangesChange(false);
    }
  }, [teamData, onUnsavedChangesChange]);

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
                  <TableHead className="sticky left-0 bg-white z-10 border-r w-[250px] cursor-pointer hover:bg-muted/50">
                    Team Member
                  </TableHead>
                  {permissions.map((permission) => (
                    <TableHead key={permission.key} className="sticky left-0 bg-white z-10 border-r w-[250px] cursor-pointer hover:bg-muted/50">
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
                          <AvatarImage src={import.meta.env.VITE_BACKEND_BASE_URL + member.avatarUrl || getProfileImage(member.name)} alt={member.name} />
                          <AvatarFallback>{getUserInitials(member.name)}</AvatarFallback>
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
                              handlePermissionChange(member.id, permission.key as keyof ApprovalsTeamMember['permissions'], !!checked)
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

export default ApprovalsContent;