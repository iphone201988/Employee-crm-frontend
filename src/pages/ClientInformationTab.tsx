import React, { useState, useMemo, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowUpDown, Search, FileText, ChevronLeft, ChevronRight, Eye, Edit2, Trash2, Delete, Settings, Download, Move, GripVertical, Paperclip, Check, ChevronDown, RefreshCw } from 'lucide-react';
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
import { formatDateToDMY, normalizeOptionalText, parseDateValue } from '@/utils/clientFieldUtils';
import { useGetAllCategorieasQuery } from '@/store/categoryApi';
import { useDebounce } from 'use-debounce';
const tabs = [
  {
    id: 'clientList',
    label: 'Client List',
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
  const [clientInfoSortConfig, setClientInfoSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);
  const [clientInfoSearch, setClientInfoSearch] = useState('');
  const [debouncedSearch] = useDebounce(clientInfoSearch, 500);
  const [businessTypeFilter, setBusinessTypeFilter] = useState<Set<string>>(new Set());
  const [statusFilter, setStatusFilter] = useState<Set<string>>(new Set());
  const [auditFilter, setAuditFilter] = useState<Set<string>>(new Set());
  const [amlFilter, setAmlFilter] = useState<Set<string>>(new Set());
  const [yearEndFilter, setYearEndFilter] = useState<Set<string>>(new Set());

  const clientsQueryArgs = useMemo(
    () => ({
      page,
      limit,
      search: debouncedSearch || undefined,
      businessTypeIds: Array.from(businessTypeFilter),
      statuses: Array.from(statusFilter),
      audit: Array.from(auditFilter),
      aml: Array.from(amlFilter),
      yearEnds: Array.from(yearEndFilter),
    }),
    [page, limit, debouncedSearch, businessTypeFilter, statusFilter, auditFilter, amlFilter, yearEndFilter]
  );

  const { data: clientsData, isLoading, error } = useGetClientsQuery(clientsQueryArgs);
  const { data: categoriesData } = useGetAllCategorieasQuery("bussiness");

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
      email: normalizeOptionalText(clientInfo.email),
      emailNote: normalizeOptionalText(clientInfo.emailNote),
      phone: normalizeOptionalText(clientInfo.phone),
      phoneNote: normalizeOptionalText(clientInfo.phoneNote),
      onboardedDate: parseDateValue(clientInfo.onboardedDate),
      amlCompliant: clientInfo.amlCompliant,
      audit: clientInfo.audit,
      clientStatus: clientInfo.clientStatus || 'Current',
      yearEnd: clientInfo.yearEnd || '',
      arDate: parseDateValue(clientInfo.arDate),
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
      email: normalizeOptionalText(clientInfo.email),
      phone: normalizeOptionalText(clientInfo.phone),
      onboardedDate: parseDateValue(clientInfo.onboardedDate),
      amlCompliant: clientInfo.amlCompliant,
      audit: clientInfo.audit,
      clientStatus: clientInfo.clientStatus || 'Current',
      yearEnd: clientInfo.yearEnd || '',
      arDate: parseDateValue(clientInfo.arDate),
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

    // Backend now handles search for name, clientRef, and email
    // No client-side search filtering needed - all filtering is done server-side

    if (businessTypeFilter.size > 0) {
      filtered = filtered.filter((client: any) => {
        const bt = client.businessTypeId;
        if (!bt) return false;
        const id = typeof bt === 'object' ? bt._id : bt;
        return id ? businessTypeFilter.has(id) : false;
      });
    }

    if (statusFilter.size > 0) {
      filtered = filtered.filter((client: any) => {
        const status = (client.clientStatus || '').trim();
        return status && statusFilter.has(status);
      });
    }

    if (auditFilter.size > 0) {
      filtered = filtered.filter((client: any) => {
        const isAudit = Boolean(client.audit);
        return (isAudit && auditFilter.has('yes')) || (!isAudit && auditFilter.has('no'));
      });
    }

    if (amlFilter.size > 0) {
      filtered = filtered.filter((client: any) => {
        const isAml = Boolean(client.amlCompliant);
        return (isAml && amlFilter.has('yes')) || (!isAml && amlFilter.has('no'));
      });
    }

    if (yearEndFilter.size > 0) {
      filtered = filtered.filter((client: any) => client.yearEnd && yearEndFilter.has(client.yearEnd));
    }

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

      if (isNumeric) {
        const result = aValue - bValue;
        return clientInfoSortConfig.direction === 'asc' ? result : -result;
      }

      const strA = String(aValue || '').toLowerCase().trim();
      const strB = String(bValue || '').toLowerCase().trim();
      const comparison = strA.localeCompare(strB, undefined, { numeric: true, sensitivity: 'base' });
      return clientInfoSortConfig.direction === 'asc' ? comparison : -comparison;
    });
  }, [processedClientInfo, businessTypeFilter, statusFilter, auditFilter, amlFilter, yearEndFilter, clientInfoSortConfig]);

  const businessTypeOptions = useMemo(() => {
    // Use categories data from API (same as AddClient form) to get all business types
    const businessTypes = categoriesData?.data?.bussiness || [];
    const mapped = businessTypes.map((bt: any) => ({
      id: bt._id,
      name: bt.name || 'Unknown',
    }));
    // Sort alphabetically by name (case-insensitive)
    return mapped.sort((a, b) =>
      String(a.name || '').toLowerCase().localeCompare(String(b.name || '').toLowerCase())
    );
  }, [categoriesData]);

  const statusOptions = useMemo(() => {
    const defaults = ['Prospect', 'Current', 'Archived'];
    const seen = new Set<string>();
    const ordered: string[] = [];
    const addStatus = (value?: string) => {
      if (!value) return;
      if (!seen.has(value)) {
        seen.add(value);
        ordered.push(value);
      }
    };
    defaults.forEach(addStatus);
    processedClientInfo.forEach((client: any) => addStatus(client.clientStatus));
    return ordered;
  }, [processedClientInfo]);

  const yearEndOptions = useMemo(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const daysInMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    const template = months.map((month, idx) => `${daysInMonth[idx]} - ${month}`);
    const seen = new Set(template);
    processedClientInfo.forEach((client: any) => {
      if (client.yearEnd && !seen.has(client.yearEnd)) {
        template.push(client.yearEnd);
        seen.add(client.yearEnd);
      }
    });
    return template;
  }, [processedClientInfo]);

  const yesNoOptions = [
    { label: 'Yes', value: 'yes' },
    { label: 'No', value: 'no' },
  ];

  const toggleOption = (value: string, setter: React.Dispatch<React.SetStateAction<Set<string>>>) => {
    setter(prev => {
      const next = new Set(prev);
      if (next.has(value)) {
        next.delete(value);
      } else {
        next.add(value);
      }
      return next;
    });
  };

  const getSelectedLabel = (values: Set<string>, fallback: string) => {
    if (values.size === 0) return fallback;
    const selected = Array.from(values);
    if (selected.length <= 2) return selected.join(', ');
    return `${selected.length} Selected`;
  };

  const handleResetFilters = () => {
    setBusinessTypeFilter(new Set());
    setStatusFilter(new Set());
    setAuditFilter(new Set());
    setAmlFilter(new Set());
    setYearEndFilter(new Set());
  };

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

  useEffect(() => {
    setPage(1);
  }, [businessTypeFilter, statusFilter, auditFilter, amlFilter, yearEndFilter, debouncedSearch]);

  const totalClientRows = clientsData?.data?.pagination?.totalClients ?? filteredAndSortedClientInfo.length;

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
          dataMappers.push((client) => formatDateToDMY(client.onboardedDate));
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
          dataMappers.push((client) => client.arDate ? formatDateToDMY(client.arDate, '') : '');
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
        <div className="bg-[#E7E5F2] p-[6px] rounded-sm flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-end gap-2 flex-1 min-w-[300px]">
            <div className="relative flex-1 min-w-[220px] max-w-[260px]">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search clients..."
              value={clientInfoSearch}
              onChange={(e) => setClientInfoSearch(e.target.value)}
                className="pl-10 bg-white text-[#381980] font-semibold h-10"
              disabled={isLoading}
            />
          </div>
            <Popover>
              <PopoverTrigger asChild>
                <button
                  className={`min-w-[170px] h-10 px-3 rounded-md border flex items-center justify-between text-sm font-semibold ${businessTypeFilter.size > 0 ? 'bg-gray-200 border-black' : 'bg-white border-[#d4d4d8]'}`}
                >
                  <span className="truncate text-[#381980]">All Business Type</span>
                  <ChevronDown className="w-4 h-4 text-[#381980]" />
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-56 p-2" align="start">
                <div className="max-h-64 overflow-auto space-y-1">
                  <div
                    className={`px-2 py-1.5 rounded-[4px] cursor-pointer ${businessTypeFilter.size === 0 ? 'bg-[#5f46b9] text-white' : 'hover:bg-[#5f46b9] hover:text-white'}`}
                    onClick={() => setBusinessTypeFilter(new Set())}
                  >
                    All Business Type
                  </div>
                  {businessTypeOptions.map(option => {
                    const active = businessTypeFilter.has(option.id);
                    return (
                      <div
                        key={option.id}
                        className={`flex items-center justify-between px-2 py-1.5 rounded-[4px] cursor-pointer ${active ? 'bg-[#5f46b9] text-white' : 'hover:bg-[#5f46b9] hover:text-white'}`}
                        onClick={() => toggleOption(option.id, setBusinessTypeFilter)}
                      >
                        <span className="truncate">{option.name}</span>
                        {active && <Check className="w-4 h-4" />}
                      </div>
                    );
                  })}
                </div>
              </PopoverContent>
            </Popover>

            <Popover>
              <PopoverTrigger asChild>
                <button
                  className={`min-w-[150px] h-10 px-3 rounded-md border flex items-center justify-between text-sm font-semibold ${statusFilter.size > 0 ? 'bg-gray-200 border-black' : 'bg-white border-[#d4d4d8]'}`}
                >
                  <span className="truncate text-[#381980]">All Status</span>
                  <ChevronDown className="w-4 h-4 text-[#381980]" />
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-48 p-2" align="start">
                <div className="max-h-64 overflow-auto space-y-1">
                  <div
                    className={`px-2 py-1.5 rounded-[4px] cursor-pointer ${statusFilter.size === 0 ? 'bg-[#5f46b9] text-white' : 'hover:bg-[#5f46b9] hover:text-white'}`}
                    onClick={() => setStatusFilter(new Set())}
                  >
                    All Status
                  </div>
                  {statusOptions.map(option => {
                    const active = statusFilter.has(option);
                    return (
                      <div
                        key={option}
                        className={`flex items-center justify-between px-2 py-1.5 rounded-[4px] cursor-pointer ${active ? 'bg-[#5f46b9] text-white' : 'hover:bg-[#5f46b9] hover:text-white'}`}
                        onClick={() => toggleOption(option, setStatusFilter)}
                      >
                        <span className="truncate">{option}</span>
                        {active && <Check className="w-4 h-4" />}
                      </div>
                    );
                  })}
                </div>
              </PopoverContent>
            </Popover>

            <Popover>
              <PopoverTrigger asChild>
                <button
                  className={`min-w-[150px] h-10 px-3 rounded-md border flex items-center justify-between text-sm font-semibold ${auditFilter.size > 0 ? 'bg-gray-200 border-black' : 'bg-white border-[#d4d4d8]'}`}
                >
                  <span className="truncate text-[#381980]">In Audit</span>
                  <ChevronDown className="w-4 h-4 text-[#381980]" />
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-44 p-2" align="start">
                <div className="space-y-1">
                  <div
                    className={`px-2 py-1.5 rounded-[4px] cursor-pointer ${auditFilter.size === 0 ? 'bg-[#5f46b9] text-white' : 'hover:bg-[#5f46b9] hover:text-white'}`}
                    onClick={() => setAuditFilter(new Set())}
                  >
                    All
                  </div>
                  {yesNoOptions.map(option => {
                    const active = auditFilter.has(option.value);
                    return (
                      <div
                        key={option.value}
                        className={`flex items-center justify-between px-2 py-1.5 rounded-[4px] cursor-pointer ${active ? 'bg-[#5f46b9] text-white' : 'hover:bg-[#5f46b9] hover:text-white'}`}
                        onClick={() => toggleOption(option.value, setAuditFilter)}
                      >
                        <span>{option.label}</span>
                        {active && <Check className="w-4 h-4" />}
                      </div>
                    );
                  })}
                </div>
              </PopoverContent>
            </Popover>

            <Popover>
              <PopoverTrigger asChild>
                <button
                  className={`min-w-[150px] h-10 px-3 rounded-md border flex items-center justify-between text-sm font-semibold ${amlFilter.size > 0 ? 'bg-gray-200 border-black' : 'bg-white border-[#d4d4d8]'}`}
                >
                  <span className="truncate text-[#381980]">AML Compliant</span>
                  <ChevronDown className="w-4 h-4 text-[#381980]" />
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-44 p-2" align="start">
                <div className="space-y-1">
                  <div
                    className={`px-2 py-1.5 rounded-[4px] cursor-pointer ${amlFilter.size === 0 ? 'bg-[#5f46b9] text-white' : 'hover:bg-[#5f46b9] hover:text-white'}`}
                    onClick={() => setAmlFilter(new Set())}
                  >
                    All
                  </div>
                  {yesNoOptions.map(option => {
                    const active = amlFilter.has(option.value);
                    return (
                      <div
                        key={option.value}
                        className={`flex items-center justify-between px-2 py-1.5 rounded-[4px] cursor-pointer ${active ? 'bg-[#5f46b9] text-white' : 'hover:bg-[#5f46b9] hover:text-white'}`}
                        onClick={() => toggleOption(option.value, setAmlFilter)}
                      >
                        <span>{option.label}</span>
                        {active && <Check className="w-4 h-4" />}
                      </div>
                    );
                  })}
                </div>
              </PopoverContent>
            </Popover>

            <Popover>
              <PopoverTrigger asChild>
                <button
                  className={`min-w-[150px] h-10 px-3 rounded-md border flex items-center justify-between text-sm font-semibold ${yearEndFilter.size > 0 ? 'bg-gray-200 border-black' : 'bg-white border-[#d4d4d8]'}`}
                >
                  <span className="truncate text-[#381980]">Year End</span>
                  <ChevronDown className="w-4 h-4 text-[#381980]" />
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-52 p-2" align="start">
                <div className="max-h-64 overflow-auto space-y-1">
                  <div
                    className={`px-2 py-1.5 rounded-[4px] cursor-pointer ${yearEndFilter.size === 0 ? 'bg-[#5f46b9] text-white' : 'hover:bg-[#5f46b9] hover:text-white'}`}
                    onClick={() => setYearEndFilter(new Set())}
                  >
                    All Year Ends
                  </div>
                  {yearEndOptions.map(option => {
                    const active = yearEndFilter.has(option);
                    return (
                      <div
                        key={option}
                        className={`flex items-center justify-between px-2 py-1.5 rounded-[4px] cursor-pointer ${active ? 'bg-[#5f46b9] text-white' : 'hover:bg-[#5f46b9] hover:text-white'}`}
                        onClick={() => toggleOption(option, setYearEndFilter)}
                      >
                        <span>{option}</span>
                        {active && <Check className="w-4 h-4" />}
                      </div>
                    );
                  })}
                </div>
              </PopoverContent>
            </Popover>
            <Button
              variant="outline"
              className="bg-[#381980] w-[42px] rounded-sm text-primary-foreground p-2 hover:bg-primary/90 !text-white"
              onClick={handleResetFilters}
              disabled={isLoading}
            >
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>
          <div className="flex items-center gap-3 ml-auto">
            <span className="text-sm text-[#381980] font-semibold whitespace-nowrap">{totalClientRows} Rows</span>
            <Button
              onClick={() => setAddClient(true)}
              style={{ backgroundColor: '#017DB9', color: 'white' }}
              className="hover:opacity-90"
              disabled={isLoading}
            >
              + New Client
            </Button>
          </div>
        </div>
        <Card className="relative">
          {isLoading && (
            <div className="absolute inset-0 bg-white/70 backdrop-blur-sm z-10 flex items-center justify-center rounded-md">
              <div className="flex flex-col items-center gap-2">
                <div className="animate-spin rounded-full h-10 w-10 border-4 border-[#381980] border-t-transparent"></div>
                <span className="text-sm font-medium text-[#381980]">Loading clients...</span>
              </div>
            </div>
          )}
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
                          disabled={isLoading}
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
                        disabled={isLoading}
                      >
                        <Download className="h-3 w-3" color='#381980' />
                      </Button>
                      <Popover>
                        <PopoverTrigger>
                          <Button variant="ghost" size="sm" className="h-6 w-6 p-0 bg-white rounded-full" aria-label="Show/Hide Columns" title="Show/Hide Columns" disabled={isLoading}>
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
                {isLoading && filteredAndSortedClientInfo.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={columnOrder.filter(k => visibleColumns[k as keyof typeof visibleColumns]).length + 1} className="text-center py-8">
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#381980]"></div>
                        <span className="ml-2 text-[#381980]">Loading clients...</span>
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
                    <TableRow key={client._id} className={`h-12 whitespace-nowrap ${isLoading ? 'opacity-50' : ''}`}>
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
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0 text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  window.open(client.croLink, '_blank', 'noopener,noreferrer');
                                }}
                                title="Open CRO Link"
                              >
                                <Paperclip className="h-4 w-4" />
                              </Button>
                            ) : '-';
                            break;
                          case 'address':
                            cellContent = client.address;
                            break;
                          case 'email':
                            {
                              const emailValue = normalizeOptionalText(client.email);
                              cellContent = emailValue || 'No Email';
                            }
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
                            cellContent = formatDateToDMY(client.onboardedDate);
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
                            cellContent = formatDateToDMY(client.arDate);
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
                            disabled={isLoading}
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

        {clientsData?.data?.pagination && (() => {
          const pagination = clientsData.data.pagination;
          return (
            <div className="space-y-4 mt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">Show:</span>
                    <select
                      value={limit}
                      onChange={(e) => setLimit(Number(e.target.value))}
                      className="border border-gray-300 rounded px-2 py-1 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={isLoading}
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
                  {isLoading && (
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-[#381980]/10 rounded-md border border-[#381980]/20">
                      <div className="animate-spin rounded-full h-5 w-5 border-3 border-[#381980] border-t-transparent"></div>
                      <span className="text-sm font-medium text-[#381980]">Loading data...</span>
                    </div>
                  )}
                </div>

                <div className={`text-sm ${isLoading ? 'text-gray-400' : 'text-gray-500'}`}>
                  Showing {((page - 1) * limit) + 1} to {Math.min(page * limit, pagination.totalClients)} of {pagination.totalClients} clients
                </div>
              </div>

              {pagination.totalPages > 1 && (
                <div className="flex justify-center items-center gap-2">
                  <Button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1 || isLoading}
                    variant="outline"
                    size="sm"
                    className="disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading && page > 1 ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent mr-2"></div>
                    ) : (
                      <ChevronLeft className="h-4 w-4" />
                    )}
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
                          className={`w-8 h-8 p-0 disabled:opacity-50 disabled:cursor-not-allowed ${page === pageNum && isLoading ? 'relative' : ''}`}
                        >
                          {page === pageNum && isLoading ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent"></div>
                          ) : (
                            pageNum
                          )}
                        </Button>
                      );
                    })}
                  </div>

                  <Button
                    onClick={() => setPage(p => p + 1)}
                    disabled={page >= pagination.totalPages || isLoading}
                    variant="outline"
                    size="sm"
                    className="disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                    {isLoading && page < pagination.totalPages ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent ml-2"></div>
                    ) : (
                      <ChevronRight className="h-4 w-4 ml-0" />
                    )}
                  </Button>
                </div>
              )}
            </div>
          );
        })()}
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