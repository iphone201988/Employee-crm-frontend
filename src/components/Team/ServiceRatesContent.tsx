import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import { ArrowUpDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { getProfileImage, getUserInitials } from '@/utils/profiles';
import { useGetAllTeamMembersQuery, useUpdateTeamMembersMutation } from '@/store/teamApi';
import { useGetAllCategorieasQuery } from "@/store/categoryApi";

import { toast } from 'sonner';


interface JobType { _id: string; name: string; key: string; }
interface JobFee { jobId: string; fee: number; _id: string; }
interface ServiceRatesTeamMember {
    id: string;
    name: string;
    avatarUrl?: string;
    hourlyRate: number;
    defaultRate: number;
    isDefaultRateLocked: boolean;
    rates: { [key: string]: number | 'N/A' };
}


const transformToServiceRates = (member: any, jobTypes: JobType[]): ServiceRatesTeamMember => {
    const rates: { [key: string]: number | 'N/A' } = {};
    jobTypes.forEach(jobType => {
        const jobFee = member.jobFees?.find((fee: JobFee) => fee.jobId === jobType._id);
        rates[jobType.key] = jobFee ? jobFee.fee : 'N/A';
    });
    return {
        id: member._id,
        name: member.name,
        avatarUrl: member.avatarUrl,
        hourlyRate: member.hourlyRate || 0,
        defaultRate: member.billableRate || 0,
        isDefaultRateLocked: member.status === 'active',
        rates,
    };
};


interface ServiceRatesContentProps {
    onUnsavedChangesChange?: (hasChanges: boolean, saveFn?: () => Promise<void>, discardFn?: () => void, tabId?: string) => void;
}

export const ServiceRatesContent: React.FC<ServiceRatesContentProps> = ({ onUnsavedChangesChange }) => {
   
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
    const [sortField, setSortField] = useState<string | null>('name');
    const [teamMembers, setTeamMembers] = useState<ServiceRatesTeamMember[]>([]);
    const [editingCell, setEditingCell] = useState<string | null>(null);
    const [editingValue, setEditingValue] = useState<string>('');
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState<{ [key: string]: boolean }>({});
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);
    

    const { data: categoriesData, isLoading: isLoadingCategories } = useGetAllCategorieasQuery('job');
    const { data: departmentData } = useGetAllCategorieasQuery("department");
    const { data: teamData, isLoading: isLoadingTeam, isFetching: isFetchingTeam } = useGetAllTeamMembersQuery({ page, limit });
    const [updateTeamMembers, { isLoading: isUpdating }] = useUpdateTeamMembersMutation();


    const mainJobTypes: JobType[] = useMemo(() => {
        const jobList = categoriesData?.data?.jobs || categoriesData?.data;
        return Array.isArray(jobList) ? jobList.map((job: any) => ({
            _id: job._id,
            name: job.name,
            key: job.name.toLowerCase().replace(/\s/g, ''),
        })) : [];
    }, [categoriesData]);

    const pagination = teamData?.data?.pagination;


    useEffect(() => {
        if (teamData?.data?.teamMembers && mainJobTypes.length > 0 && !isFetchingTeam) {
            const transformedMembers = teamData.data.teamMembers.map(member => transformToServiceRates(member, mainJobTypes));
            setTeamMembers(transformedMembers);
            setHasUnsavedChanges({});
        }
    }, [teamData, mainJobTypes, isFetchingTeam]);

    useEffect(() => { setPage(1); }, [limit]);

    const sortedTeamMembers = useMemo(() => {

        return [...teamMembers].sort((a, b) => {
            if (!sortField) return 0;
            if (sortField === 'name') return sortDirection === 'asc' ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name);
            
            const getSortValue = (member: ServiceRatesTeamMember, field: string) => {
                if (field === 'hourlyRate') return member.hourlyRate;
                if (field === 'defaultRate') return member.defaultRate;
                return member.rates[field];
            };

            const aValue = getSortValue(a, sortField);
            const bValue = getSortValue(b, sortField);

            if (aValue === 'N/A' || bValue === 'N/A') {
                if (aValue === bValue) return 0;
                return aValue === 'N/A' ? 1 : -1;
            }
            return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
        });
    }, [teamMembers, sortField, sortDirection]);


    const handleSort = (field: string) => {
        setSortDirection(prev => sortField === field && prev === 'asc' ? 'desc' : 'asc');
        setSortField(field);
    };

    const handleSaveChanges = useCallback(async () => {
        const changedMemberIds = Object.keys(hasUnsavedChanges);
        if (changedMemberIds.length === 0) {
            toast.info("No changes to save.");
            return;
        }

        const rateUpdates = teamMembers
            .filter(member => changedMemberIds.includes(member.id))
            .map(member => {
                const jobFees = mainJobTypes
                    .map(jobType => {
                        const rate = member.rates[jobType.key];
                        return rate !== 'N/A' ? { jobId: jobType._id, fee: rate } : null;
                    })
                    .filter(fee => fee !== null) as { jobId: string; fee: number }[];

       
                return {
                    userId: member.id,
                    hourlyRate: member.hourlyRate,
                    billableRate: member.defaultRate,
                    jobFees,
                };
            });

        try {
            await updateTeamMembers({ rates: rateUpdates }).unwrap();
            toast.success("Rates updated successfully!");
            setHasUnsavedChanges({});
            onUnsavedChangesChange?.(false);
        } catch (error) {
            console.error("Failed to update rates:", error);
            toast.error("Failed to update rates.");
        }
    }, [teamMembers, mainJobTypes, updateTeamMembers, onUnsavedChangesChange, hasUnsavedChanges]);
    
    const handleDiscardChanges = useCallback(() => {
        if (teamData?.data?.teamMembers && mainJobTypes.length > 0) {
            setTeamMembers(teamData.data.teamMembers.map(member => transformToServiceRates(member, mainJobTypes)));
        }
        setHasUnsavedChanges({});
        onUnsavedChangesChange?.(false);
    }, [teamData, mainJobTypes, onUnsavedChangesChange]);

    const handleCellSave = (memberId: string, fieldKey: string) => {
        const value = parseFloat(editingValue);
        const finalValue: number | 'N/A' = isNaN(value) ? (fieldKey === 'hourlyRate' || fieldKey === 'defaultRate' ? 0 : 'N/A') : value;

        setTeamMembers(prev => prev.map(member => {
            if (member.id !== memberId) return member;

            if (fieldKey === 'hourlyRate') return { ...member, hourlyRate: finalValue as number };
            if (fieldKey === 'defaultRate') return { ...member, defaultRate: finalValue as number };
            
            return { ...member, rates: { ...member.rates, [fieldKey]: finalValue } };
        }));

        setEditingCell(null);
        setHasUnsavedChanges(prev => ({ ...prev, [memberId]: true }));
        onUnsavedChangesChange?.(true, handleSaveChanges, handleDiscardChanges, 'rates');
    };

    const toggleDefaultRateLock = (memberId: string) => {
        const currentMember = teamMembers.find(m => m.id === memberId);
        if (!currentMember) return;
        const newLockState = !currentMember.isDefaultRateLocked;
        const status = newLockState ? 'active' : 'inActive';
        updateTeamMembers({ singleTeamMenber: { userId: memberId, status }})
            .unwrap()
            .then(() => {
                setTeamMembers(prev => prev.map(member =>
                    member.id === memberId ? { ...member, isDefaultRateLocked: newLockState } : member
                ));
                toast.success(`Lock status updated.`);
            }).catch(() => toast.error("Failed to update lock status."));
    };
    
    const handleKeyDown = (e: React.KeyboardEvent, memberId: string, fieldKey: string) => {
        if (e.key === 'Enter') handleCellSave(memberId, fieldKey);
        if (e.key === 'Escape') setEditingCell(null);
    };

    const handleCellClick = (memberId: string, fieldKey: string, currentValue: number | string) => {
        setEditingCell(`${memberId}-${fieldKey}`);
        setEditingValue(currentValue === 'N/A' ? '' : String(currentValue));
    };

    // --- Render ---
    if (isLoadingTeam || isLoadingCategories) {
        return <div className="flex items-center justify-center py-20"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-gray-900"></div><p className="ml-4 text-gray-600">Loading data...</p></div>;
    }
    
    const isLoading = isUpdating || isFetchingTeam;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-end pt-4">
                <Button onClick={handleSaveChanges} disabled={isLoading || Object.keys(hasUnsavedChanges).length === 0}>
                    {isUpdating ? 'Saving...' : 'Save Changes'}
                </Button>
            </div>
            <Card>
                <CardContent className="p-0">
                    <div className="overflow-auto">
                        <Table>
                             <TableHeader>
                                <TableRow>
                                    <TableHead className="sticky left-0 bg-white z-10 border-r min-w-[250px]">
                                        <Button variant="ghost" size="sm" className="font-medium" onClick={() => handleSort('name')}>Team Member <ArrowUpDown className="ml-2 h-4 w-4" /></Button>
                                    </TableHead>
                                    <TableHead><Button variant="ghost" size="sm" className="font-medium" onClick={() => handleSort('hourlyRate')}>Hourly Rate <ArrowUpDown className="ml-2 h-4 w-4" /></Button></TableHead>
                                    <TableHead><Button variant="ghost" size="sm" className="font-medium" onClick={() => handleSort('defaultRate')}>Billable Rate <ArrowUpDown className="ml-2 h-4 w-4" /></Button></TableHead>
                                    <TableHead>Lock</TableHead>
                                    {mainJobTypes.map((job) => (
                                        <TableHead key={job.key} className="min-w-[150px]">
                                            <Button variant="ghost" size="sm" className="font-medium" onClick={() => handleSort(job.key)}>{job.name} <ArrowUpDown className="ml-2 h-4 w-4" /></Button>
                                        </TableHead>
                                    ))}
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {sortedTeamMembers.map((member) => {
                                    const renderCell = (fieldKey: 'hourlyRate' | 'defaultRate' | string, rateValue: number | 'N/A') => {
                                        const isEditing = editingCell === `${member.id}-${fieldKey}`;
                                        return isEditing ? (
                                            <Input
                                                type="text" value={editingValue} onChange={(e) => setEditingValue(e.target.value)}
                                                onBlur={() => handleCellSave(member.id, fieldKey)} onKeyDown={(e) => handleKeyDown(e, member.id, fieldKey)}
                                                className="w-24 h-8" autoFocus
                                            />
                                        ) : (
                                            <div onClick={() => handleCellClick(member.id, fieldKey, rateValue)} className="cursor-pointer p-2 rounded hover:bg-gray-100">
                                                {rateValue === 'N/A' ? <Badge variant="secondary">N/A</Badge> : `€${Number(rateValue).toFixed(2)}`}
                                            </div>
                                        );
                                    };

                                    return (
                                        <TableRow key={member.id}>
                                            <TableCell className="sticky left-0 bg-white z-10 border-r font-medium">
                                                <div className="flex items-center gap-3">
                                                    <Avatar className="h-8 w-8">
                                                        <AvatarImage src={member.avatarUrl || getProfileImage(member.name)} alt={member.name} />
                                                        <AvatarFallback>{getUserInitials(member.name)}</AvatarFallback>
                                                    </Avatar>
                                                    {member.name}
                                                </div>
                                            </TableCell>
                                            <TableCell>{renderCell('hourlyRate', member.hourlyRate)}</TableCell>
                                            <TableCell>{renderCell('defaultRate', member.defaultRate)}</TableCell>
                                            <TableCell><Switch checked={member.isDefaultRateLocked} onCheckedChange={() => toggleDefaultRateLock(member.id)}/></TableCell>
                                            {mainJobTypes.map((job) => (
                                                <TableCell key={job.key}>
                                                    {!member.isDefaultRateLocked ? renderCell(job.key, member.rates[job.key]) : <div className="p-2 text-gray-400">-</div>}
                                                </TableCell>
                                            ))}
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
            {pagination && pagination.totalPages > 1 && (
                 <div className="flex justify-center items-center gap-4 mt-6">
                    <Button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1 || isLoading}>Previous</Button>
                    <span>Page {page} of {pagination.totalPages}</span>
                    <Button onClick={() => setPage(p => p + 1)} disabled={page >= pagination.totalPages || isLoading}>Next</Button>
                </div>
            )}
        </div>
    );
};
