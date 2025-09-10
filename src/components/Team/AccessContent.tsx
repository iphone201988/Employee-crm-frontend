import { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { getProfileImage, getUserInitials } from '@/utils/profiles';
import { TeamMember as ApiTeamMember } from '@/types/APIs/teamApiType';
import { useGetAllTeamMembersQuery, useUpdateTeamMembersMutation } from '@/store/teamApi';

interface ServiceRatesTeamMember {
    id: string;
    name: string;
    email: string;
    avatarUrl: string;
    department: string;
    defaultRate: number;
    hourlyRate: number;
    isDefaultRateLocked: boolean;
    rates: {
        accounts: number | string;
        audits: number | string;
        bookkeeping: number | string;
        companySecretarial: number | string;
        payroll: number | string;
        vat: number | string;
        cgt: number | string;
    };
    featureAccess: {
        myTimesheet: boolean;
        allTimesheets: boolean;
        timeLogs: boolean;
        WIP: boolean;
        agedWIP: boolean;
        invoices: boolean;
        agedDebtors: boolean;
        writeOff: boolean;
        clientList: boolean;
        clientBreakdown: boolean;
        services: boolean;
        jobTemplates: boolean;
        jobBuilder: boolean;
        jobList: boolean;
        clientExpenses: boolean;
        teamExpenses: boolean;
        reports: boolean;
        teamList: boolean;
        rates: boolean;
        permissions: boolean;
        access: boolean;
        general: boolean;
        invoicing: boolean;
        tags: boolean;
        clientImport: boolean;
        timeLogsImport: boolean;
        integrations: boolean;
    };
}

const transformApiTeamMember = (apiMember: ApiTeamMember): ServiceRatesTeamMember => {
    return {
        id: apiMember._id,
        name: apiMember.name,
        email: apiMember.email,
        avatarUrl: apiMember.avatarUrl || '',
        department: apiMember.department?.name || 'Unknown',
        defaultRate: apiMember.billableRate || apiMember.hourlyRate * 2,
        hourlyRate: apiMember.hourlyRate,
        isDefaultRateLocked: false,
        rates: {
            accounts: (apiMember as any).accounts || 0,
            audits: (apiMember as any).audits || 0,
            bookkeeping: (apiMember as any).bookkeeping || 0,
            companySecretarial: (apiMember as any).companySecretarial || 0,
            payroll: (apiMember as any).payroll || 0,
            vat: (apiMember as any).vat || 0,
            cgt: (apiMember as any).cgt || 0,
        },
        featureAccess: {
            myTimesheet: (apiMember.featureAccess as any)?.myTimesheet || false,
            allTimesheets: (apiMember.featureAccess as any)?.allTimesheets || false,
            timeLogs: (apiMember.featureAccess as any)?.timeLogs || false,
            WIP: (apiMember.featureAccess as any)?.WIP || false,
            agedWIP: (apiMember.featureAccess as any)?.agedWIP || false,
            invoices: (apiMember.featureAccess as any)?.invoices || false,
            agedDebtors: (apiMember.featureAccess as any)?.agedDebtors || false,
            writeOff: (apiMember.featureAccess as any)?.writeOff || false,
            clientList: (apiMember.featureAccess as any)?.clientList || false,
            clientBreakdown: (apiMember.featureAccess as any)?.clientBreakdown || false,
            services: (apiMember.featureAccess as any)?.services || false,
            jobTemplates: (apiMember.featureAccess as any)?.jobTemplates || false,
            jobBuilder: (apiMember.featureAccess as any)?.jobBuilder || false,
            jobList: (apiMember.featureAccess as any)?.jobList || false,
            clientExpenses: (apiMember.featureAccess as any)?.clientExpenses || false,
            teamExpenses: (apiMember.featureAccess as any)?.teamExpenses || false,
            reports: (apiMember.featureAccess as any)?.reports || false,
            teamList: (apiMember.featureAccess as any)?.teamList || false,
            rates: (apiMember.featureAccess as any)?.rates || false,
            permissions: (apiMember.featureAccess as any)?.permissions || false,
            access: (apiMember.featureAccess as any)?.access || false,
            general: (apiMember.featureAccess as any)?.general || false,
            invoicing: (apiMember.featureAccess as any)?.invoicing || false,
            tags: (apiMember.featureAccess as any)?.tags || false,
            clientImport: (apiMember.featureAccess as any)?.clientImport || false,
            timeLogsImport: (apiMember.featureAccess as any)?.timeLogsImport || false,
            integrations: (apiMember.featureAccess as any)?.integrations || false,
        }
    };
};
const systemFeatures = {
    'Time': {
        features: [
            { key: 'myTimesheet', label: 'My Timesheet' },
            { key: 'allTimesheets', label: 'All Timesheets' },
            { key: 'timeLogs', label: 'Time Logs' }
        ]
    },
    'WIP & Debtors': {
        features: [
            { key: 'WIP', label: 'WIP' },
            { key: 'agedWIP', label: 'Aged WIP' },
            { key: 'invoices', label: 'Invoices' },
            { key: 'agedDebtors', label: 'Aged Debtors' },
            { key: 'writeOff', label: 'Write Off' }
        ]
    },
    'Clients': {
        features: [
            { key: 'clientList', label: 'Client List' },
            { key: 'clientBreakdown', label: 'Client Breakdown' }
        ]
    },
    'Jobs': {
        features: [
            { key: 'services', label: 'Services' },
            { key: 'jobTemplates', label: 'Job Templates' },
            { key: 'jobBuilder', label: 'Job Builder' },
            { key: 'jobList', label: 'Job List' }
        ]
    },
    'Expenses': {
        features: [
            { key: 'clientExpenses', label: 'Client Expenses' },
            { key: 'teamExpenses', label: 'Team Expenses' }
        ]
    },
    'Reports': {
        features: [
            { key: 'reports', label: 'Reports' }
        ]
    },
    'Team': {
        features: [
            { key: 'teamList', label: 'Team List' },
            { key: 'rates', label: 'Rates' },
            { key: 'permissions', label: 'Permissions' },
            { key: 'access', label: 'Access' }
        ]
    },
    'Settings': {
        features: [
            { key: 'general', label: 'General' },
            { key: 'invoicing', label: 'Invoicing' },
            { key: 'tags', label: 'Tags' },
            { key: 'clientImport', label: 'Client Import' },
            { key: 'timeLogsImport', label: 'Time Logs Import' },
            { key: 'integrations', label: 'Integrations' }
        ]
    }
};
const AccessContent = () => {
    const [teamMembers, setTeamMembers] = useState<ServiceRatesTeamMember[]>([]);
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

    const { data: teamData, isLoading, error } = useGetAllTeamMembersQuery({ page, limit });
    const [updateTeamMembers] = useUpdateTeamMembersMutation();

    const pagination = teamData?.data?.pagination;

    // Transform API data when it's loaded
    useEffect(() => {
        if (teamData?.data?.teamMembers) {
            const transformedMembers = teamData.data.teamMembers.map(transformApiTeamMember);
            setTeamMembers(transformedMembers);
        }
    }, [teamData]);

    useEffect(() => {
        setPage(1);
    }, [limit]);

    const handlePermissionChange = (memberId: string, featureKey: keyof ServiceRatesTeamMember['featureAccess'], checked: boolean) => {
        setTeamMembers(prev =>
            prev.map(member =>
                member.id === memberId
                    ? {
                        ...member,
                        featureAccess: {
                            ...member.featureAccess,
                            [featureKey]: checked
                        }
                    }
                    : member
            )
        );
        setHasUnsavedChanges(true);
    };

    const handleSelectAllForMember = (memberId: string) => {
        const member = teamMembers.find(m => m.id === memberId);
        if (!member) return;

        const allChecked = Object.values(member.featureAccess).every(value => value);
        const newFeatureAccess = Object.keys(member.featureAccess).reduce((acc, key) => {
            acc[key as keyof ServiceRatesTeamMember['featureAccess']] = !allChecked;
            return acc;
        }, {} as ServiceRatesTeamMember['featureAccess']);

        setTeamMembers(prev =>
            prev.map(m =>
                m.id === memberId
                    ? { ...m, featureAccess: newFeatureAccess }
                    : m
            )
        );
        setHasUnsavedChanges(true);
    };

    const handleSaveChanges = async () => {
        try {
            const featureAccessUpdates = teamMembers.map(member => ({
                userId: member.id,
                myTimesheet: member.featureAccess.myTimesheet,
                allTimesheets: member.featureAccess.allTimesheets,
                timeLogs: member.featureAccess.timeLogs,
                WIP: member.featureAccess.WIP,
                agedWIP: member.featureAccess.agedWIP,
                invoices: member.featureAccess.invoices,
                agedDebtors: member.featureAccess.agedDebtors,
                writeOff: member.featureAccess.writeOff,
                clientList: member.featureAccess.clientList,
                clientBreakdown: member.featureAccess.clientBreakdown,
                services: member.featureAccess.services,
                jobTemplates: member.featureAccess.jobTemplates,
                jobBuilder: member.featureAccess.jobBuilder,
                jobList: member.featureAccess.jobList,
                clientExpenses: member.featureAccess.clientExpenses,
                teamExpenses: member.featureAccess.teamExpenses,
                reports: member.featureAccess.reports,
                teamList: member.featureAccess.teamList,
                rates: member.featureAccess.rates,
                permissions: member.featureAccess.permissions,
                access: member.featureAccess.access,
                general: member.featureAccess.general,
                invoicing: member.featureAccess.invoicing,
                tags: member.featureAccess.tags,
                clientImport: member.featureAccess.clientImport,
                timeLogsImport: member.featureAccess.timeLogsImport,
                integrations: member.featureAccess.integrations,
            }));

            await updateTeamMembers({ featureAccess: featureAccessUpdates }).unwrap();
            setHasUnsavedChanges(false);
        } catch (error) {
            console.error('Failed to update team member feature access:', error);
        }
    };

    // Show loading state
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
                                    <TableHead className="w-[200px] p-4 font-medium text-base text-left border-r">
                                        Team Member
                                    </TableHead>
                                    {Object.keys(systemFeatures).map((category) => (
                                        <TableHead key={category} className="p-4 font-medium text-base text-left border-r">
                                            {category}
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
                                                    <AvatarImage
                                                        src={member.avatarUrl || getProfileImage(member.name)}
                                                        alt={member.name}
                                                    />
                                                    <AvatarFallback className="text-xs">{getUserInitials(member.name)}</AvatarFallback>
                                                </Avatar>
                                                <div>
                                                    <div className="text-base font-medium">{member.name}</div>
                                                    <div className="text-xs text-gray-500">{member.department}</div>
                                                </div>
                                                <Checkbox
                                                    checked={Object.values(member.featureAccess).every(value => value)}
                                                    onCheckedChange={() => handleSelectAllForMember(member.id)}
                                                    className="h-4 w-4"
                                                />
                                            </div>
                                        </TableCell>
                                        {Object.keys(systemFeatures).map((category) => (
                                            <TableCell key={category} className="p-4 border-r">
                                                <div className="space-y-2">
                                                    {systemFeatures[category as keyof typeof systemFeatures].features.map((feature) => (
                                                        <div key={feature.key} className="flex items-center gap-2">
                                                            <Checkbox
                                                                id={`${member.id}-${category}-${feature.key}`}
                                                                checked={member.featureAccess[feature.key as keyof typeof member.featureAccess]}
                                                                onCheckedChange={(checked) =>
                                                                    handlePermissionChange(member.id, feature.key as keyof ServiceRatesTeamMember['featureAccess'], !!checked)
                                                                }
                                                                className="h-4 w-4"
                                                            />
                                                            <Label
                                                                htmlFor={`${member.id}-${category}-${feature.key}`}
                                                                className="text-sm cursor-pointer flex-1 font-normal"
                                                            >
                                                                {feature.label}
                                                            </Label>
                                                        </div>
                                                    ))}
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

export default AccessContent