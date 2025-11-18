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

interface ServiceType {
    _id: string;
    name: string;
    key: string;
}

interface ServiceFee {
    jobId: string;
    fee: number;
    _id: string;
}

interface ServiceRatesTeamMember {
    id: string;
    name: string;
    avatarUrl?: string;
    hourlyRate: number;
    defaultRate: number;
    isDefaultRateLocked: boolean;
    rates: { [key: string]: number | 'N/A' };
}

const transformToServiceRates = (member: any, serviceTypes: ServiceType[]): ServiceRatesTeamMember => {
    const rates: { [key: string]: number | 'N/A' } = {};
    serviceTypes.forEach(serviceType => {
        const jobFee = member.jobFees?.find((fee: ServiceFee) => fee.jobId === serviceType._id);
        rates[serviceType.key] = jobFee ? jobFee.fee : 'N/A';
    });

    return {
        id: member._id,
        name: member.name,
        avatarUrl: member.avatarUrl,
        hourlyRate: member.hourlyRate || 0,
        defaultRate: member.billableRate || 0,
        // The lock state should be based on the 'status' field.
        isDefaultRateLocked: member.isLocked === true,
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
    const { data: teamData, isLoading: isLoadingTeam, isFetching: isFetchingTeam, refetch } = useGetAllTeamMembersQuery({ page, limit });
    const [updateTeamMembers, { isLoading: isUpdating }] = useUpdateTeamMembersMutation();

    const mainServiceTypes: ServiceType[] = useMemo(() => {
        const serviceList = categoriesData?.data?.jobs || [];
        return Array.isArray(serviceList) ? serviceList.map((service: any) => ({
            _id: service._id,
            name: service.name,
            key: service.name.toLowerCase().replace(/\s/g, ''),
        })) : [];
    }, [categoriesData]);

    const pagination = teamData?.data?.pagination;

    useEffect(() => {
        if (teamData?.data?.teamMembers && mainServiceTypes.length > 0 && !isFetchingTeam) {
            const transformedMembers = teamData.data.teamMembers.map(member => transformToServiceRates(member, mainServiceTypes));
            setTeamMembers(transformedMembers);
            // Reset unsaved changes when data is re-fetched.
            setHasUnsavedChanges({});
        }
    }, [teamData, mainServiceTypes, isFetchingTeam]);

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

            if (aValue === 'N/A') return 1;
            if (bValue === 'N/A') return -1;
            
            return sortDirection === 'asc' ? (aValue as number) - (bValue as number) : (bValue as number) - (aValue as number);
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
                const jobFees = mainServiceTypes
                    .map(serviceType => {
                        const rate = member.rates[serviceType.key];
                        return rate !== 'N/A' ? { jobId: serviceType._id, fee: Number(rate) } : null;
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
    }, [teamMembers, mainServiceTypes, updateTeamMembers, onUnsavedChangesChange, hasUnsavedChanges]);
    
    const handleDiscardChanges = useCallback(() => {
        refetch(); // Refetch original data to discard changes
        setHasUnsavedChanges({});
        onUnsavedChangesChange?.(false);
    }, [refetch, onUnsavedChangesChange]);

    const handleCellSave = (memberId: string, fieldKey: string) => {
        const value = parseFloat(editingValue);
        const finalValue: number | 'N/A' = isNaN(value) ? 'N/A' : value;

        setTeamMembers(prev => prev.map(member => {
            if (member.id !== memberId) return member;
            
            const updatedMember = { ...member };
            if (fieldKey === 'hourlyRate') {
                updatedMember.hourlyRate = isNaN(value) ? member.hourlyRate : value;
            } else if (fieldKey === 'defaultRate') {
                updatedMember.defaultRate = isNaN(value) ? member.defaultRate : value;
            } else {
                updatedMember.rates = { ...member.rates, [fieldKey]: finalValue };
            }
            return updatedMember;
        }));

        setEditingCell(null);
        setHasUnsavedChanges(prev => ({ ...prev, [memberId]: true }));
        onUnsavedChangesChange?.(true, handleSaveChanges, handleDiscardChanges, 'rates');
    };

    const toggleDefaultRateLock = async (memberId: string) => {
        const currentMember = teamMembers.find(m => m.id === memberId);
        if (!currentMember) return;
        const newLockState = !currentMember.isDefaultRateLocked;
        const newStatus = newLockState ? true : false;

        try {
            await updateTeamMembers({ singleTeamMenber: { userId: memberId, isLocked: newStatus } }).unwrap();
            setTeamMembers(prev => prev.map(member =>
                member.id === memberId ? { ...member, isDefaultRateLocked: newLockState } : member
            ));
            toast.success(`Lock status updated successfully.`);
        } catch (error) {
            console.error("Failed to update lock status:", error);
            toast.error("Failed to update lock status.");
        }
    };
    
    const handleKeyDown = (e: React.KeyboardEvent, memberId: string, fieldKey: string) => {
        if (e.key === 'Enter') handleCellSave(memberId, fieldKey);
        if (e.key === 'Escape') setEditingCell(null);
    };

    const handleCellClick = (memberId: string, fieldKey: string, currentValue: number | string) => {
        const member = teamMembers.find(m => m.id === memberId);
        // Prevent editing service rates when the row is locked
        if (member?.isDefaultRateLocked && fieldKey !== 'hourlyRate' && fieldKey !== 'defaultRate') {
            return;
        }
        setEditingCell(`${memberId}-${fieldKey}`);
        setEditingValue(currentValue === 'N/A' ? '' : String(currentValue));
    };

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
                                <TableRow className="h-12 !bg-[#edecf4] text-[#381980]">
                                    <TableHead
                                        className="sticky left-0  z-10 border-r w-[250px] cursor-pointer hover:bg-muted/50"
                                        onClick={() => handleSort('name')}
                                    >
                                        <div className="flex items-center gap-2">
                                            Team Member
                                        <ArrowUpDown className="h-3 w-3" />
                                        </div>
                                    </TableHead>
                                    <TableHead
                                        className="w-[150px] cursor-pointer hover:bg-muted/50"
                                        onClick={() => handleSort('hourlyRate')}
                                    >
                                        <div className="flex items-center gap-2">
                                            Hourly Rate
                                             <ArrowUpDown className="h-3 w-3" />
                                        </div>
                                    </TableHead>
                                    <TableHead
                                        className="w-[170px] cursor-pointer hover:bg-muted/50"
                                        onClick={() => handleSort('defaultRate')}
                                    >
                                        <div className="flex items-center gap-2">
                                           Billable Rate
                                         <ArrowUpDown className="h-3 w-3" />
                                        </div>
                                    </TableHead>
                                    <TableHead className="w-[100px]">Lock</TableHead>
                                    {mainServiceTypes.map((service) => (
                                        <TableHead
                                            key={service.key}
                                            className="w-[150px] cursor-pointer hover:bg-muted/50"
                                            onClick={() => handleSort(service.key)}
                                        >
                                            <div className="flex items-center gap-2">
                                                {service.name}
                                                 <ArrowUpDown className="h-3 w-3" />
                                            </div>
                                        </TableHead>
                                    ))}
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading ? (
                                    <TableRow>
                                        <TableCell colSpan={mainServiceTypes.length + 4} className="h-24 text-center">
                                            <div className="flex justify-center items-center">
                                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                                                <p className="ml-3">Loading members...</p>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : sortedTeamMembers.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={mainServiceTypes.length + 4} className="h-24 text-center">
                                            No team members found.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    sortedTeamMembers.map((member) => {
                                        const renderCell = (fieldKey: 'hourlyRate' | 'defaultRate' | string, rateValue: number | 'N/A') => {
                                            const isEditing = editingCell === `${member.id}-${fieldKey}`;
                                            const isLocked = member.isDefaultRateLocked && fieldKey !== 'hourlyRate' && fieldKey !== 'defaultRate';

                                            if (isLocked) {
                                                return <div className="p-2 text-gray-400">-</div>;
                                            }
                                            
                                            return isEditing ? (
                                                <Input
                                                    type="number"
                                                    value={editingValue}
                                                    onChange={(e) => setEditingValue(e.target.value)}
                                                    onBlur={() => handleCellSave(member.id, fieldKey)}
                                                    onKeyDown={(e) => handleKeyDown(e, member.id, fieldKey)}
                                                    className="w-24 h-8 text-sm"
                                                    autoFocus
                                                    placeholder="N/A"
                                                />
                                            ) : (
                                                <div onClick={() => handleCellClick(member.id, fieldKey, rateValue)} className="cursor-pointer p-2 rounded hover:bg-gray-100 min-h-[36px] flex items-center">
                                                    {rateValue === 'N/A' ? <Badge variant="secondary">N/A</Badge> : `€${Number(rateValue).toFixed(2)}`}
                                                </div>
                                            );
                                        };

                                        return (
                                            <TableRow key={member.id} className="h-12 hover:bg-gray-50">
                                                <TableCell className="sticky left-0 bg-white z-10 border-r font-medium py-4">
                                                    <div className="flex items-center gap-3">
                                                        <Avatar className="h-8 w-8">
                                                            <AvatarImage src={import.meta.env.VITE_BACKEND_BASE_URL + member.avatarUrl || getProfileImage(member.name)} alt={member.name} />
                                                            <AvatarFallback>{getUserInitials(member.name)}</AvatarFallback>
                                                        </Avatar>
                                                        {member.name}
                                                    </div>
                                                </TableCell>
                                                <TableCell className='py-3'>{renderCell('hourlyRate', member.hourlyRate)}</TableCell>
                                                <TableCell className='py-3'>{renderCell('defaultRate', member.defaultRate)}</TableCell>
                                                <TableCell className='py-3'>
                                                    <Switch 
                                                        checked={member.isDefaultRateLocked} 
                                                        onCheckedChange={() => toggleDefaultRateLock(member.id)}
                                                        disabled={isUpdating}
                                                    />
                                                </TableCell>
                                                {mainServiceTypes.map((service) => (
                                                    <TableCell  className='py-3' key={service.key}>
                                                        {renderCell(service.key, member.rates[service.key])}
                                                    </TableCell>
                                                ))}
                                            </TableRow>
                                        );
                                    })
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
                            <select value={limit} onChange={(e) => setLimit(Number(e.target.value))} className="border border-gray-300 rounded px-2 py-1 text-sm" disabled={isLoading}>
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
                            <Button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1 || isLoading} variant="outline" size="sm">
                                <ChevronLeft className="h-4 w-4" /> Previous
                            </Button>
                            <Button onClick={() => setPage(p => p + 1)} disabled={page >= pagination.totalPages || isLoading} variant="outline" size="sm">
                                Next <ChevronRight className="h-4 w-4" />
                            </Button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
