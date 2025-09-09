import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import { ArrowUpDown } from 'lucide-react';
import { TEAM_MEMBER_NAMES, DEFAULT_SERVICE_RATES } from '@/constants/teamConstants';
import { getProfileImage, getUserInitials } from '@/utils/profiles';

import { useGetAllTeamMembersQuery, useUpdateTeamMembersMutation } from '@/store/teamApi';
interface TeamMember {
    id: string;
    name: string;
    defaultRate: number;
    isDefaultRateLocked: boolean;
    rates: {
        accounts: number | string;
        audit: number | string;
        bookkeeping: number | string;
        companySecretary: number | string;
        corporationTax: number | string;
        managementAccounts: number | string;
        payroll: number | string;
        personalTax: number | string;
        vat: number | string;
        cgt: number | string;
    };
}

const initialTeamMembers: TeamMember[] = TEAM_MEMBER_NAMES.map((name, index) => {
    const rates = { ...DEFAULT_SERVICE_RATES };

    // Add some N/A values throughout the table
    if (index === 2) { // Michael Brown
        rates.bookkeeping = 'N/A' as any;
        rates.payroll = 'N/A' as any;
    }
    if (index === 5) { // Lisa Anderson
        rates.audit = 'N/A' as any;
        rates.corporationTax = 'N/A' as any;
    }
    if (index === 8) { // Robert Thomas
        rates.companySecretary = 'N/A' as any;
        rates.cgt = 'N/A' as any;
    }
    if (index === 11) { // Amanda Lewis
        rates.personalTax = 'N/A' as any;
        rates.managementAccounts = 'N/A' as any;
    }

    // Add VAT values for all members
    if (index === 0) rates.vat = 130; // John Smith
    if (index === 1) rates.vat = 140; // Sarah Johnson
    if (index === 2) rates.vat = 120; // Michael Brown
    if (index === 3) rates.vat = 135; // Emma Wilson
    if (index === 4) rates.vat = 145; // David Wilson
    if (index === 5) rates.vat = 'N/A' as any; // Lisa Anderson
    if (index === 6) rates.vat = 125; // James Taylor
    if (index === 7) rates.vat = 150; // Jennifer White
    if (index === 8) rates.vat = 115; // Robert Thomas
    if (index === 9) rates.vat = 140; // Jessica Hall
    if (index === 10) rates.vat = 130; // Christopher Rodriguez
    if (index === 11) rates.vat = 135; // Amanda Lewis
    if (index === 12) rates.vat = 145; // Matthew Walker

    // Mix and match lock default values
    const isLocked = index % 3 === 0; // Lock every third member

    return {
        id: (index + 1).toString(),
        name,
        defaultRate: 75 + (index * 5), // Different default rates for each member
        isDefaultRateLocked: isLocked,
        rates
    };
});

const mainServices = [
    { key: 'accounts', label: 'Accounts' },
    { key: 'audit', label: 'Audit' },
    { key: 'bookkeeping', label: 'Bookkeeping' },
    { key: 'payroll', label: 'Payroll' },
    { key: 'vat', label: 'VAT' },
    { key: 'companySecretary', label: 'Company Secretarial' },
    { key: 'cgt', label: 'CGT' },
];


export const ServiceRatesContent = () => {
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
    const [sortField, setSortField] = useState<'name' | keyof typeof DEFAULT_SERVICE_RATES | null>(null);
    const [teamMembers, setTeamMembers] = useState<TeamMember[]>(initialTeamMembers);
    const [editingCell, setEditingCell] = useState<string | null>(null);
    const [editingValue, setEditingValue] = useState<string>('');
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

            // Handle N/A values - put them at the end
            if (aValue === 'N/A' && bValue === 'N/A') return 0;
            if (aValue === 'N/A') return 1;
            if (bValue === 'N/A') return -1;

            const aNum = typeof aValue === 'number' ? aValue : parseFloat(aValue.toString());
            const bNum = typeof bValue === 'number' ? bValue : parseFloat(bValue.toString());

            return sortDirection === 'asc' ? aNum - bNum : bNum - aNum;
        }
    });

    const calculateHourlyRate = (member: TeamMember) => {
        // Return 50% of the member's default rate (billable rate)
        return member.defaultRate / 2;
    };

    const handleCellSave = (memberId: string, serviceKey: string) => {
        let finalValue: number | string = editingValue.trim();

        // Allow N/A as a valid value
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
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-end pt-4">
                <Button className="flex items-center gap-2">
                    Save Changes
                </Button>
            </div>

            <Card>
                <CardContent className="p-0">
                    <div className="overflow-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="sticky left-0 border-r">
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
                                        <TableCell className="p-4 align-middle font-medium sticky left-0 border-r">
                                            <div className="flex items-center gap-3">
                                                <Avatar className="h-8 w-8">
                                                    <AvatarImage src={getProfileImage(member.name)} alt={member.name} />
                                                    <AvatarFallback>{getUserInitials(member.name)}</AvatarFallback>
                                                </Avatar>
                                                {member.name}
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
        </div>
    )
}
