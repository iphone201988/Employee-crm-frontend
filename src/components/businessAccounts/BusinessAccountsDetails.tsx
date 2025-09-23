import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
// MODIFIED: Added ArrowUpDown for sorting indicators
import { Plus, ChevronLeft, ChevronRight, Search, Edit2, ArrowUpDown } from 'lucide-react';
import { getProfileImage, getUserInitials } from '@/utils/profiles';
import AddTeamMemberDialog from '../AddTeamMemberDialog';
import { useGetAllCategorieasQuery } from "@/store/categoryApi";
import {
  useUpdateTeamMembersMutation,
  useSendInviteToTeamMemberMutation,
  useGetAllCompanyMembersQuery
} from '@/store/teamApi';
import { TeamMember } from '@/types/APIs/teamApiType';
import { toast } from 'sonner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { useDebounce } from 'use-debounce';
import AddBusinessAccount from '../AddBusinessAccount';

interface DetailsContentProps {
  onUnsavedChangesChange?: (
    hasChanges: boolean,
    saveFn?: () => Promise<void>,
    discardFn?: () => void,
    tabId?: string
  ) => void;
}

const BusinessAccountsDetails: React.FC<DetailsContentProps> = ({ onUnsavedChangesChange }) => {
  // --- State Management ---
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
  const [selectedMemberForInvite, setSelectedMemberForInvite] = useState<TeamMember | null>(null);
  const [isAddMemberDialogOpen, setIsAddMemberDialogOpen] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [detailsCapacities, setDetailsCapacities] = useState<{ [key: string]: { [key: string]: number } }>({});
  
  const [searchTerm, setSearchTerm] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [debouncedSearchTerm] = useDebounce(searchTerm, 500);
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);

  const [sortField, setSortField] = useState<string>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const detailsCapacitiesRef = useRef(detailsCapacities);
  

  const { data: teamData, isLoading, isError, isFetching } = useGetAllCompanyMembersQuery
({
    page,
    limit,
    search: debouncedSearchTerm,
    departmentType: departmentFilter === 'all' ? '' : departmentFilter,
  });
  
  const [updateTeamMembers, { isLoading: isUpdating }] = useUpdateTeamMembersMutation();
  const [sendInvite, { isLoading: isSendingInvite }] = useSendInviteToTeamMemberMutation();
  const { data: categoriesData, isLoading: isLoadingCategories } = useGetAllCategorieasQuery('department');

  const teamMembers = teamData?.data?.companyMembers || [];
  const pagination = teamData?.data?.pagination;
  
  const mainDepartments: { _id: string; name: string }[] = useMemo(() => {
    const departmentList = categoriesData?.data?.departments || categoriesData?.data;
    return Array.isArray(departmentList) ? departmentList : [];
  }, [categoriesData]);

  const sortedTeamMembers = useMemo(() => {
    const sorted = [...teamMembers];
    if (sortField) {
      sorted.sort((a, b) => {
        let aValue: string | number = '';
        let bValue: string | number = '';

        if (sortField === 'name') {
          aValue = a.name;
          bValue = b.name;
        } else if (sortField === 'department') {
          aValue = a.department?.name || '';
          bValue = b.department?.name || '';
        } else if (sortField === 'email') {
          aValue = a.email;
          bValue = b.email;
        }

        if (aValue < bValue) {
          return sortDirection === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortDirection === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }
    return sorted;
  }, [teamMembers, sortField, sortDirection]);

  useEffect(() => {
    setPage(1);
  }, [limit, debouncedSearchTerm, departmentFilter]);

  useEffect(() => {
    detailsCapacitiesRef.current = detailsCapacities;
  }, [detailsCapacities]);

  const handleEditMember = (member: TeamMember) => {
    setEditingMember(member);
    setIsAddMemberDialogOpen(true);
  };
  
  const handleAddMember = () => {
    setEditingMember(null);
    setIsAddMemberDialogOpen(true);
  };
  
  const handleSendInvite = (member: TeamMember) => {
    setSelectedMemberForInvite(member);
    setIsInviteDialogOpen(true);
  };

  const handleSort = (field: string) => {
    setSortDirection(prev => sortField === field && prev === 'asc' ? 'desc' : 'asc');
    setSortField(field);
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
      {/* Search and Filter Section */}
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
          <SelectTrigger className="w-56 bg-white"><SelectValue placeholder="Filter by Department" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Departments</SelectItem>
            {mainDepartments.map((department) => (
              <SelectItem key={department._id} value={department._id}>{department.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-end gap-2 pt-4">
        <Button onClick={handleSaveUpdates} disabled={!hasUnsavedChanges || isUpdating}>
          {isUpdating ? 'Saving...' : 'Save Changes'}
        </Button>
        <Button className="flex items-center gap-2" onClick={handleAddMember}>
          <Plus className="h-4 w-4" /> Company
        </Button>
      </div>

      {/* Team Members Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-auto">
            <Table>
              <TableHeader>
                <TableRow className="h-12">
                  {/* MODIFIED: Added sorting to headers */}
                  <TableHead className="w-[200px] cursor-pointer hover:bg-muted/50" onClick={() => handleSort('name')}>
                    <div className="flex items-center gap-2">Business Name <ArrowUpDown className="h-4 w-4 text-muted-foreground" /></div>
                  </TableHead>
            
                  <TableHead className="w-[250px] cursor-pointer hover:bg-muted/50" onClick={() => handleSort('email')}>
                    <div className="flex items-center gap-2">Email Address <ArrowUpDown className="h-4 w-4 text-muted-foreground" /></div>
                  </TableHead>
                  <TableHead className="w-[150px]">Invite</TableHead>
                  <TableHead className="w-[100px] text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoadingData ? (
                  <TableRow><TableCell colSpan={13} className="text-center h-24">Loading Business Accounts...</TableCell></TableRow>
                ) : isError ? (
                  <TableRow><TableCell colSpan={13} className="text-center h-24 text-red-500">Failed to load Business Accounts.</TableCell></TableRow>
                ) : sortedTeamMembers.length === 0 ? (
                  <TableRow><TableCell colSpan={13} className="text-center h-24">No Business Accounts found.</TableCell></TableRow>
                ) : (
                  // MODIFIED: Map over sortedTeamMembers
                  sortedTeamMembers.map(member => (
                    <TableRow key={member._id} className="h-12">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={import.meta.env.VITE_BACKEND_BASE_URL + member.avatarUrl} alt={member.name} />
                            <AvatarFallback>{getUserInitials(member.name)}</AvatarFallback>
                          </Avatar>
                          {member.name}
                        </div>
                      </TableCell>
                      <TableCell>{member.email}</TableCell>
                    
                      <TableCell>
                        <Button size="sm" variant="outline" onClick={() => handleSendInvite(member)} disabled={isSendingInvite}>
                          {isSendingInvite && selectedMemberForInvite?._id === member._id ? 'Sending...' : 'Send Invite'}
                        </Button>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex gap-1 justify-center">
                          <Button variant="ghost" size="icon" onClick={() => handleEditMember(member)}>
                            <Edit2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
      {/* Pagination Controls */}
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
                <Button onClick={() => setPage(p => p + 1)} disabled={page >= pagination.totalPages || isLoadingData} variant="outline" size="sm">
                    Next <ChevronRight className="h-4 w-4" />
                </Button>
            </div>
            )}
        </div>
      )}
      
      <AddBusinessAccount
        open={isAddMemberDialogOpen}
        onOpenChange={setIsAddMemberDialogOpen}
        memberToEdit={editingMember}
      />
      
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

export default BusinessAccountsDetails;
