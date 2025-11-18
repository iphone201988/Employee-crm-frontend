import React, { useState, useMemo, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowUpDown, Search, FileText, ChevronLeft, ChevronRight, Eye, Edit2, Trash2, Delete, Settings, Download, Move, GripVertical, Link } from 'lucide-react';
import { DashboardCard, DashboardGrid } from "@/components/ui/dashboard-card";
import { Switch } from "@/components/ui/switch";
import ClientsTab from '@/components/ClientsTab';
import ClientDetailsDialog from '@/components/ClientDetailsDialog';
import ClientNameLink from '@/components/ClientNameLink';
import ServiceChangesLogDialog from '@/components/ServiceChangesLogDialog';
import CustomTabs from '@/components/Tabs';
import AddClient from '@/components/client/AddClient';
import { useGetClientsQuery } from '@/store/clientApi';
import { usePermissionTabs } from '@/hooks/usePermissionTabs';
import EditClientModal from '@/components/client/component/EditClientModal';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@radix-ui/react-tooltip';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useLazyGetTabAccessQuery } from '@/store/authApi';
import Avatars from '@/components/Avatars';
import { useDeleteClientMutation } from '@/store/clientApi';
import { toast } from 'sonner';
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
  const [deleteClient, { isLoading: isDeleting }] = useDeleteClientMutation();
  const { data: clientsData, isLoading, error } = useGetClientsQuery({ page, limit });

  const clientInfo = clientsData?.data?.clients || [];
  const processedClientInfo = useMemo(() => {
    return clientInfo.map((client: any) => {
      let managerName = '';
      let managerId = '';

      if (typeof client?.clientManager === 'string') {
        managerName = client.clientManager;
      } else if (client?.clientManager && typeof client.clientManager === 'object') {
        managerName = client.clientManager.name || '';
      }

      const managerField = client?.clientManagerId;
      if (typeof managerField === 'string') {
        managerId = managerField;
      } else if (managerField && typeof managerField === 'object') {
        managerId = managerField._id || '';
        if (!managerName && managerField.name) {
          managerName = managerField.name;
        }
      }

      return {
        ...client,
        clientManager: managerName,
        clientManagerId: managerId,
      };
    });
  }, [clientInfo]);

  console.log('clientInfo===========', processedClientInfo); 
  const [clientInfoSortConfig, setClientInfoSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);
  const [clientInfoSearch, setClientInfoSearch] = useState('');
  const [clientTypeFilter, setClientTypeFilter] = useState('all');
  const [showClientDetailsDialog, setShowClientDetailsDialog] = useState(false);
  const [showClientServiceLogDialog, setShowClientServiceLogDialog] = useState(false);
  const [selectedClientForDetails, setSelectedClientForDetails] = useState<ClientInfo | null>(null);
  const [showEditClientDialog, setShowEditClientDialog] = useState(false);
  const [clientToEdit, setClientToEdit] = useState<ClientInfo | null>(null);
  const [getTabAccess, { data: currentTabsUsers }] = useLazyGetTabAccessQuery()
  const isTabVisible = (tabId: string) => visibleTabs.some(tab => tab.id === tabId)

  // Column visibility state
  const [visibleColumns, setVisibleColumns] = useState({
    clientRef: true,
    clientName: true,
    clientManager: true,
    clientStatus: true,
    businessType: true,
    taxNumber: true,
    yearEnd: true,
    audit: true,
    croNumber: true,
    croLink: true,
    arDate: true,
    address: true,
    phone: true,
    phoneNote: true,
    email: true,
    emailNote: true,
    onboardedDate: true,
    amlCompliant: true
  });

  // Column order state
  const [columnOrder, setColumnOrder] = useState([
    'clientRef',
    'clientName',
    'clientManager',
    'clientStatus',
    'businessType',
    'taxNumber',
    'yearEnd',
    'audit',
    'croNumber',
    'croLink',
    'arDate',
    'address',
    'phone',
    'phoneNote',
    'email',
    'emailNote',
    'onboardedDate',
    'amlCompliant'
  ]);

  // Drag and drop state
  const [draggedItem, setDraggedItem] = useState<string | null>(null);

  // Settings popup state
  const [settingsPopup, setSettingsPopup] = useState<{ clientId: string; x: number; y: number } | null>(null);

  // Column display names mapping
  const columnDisplayNames: Record<string, string> = {
    clientRef: 'CLIENT REF',
    clientName: 'CLIENT NAME',
    clientManager: 'CLIENT MANAGER',
    clientStatus: 'CLIENT STATUS',
    businessType: 'BUSINESS TYPE',
    taxNumber: 'TAX/PPS NO.',
    yearEnd: 'YEAR END',
    audit: 'IN AUDIT',
    croNumber: 'CRO NUMBER',
    croLink: 'CRO LINK',
    arDate: 'AR DATE',
    address: 'ADDRESS',
    phone: 'PHONE',
    phoneNote: 'PHONE NOTE',
    email: 'EMAIL',
    emailNote: 'EMAIL NOTE',
    onboardedDate: 'ONBOARDED DATE',
    amlCompliant: 'AML COMPLAINT'
  };

  // Helper function to convert ClientInfo to ClientData format
  const convertClientInfoToClientData = (clientInfo: ClientInfo): ClientData & { _id: string } => {
    return {
      _id: clientInfo._id,
      clientRef: clientInfo.clientRef,
      name: clientInfo.name,
      businessTypeId: clientInfo.businessTypeId?._id || '',
      taxNumber: clientInfo.taxNumber,
      croNumber: clientInfo.croNumber,
      croLink: clientInfo.croLink || '',
      clientManagerId: (clientInfo as any).clientManagerId || '',
      clientManager: (clientInfo as any).clientManager || '',
      address: clientInfo.address,
      email: clientInfo.email,
      emailNote: clientInfo.emailNote,
      phone: clientInfo.phone,
      phoneNote: clientInfo.phoneNote,
      onboardedDate: new Date(clientInfo.onboardedDate),
      amlCompliant: clientInfo.amlCompliant,
      audit: clientInfo.audit,
      clientStatus: clientInfo.clientStatus || 'Current',
      yearEnd: clientInfo.yearEnd || '',
      arDate: clientInfo.arDate ? new Date(clientInfo.arDate) : undefined,
    };
  };

  // Helper function to convert ClientInfo to FullClientData format for EditClientModal
  const convertClientInfoToFullClientData = (clientInfo: ClientInfo): any => {
    return {
      _id: clientInfo._id,
      clientRef: clientInfo.clientRef,
      name: clientInfo.name,
      businessTypeId: clientInfo.businessTypeId,
      taxNumber: clientInfo.taxNumber,
      croNumber: clientInfo.croNumber,
      croLink: clientInfo.croLink || '',
      clientManagerId: (clientInfo as any).clientManagerId || '',
      clientManager: (clientInfo as any).clientManager || '',
      address: clientInfo.address,
      email: clientInfo.email,
      phone: clientInfo.phone,
      onboardedDate: clientInfo.onboardedDate,
      amlCompliant: clientInfo.amlCompliant,
      audit: clientInfo.audit,
      clientStatus: clientInfo.clientStatus || 'Current',
      yearEnd: clientInfo.yearEnd || '',
      arDate: clientInfo.arDate || undefined,
    };
  };


  useEffect(() => {
    if (visibleTabs.length > 0 && !visibleTabs.some(tab => tab.id === activeTab)) {
      setActiveTab(visibleTabs[0].id);
    }
    getTabAccess(activeTab).unwrap();
  }, [visibleTabs, activeTab]);
  const handleClientInfoSort = (key: string) => {
    setClientInfoSortConfig(current => {
      if (current?.key === key) {
        return current.direction === 'desc'
          ? { key, direction: 'asc' }
          : null;
      }
      return { key, direction: 'desc' };
    });
  };

  const getSortIcon = (key: string) => {
    if (clientInfoSortConfig?.key !== key) {
      return <ArrowUpDown className="ml-1 !h-3 !w-3 opacity-50" />;
    }
    return <ArrowUpDown className={`ml-1 !h-3 !w-3 ${clientInfoSortConfig.direction === 'desc' ? 'rotate-180' : ''}`} />;
  };

  // Filter and sort client info
  const filteredAndSortedClientInfo = useMemo(() => {
    let filtered = processedClientInfo;

    // Apply search filter
    if (clientInfoSearch) {
      const searchValue = clientInfoSearch.toLowerCase();
      filtered = filtered.filter((client: any) =>
        client.name.toLowerCase().includes(searchValue) ||
        client.email.toLowerCase().includes(searchValue) ||
        client.clientRef.toLowerCase().includes(searchValue) ||
        (client.clientManager && client.clientManager.toLowerCase().includes(searchValue))
      );
    }

    // Apply client type filter
    if (clientTypeFilter && clientTypeFilter !== 'all') {
      filtered = filtered.filter(client => client.businessTypeId?.name === clientTypeFilter);
    }

    // Apply sorting
    if (!clientInfoSortConfig?.key) return filtered;

    return [...filtered].sort((a: any, b: any) => {
      let aValue: any;
      let bValue: any;
      let isNumeric = false;

      if (clientInfoSortConfig.key === 'name') {
        aValue = a.name || '';
        bValue = b.name || '';
      } else if (clientInfoSortConfig.key === 'clientRef') {
        aValue = a.clientRef || '';
        bValue = b.clientRef || '';
      } else if (clientInfoSortConfig.key === 'clientManager') {
        aValue = a.clientManager || '';
        bValue = b.clientManager || '';
      } else if (clientInfoSortConfig.key === 'clientStatus') {
        aValue = a.clientStatus || '';
        bValue = b.clientStatus || '';
      } else if (clientInfoSortConfig.key === 'clientType') {
        aValue = a.businessTypeId?.name || '';
        bValue = b.businessTypeId?.name || '';
      } else if (clientInfoSortConfig.key === 'customerNumber') {
        aValue = a.taxNumber || '';
        bValue = b.taxNumber || '';
      } else if (clientInfoSortConfig.key === 'yearEnd') {
        aValue = a.yearEnd || '';
        bValue = b.yearEnd || '';
      } else if (clientInfoSortConfig.key === 'audit') {
        aValue = a.audit ? 'Yes' : 'No';
        bValue = b.audit ? 'Yes' : 'No';
      } else if (clientInfoSortConfig.key === 'arDate') {
        isNumeric = true;
        aValue = a.arDate ? new Date(a.arDate).getTime() : -Infinity;
        bValue = b.arDate ? new Date(b.arDate).getTime() : -Infinity;
      } else if (clientInfoSortConfig.key === 'croNumber') {
        aValue = a.croNumber || '';
        bValue = b.croNumber || '';
      } else if (clientInfoSortConfig.key === 'croLink') {
        aValue = a.croLink || '';
        bValue = b.croLink || '';
      } else if (clientInfoSortConfig.key === 'address') {
        aValue = a.address || '';
        bValue = b.address || '';
      } else if (clientInfoSortConfig.key === 'phone') {
        aValue = a.phone || '';
        bValue = b.phone || '';
      } else if (clientInfoSortConfig.key === 'phoneNote') {
        aValue = a.phoneNote || '';
        bValue = b.phoneNote || '';
      } else if (clientInfoSortConfig.key === 'email') {
        aValue = a.email || '';
        bValue = b.email || '';
      } else if (clientInfoSortConfig.key === 'emailNote') {
        aValue = a.emailNote || '';
        bValue = b.emailNote || '';
      } else if (clientInfoSortConfig.key === 'onboardedDate') {
        isNumeric = true;
        aValue = a.onboardedDate ? new Date(a.onboardedDate).getTime() : -Infinity;
        bValue = b.onboardedDate ? new Date(b.onboardedDate).getTime() : -Infinity;
      } else if (clientInfoSortConfig.key === 'amlCompliant') {
        aValue = a.amlCompliant ? 'Yes' : 'No';
        bValue = b.amlCompliant ? 'Yes' : 'No';
      } else {
        const rawA = a[clientInfoSortConfig.key as keyof typeof a];
        const rawB = b[clientInfoSortConfig.key as keyof typeof b];
        aValue = rawA != null ? rawA : '';
        bValue = rawB != null ? rawB : '';
      }

      // Handle numeric comparison
      if (isNumeric) {
        const result = aValue - bValue;
        return clientInfoSortConfig.direction === 'asc' ? result : -result;
      }

      // Convert to strings for comparison
      const strA = String(aValue || '').toLowerCase().trim();
      const strB = String(bValue || '').toLowerCase().trim();

      // Compare strings
      const comparison = strA.localeCompare(strB, undefined, { numeric: true, sensitivity: 'base' });
      return clientInfoSortConfig.direction === 'asc' ? comparison : -comparison;
    });
  }, [processedClientInfo, clientInfoSearch, clientTypeFilter, clientInfoSortConfig]);

  const availableClientTypes = [...new Set(processedClientInfo.map(client => client.businessTypeId?.name).filter(Boolean))];

  useEffect(() => {
    if (Object.keys(serviceSelections).length === 0) {
      const initialSelections: { [key: string]: { [key: string]: boolean } } = {};
      processedClientInfo.forEach(client => {
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
  }, [processedClientInfo]);

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

  const deleteClientById = async (client: any) => {
    try {
      await deleteClient(client._id);
      toast.success('Client deleted successfully!');
      setSettingsPopup(null);
    } catch (error) {
      console.error('Error deleting client:', error);
      toast.error('Failed to delete client');
    }
  };

  // Column visibility toggle
  const toggleColumn = (column: keyof typeof visibleColumns) => {
    setVisibleColumns(prev => ({ ...prev, [column]: !prev[column] }));
  };

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, item: string) => {
    setDraggedItem(item);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, targetItem: string) => {
    e.preventDefault();
    if (!draggedItem || draggedItem === targetItem) return;

    const newOrder = [...columnOrder];
    const draggedIndex = newOrder.indexOf(draggedItem);
    const targetIndex = newOrder.indexOf(targetItem);

    // Remove dragged item and insert at target position
    newOrder.splice(draggedIndex, 1);
    newOrder.splice(targetIndex, 0, draggedItem);

    setColumnOrder(newOrder);
    setDraggedItem(null);
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
  };

  // Export to CSV
  const exportToCSV = () => {
    const headers: string[] = [];
    const dataMappers: ((client: any) => string)[] = [];

    // Add columns in the order specified by columnOrder
    columnOrder.forEach((key) => {
      if (!visibleColumns[key as keyof typeof visibleColumns]) return;

      headers.push(columnDisplayNames[key]);

      switch (key) {
        case 'clientRef':
          dataMappers.push((client) => client.clientRef || '');
          break;
        case 'clientName':
          dataMappers.push((client) => client.name || '-');
          break;
        case 'clientManager':
          dataMappers.push((client) => client.clientManager || '-');
          break;
        case 'businessType':
          dataMappers.push((client) => client.businessTypeId?.name || 'N/A');
          break;
        case 'taxNumber':
          dataMappers.push((client) => client.taxNumber || '');
          break;
        case 'croNumber':
          dataMappers.push((client) => client.croNumber || '');
          break;
        case 'croLink':
          dataMappers.push((client) => client.croLink || '');
          break;
        case 'address':
          dataMappers.push((client) => `"${(client.address || '').replace(/"/g, '""')}"`);
          break;
        case 'email':
          dataMappers.push((client) => client.email || '');
          break;
        case 'emailNote':
          dataMappers.push((client) => client.emailNote || '');
          break;
        case 'phone':
          dataMappers.push((client) => client.phone || '');
          break;
        case 'phoneNote':
          dataMappers.push((client) => client.phoneNote || '');
          break;
        case 'onboardedDate':
          dataMappers.push((client) => {
            const date = new Date(client.onboardedDate);
            const month = (date.getMonth() + 1).toString().padStart(2, '0');
            const day = date.getDate().toString().padStart(2, '0');
            const year = date.getFullYear();
            return `${month}/${day}/${year}`;
          });
          break;
        case 'yearEnd':
          dataMappers.push((client) => client.yearEnd || '');
          break;
        case 'audit':
          dataMappers.push((client) => client.audit ? 'Yes' : '');
          break;
        case 'amlCompliant':
          dataMappers.push((client) => client.amlCompliant ? 'Yes' : '');
          break;
        case 'arDate':
          dataMappers.push((client) => {
            if (!client.arDate) return '';
            const date = new Date(client.arDate);
            const month = (date.getMonth() + 1).toString().padStart(2, '0');
            const day = date.getDate().toString().padStart(2, '0');
            const year = date.getFullYear();
            return `${month}/${day}/${year}`;
          });
          break;
      }
    });

    // Use current page clients (filteredAndSortedClientInfo is already the current page from API)
    const csvContent = `${headers.join(',')}\n${filteredAndSortedClientInfo.map(client =>
      dataMappers.map(mapper => mapper(client)).join(',')
    ).join('\n')}`;

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'clients.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Settings popup handlers
  const handleSettingsClick = (e: React.MouseEvent, clientId: string) => {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    setSettingsPopup({ clientId, x: rect.left, y: rect.bottom + 5 });
  };

  const handleEditClient = (client: any) => {
    setClientToEdit(client);
    setShowEditClientDialog(true);
    setSettingsPopup(null);
  };

  const handleDeleteClient = (client: any) => {
    deleteClientById(client);
  };

  const handleCloseSettingsPopup = () => {
    setSettingsPopup(null);
  };

  return (
    <div className="space-y-6 p-6">
      <div className="mb-6">

        <Avatars activeTab={activeTab} title={"Clients"} />

        {/* Tabs */}
        <CustomTabs tabs={visibleTabs} activeTab={activeTab} setActiveTab={setActiveTab} />
      </div>
      {activeTab === "clientList" && isTabVisible("clientList") && (<>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {Array.isArray(clientsData?.data?.breakdown) &&
            clientsData.data.breakdown.length > 0 &&
            clientsData.data.breakdown
              .filter((item: any) =>
                ["totalClients", "soletrader", "partnership", "limitedcompany"].includes(
                  item.name
                )
              )
              .map((item: any) => (
                <Card key={item.name} className="h-full">
                  <CardContent className="p-4">
                    <div className="text-2xl font-bold !text-[#381980]">
                      {isLoading ? "..." : item.count}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {item.name === "totalClients"
                        ? "Total Clients"
                        : item.name === "soletrader"
                          ? "Sole Traders"
                          : item.name === "partnership"
                            ? "Partnerships"
                            : "Limited Companies"}
                    </p>
                  </CardContent>
                </Card>
              ))}
        </div>

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
                <TableRow className='!bg-[#edecf4] text-[#381980]'>
                  {columnOrder.map((key) => {
                    if (!visibleColumns[key as keyof typeof visibleColumns]) return null;
                    
                    let sortKey = '';
                    if (key === 'clientRef') sortKey = 'clientRef';
                    else if (key === 'clientName') sortKey = 'name';
                    else if (key === 'clientManager') sortKey = 'clientManager';
                    else if (key === 'clientStatus') sortKey = 'clientStatus';
                    else if (key === 'businessType') sortKey = 'clientType';
                    else if (key === 'taxNumber') sortKey = 'customerNumber';
                    else if (key === 'yearEnd') sortKey = 'yearEnd';
                    else if (key === 'audit') sortKey = 'audit';
                    else if (key === 'croNumber') sortKey = 'croNumber';
                    else if (key === 'croLink') sortKey = 'croLink';
                    else if (key === 'arDate') sortKey = 'arDate';
                    else if (key === 'address') sortKey = 'address';
                    else if (key === 'phone') sortKey = 'phone';
                    else if (key === 'phoneNote') sortKey = 'phoneNote';
                    else if (key === 'email') sortKey = 'email';
                    else if (key === 'emailNote') sortKey = 'emailNote';
                    else if (key === 'onboardedDate') sortKey = 'onboardedDate';
                    else if (key === 'amlCompliant') sortKey = 'amlCompliant';
                    else sortKey = key;

                    return (
                      <TableHead key={key} className="border-r text-left">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleClientInfoSort(sortKey)}
                          className="h-8 px-1 font-medium justify-start text-[12px] hover:bg-transparent hover:text-inherit !text-[#381980]"
                        >
                          {columnDisplayNames[key]}
                          {getSortIcon(sortKey)}
                        </Button>
                      </TableHead>
                    );
                  })}
                  <TableHead className="p-3 text-center">
                    <div className="flex gap-[6px] justify-center">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 bg-white rounded-full"
                        onClick={exportToCSV}
                        aria-label="Export CSV"
                        title="Export CSV (current page, visible columns)"
                      >
                        <Download className="h-3 w-3" color='#381980' />
                      </Button>
                      <Popover>
                        <PopoverTrigger>
                          <Button variant="ghost" size="sm" className="h-6 w-6 p-0 bg-white rounded-full" aria-label="Show/Hide Columns" title="Show/Hide Columns">
                            <Move className="h-3 w-3" color='#381980' />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent
                          className="w-64 max-h-96 overflow-y-auto z-50"
                          align="start"
                          side="bottom"
                          sideOffset={5}
                          avoidCollisions={true}
                          collisionPadding={10}
                        >
                          <div className="space-y-3">
                            <h4 className="font-medium text-sm">Show/Hide Columns</h4>
                            <div className="space-y-2">
                              {columnOrder.map((key) => (
                                <div
                                  key={key}
                                  className={`flex items-center space-x-2 p-2 rounded-md cursor-move hover:bg-gray-50 transition-colors ${draggedItem === key ? 'opacity-50' : ''
                                    }`}
                                  draggable
                                  onDragStart={(e) => handleDragStart(e, key)}
                                  onDragOver={handleDragOver}
                                  onDrop={(e) => handleDrop(e, key)}
                                  onDragEnd={handleDragEnd}
                                >
                                  <GripVertical className="h-4 w-4 text-gray-400 cursor-move" />
                                  <Checkbox
                                    id={key}
                                    checked={(visibleColumns as any)[key]}
                                    onCheckedChange={() => toggleColumn(key as keyof typeof visibleColumns)}
                                  />
                                  <Label htmlFor={key} className="text-sm cursor-pointer flex-1">
                                    {columnDisplayNames[key]}
                                  </Label>
                                </div>
                              ))}
                            </div>
                          </div>
                        </PopoverContent>
                      </Popover>
                    </div>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={columnOrder.filter(k => visibleColumns[k as keyof typeof visibleColumns]).length + 1} className="text-center py-8">
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        <span className="ml-2">Loading clients...</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : error ? (
                  <TableRow>
                    <TableCell colSpan={columnOrder.filter(k => visibleColumns[k as keyof typeof visibleColumns]).length + 1} className="text-center py-8 text-red-600">
                      Error loading clients. Please try again.
                    </TableCell>
                  </TableRow>
                ) : filteredAndSortedClientInfo.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={columnOrder.filter(k => visibleColumns[k as keyof typeof visibleColumns]).length + 1} className="text-center py-8 text-gray-500">
                      No clients found.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredAndSortedClientInfo.map((client: any, index) => (
                    <TableRow key={client._id} className="h-12 whitespace-nowrap">
                      {columnOrder.map((key) => {
                        if (!visibleColumns[key as keyof typeof visibleColumns]) return null;

                        let cellContent;
                        switch (key) {
                          case 'clientRef':
                            cellContent = client.clientRef;
                            break;
                          case 'clientName':
                            cellContent = (
                              <ClientNameLink name={client.name} ciientId={client._id} />
                            );
                            break;
                          case 'clientManager':
                            cellContent = client.clientManager || '-';
                            break;
                          case 'businessType':
                            cellContent = client.businessTypeId?.name || 'N/A';
                            break;
                          case 'taxNumber':
                            cellContent = client.taxNumber;
                            break;
                          case 'croNumber':
                            cellContent = client.croNumber;
                            break;
                          case 'croLink':
                            cellContent = client.croLink ? (
                              <div className="for-link-icon">
                                <a href={client.croLink} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline underline-text">
                                {client.croLink}
                                <Link/>
                              </a>
                              </div>
                            ) : '-';
                            break;
                          case 'address':
                            cellContent = client.address;
                            break;
                          case 'email':
                            cellContent = client.email;
                            break;
                          case 'emailNote':
                            cellContent = client.emailNote;
                            break;
                          case 'phone':
                            cellContent = client.phone;
                            break;
                          case 'phoneNote':
                            cellContent = client.phoneNote;
                            break;
                          case 'onboardedDate':
                            cellContent = (() => {
                              const date = new Date(client.onboardedDate);
                              const month = (date.getMonth() + 1).toString().padStart(2, '0');
                              const day = date.getDate().toString().padStart(2, '0');
                              const year = date.getFullYear();
                              return `${month}/${day}/${year}`;
                            })();
                            break;
                          case 'amlCompliant':
                            cellContent = client.amlCompliant ? 'Yes' : '';
                            break;
                          case 'audit':
                            cellContent = client.audit ? 'Yes' : '';
                            break;
                          case 'clientStatus':
                            cellContent = client.clientStatus || '-';
                            break;
                          case 'yearEnd':
                            cellContent = client.yearEnd || '-';
                            break;
                          case 'arDate':
                            cellContent = client.arDate ? (() => {
                              const date = new Date(client.arDate);
                              const month = (date.getMonth() + 1).toString().padStart(2, '0');
                              const day = date.getDate().toString().padStart(2, '0');
                              const year = date.getFullYear();
                              return `${month}/${day}/${year}`;
                            })() : '-';
                            break;
                          default:
                            cellContent = '-';
                        }

                        return (
                          <TableCell key={key} className={`p-4 text-sm border-r text-left ${key === 'clientName' ? 'font-medium' : ''}`}>
                            {cellContent}
                          </TableCell>
                        );
                      })}
                      <TableCell className="text-center">
                        <div className="flex justify-center">
                          <button
                            onClick={(e) => handleSettingsClick(e, client._id)}
                            className="p-1 hover:bg-gray-100 rounded"
                          >
                            <Settings className='text-[#381980]' size={16} />
                          </button>
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

      {activeTab === '' && <div>YOU HAVE NOT ACCESS</div>}

      <ServiceChangesLogDialog
        open={showServiceLog}
        onOpenChange={setShowServiceLog}
      />

      {selectedClientForDetails && showClientServiceLogDialog && (
        <EditClientModal
          open={showClientServiceLogDialog}
          onOpenChange={setShowClientServiceLogDialog}
          clientData={convertClientInfoToFullClientData(selectedClientForDetails)}
        />
      )}
      <AddClient dialogOpen={addClient} setDialogOpen={setAddClient} />

      {/* Edit Client Dialog */}
      {clientToEdit && (
        <AddClient
          dialogOpen={showEditClientDialog}
          setDialogOpen={setShowEditClientDialog}
          editMode={true}
          clientToEdit={convertClientInfoToClientData(clientToEdit)}
          onClientAdd={() => {
            // Refresh the client list after edit
            setShowEditClientDialog(false);
            setClientToEdit(null);
          }}
        />
      )}

      {/* Settings Popup */}
      {settingsPopup && (
        <div
          className="fixed z-50 bg-white border border-gray-200 rounded-md shadow-lg py-1 min-w-[120px]"
          style={{
            left: settingsPopup.x,
            top: settingsPopup.y
          }}
        >
          <button
            onClick={() => {
              const client = filteredAndSortedClientInfo.find(c => c._id === settingsPopup.clientId);
              if (client) handleEditClient(client);
            }}
            className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2"
          >
            <Edit2 size={14} />
            Edit
          </button>
          <button
            onClick={() => {
              const client = filteredAndSortedClientInfo.find(c => c._id === settingsPopup.clientId);
              if (client) handleDeleteClient(client);
            }}
            className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 text-red-600 flex items-center gap-2"
          >
            <Trash2 size={14} />
            Delete
          </button>
        </div>
      )}

      {/* Click outside to close popup */}
      {settingsPopup && (
        <div
          className="fixed inset-0 z-40"
          onClick={handleCloseSettingsPopup}
        />
      )}
    </div>
  );
};

export default ClientInformationTab;