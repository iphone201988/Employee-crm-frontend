import React, { useState, useMemo, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Lock, Unlock } from 'lucide-react';
import { DashboardCard, DashboardGrid } from "@/components/ui/dashboard-card";
import { Switch } from "@/components/ui/switch";
import ClientNameLink from './ClientNameLink';
import ServiceChangesLogDialog from './ServiceChangesLogDialog';
import { useGetClientServicesQuery, useUpdateClientServicesMutation } from '@/store/clientApi';
import { toast } from 'sonner';
import { useDebounce } from 'use-debounce'; 

const ServicesTab = () => {
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);
    const [searchTerm, setSearchTerm] = useState('');
    const [businessTypeFilter, setBusinessTypeFilter] = useState('all');
    const [debouncedSearchTerm] = useDebounce(searchTerm, 500); 

    const [servicesLocked, setServicesLocked] = useState(true);
    const [showServiceLog, setShowServiceLog] = useState(false);

    const [pendingChanges, setPendingChanges] = useState<{ [clientId: string]: { [serviceId: string]: boolean } }>({});

    const { data: clientServicesData, isLoading, isError, isFetching }: any = useGetClientServicesQuery({
        page,
        limit,
        search: debouncedSearchTerm,
        businessType: businessTypeFilter === 'all' ? undefined : businessTypeFilter,
    });

    const [updateClientServices, { isLoading: isUpdating }] = useUpdateClientServicesMutation();

    const { clients, services, pagination, breakdown, filteredCounts } = useMemo(() => {
        const clients = clientServicesData?.data || [];
        const services = clientServicesData?.breakdown || [];
        const pagination = clientServicesData?.pagination;
        const breakdown = clientServicesData?.breakdown || [];
        const filteredCounts = clientServicesData?.filteredCounts || [];
        return { clients, services, pagination, breakdown, filteredCounts };
    }, [clientServicesData]);

    useEffect(() => {
        setPendingChanges({});
    }, [clientServicesData]);

    const handleServiceChange = (clientId: string, serviceId: string, isEnabled: boolean) => {
        if (servicesLocked) return;

        setPendingChanges(prev => {
            const clientChanges = { ...(prev[clientId] || {}) };
            clientChanges[serviceId] = isEnabled;
            return { ...prev, [clientId]: clientChanges };
        });
    };
   
    const isServiceChecked = (client: any, serviceId: string) => {
        if (pendingChanges[client._id] && pendingChanges[client._id][serviceId] !== undefined) {
            return pendingChanges[client._id][serviceId];
        }

        return !!client[serviceId.toLowerCase().replace(/\s/g, '')] || !!client[serviceId];
    };

    const handleSaveChanges = async () => {
        const changesToSubmit = Object.entries(pendingChanges).map(([clientId, serviceChanges]) => {
            const originalClient = clients.find(c => c._id === clientId);
            if (!originalClient) return null;

            const currentServices = new Set<string>(
                services.filter(s => isServiceChecked({ ...originalClient, ...serviceChanges }, s.serviceId)).map(s => s.serviceId)
            );

            return {
                clientId,
                servicesTds: Array.from(currentServices),
            };
        }).filter(Boolean);

        if (changesToSubmit.length === 0) {
            toast.info("No changes to save.");
            return;
        }

        try {
            await updateClientServices({ clientServices: changesToSubmit as any }).unwrap();
            toast.success("Client services updated successfully!");
            setPendingChanges({}); 
            setServicesLocked(true);
        } catch (error) {
            toast.error("Failed to update services. Please try again.");
        }
    };


    const getFilteredServiceCount = (serviceId: string) => {
        const service = filteredCounts.find(s => s.serviceId === serviceId);
        return service ? service.count : 0;
    };
    const topServices = useMemo(() => {
        return [...breakdown]
            .sort((a, b) => b.count - a.count)
            .slice(0, 4);
    }, [breakdown]);

    return (
        <div className="space-y-8">
            <DashboardGrid columns={4}>
                {topServices.map(service => (
                    <DashboardCard
                        key={service.serviceId}
                        title={service.serviceName}
                        value={service.count}
                    />
                ))}
            </DashboardGrid>

            <div className="flex items-center justify-between gap-4 bg-white p-4 rounded-lg shadow-sm">
                <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <Input
                        placeholder="Search clients by name, ref..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 bg-white"
                    />
                </div>
        
                <Select value={businessTypeFilter} onValueChange={setBusinessTypeFilter}>
                    <SelectTrigger className="w-56 bg-white">
                        <SelectValue placeholder="Filter by business type" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Business Types</SelectItem>

                    </SelectContent>
                </Select>
            </div>

            <div className="flex justify-end items-center mb-4 gap-4">
                 {Object.keys(pendingChanges).length > 0 && (
                    <Button onClick={handleSaveChanges} disabled={isUpdating}>
                        {isUpdating ? 'Saving...' : 'Save Changes'}
                    </Button>
                )}
                <Button
                    variant={servicesLocked ? "default" : "outline"}
                    onClick={() => setServicesLocked(!servicesLocked)}
                    className="flex items-center gap-2"
                >
                   🔒 {servicesLocked ? 'Unlock Services' : 'Lock Services'}
                </Button>
            </div>

            <Card>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-20 border-r font-medium sticky left-0 bg-white z-10">CLIENT REF</TableHead>
                                    <TableHead className="w-40 border-r font-medium sticky left-[81px] bg-white z-10">CLIENT NAME</TableHead>
                                    <TableHead className="w-32 border-r font-medium">TYPE</TableHead>
                                    {services.map(service => (
                                        <TableHead key={service.serviceId} className="w-24 border-r text-center font-medium">
                                            {service.serviceName.toUpperCase()} ({getFilteredServiceCount(service.serviceId)})
                                        </TableHead>
                                    ))}
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading ? (
                                    <TableRow><TableCell colSpan={services.length + 3} className="text-center h-24">Loading clients...</TableCell></TableRow>
                                ) : isError ? (
                                    <TableRow><TableCell colSpan={services.length + 3} className="text-center h-24 text-red-500">Failed to load data.</TableCell></TableRow>
                                ) : clients.length === 0 ? (
                                     <TableRow><TableCell colSpan={services.length + 3} className="text-center h-24">No clients found.</TableCell></TableRow>
                                ) : (
                                    clients.map((client) => (
                                        <TableRow key={client._id} className="h-12">
                                            <TableCell className="p-4 text-sm border-r sticky left-0 bg-white z-10">{client.clientRef}</TableCell>
                                            <TableCell className="p-4 text-sm border-r font-medium sticky left-[81px] bg-white z-10">
                                                <ClientNameLink name={client.name} />
                                            </TableCell>
                                            <TableCell className="p-4 text-sm border-r">{client.businessType}</TableCell>
                                            {services.map(service => (
                                                <TableCell key={service.serviceId} className="p-2 border-r text-center">
                                                    <Switch
                                                        checked={isServiceChecked(client, service.serviceId)}
                                                        onCheckedChange={(checked) => handleServiceChange(client._id, service.serviceId, checked)}
                                                        disabled={servicesLocked || isUpdating}
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

            <ServiceChangesLogDialog
                open={showServiceLog}
                onOpenChange={setShowServiceLog}
            />
        </div>
    );
};

export default ServicesTab;
