import React, { useState, useMemo, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowUpDown, Search, FileText, ChevronLeft, ChevronRight, Eye, Edit2, Trash2 } from 'lucide-react';
import { DashboardCard, DashboardGrid } from "@/components/ui/dashboard-card";
import { Switch } from "@/components/ui/switch";
import ClientsTab from '@/components/ClientsTab';
import ClientDetailsDialog from '@/components/ClientDetailsDialog';
import ServiceChangesLogDialog from '@/components/ServiceChangesLogDialog';
import CustomTabs from '@/components/Tabs';
import AddClient from '@/components/client/AddClient';
import { useGetClientsQuery } from '@/store/clientApi';
import { usePermissionTabs } from '@/hooks/usePermissionTabs';
import EditClientModal from '@/components/client/component/EditClientModal';

const tabs = [
  {
    id: 'clientList',
    label: 'Details',
  }, {
    id: 'clientBreakdown',
    label: 'Client Breakdown',
  }
]
const ClientInformationTab = () => {
  const [activeTab, setActiveTab] = useState('');
  const [serviceSelections, setServiceSelections] = useState<{ [key: string]: { [key: string]: boolean } }>({});
  const [servicesLocked, setServicesLocked] = useState(false);
  const [showServiceLog, setShowServiceLog] = useState(false);
  const [addClient, setAddClient] = useState(false);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const { visibleTabs, isError } = usePermissionTabs(tabs);

  const { data: clientsData, isLoading, error } = useGetClientsQuery({ page, limit });

  const clientInfo = clientsData?.data?.clients || [];

  const [clientInfoSortConfig, setClientInfoSortConfig] = useState<{ key: string | null; direction: 'asc' | 'desc' }>({ key: null, direction: 'asc' });
  const [clientInfoSearch, setClientInfoSearch] = useState('');
  const [clientTypeFilter, setClientTypeFilter] = useState('all');
  const [showClientDetailsDialog, setShowClientDetailsDialog] = useState(false);
  const [showClientServiceLogDialog, setShowClientServiceLogDialog] = useState(false);
  const [selectedClientForDetails, setSelectedClientForDetails] = useState<ClientInfo | null>(null);
  const isTabVisible = (tabId: string) => visibleTabs.some(tab => tab.id === tabId)
  useEffect(() => {
    if (visibleTabs.length > 0 && !visibleTabs.some(tab => tab.id === activeTab)) {
      setActiveTab(visibleTabs[0].id);
    }
  }, [visibleTabs, activeTab]);
  const handleClientInfoSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (clientInfoSortConfig.key === key && clientInfoSortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setClientInfoSortConfig({ key, direction });
  };

  // Filter and sort client info
  const filteredAndSortedClientInfo = useMemo(() => {
    let filtered = clientInfo;

    // Apply search filter
    if (clientInfoSearch) {
      filtered = filtered.filter((client: any) =>
        client.name.toLowerCase().includes(clientInfoSearch.toLowerCase()) ||
        client.contactName.toLowerCase().includes(clientInfoSearch.toLowerCase()) ||
        client.email.toLowerCase().includes(clientInfoSearch.toLowerCase()) ||
        client.clientRef.toLowerCase().includes(clientInfoSearch.toLowerCase())
      );
    }

    // Apply client type filter
    if (clientTypeFilter && clientTypeFilter !== 'all') {
      filtered = filtered.filter(client => client.businessTypeId?.name === clientTypeFilter);
    }

    // Apply sorting
    if (!clientInfoSortConfig.key) return filtered;

    return [...filtered].sort((a: any, b: any) => {
      let aValue: any;
      let bValue: any;

      if (clientInfoSortConfig.key === 'name') {
        aValue = a.name;
        bValue = b.name;
      } else if (clientInfoSortConfig.key === 'clientType') {
        aValue = a.businessTypeId?.name || '';
        bValue = b.businessTypeId?.name || '';
      } else if (clientInfoSortConfig.key === 'contact') {
        aValue = a.contactName;
        bValue = b.contactName;
      } else if (clientInfoSortConfig.key === 'customerNumber') {
        aValue = a.taxNumber;
        bValue = b.taxNumber;
      } else {
        aValue = a[clientInfoSortConfig.key as keyof typeof a];
        bValue = b[clientInfoSortConfig.key as keyof typeof b];
      }

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return clientInfoSortConfig.direction === 'asc'
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }

      return 0;
    });
  }, [clientInfo, clientInfoSearch, clientTypeFilter, clientInfoSortConfig]);

  const availableClientTypes = [...new Set(clientInfo.map(client => client.businessTypeId?.name).filter(Boolean))];

  useEffect(() => {
    if (Object.keys(serviceSelections).length === 0) {
      const initialSelections: { [key: string]: { [key: string]: boolean } } = {};
      clientInfo.forEach(client => {
        initialSelections[client.clientRef] = {
          vat: Math.random() > 0.5,
          payroll: Math.random() > 0.5,
          ct1: Math.random() > 0.6,
          incomeTax: Math.random() > 0.5,
          audit: client.audit,
          bookkeeping: Math.random() > 0.5
        };
      });
      setServiceSelections(initialSelections);
    }
  }, [clientInfo]);

  // Calculate service counts based on current selections
  const serviceCounts = useMemo(() => {
    return {
      vat: Object.values(serviceSelections).filter(services => services?.vat).length,
      payroll: Object.values(serviceSelections).filter(services => services?.payroll).length,
      ct1: Object.values(serviceSelections).filter(services => services?.ct1).length,
      incomeTax: Object.values(serviceSelections).filter(services => services?.incomeTax).length,
      audit: Object.values(serviceSelections).filter(services => services?.audit).length,
      bookkeeping: Object.values(serviceSelections).filter(services => services?.bookkeeping).length
    };
  }, [serviceSelections]);

  const handleServiceChange = (clientRef: string, service: string, checked: boolean) => {
    if (servicesLocked) return;

    setServiceSelections(prev => ({
      ...prev,
      [clientRef]: {
        ...prev[clientRef],
        [service]: checked
      }
    }));
  };



  return (
    <div className="space-y-6">
      <CustomTabs
        tabs={visibleTabs}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />
      {activeTab === "clientList" && isTabVisible("clientList") && (<>
        <DashboardGrid columns={4}>
          <DashboardCard
            title="Total Clients"
            value={isLoading ? '...' : filteredAndSortedClientInfo.length}
          />

          {Array.isArray(clientsData?.data?.breakdown) && clientsData.data.breakdown.length > 0 && (
            clientsData.data.breakdown.map((item: any) => (
              <DashboardCard
                key={item.name}
                title={item.name}
                value={isLoading ? '...' : item.count}
              />
            ))
          )}
        </DashboardGrid>

        {/* Search and Filters Row */}
        <div className="flex items-center gap-4 bg-white p-4 rounded-lg">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search clients..."
              value={clientInfoSearch}
              onChange={(e) => setClientInfoSearch(e.target.value)}
              className="pl-10 bg-white"
              disabled={isLoading}
            />
          </div>
          <Select value={clientTypeFilter} onValueChange={setClientTypeFilter} disabled={isLoading}>
            <SelectTrigger className="w-48 bg-white">
              <SelectValue placeholder="Filter by client type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All client types</SelectItem>
              {availableClientTypes.map(type => (
                <SelectItem key={type} value={type}>{type}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={() => setAddClient(true)} style={{ backgroundColor: '#017DB9', color: 'white' }} className="hover:opacity-90" disabled={isLoading}>
            + New Client
          </Button>
        </div>
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-20 border-r text-left">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleClientInfoSort('clientRef')}
                      className="h-8 px-1 font-medium justify-start"
                    >
                      Client Ref
                      <ArrowUpDown className="ml-1 h-4 w-4" />
                    </Button>
                  </TableHead>
                  <TableHead className="w-32 border-r text-left">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleClientInfoSort('name')}
                      className="h-8 px-1 font-medium justify-start"
                    >
                      Client Name
                      <ArrowUpDown className="ml-1 h-4 w-4" />
                    </Button>
                  </TableHead>
                  <TableHead className="w-24 border-r text-left">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleClientInfoSort('clientType')}
                      className="h-8 px-1 font-light justify-start"
                    >
                      Business Type
                      <ArrowUpDown className="ml-1 h-4 w-4" />
                    </Button>
                  </TableHead>
                  <TableHead className="w-24 border-r text-left">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleClientInfoSort('customerNumber')}
                      className="h-8 px-1 font-light justify-start"
                    >
                      Tax Number
                      <ArrowUpDown className="ml-1 h-4 w-4" />
                    </Button>
                  </TableHead>
                  <TableHead className="w-24 border-r text-left">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleClientInfoSort('croNumber')}
                      className="h-8 px-1 font-light justify-start"
                    >
                      CRO Number
                      <ArrowUpDown className="ml-1 h-4 w-4" />
                    </Button>
                  </TableHead>
                  <TableHead className="w-40 border-r text-left">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleClientInfoSort('address')}
                      className="h-8 px-1 font-light justify-start"
                    >
                      Address
                      <ArrowUpDown className="ml-1 h-4 w-4" />
                    </Button>
                  </TableHead>
                  <TableHead className="w-24 border-r text-left">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleClientInfoSort('contact')}
                      className="h-8 px-1 font-light justify-start"
                    >
                      Contact Name
                      <ArrowUpDown className="ml-1 h-4 w-4" />
                    </Button>
                  </TableHead>
                  <TableHead className="w-32 border-r text-left">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleClientInfoSort('email')}
                      className="h-8 px-1 font-light justify-start"
                    >
                      Email
                      <ArrowUpDown className="ml-1 h-4 w-4" />
                    </Button>
                  </TableHead>
                  <TableHead className="w-24 border-r text-left">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleClientInfoSort('emailNote')}
                      className="h-8 px-1 font-light justify-start"
                    >
                      Email Note
                      <ArrowUpDown className="ml-1 h-4 w-4" />
                    </Button>
                  </TableHead>
                  <TableHead className="w-24 border-r text-left">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleClientInfoSort('phone')}
                      className="h-8 px-1 font-light justify-start"
                    >
                      Phone
                      <ArrowUpDown className="ml-1 h-4 w-4" />
                    </Button>
                  </TableHead>
                  <TableHead className="w-24 border-r text-left">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleClientInfoSort('phoneNote')}
                      className="h-8 px-1 font-light justify-start"
                    >
                      Phone Note
                      <ArrowUpDown className="ml-1 h-4 w-4" />
                    </Button>
                  </TableHead>
                  <TableHead className="w-24 border-r text-left">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleClientInfoSort('onboardedDate')}
                      className="h-8 px-1 font-light justify-start"
                    >
                      Onboarded Date
                      <ArrowUpDown className="ml-1 h-4 w-4" />
                    </Button>
                  </TableHead>
                  <TableHead className="w-24 border-r text-left">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleClientInfoSort('amlCompliant')}
                      className="h-8 px-1 font-light justify-start"
                    >
                      AML Compliant
                      <ArrowUpDown className="ml-1 h-4 w-4" />
                    </Button>
                  </TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={13} className="text-center py-8">
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        <span className="ml-2">Loading clients...</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : error ? (
                  <TableRow>
                    <TableCell colSpan={13} className="text-center py-8 text-red-600">
                      Error loading clients. Please try again.
                    </TableCell>
                  </TableRow>
                ) : filteredAndSortedClientInfo.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={13} className="text-center py-8 text-gray-500">
                      No clients found.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredAndSortedClientInfo.map((client: any, index) => (
                    <TableRow key={client._id} className="h-12">
                      <TableCell className="p-4 text-sm w-20 border-r text-left">{client.clientRef}</TableCell>
                      <TableCell className="font-medium text-left p-4 text-sm w-32 border-r">
                        <span
                          className="cursor-pointer text-blue-600 hover:text-blue-800 hover:underline"
                          onClick={() => {
                            setSelectedClientForDetails(client);
                            setShowClientDetailsDialog(true);
                          }}
                        >
                          {client.name}
                        </span>
                      </TableCell>
                      <TableCell className="p-4 text-sm w-24 border-r text-left">{client.businessTypeId?.name || 'N/A'}</TableCell>
                      <TableCell className="p-4 text-sm w-24 border-r text-left">{client.taxNumber}</TableCell>
                      <TableCell className="p-4 text-sm w-24 border-r text-left">{client.croNumber}</TableCell>
                      <TableCell className="p-4 text-sm w-40 border-r text-left">{client.address}</TableCell>
                      <TableCell className="p-4 text-sm w-24 border-r text-left">{client.contactName}</TableCell>
                      <TableCell className="p-4 text-sm w-32 border-r text-left">{client.email}</TableCell>
                      <TableCell className="p-4 text-sm w-24 border-r text-left">{client.emailNote}</TableCell>
                      <TableCell className="p-4 text-sm w-24 border-r text-left">{client.phone}</TableCell>
                      <TableCell className="p-4 text-sm w-24 border-r text-left">{client.phoneNote}</TableCell>
                      <TableCell className="p-4 text-sm w-24 border-r text-left">{(() => {
                        const date = new Date(client.onboardedDate);
                        const month = (date.getMonth() + 1).toString().padStart(2, '0');
                        const day = date.getDate().toString().padStart(2, '0');
                        const year = date.getFullYear();
                        return `${month}/${day}/${year}`;
                      })()}</TableCell>
                      <TableCell className="p-4 text-sm w-24 border-r text-left">{client.amlCompliant ? 'Yes' : ''}</TableCell>
                      <TableCell className="text-center">
                        <div className="flex gap-1 justify-center">
                          {/* <Button variant="ghost" size="icon" onClick={() => openViewDialog(job)}>
                            <Eye className="w-4 h-4" />
                          </Button> */}
                          <Button variant="ghost" size="icon" onClick={() => {
                            setSelectedClientForDetails(client);
                            setShowClientServiceLogDialog(true);
                          }} >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          {/* <Button variant="ghost" size="icon" onClick={() => deleteJobById(job)} className="text-red-500 hover:text-red-700">
                            <Trash2 className="w-4 h-4" />
                          </Button> */}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {clientsData?.data?.pagination && (
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
                Showing {((page - 1) * limit) + 1} to {Math.min(page * limit, clientsData.data.pagination.totalClients)} of {clientsData.data.pagination.totalClients} clients
              </div>
            </div>

            {clientsData.data.pagination.totalPages > 1 && (
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
                  {Array.from({ length: Math.min(5, clientsData.data.pagination.totalPages) }, (_, i) => {
                    let pageNum;
                    if (clientsData.data.pagination.totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (page <= 3) {
                      pageNum = i + 1;
                    } else if (page >= clientsData.data.pagination.totalPages - 2) {
                      pageNum = clientsData.data.pagination.totalPages - 4 + i;
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
                  disabled={page >= clientsData.data.pagination.totalPages || isLoading}
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
      </>)
      }


      {activeTab === "clientBreakdown" && isTabVisible("clientBreakdown") && <ClientsTab />}

      <ServiceChangesLogDialog
        open={showServiceLog}
        onOpenChange={setShowServiceLog}
      />

      {selectedClientForDetails && (
        <ClientDetailsDialog
          open={showClientDetailsDialog}
          onOpenChange={setShowClientDetailsDialog}
          clientData={selectedClientForDetails}
        />
      )}
      {selectedClientForDetails && showClientServiceLogDialog && (
        <EditClientModal
          open={showClientServiceLogDialog}
          onOpenChange={setShowClientServiceLogDialog}
          clientData={selectedClientForDetails}
        />
      )}
      <AddClient dialogOpen={addClient} setDialogOpen={setAddClient} />
    </div>
  );
};

export default ClientInformationTab;