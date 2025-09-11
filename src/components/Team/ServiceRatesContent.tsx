import React, { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import { ArrowUpDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { DEFAULT_SERVICE_RATES } from '@/constants/teamConstants';
import { getProfileImage, getUserInitials } from '@/utils/profiles';
import { TeamMember as ApiTeamMember } from '@/types/APIs/teamApiType';
import { transformToServiceRates } from '@/types/teamMemberTypes';
import { useGetAllTeamMembersQuery, useUpdateTeamMembersMutation } from '@/store/teamApi';


const mainServices = [
    { key: 'accounts', label: 'Accounts' },
    { key: 'audits', label: 'Audits' },
    { key: 'bookkeeping', label: 'Bookkeeping' },
    { key: 'payroll', label: 'Payroll' },
    { key: 'vat', label: 'VAT' },
    { key: 'companySecretarial', label: 'Company Secretarial' },
    { key: 'cgt', label: 'CGT' },
];


export const ServiceRatesContent = () => {
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
    const [sortField, setSortField] = useState<'name' | keyof typeof DEFAULT_SERVICE_RATES | null>(null);
    const [teamMembers, setTeamMembers] = useState<ServiceRatesTeamMember[]>([]);
    const [editingCell, setEditingCell] = useState<string | null>(null);
    const [editingValue, setEditingValue] = useState<string>('');
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);

    const { data: teamData, isLoading, error } = useGetAllTeamMembersQuery({ page, limit });
    const [updateTeamMembers] = useUpdateTeamMembersMutation();

    const pagination = teamData?.data?.pagination;

    useEffect(() => {
        if (teamData?.data?.teamMembers) {
            const transformedMembers = teamData.data.teamMembers.map(transformToServiceRates);
            setTeamMembers(transformedMembers);
        }
    }, [teamData]);

    useEffect(() => {
        setPage(1);
    }, [limit]);

    const handleSort = (field: 'name' | keyof typeof DEFAULT_SERVICE_RATES) => {
        if (sortField === field) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortDirection(field === 'name' ? 'asc' : 'desc');
        }
    };

    const sortedTeamMembers = [...teamMembers].sort((a, b) => {
        if (!sortField) return 0;

        if (sortField === 'name') {
            const aValue = a.name;
            const bValue = b.name;
            return sortDirection === 'asc'
                ? aValue.localeCompare(bValue)
                : bValue.localeCompare(aValue);
        } else {
            const aValue = a.rates[sortField];
            const bValue = b.rates[sortField];

            if (aValue === 'N/A' && bValue === 'N/A') return 0;
            if (aValue === 'N/A') return 1;
            if (bValue === 'N/A') return -1;

            const aNum = typeof aValue === 'number' ? aValue : parseFloat(aValue.toString());
            const bNum = typeof bValue === 'number' ? bValue : parseFloat(bValue.toString());

            return sortDirection === 'asc' ? aNum - bNum : bNum - aNum;
        }
    });

    const calculateHourlyRate = (member: ServiceRatesTeamMember) => {
        return member.hourlyRate;
    };

    const handleSaveChanges = async () => {
        try {
            const rateUpdates = teamMembers.map(member => ({
                userId: member.id,
                accounts: member.rates.accounts,
                audits: member.rates.audits,
                bookkeeping: member.rates.bookkeeping,
                companySecretarial: member.rates.companySecretarial,
                payroll: member.rates.payroll,
                vat: member.rates.vat,
                cgt: member.rates.cgt,
                hourlyRate: member.hourlyRate,
                billableRate: member.defaultRate,
            }));

            await updateTeamMembers({ rates: rateUpdates }).unwrap();
            setHasUnsavedChanges(false);

        } catch (error) {
            console.error('Failed to update team member rates:', error);
        }
    };

    const handleLockUnlock = async(userId: string,status:string) => {
        try {
            const payload = {
                singleTeamMenber:{
                    userId,
                    status
                }
            }
            await updateTeamMembers(payload).unwrap();
        } catch (error) {
        console.error('Failed to update team member rates:', error); 
        }
    }

    const handleCellSave = (memberId: string, serviceKey: string) => {
        let finalValue: number | string = editingValue.trim();

        if (finalValue.toLowerCase() === 'n/a' || finalValue === '') {
            finalValue = 'N/A';
        } else {
            const numericValue = parseFloat(finalValue);
            finalValue = isNaN(numericValue) ? 'N/A' : numericValue;
        }

        setTeamMembers(prev =>
            prev.map(member =>
                member.id === memberId
                    ? {
                        ...member,
                        rates: {
                            ...member.rates,
                            [serviceKey]: finalValue
                        }
                    }
                    : member
            )
        );
        setEditingCell(null);
        setEditingValue('');
        setHasUnsavedChanges(true);
    };

    const toggleDefaultRateLock = (memberId: string) => {
        setTeamMembers(prev =>
            prev.map(member =>
                member.id === memberId
                    ? { ...member, isDefaultRateLocked: !member.isDefaultRateLocked }
                    : member
            )
        );
    };

    const handleKeyDown = (e: React.KeyboardEvent, memberId: string, serviceKey: string) => {
        if (e.key === 'Enter') {
            handleCellSave(memberId, serviceKey);
        } else if (e.key === 'Escape') {
            setEditingCell(null);
            setEditingValue('');
        }
    };
    const handleCellClick = (memberId: string, serviceKey: string, currentValue: number | string) => {
        const cellId = `${memberId}-${serviceKey}`;
        setEditingCell(cellId);
        setEditingValue(currentValue === 'N/A' ? 'N/A' : currentValue.toString());
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
            <div className="flex items-center justify-end pt-4">
                <Button
                    className={`flex items-center gap-2 ${!hasUnsavedChanges ? 'opacity-50 cursor-not-allowed' : ''}`}
                    onClick={handleSaveChanges}
                    disabled={isLoading || !hasUnsavedChanges}
                >
                    {isLoading ? 'Saving...' : 'Save Changes'}
                </Button>
            </div>

            <Card>
                <CardContent className="p-0">
                    <div className="overflow-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="sticky left-0 border-r opacity-100 bg-opacity-100">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleSort('name')}
                                            className="h-8 px-1 font-medium"
                                        >
                                            Team Member
                                            <ArrowUpDown className="ml-1 h-4 w-4" />
                                        </Button>
                                    </TableHead>
                                    <TableHead className="h-12 text-left align-middle border-r min-w-[120px]">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-8 px-1 font-medium"
                                        >
                                            Hourly Rate
                                        </Button>
                                    </TableHead>
                                    <TableHead className="h-12 text-left align-middle border-r min-w-[120px]">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-8 px-1 font-medium"
                                        >
                                            Billable Rate
                                        </Button>
                                    </TableHead>
                                    <TableHead className="h-12 text-left align-middle border-r min-w-[120px]">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-8 px-1 font-medium"
                                        >
                                            Lock
                                        </Button>
                                    </TableHead>
                                    {mainServices.map((service) => (
                                        <TableHead key={service.key} className="min-w-[120px] border-r">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleSort(service.key as keyof typeof DEFAULT_SERVICE_RATES)}
                                                className="h-8 px-1 font-medium"
                                            >
                                                {service.label}
                                                <ArrowUpDown className="ml-1 h-4 w-4" />
                                            </Button>
                                        </TableHead>
                                    ))}
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {sortedTeamMembers.map((member) => (
                                    <TableRow key={member.id} className="border-b transition-colors">
                                        <TableCell className="p-4 align-middle font-medium sticky left-0 border-r bg-opacity-100 opacity-100">
                                            <div className="flex items-center gap-3">
                                                <Avatar className="h-8 w-8">
                                                    <AvatarImage
                                                        src={member.avatarUrl || getProfileImage(member.name)}
                                                        alt={member.name}
                                                    />
                                                    <AvatarFallback>{getUserInitials(member.name)}</AvatarFallback>
                                                </Avatar>
                                                <div>
                                                    <div className="font-medium">{member.name}</div>
                                                    {/* <div className="text-xs text-gray-500">{member.department}</div> */}
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell className="p-4 align-middle border-r">
                                            <span className="font-medium">€{calculateHourlyRate(member).toFixed(2)}</span>
                                        </TableCell>
                                        <TableCell className="p-4 align-middle border-r">
                                            <span className="font-medium">€{member.defaultRate.toFixed(2)}</span>
                                        </TableCell>
                                        <TableCell className="p-4 align-middle border-r">
                                            <div className="flex items-center gap-2">
                                                <Switch
                                                    checked={member.isDefaultRateLocked}
                                                    onCheckedChange={() => toggleDefaultRateLock(member.id)}
                                                    onClick={() => handleLockUnlock( member.id,member.isDefaultRateLocked?'inActive':'active')}
                                                />
                                            </div>
                                        </TableCell>
                                        {mainServices.map((service) => {
                                            const cellId = `${member.id}-${service.key}`;
                                            const isEditing = editingCell === cellId;
                                            const rate = member.rates[service.key as keyof typeof member.rates];

                                            return (
                                                <TableCell key={service.key} className="p-4 align-middle border-r">
                                                    {!member.isDefaultRateLocked ? (
                                                        isEditing ? (
                                                            <Input
                                                                value={editingValue}
                                                                onChange={(e) => setEditingValue(e.target.value)}
                                                                onBlur={() => handleCellSave(member.id, service.key)}
                                                                onKeyDown={(e) => handleKeyDown(e, member.id, service.key)}
                                                                className="w-16 h-6 text-sm"
                                                                placeholder="Enter rate or N/A"
                                                                autoFocus
                                                                style={{ position: 'relative' }}
                                                            />
                                                        ) : (
                                                            <div
                                                                className="cursor-pointer p-2 rounded"
                                                                onClick={() => handleCellClick(member.id, service.key, rate)}
                                                            >
                                                                {rate === 'N/A' ? (
                                                                    <Badge variant="secondary" className="text-xs">N/A</Badge>
                                                                ) : (
                                                                    `€${typeof rate === 'number' ? rate.toFixed(2) : rate}`
                                                                )}
                                                            </div>
                                                        )
                                                    ) : (
                                                        <div className="p-2">
                                                            {/* Empty cell when default rate is locked */}
                                                        </div>
                                                    )}
                                                </TableCell>
                                            );
                                        })}
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>

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
    )
}
