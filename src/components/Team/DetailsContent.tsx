import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Plus, ChevronLeft, ChevronRight, Search } from 'lucide-react';
import { getProfileImage, getUserInitials } from '@/utils/profiles';
import AddTeamMemberDialog from '../AddTeamMemberDialog';
import { useGetAllCategorieasQuery } from "@/store/categoryApi";
import {
  useGetAllTeamMembersQuery,
  useUpdateTeamMembersMutation,
  useSendInviteToTeamMemberMutation
} from '@/store/teamApi';
import { TeamMember } from '@/types/APIs/teamApiType';
import { toast } from 'sonner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { useDebounce } from 'use-debounce'; // Assuming you have this hook


interface DetailsContentProps {
  onUnsavedChangesChange?: (
    hasChanges: boolean,
    saveFn?: () => Promise<void>,
    discardFn?: () => void,
    tabId?: string
  ) => void;
}


const DetailsContent: React.FC<DetailsContentProps> = ({ onUnsavedChangesChange }) => {
  // --- State Management ---
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
  const [selectedMemberForInvite, setSelectedMemberForInvite] = useState<TeamMember | null>(null);
  const [isAddMemberDialogOpen, setIsAddMemberDialogOpen] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [detailsCapacities, setDetailsCapacities] = useState<{ [key: string]: { [key: string]: number } }>({});
  
  // State for search and filter
  const [searchTerm, setSearchTerm] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('all'); // 'all' or a department ID
  const [debouncedSearchTerm] = useDebounce(searchTerm, 500);


  // Refs for debounced/stable values
  const detailsCapacitiesRef = useRef(detailsCapacities);
  
  // --- RTK Query Hooks ---
  const { data: teamData, isLoading, isError, isFetching } = useGetAllTeamMembersQuery({
    page,
    limit,
    search: debouncedSearchTerm,
    departmentType: departmentFilter === 'all' ? '' : departmentFilter,
  });
  
  const [updateTeamMembers, { isLoading: isUpdating }] = useUpdateTeamMembersMutation();
  const [sendInvite, { isLoading: isSendingInvite }] = useSendInviteToTeamMemberMutation();
  const { data: categoriesData, isLoading: isLoadingCategories } = useGetAllCategorieasQuery('department');


  // --- Data Extraction ---
  const teamMembers = teamData?.data?.teamMembers || [];
  const pagination = teamData?.data?.pagination;


  const mainDepartments: { _id: string; name: string }[] = useMemo(() => {
    const departmentList = categoriesData?.data?.departments || categoriesData?.data;
    return Array.isArray(departmentList) ? departmentList : [];
  }, [categoriesData]);


  // --- Effects ---
  useEffect(() => {
    // Reset to first page when filters change
    setPage(1);
  }, [limit, debouncedSearchTerm, departmentFilter]);


  useEffect(() => {
    detailsCapacitiesRef.current = detailsCapacities;
  }, [detailsCapacities]);
  
  // --- Handlers ---
  const handleSendInvite = (member: TeamMember) => {
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


  const handleCapacityChange = (memberId: string, day: keyof TeamMember['workSchedule'], value: string) => {
    // MODIFIED: Use parseFloat to allow decimal values. Default to 0 if input is empty or invalid.
    const numValue = value === '' ? 0 : parseFloat(value) || 0;
    const originalMember = teamMembers.find(m => m._id === memberId);
    if (!originalMember) return;


    const originalValue = originalMember.workSchedule[day];


    setDetailsCapacities(prev => {
        const newCaps = { ...prev };
        if (!newCaps[memberId]) newCaps[memberId] = {};
        newCaps[memberId][day] = numValue;
        return newCaps;
    });


    const hasChangesNow = Object.keys(detailsCapacitiesRef.current).length > 0 || numValue !== originalValue;
    setHasUnsavedChanges(hasChangesNow);
    if (onUnsavedChangesChange) {
      onUnsavedChangesChange(hasChangesNow, handleSaveUpdates, handleDiscardChanges, 'teamList');
    }
  };
  
  const getCapacityValue = (member: TeamMember, day: keyof TeamMember['workSchedule']) => {
    return detailsCapacities[member._id]?.[day] ?? member.workSchedule[day];
  };


  const handleSaveUpdates = useCallback(async () => {
    const updates = Object.entries(detailsCapacitiesRef.current).map(([userId, changedSchedule]) => ({
      userId,
      workSchedule: {
        ...teamMembers.find(m => m._id === userId)?.workSchedule,
        ...changedSchedule,
      },
    })).filter(Boolean);


    if (updates.length === 0) {
      toast.info("No changes to save.");
      return;
    }
    try {
      await updateTeamMembers({ blukWeeklyHours: updates as any }).unwrap();
      toast.success("Team hours updated successfully!");
      setHasUnsavedChanges(false);
      setDetailsCapacities({});
      onUnsavedChangesChange?.(false);
    } catch (error) {
      toast.error("Failed to update team hours.");
      throw error;
    }
  }, [updateTeamMembers, onUnsavedChangesChange, teamMembers]);


  const handleDiscardChanges = useCallback(() => {
    setDetailsCapacities({});
    setHasUnsavedChanges(false);
    onUnsavedChangesChange?.(false);
  }, [onUnsavedChangesChange]);


  const isLoadingData = isLoading || isFetching || isLoadingCategories;


  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 bg-white p-4 rounded-lg shadow-sm">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search by name, email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-white"
          />
        </div>


        <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
          <SelectTrigger className="w-56 bg-white">
            <SelectValue placeholder="Filter by Department" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Departments</SelectItem>
            {mainDepartments.map((department) => (
              <SelectItem key={department._id} value={department._id}>
                {department.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>


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
                {isLoadingData ? (
                  <TableRow><TableCell colSpan={12} className="text-center h-24">Loading team members...</TableCell></TableRow>
                ) : isError ? (
                  <TableRow><TableCell colSpan={12} className="text-center h-24 text-red-500">Failed to load team members.</TableCell></TableRow>
                ) : teamMembers.length === 0 ? (
                  <TableRow><TableCell colSpan={12} className="text-center h-24">No team members found.</TableCell></TableRow>
                ) : (
                  teamMembers.map(member => (
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
                      {(['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const).map(day => (
                        <TableCell key={day}>
                          <Input
                            value={getCapacityValue(member, day)}
                            onChange={e => handleCapacityChange(member._id, day, e.target.value)}
                            className="w-16 h-8 text-sm"
                            type="number"
                            min="0"
                            max="24"
                            // MODIFIED: Add step to allow decimal input
                            step="0.5"
                          />
                        </TableCell>
                      ))}
                      <TableCell>
                        <Button size="sm" variant="outline" onClick={() => handleSendInvite(member)} disabled={isSendingInvite}>
                          {isSendingInvite && selectedMemberForInvite?._id === member._id ? 'Sending...' : 'Send Invite'}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>


      {pagination && pagination.totalPages > 0 && (
        <div className="space-y-4 mt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Show:</span>
              <select value={limit} onChange={(e) => setLimit(Number(e.target.value))} className="border border-gray-300 rounded px-2 py-1 text-sm" disabled={isLoadingData}>
                <option value={5}>5 per page</option>
                <option value={10}>10 per page</option>
                <option value={20}>20 per page</option>
                <option value={50}>50 per page</option>
              </select>
            </div>
            <div className="text-sm text-gray-500">
              Showing {pagination.total > 0 ? ((page - 1) * limit) + 1 : 0} to {Math.min(page * limit, pagination.total)} of {pagination.total} team members
            </div>
          </div>
          {pagination.totalPages > 1 && (
            <div className="flex justify-center items-center gap-2">
              <Button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1 || isLoadingData} variant="outline" size="sm">
                <ChevronLeft className="h-4 w-4" /> Previous
              </Button>
              {/* Pagination logic here */}
              <Button onClick={() => setPage(p => p + 1)} disabled={page >= pagination.totalPages || isLoadingData} variant="outline" size="sm">
                Next <ChevronRight className="h-4 w-4" />
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
            <Button variant="outline" onClick={() => setIsInviteDialogOpen(false)}>Cancel</Button>
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
