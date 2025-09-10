import React, { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Plus, ChevronLeft, ChevronRight } from 'lucide-react';
import { getProfileImage, getUserInitials } from '@/utils/profiles';
import AddTeamMemberDialog from '../AddTeamMemberDialog';
import {
  useGetAllTeamMembersQuery,
  useUpdateTeamMembersMutation,
  useSendInviteToTeamMemberMutation
} from '@/store/teamApi';
import { TeamMember } from '@/types/APIs/teamApiType';
import { toast } from 'sonner';


const DetailsContent = () => {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
  const [selectedMemberForInvite, setSelectedMemberForInvite] = useState<TeamMember | null>(null);
  const [isAddMemberDialogOpen, setIsAddMemberDialogOpen] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [detailsCapacities, setDetailsCapacities] = useState<{ [key: string]: { [key: string]: number } }>({});

  const { data: teamData, isLoading, isError } = useGetAllTeamMembersQuery({ page, limit });
  const [updateTeamMembers, { isLoading: isUpdating }] = useUpdateTeamMembersMutation();
  const [sendInvite, { isLoading: isSendingInvite }] = useSendInviteToTeamMemberMutation();

  const teamMembers = teamData?.data?.teamMembers || [];
  const pagination = teamData?.data?.pagination;

  useEffect(() => {
    setPage(1);
  }, [limit]);
  const handleSendInvite = async (member: TeamMember) => {
    setSelectedMemberForInvite(member);
    setIsInviteDialogOpen(true);
  };

  const confirmSendInvite = async () => {
    if (!selectedMemberForInvite) return;
    try {
      await sendInvite({ email: selectedMemberForInvite.email }).unwrap();
      toast.success(`Invitation sent to ${selectedMemberForInvite.name}`);
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to send invite');
    } finally {
      setIsInviteDialogOpen(false);
    }
  };

  const handleCapacityChange = (memberId: string, day: string, value: string) => {
    const numValue = value === '' ? 0 : parseInt(value) || 0;
    setDetailsCapacities(prev => ({
      ...prev,
      [memberId]: {
        ...(prev[memberId] || {}),
        [day]: numValue
      }
    }));
    setHasUnsavedChanges(true);
  };

  const getCapacityValue = (member: TeamMember, day: keyof typeof member.workSchedule) => {
    return detailsCapacities[member._id]?.[day] ?? member.workSchedule[day];
  };

  const handleSaveUpdates = async () => {
    const updates = Object.entries(detailsCapacities).map(([userId, changedSchedule]) => {
      const originalMember = teamMembers.find(m => m._id === userId);
      if (!originalMember) return null;
      return {
        userId,
        workSchedule: {
          ...originalMember.workSchedule,
          ...changedSchedule
        }
      };
    }).filter(Boolean);
    if (updates.length === 0) {
      toast.info("No changes to save.");
      return;
    }
    try {
      await updateTeamMembers({ blukWeeklyHours: updates as any }).unwrap();
      toast.success("Team hours updated successfully!");
      setHasUnsavedChanges(false);
      setDetailsCapacities({});
    } catch {
      toast.error("Failed to update team hours.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-end gap-2 pt-4">
        <Button onClick={handleSaveUpdates} disabled={!hasUnsavedChanges || isUpdating}>
          {isUpdating ? 'Saving...' : 'Save Changes'}
        </Button>
        <Button className="flex items-center gap-2" onClick={() => setIsAddMemberDialogOpen(true)}>
          <Plus className="h-4 w-4" /> Team Member
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-auto">
            <Table>
              <TableHeader>
                <TableRow className="h-12">
                  <TableHead className="w-[200px]">Team Name</TableHead>
                  <TableHead className="w-[120px]">Department</TableHead>
                  <TableHead className="w-[250px]">Email Address</TableHead>
                  <TableHead className="w-[80px]">Mon</TableHead>
                  <TableHead className="w-[80px]">Tue</TableHead>
                  <TableHead className="w-[80px]">Wed</TableHead>
                  <TableHead className="w-[80px]">Thu</TableHead>
                  <TableHead className="w-[80px]">Fri</TableHead>
                  <TableHead className="w-[80px]">Sat</TableHead>
                  <TableHead className="w-[80px]">Sun</TableHead>
                  <TableHead className="w-[150px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={11} className="text-center h-24">Loading team members...</TableCell>
                  </TableRow>
                ) : isError ? (
                  <TableRow>
                    <TableCell colSpan={11} className="text-center h-24 text-red-500">Failed to load team members.</TableCell>
                  </TableRow>
                ) : teamMembers.map(member => (
                  <TableRow key={member._id} className="h-12">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={member.avatarUrl || getProfileImage(member.name)} alt={member.name} />
                          <AvatarFallback>{getUserInitials(member.name)}</AvatarFallback>
                        </Avatar>
                        {member.name}
                      </div>
                    </TableCell>
                    <TableCell>{member.department?.name || 'N/A'}</TableCell>
                    <TableCell>{member.email}</TableCell>
                    {(['monday','tuesday','wednesday','thursday','friday','saturday','sunday'] as const).map(day => (
                      <TableCell key={day}>
                        <Input
                          value={getCapacityValue(member, day)}
                          onChange={e => handleCapacityChange(member._id, day, e.target.value)}
                          className="w-16 h-8 text-sm"
                          type="number"
                          min="0"
                          max="24"
                        />
                      </TableCell>
                    ))}
                    <TableCell>
                      <Button size="sm" variant="outline" onClick={() => handleSendInvite(member)}>
                        {isSendingInvite && selectedMemberForInvite?._id === member._id ? 'Sending...' : 'Send Invite'}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

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
                disabled={isLoading || isUpdating}
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
                disabled={page === 1 || isLoading || isUpdating}
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
                      disabled={isLoading || isUpdating}
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
                disabled={page >= pagination.totalPages || isLoading || isUpdating}
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

      <AddTeamMemberDialog open={isAddMemberDialogOpen} onOpenChange={setIsAddMemberDialogOpen} />

      <Dialog open={isInviteDialogOpen} onOpenChange={setIsInviteDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Send Invite</DialogTitle></DialogHeader>
          <p>Send an invitation email to <strong>{selectedMemberForInvite?.name}</strong>?</p>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setIsInviteDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={confirmSendInvite} disabled={isSendingInvite}>
              {isSendingInvite ? 'Sending...' : 'Send Invite'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DetailsContent;
