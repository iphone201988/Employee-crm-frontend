import React, { useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Plus } from 'lucide-react';
import { getProfileImage, getUserInitials } from '@/utils/profiles';
import AddTeamMemberDialog from '../AddTeamMemberDialog';
import { useGetAllTeamMembersQuery, useUpdateTeamMembersMutation } from '@/store/teamApi';
import { TeamMember } from '@/types/APIs/teamApiType';

const DetailsContent = () => {
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);
    const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
    const [selectedMemberForInvite, setSelectedMemberForInvite] = useState<TeamMember | null>(null);
    const [isAddMemberDialogOpen, setIsAddMemberDialogOpen] = useState(false);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const [detailsCapacities, setDetailsCapacities] = useState<{ [key: string]: { [key: string]: number } }>({});
  
    const { data: teamData, isLoading, isError } = useGetAllTeamMembersQuery({ page, limit });
    
    const teamMembers = teamData?.data?.teamMembers || [];
    const pagination = teamData?.data?.pagination;


    const handleSendInvite = (member: TeamMember) => {
        setSelectedMemberForInvite(member);
        setIsInviteDialogOpen(true);
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

    const handleSaveUpdates = () => {
        console.log('Saving capacity updates:', detailsCapacities);
        setHasUnsavedChanges(false);
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-end gap-2 pt-4">
                <Button onClick={handleSaveUpdates} disabled={!hasUnsavedChanges}>
                    Save Changes
                </Button>
                <Button
                    className="flex items-center gap-2"
                    onClick={() => setIsAddMemberDialogOpen(true)}
                >
                    <Plus className="h-4 w-4" />
                    Team Member
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
                                    <TableRow><TableCell colSpan={11} className="text-center h-24">Loading team members...</TableCell></TableRow>
                                ) : isError ? (
                                    <TableRow><TableCell colSpan={11} className="text-center h-24 text-red-500">Failed to load team members.</TableCell></TableRow>
                                ) : (
                                    teamMembers.map((member) => (
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
                                            {(['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const).map((day) => (
                                                <TableCell key={day}>
                                                    <Input
                                                        value={getCapacityValue(member, day)}
                                                        onChange={(e) => handleCapacityChange(member._id, day, e.target.value)}
                                                        className="w-16 h-8 text-sm"
                                                        type="number"
                                                        min="0"
                                                        max="24"
                                                    />
                                                </TableCell>
                                            ))}
                                            <TableCell>
                                                <Button size="sm" variant="outline" onClick={() => handleSendInvite(member)}>
                                                    Send Invite
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

            {/* Pagination Controls */}
            <div className="flex justify-center items-center gap-4">
                <Button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1 || isLoading}>
                    Previous
                </Button>
                <span>Page {page} of {pagination?.totalPages || 1}</span>
                <Button onClick={() => setPage(p => p + 1)} disabled={page >= (pagination?.totalPages || 1) || isLoading}>
                    Next
                </Button>
            </div>

            <AddTeamMemberDialog
                open={isAddMemberDialogOpen}
                onOpenChange={setIsAddMemberDialogOpen}
            />

            <Dialog open={isInviteDialogOpen} onOpenChange={setIsInviteDialogOpen}>
                <DialogContent>
                    <DialogHeader><DialogTitle>Send Invite</DialogTitle></DialogHeader>
                    <p>Send an invitation email to **{selectedMemberForInvite?.name}**?</p>
                    <div className="flex justify-end gap-2 mt-4">
                        <Button variant="outline" onClick={() => setIsInviteDialogOpen(false)}>Cancel</Button>
                        <Button onClick={() => { setIsInviteDialogOpen(false); }}>
                            Send Invite
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default DetailsContent;
