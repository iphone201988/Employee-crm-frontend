import React, { useState, useMemo, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Lock, Unlock, ChevronLeft, ChevronRight, ChevronDown, Check } from 'lucide-react';
import { DashboardCard, DashboardGrid } from "@/components/ui/dashboard-card";
import { Switch } from "@/components/ui/switch";
import ClientNameLink from './ClientNameLink';
import ServiceChangesLogDialog from './ServiceChangesLogDialog';
// --- Using the existing RTK Query hook names as requested ---
import { useGetClientServicesQuery, useUpdateClientServicesMutation } from '@/store/clientApi';
import { useGetAllCategorieasQuery } from '@/store/categoryApi';
import { toast } from 'sonner';
import { useDebounce } from 'use-debounce';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

const ServicesTab = () => {
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);
    const [searchTerm, setSearchTerm] = useState('');
    const [businessTypeFilter, setBusinessTypeFilter] = useState<Set<string>>(new Set());
    const [debouncedSearchTerm] = useDebounce(searchTerm, 500);

    const [jobCategoriesLocked, setJobCategoriesLocked] = useState(true);
    const [showServiceLog, setShowServiceLog] = useState(false);

    const [pendingChanges, setPendingChanges] = useState<{ [clientId: string]: { [jobCategoryId: string]: boolean } }>({});

    const selectedBusinessTypeIds = useMemo(() => Array.from(businessTypeFilter), [businessTypeFilter]);

    // --- Using useGetClientServicesQuery as requested ---
    const { data: clientServicesData, isLoading, isError, isFetching }: any = useGetClientServicesQuery({
        page,
        limit,
        search: debouncedSearchTerm,
        businessTypeIds: selectedBusinessTypeIds.length ? selectedBusinessTypeIds : undefined,
        businessTypeId: selectedBusinessTypeIds.length === 1 ? selectedBusinessTypeIds[0] : undefined,
    });

    // --- Using useUpdateClientServicesMutation as requested ---
    const [updateClientServices, { isLoading: isUpdating }] = useUpdateClientServicesMutation();

    const { data: businessTypesData, isLoading: isBusinessTypesLoading } = useGetAllCategorieasQuery("bussiness");
    const businessTypeOptions = useMemo(() => businessTypesData?.data?.bussiness ?? [], [businessTypesData]);

    const toggleBusinessType = (value: string) => {
        setBusinessTypeFilter(prev => {
            const next = new Set(prev);
            if (next.has(value)) {
                next.delete(value);
            } else {
                next.add(value);
            }
            return next;
        });
    };

    const selectedBusinessTypeLabel = useMemo(() => {
        if (businessTypeFilter.size === 0) return 'All Business Types';
        const selectedNames = businessTypeOptions
            .filter((type: any) => businessTypeFilter.has(type._id))
            .map((type: any) => type.name);
        if (selectedNames.length === 0) return 'All Business Types';
        return selectedNames.length <= 2 ? selectedNames.join(', ') : `${selectedNames.length} Selected`;
    }, [businessTypeFilter, businessTypeOptions]);

    useEffect(() => {
        setPage(1);
    }, [businessTypeFilter]);

    // The internal logic is updated to handle the new API response structure (clients, jobCategories, etc.)
    const { clients, jobCategories, pagination, breakdown, filteredCounts } = useMemo(() => {
        const clients = clientServicesData?.data || [];
        const jobCategories = clientServicesData?.breakdown || [];
        const pagination = clientServicesData?.pagination;
        const breakdown = clientServicesData?.breakdown || [];
        const filteredCounts = clientServicesData?.filteredCounts || [];
        return { clients, jobCategories, pagination, breakdown, filteredCounts };
    }, [clientServicesData]);

    useEffect(() => {
        setPendingChanges({});
    }, [clientServicesData]);

    const handleJobCategoryChange = (clientId: string, jobCategoryId: string, isEnabled: boolean) => {
        if (jobCategoriesLocked) return;

        setPendingChanges(prev => {
            const clientChanges = { ...(prev[clientId] || {}) };
            clientChanges[jobCategoryId] = isEnabled;
            return { ...prev, [clientId]: clientChanges };
        });
    };

    const isJobCategoryChecked = (client: any, jobCategoryId: string) => {
        if (pendingChanges[client._id] && pendingChanges[client._id][jobCategoryId] !== undefined) {
            return pendingChanges[client._id][jobCategoryId];
        }
        return !!client[jobCategoryId];
    };

    const handleSaveChanges = async () => {
        const changesToSubmit = Object.entries(pendingChanges).map(([clientId, jobCategoryChanges]) => {
            const originalClient = clients.find(c => c._id === clientId);
            if (!originalClient) return null;

            const enabledJobCategoryIds = new Set<string>(
                jobCategories
                    .filter(jc => isJobCategoryChecked({ ...originalClient, ...jobCategoryChanges }, jc.jobCategoryId))
                    .map(jc => jc.jobCategoryId)
            );
            
            // NOTE: The payload key is updated to 'jobCategoryIds' to match the new data model.
            // If your mutation still expects the old 'servicesTds' key, you should change 'jobCategoryIds' back to 'servicesTds'.
            return {
                clientId,
                jobCategoriesIds: Array.from(enabledJobCategoryIds),
            };
        }).filter(Boolean);

        if (changesToSubmit.length === 0) {
            toast.info("No changes to save.");
            return;
        }

        try {
            // --- Calling the existing updateClientServices mutation ---
            // The payload key 'clientServices' is kept from the original code.
            await updateClientServices({ clientJobCategories: changesToSubmit as any }).unwrap();
            toast.success("Client job categories updated successfully!");
            setPendingChanges({});
            setJobCategoriesLocked(true);
        } catch (error) {
            toast.error("Failed to update job categories. Please try again.");
        }
    };

    const getFilteredJobCategoryCount = (jobCategoryId: string) => {
        const jobCategory = filteredCounts.find(jc => jc.jobCategoryId === jobCategoryId);
        return jobCategory ? jobCategory.count : 0;
    };

    const topJobCategories = useMemo(() => {
        return [...breakdown]
            .sort((a, b) => b.count - a.count)
            .slice(0, 4);
    }, [breakdown]);

    return (
        <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {topJobCategories.map(jobCategory => (
                    <Card key={jobCategory.jobCategoryId} className="h-full">
                        <CardContent className="p-4">
                            <div className="text-2xl font-bold !text-[#381980]">
                                {jobCategory.count}
                            </div>
                            <p className="text-sm text-muted-foreground">
                                {jobCategory.jobCategoryName}
                            </p>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="p-[6px] rounded-sm bg-[#E7E5F2] flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2">
                    <div className="relative flex-1 w-full max-w-[260px]">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                            placeholder="Search clients by name, ref..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 w-[240px] bg-white text-[#381980] font-semibold placeholder:text-[#381980]"
                        />
                    </div>
                    <div className="space-y-2">
                        <Popover>
                            <PopoverTrigger asChild>
                                <button
                                    type="button"
                                    className={`w-56 h-10 ${businessTypeFilter.size > 0 ? 'bg-gray-200 border-black' : 'bg-white border-input'} text-[#381980] font-semibold rounded-md border px-3 flex items-center justify-between`}
                                    disabled={isBusinessTypesLoading}
                                >
                                    <span className="truncate text-[14px]">
                                        {selectedBusinessTypeLabel}
                                    </span>
                                    <ChevronDown className="w-4 h-4" />
                                </button>
                            </PopoverTrigger>
                            <PopoverContent className="w-56 p-2" align="start">
                                <div className="max-h-64 overflow-auto">
                                    <div
                                        className={`px-2 py-1.5 rounded-[4px] cursor-pointer ${businessTypeFilter.size === 0 ? 'bg-[#5f46b9] text-white' : 'hover:bg-[#5f46b9] hover:text-white'}`}
                                        onClick={() => {
                                            setBusinessTypeFilter(new Set());
                                        }}
                                    >
                                        All Business Types
                                    </div>
                                    {businessTypeOptions.map((type: any) => {
                                        const active = businessTypeFilter.has(type._id);
                                        return (
                                            <div
                                                key={type._id}
                                                className={`flex items-center justify-between px-2 py-1.5 rounded-[4px] cursor-pointer ${active ? 'bg-[#5f46b9] text-white' : 'hover:bg-[#5f46b9] hover:text-white'}`}
                                                onClick={() => toggleBusinessType(type._id)}
                                            >
                                                <span className="truncate">{type.name}</span>
                                                {active && <Check className="w-4 h-4" />}
                                            </div>
                                        );
                                    })}
                                </div>
                            </PopoverContent>
                        </Popover>
                    </div>
                </div>
                <div className="flex items-center gap-3 ml-auto">
                    {Object.keys(pendingChanges).length > 0 && (
                        <Button onClick={handleSaveChanges} disabled={isUpdating} className="rounded-md">
                            {isUpdating ? 'Saving...' : 'Save Changes'}
                        </Button>
                    )}
                    <Button
                        variant={jobCategoriesLocked ? "default" : "outline"}
                        onClick={() => setJobCategoriesLocked(!jobCategoriesLocked)}
                        className="flex items-center gap-2 rounded-md"
                    >
                        {jobCategoriesLocked ? <Lock className="h-4 w-4" /> : <Unlock className="h-4 w-4" />}
                        {jobCategoriesLocked ? 'Unlock to Edit' : 'Lock Changes'}
                    </Button>
                </div>
            </div>

            <Card>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow className='!bg-[#edecf4] text-[#381980]'>
                                    <TableHead className="w-20 border-r font-medium sticky left-0  z-10">CLIENT REF</TableHead>
                                    <TableHead className="w-40 border-r font-medium sticky left-[81px]  z-10">CLIENT NAME</TableHead>
                                    <TableHead className="w-32 border-r font-medium">BUSINESS TYPE</TableHead>
                                    {jobCategories.map(jobCategory => (
                                        <TableHead key={jobCategory.jobCategoryId} className="w-24 border-r text-center font-medium">
                                            {jobCategory.jobCategoryName.toUpperCase()} ({getFilteredJobCategoryCount(jobCategory.jobCategoryId)})
                                        </TableHead>
                                    ))}
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading ? (
                                    <TableRow><TableCell colSpan={jobCategories.length + 3} className="text-center h-24">Loading clients...</TableCell></TableRow>
                                ) : isError ? (
                                    <TableRow><TableCell colSpan={jobCategories.length + 3} className="text-center h-24 text-red-500">Failed to load data.</TableCell></TableRow>
                                ) : clients.length === 0 ? (
                                    <TableRow><TableCell colSpan={jobCategories.length + 3} className="text-center h-24">No clients found.</TableCell></TableRow>
                                ) : (
                                    clients.map((client) => (
                                        <TableRow key={client._id} className="h-12">
                                            <TableCell className="p-4 text-sm border-r sticky left-0 bg-white z-10">{client.clientRef}</TableCell>
                                            <TableCell className="p-4 text-sm border-r font-medium sticky left-[81px] bg-white z-10">
                                                <ClientNameLink name={client.name} ciientId={client._id} />
                                            </TableCell>
                                            <TableCell className="p-4 text-sm border-r">{client.businessType}</TableCell>
                                            {jobCategories.map(jobCategory => (
                                                <TableCell key={jobCategory.jobCategoryId} className="p-2 border-r text-center">
                                                    <Switch
                                                        checked={isJobCategoryChecked(client, jobCategory.jobCategoryId)}
                                                        onCheckedChange={(checked) => handleJobCategoryChange(client._id, jobCategory.jobCategoryId, checked)}
                                                        disabled={jobCategoriesLocked || isUpdating}
                                                    />
                                                </TableCell>
                                            ))}
                                        </TableRow>
                                    ))
                                )}
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
                                disabled={isLoading || isFetching}
                            >
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
                            Showing {((page - 1) * limit) + 1} to {Math.min(page * limit, pagination.totalClients)} of {pagination.totalClients} clients
                        </div>
                    </div>

                    {pagination.totalPages > 1 && (
                        <div className="flex justify-center items-center gap-2">
                            <Button
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={page === 1 || isLoading || isFetching}
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
                                            disabled={isLoading || isFetching}
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
                                disabled={page >= pagination.totalPages || isLoading || isFetching}
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

            <ServiceChangesLogDialog
                open={showServiceLog}
                onOpenChange={setShowServiceLog}
            />
        </div>
    );
};

export default ServicesTab;
