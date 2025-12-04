import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Plus, ChevronLeft, ChevronRight, Search, Edit2, ArrowUpDown, Settings, MoreVertical, ArrowLeft } from 'lucide-react';
import { skipToken } from '@reduxjs/toolkit/query/react';
import {
  useUpdateTeamMembersMutation,
  useSendInviteToTeamMemberMutation,
  useGetAllCompanyMembersQuery,
  useGetCompanyByIdQuery,
  useGetTeamMembersByCompanyIdQuery
} from '@/store/teamApi';
import { useGetCurrentUserQuery } from '@/store/authApi';
import { useLoginAsGuestMutation } from '@/store/companiesApi';
import { useSuperAdminContext } from '@/context/SuperAdminContext';
import { TeamMember } from '@/types/APIs/teamApiType';
import { toast } from 'sonner';
import { useDebounce } from 'use-debounce';
import AddBusinessAccount from '../AddBusinessAccount';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { getUserInitials } from '@/utils/profiles';
import AccessApproval from '../AccessApproval';
import UserPermissions from '../UserPermissions';

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
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);

  // --- View and Selection State ---
  const [showInfo, setShowInfo] = useState(false);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<'company' | 'team' | 'access'>('company');

  // --- Search and Sort State ---
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm] = useDebounce(searchTerm, 500);
  const [sortField, setSortField] = useState<string>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // --- API Queries ---
  const { data: companiesData, isLoading, isError, isFetching } = useGetAllCompanyMembersQuery({
    page,
    limit,
    search: debouncedSearchTerm,
  });

  const { data: companyDetailsData, isLoading: isLoadingCompanyDetails } = useGetCompanyByIdQuery(
    selectedCompanyId ? { companyId: selectedCompanyId } : skipToken
  );

  const { data: teamMembersByCompanyData, isLoading: isLoadingTeamMembers } = useGetTeamMembersByCompanyIdQuery(
    selectedCompanyId ? { companyId: selectedCompanyId, page: 1, limit: 10, search: '' } : skipToken
  );

  const [sendInvite, { isLoading: isSendingInvite }] = useSendInviteToTeamMemberMutation();
  const [loginAsGuest, { isLoading: isLoggingAsGuest }] = useLoginAsGuestMutation();
  const { switchToCompanyMode } = useSuperAdminContext();

  const companies = companiesData?.data?.companyMembers || [];
  const pagination = companiesData?.data?.pagination;

  const sortedCompanies = useMemo(() => {
    const sorted = [...companies];
    if (sortField) {
      sorted.sort((a, b) => {
        const aValue = a[sortField as keyof TeamMember] || '';
        const bValue = b[sortField as keyof TeamMember] || '';
        if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return sorted;
  }, [companies, sortField, sortDirection]);

  useEffect(() => {
    setPage(1);
  }, [limit, debouncedSearchTerm]);

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

  const handleShowMore = (companyId: string) => {
    setSelectedCompanyId(companyId);
    setActiveSection('company');
    setShowInfo(true);
  };

  const handleGoBack = () => {
    setShowInfo(false);
    setSelectedCompanyId(null);
    setSearchTerm('');
  };

  const handleAccessCompany = async (companyId: string) => {
    try {
      // Use the companyId directly as userId
      const result = await loginAsGuest({ userId: companyId }).unwrap();
      toast.success('Successfully accessed company account');
      switchToCompanyMode(result.data.token);
      // Navigate to the main dashboard
      window.location.href = '/';
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to access company account');
    }
  };

  const isLoadingData = isLoading || isFetching;

  if (showInfo) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleGoBack}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Go Back
          </Button>
          <Button
            size="sm"
            onClick={() => setActiveSection('company')}
            className={`h-8 px-3 text-xs ${activeSection === 'company' ? 'bg-purple-600 text-white' : 'bg-gray-200 text-gray-800'}`}
          >
            Company Info
          </Button>
          <Button
            size="sm"
            onClick={() => setActiveSection('team')}
            className={`h-8 px-3 text-xs ${activeSection === 'team' ? 'bg-purple-600 text-white' : 'bg-gray-200 text-gray-800'}`}
          >
            Team Members
          </Button>
          <Button
            size="sm"
            onClick={() => selectedCompanyId && handleAccessCompany(selectedCompanyId)}
            disabled={isLoggingAsGuest}
            className={`h-8 px-3 text-xs ${activeSection === 'access' ? 'bg-purple-600 text-white' : 'bg-gray-200 text-gray-800'}`}
          >
            {isLoggingAsGuest ? 'Accessing...' : 'Access Company'}
          </Button>
        </div>

        {activeSection === 'company' && (
          <>
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-4">Company Details</h3>
                {isLoadingCompanyDetails ? (
                  <p>Loading company information...</p>
                ) : companyDetailsData?.data?.company ? (
                  <div className="space-y-2">
                    <p><strong>Company Name:</strong> {companyDetailsData.data.company.name}</p>
                    <p><strong>Email:</strong> {companyDetailsData.data.company.email}</p>
                  </div>
                ) : (
                  <p>Could not load company details.</p>
                )}
              </CardContent>
            </Card>
            {/* <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-4">User Access Permissions</h3>
                {selectedCompanyId ? (
                  <UserPermissions companyData = {companyDetailsData?.data?.company}  />
                ) : (
                  <p>No company selected.</p>
                )}
              </CardContent>
            </Card> */}
          </>
        )}

        {activeSection === 'team' && (
           <Card>
            <CardContent className="p-0">
              <div className="overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoadingTeamMembers ? (
                      <TableRow><TableCell colSpan={2} className="text-center h-24">Loading team members...</TableCell></TableRow>
                    ) : teamMembersByCompanyData?.data?.teamMembers?.length === 0 ? (
                      <TableRow><TableCell colSpan={2} className="text-center h-24">No team members found.</TableCell></TableRow>
                    ) : (
                      teamMembersByCompanyData?.data?.teamMembers.map(member => (
                        <TableRow key={member._id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Avatar className="h-8 w-8">
                                <AvatarImage src={member.avatarUrl} alt={member.name} />
                                <AvatarFallback>{getUserInitials(member.name)}</AvatarFallback>
                              </Avatar>
                              {member.name}
                            </div>
                          </TableCell>
                          <TableCell>{member.email}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  // The rest of the component remains the same...
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 bg-white p-4 rounded-lg shadow-sm">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search by company name, email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-white"
          />
        </div>
      </div>

      <div className="flex items-center justify-end gap-2 pt-4">
        <Button className="flex items-center gap-2" onClick={handleAddMember}>
          <Plus className="h-4 w-4" /> Company
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-auto">
            <Table>
              <TableHeader>
                <TableRow className="h-12">
                  <TableHead className="w-[200px] cursor-pointer hover:bg-muted/50" onClick={() => handleSort('name')}>
                    <div className="flex items-center gap-2">Company Name <ArrowUpDown className="h-4 w-4 text-muted-foreground" /></div>
                  </TableHead>
                  <TableHead className="w-[250px] cursor-pointer hover:bg-muted/50" onClick={() => handleSort('email')}>
                    <div className="flex items-center gap-2">Email Address <ArrowUpDown className="h-4 w-4 text-muted-foreground" /></div>
                  </TableHead>
                  <TableHead className="w-[250px]">Total Team Members</TableHead>
                  <TableHead className="w-[150px]">Invite</TableHead>
                  <TableHead className="w-[100px] text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoadingData ? (
                  <TableRow><TableCell colSpan={5} className="text-center h-24">Loading Business Accounts...</TableCell></TableRow>
                ) : isError ? (
                  <TableRow><TableCell colSpan={5} className="text-center h-24 text-red-500">Failed to load Business Accounts.</TableCell></TableRow>
                ) : sortedCompanies.length === 0 ? (
                  <TableRow><TableCell colSpan={5} className="text-center h-24">No Business Accounts found.</TableCell></TableRow>
                ) : (
                  sortedCompanies.map(member => (
                    <TableRow key={member._id} className="h-12">
                      <TableCell>
                        <div className="flex items-center gap-3">{member.name}</div>
                      </TableCell>
                      <TableCell>{member.email}</TableCell>
                      <TableCell>{member.teamMembersCount}</TableCell>
                      <TableCell>
                        <Button size="sm" variant="outline" onClick={() => handleSendInvite(member)} disabled={isSendingInvite}>
                          {isSendingInvite && selectedMemberForInvite?._id === member._id ? 'Sending...' : 'Send Invite'}
                        </Button>
                      </TableCell>
                      <TableCell className="text-center">
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <Settings className="w-4 h-4" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-40">
                            <div className="grid gap-2">
                              <Button variant="outline" size="sm" className="w-full justify-start" onClick={() => handleEditMember(member)}>
                                <Edit2 className="mr-2 h-4 w-4" /> Edit
                              </Button>
                              <Button variant="outline" size="sm" className="w-full justify-start" onClick={() => handleShowMore(member._id)}>
                                <MoreVertical className="mr-2 h-4 w-4" /> Show More
                              </Button>
                            </div>
                          </PopoverContent>
                        </Popover>
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
                <option value={100}>100 per page</option>
                <option value={250}>250 per page</option>
                <option value={500}>500 per page</option>
                <option value={1000}>1000 per page</option>
              </select>
            </div>
            <div className="text-sm text-gray-500">
              Showing {pagination.total > 0 ? ((page - 1) * limit) + 1 : 0} to {Math.min(page * limit, pagination.total)} of {pagination.total} companies
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
