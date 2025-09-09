import React, { useState, useMemo, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowUpDown, Search, FileText } from 'lucide-react';
import { DashboardCard, DashboardGrid } from "@/components/ui/dashboard-card";
import { Switch } from "@/components/ui/switch";
import ClientsTab from './ClientsTab';
import ClientNameLink from './ClientNameLink';
import ClientDetailsDialog from './ClientDetailsDialog';
import ServiceChangesLogDialog from './ServiceChangesLogDialog';
import CustomTabs from './Tabs';
import AddClient from './client/AddClient';

interface ClientInfo {
  name: string;
  address: string;
  contact: string;
  email: string;
  emailNote: string;
  phone: string;
  phoneNote: string;
  clientType: string;
  clientRef: string;
  onboardedDate: string;
  amlCompliant: boolean;
  croNumber: string;
  clientTags: string[];
  customerNumber: string;
  taxes: string[];
}

const ClientInformationTab = () => {
  const [activeTab, setActiveTab] = useState('details');
  const [serviceSelections, setServiceSelections] = useState<{ [key: string]: { [key: string]: boolean } }>({});
  const [servicesLocked, setServicesLocked] = useState(false);
  const [showServiceLog, setShowServiceLog] = useState(false);
  const [addClient, setAddClient] = useState(false);
  const [clientInfo] = useState<ClientInfo[]>([
    {
      name: 'Water Savers Limited',
      address: '123 Water Street, Dublin 2',
      contact: 'John Smith',
      email: 'john@watersavers.ie',
      emailNote: 'Main contact email',
      phone: '+353 1 234 5678',
      phoneNote: 'Office number',
      clientType: 'Limited Company',
      clientRef: 'WAT-23',
      onboardedDate: '2024-01-15',
      amlCompliant: true,
      croNumber: '123456',
      clientTags: ['Audit', 'VAT'],
      customerNumber: '1234567T',
      taxes: ['VAT', 'PAYE-EMP', 'CT']
    },
    {
      name: 'Green Gardens Limited',
      address: '456 Garden Lane, Cork',
      contact: 'Sarah Johnson',
      email: 'sarah@greengardens.ie',
      emailNote: 'Finance department',
      phone: '+353 21 987 6543',
      phoneNote: 'Direct line',
      clientType: 'Limited Company',
      clientRef: 'GRE-22',
      onboardedDate: '2023-11-20',
      amlCompliant: true,
      croNumber: '234567',
      clientTags: ['Payroll', 'Income Tax'],
      customerNumber: '2345678U',
      taxes: ['CT', 'VAT']
    },
    {
      name: 'Brown Enterprises',
      address: '789 Business Park, Galway',
      contact: 'Michael Brown',
      email: 'michael@brownenterprises.ie',
      emailNote: 'Owner direct',
      phone: '+353 91 555 0123',
      phoneNote: 'Mobile',
      clientType: 'Sole Trader',
      clientRef: 'BRO-21',
      onboardedDate: '2023-09-10',
      amlCompliant: false,
      croNumber: '',
      clientTags: ['Audit'],
      customerNumber: '3456789V',
      taxes: ['IT']
    },
    {
      name: 'Smith & Associates',
      address: '321 Professional Plaza, Limerick',
      contact: 'Emily Smith',
      email: 'emily@smithassociates.ie',
      emailNote: 'Partner email',
      phone: '+353 61 444 7890',
      phoneNote: 'Reception',
      clientType: 'Limited Company',
      clientRef: 'SMI-24',
      onboardedDate: '2024-02-01',
      amlCompliant: true,
      croNumber: '345678',
      clientTags: ['VAT', 'Payroll'],
      customerNumber: '4567890W',
      taxes: ['IT', 'VAT']
    },
    {
      name: 'Tech Solutions Inc.',
      address: '654 Innovation Hub, Waterford',
      contact: 'David Wilson',
      email: 'david@techsolutions.ie',
      emailNote: 'CEO email',
      phone: '+353 51 222 3456',
      phoneNote: 'Main office',
      clientType: 'Limited Company',
      clientRef: 'TEC-25',
      onboardedDate: '2024-03-12',
      amlCompliant: true,
      croNumber: '456789',
      clientTags: ['Income Tax', 'VAT'],
      customerNumber: '5678901X',
      taxes: ['CT', 'VAT', 'PAYE-EMP']
    },
    {
      name: 'Financial Advisors Co.',
      address: '987 Finance District, Dublin 4',
      contact: 'Lisa Thompson',
      email: 'lisa@financialadvisors.ie',
      emailNote: 'Business contact',
      phone: '+353 1 777 8901',
      phoneNote: 'Office line',
      clientType: 'Sole Trader',
      clientRef: 'FIN-20',
      onboardedDate: '2023-12-05',
      amlCompliant: false,
      croNumber: '',
      clientTags: ['Audit', 'Income Tax'],
      customerNumber: '6789012Y',
      taxes: ['CT', 'VAT']
    },
    {
      name: 'Maritime Logistics Ltd.',
      address: '445 Port Avenue, Dublin 1',
      contact: 'Peter Murphy',
      email: 'peter@maritimelogistics.ie',
      emailNote: 'Operations manager',
      phone: '+353 1 888 9999',
      phoneNote: 'Operations',
      clientType: 'Limited Company',
      clientRef: 'MAR-23',
      onboardedDate: '2024-01-22',
      amlCompliant: true,
      croNumber: '567890',
      clientTags: ['VAT', 'Audit'],
      customerNumber: '7890123Z',
      taxes: ['CT', 'VAT']
    },
    {
      name: 'Creative Design Studio',
      address: '789 Art District, Cork',
      contact: 'Maria Garcia',
      email: 'maria@creativedesign.ie',
      emailNote: 'Creative director',
      phone: '+353 21 444 5555',
      phoneNote: 'Studio',
      clientType: 'Partnership',
      clientRef: 'CRE-24',
      onboardedDate: '2024-02-10',
      amlCompliant: true,
      croNumber: '678901',
      clientTags: ['Income Tax', 'Payroll'],
      customerNumber: '8901234A',
      taxes: ['CT', 'IT']
    },
    {
      name: 'Phoenix Construction',
      address: '112 Industrial Park, Galway',
      contact: 'Sean O\'Brien',
      email: 'sean@phoenixconstruction.ie',
      emailNote: 'Site manager',
      phone: '+353 91 666 7777',
      phoneNote: 'Site office',
      clientType: 'Limited Company',
      clientRef: 'PHO-22',
      onboardedDate: '2023-08-15',
      amlCompliant: false,
      croNumber: '',
      clientTags: ['VAT'],
      customerNumber: '9012345B',
      taxes: ['RCT', 'CT']
    },
    {
      name: 'Emerald Hospitality',
      address: '556 Tourism Avenue, Killarney',
      contact: 'Claire Kelly',
      email: 'claire@emeraldhospitality.ie',
      emailNote: 'General manager',
      phone: '+353 64 333 4444',
      phoneNote: 'Front desk',
      clientType: 'Limited Company',
      clientRef: 'EME-25',
      onboardedDate: '2024-03-05',
      amlCompliant: true,
      croNumber: '789012',
      clientTags: ['Payroll', 'VAT', 'Audit'],
      customerNumber: '0123456C',
      taxes: ['CT', 'VAT', 'PAYE-EMP']
    },
    {
      name: 'Digital Solutions Pro',
      address: '298 Tech Boulevard, Dublin 18',
      contact: 'Alan Byrne',
      email: 'alan@digitalsolutions.ie',
      emailNote: 'Tech lead',
      phone: '+353 1 222 3333',
      phoneNote: 'Direct',
      clientType: 'Limited Company',
      clientRef: 'DIG-24',
      onboardedDate: '2024-01-30',
      amlCompliant: true,
      croNumber: '890123',
      clientTags: ['Income Tax'],
      customerNumber: '1234567D',
      taxes: ['CT', 'IT']
    },
    {
      name: 'Atlantic Fisheries',
      address: '77 Coastal Road, Donegal',
      contact: 'Fiona Walsh',
      email: 'fiona@atlanticfisheries.ie',
      emailNote: 'Owner',
      phone: '+353 74 111 2222',
      phoneNote: 'Harbor office',
      clientType: 'Sole Trader',
      clientRef: 'ATL-23',
      onboardedDate: '2023-06-12',
      amlCompliant: false,
      croNumber: '',
      clientTags: ['VAT'],
      customerNumber: '2345678E',
      taxes: ['VAT']
    }
  ]);

  const [clientInfoSortConfig, setClientInfoSortConfig] = useState<{ key: string | null; direction: 'asc' | 'desc' }>({ key: null, direction: 'asc' });
  const [clientInfoSearch, setClientInfoSearch] = useState('');
  const [clientTypeFilter, setClientTypeFilter] = useState('all');
  const [clientTagsFilter, setClientTagsFilter] = useState('all');
  const [showClientDetailsDialog, setShowClientDetailsDialog] = useState(false);
  const [selectedClientForDetails, setSelectedClientForDetails] = useState<ClientInfo | null>(null);

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
      filtered = filtered.filter(client =>
        client.name.toLowerCase().includes(clientInfoSearch.toLowerCase()) ||
        client.contact.toLowerCase().includes(clientInfoSearch.toLowerCase()) ||
        client.email.toLowerCase().includes(clientInfoSearch.toLowerCase()) ||
        client.clientRef.toLowerCase().includes(clientInfoSearch.toLowerCase())
      );
    }

    // Apply client type filter
    if (clientTypeFilter && clientTypeFilter !== 'all') {
      filtered = filtered.filter(client => client.clientType === clientTypeFilter);
    }

    // Apply client tags filter
    if (clientTagsFilter && clientTagsFilter !== 'all') {
      filtered = filtered.filter(client =>
        client.clientTags.some(tag => tag.toLowerCase().includes(clientTagsFilter.toLowerCase()))
      );
    }

    // Apply sorting
    if (!clientInfoSortConfig.key) return filtered;

    return [...filtered].sort((a, b) => {
      const aValue = a[clientInfoSortConfig.key as keyof typeof a];
      const bValue = b[clientInfoSortConfig.key as keyof typeof b];

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return clientInfoSortConfig.direction === 'asc'
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }

      return 0;
    });
  }, [clientInfo, clientInfoSearch, clientTypeFilter, clientTagsFilter, clientInfoSortConfig]);

  const availableClientTypes = [...new Set(clientInfo.map(client => client.clientType))];
  const availableClientTags = [...new Set(clientInfo.flatMap(client => client.clientTags))];

  // Initialize service selections once when component mounts
  useEffect(() => {
    if (Object.keys(serviceSelections).length === 0) {
      const initialSelections: { [key: string]: { [key: string]: boolean } } = {};
      clientInfo.forEach(client => {
        initialSelections[client.clientRef] = {
          vat: client.clientTags.includes('VAT'),
          payroll: client.clientTags.includes('Payroll'),
          ct1: Math.random() > 0.6,
          incomeTax: client.clientTags.includes('Income Tax'),
          audit: client.clientTags.includes('Audit'),
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

  const tabs = [
    {
      id: 'details',
      label: 'Details',
    }, {
      id: 'client-breakdown',
      label: 'Client Breakdown',
    }
  ]

  return (
    <div className="space-y-6">
      <CustomTabs
        tabs={tabs}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />
      {activeTab == "details" && <>
        {/* Dashboard Cards */}
        <DashboardGrid columns={4}>
          <DashboardCard
            title="Total Clients"
            value={filteredAndSortedClientInfo.length}
          />

          <DashboardCard
            title="Limited Companies"
            value={filteredAndSortedClientInfo.filter(client => client.clientType === 'Limited Company').length}
          />

          <DashboardCard
            title="Sole Traders"
            value={filteredAndSortedClientInfo.filter(client => client.clientType === 'Sole Trader').length}
          />

          <DashboardCard
            title="Partnerships"
            value={filteredAndSortedClientInfo.filter(client => client.clientType === 'Partnership').length}
          />
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
            />
          </div>
          <Select value={clientTypeFilter} onValueChange={setClientTypeFilter}>
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
          <Button onClick={()=>setAddClient(true)} style={{ backgroundColor: '#017DB9', color: 'white' }} className="hover:opacity-90">
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
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAndSortedClientInfo.map((client, index) => (
                  <TableRow key={index} className="h-12">
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
                    <TableCell className="p-4 text-sm w-24 border-r text-left">{client.clientType}</TableCell>
                    <TableCell className="p-4 text-sm w-24 border-r text-left">{client.customerNumber}</TableCell>
                    <TableCell className="p-4 text-sm w-24 border-r text-left">{client.croNumber}</TableCell>
                    <TableCell className="p-4 text-sm w-40 border-r text-left">{client.address}</TableCell>
                    <TableCell className="p-4 text-sm w-24 border-r text-left">{client.contact}</TableCell>
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
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </>
      }


      {activeTab == "client-breakdown" && <ClientsTab />}

      <ServiceChangesLogDialog
        open={showServiceLog}
        onOpenChange={setShowServiceLog}
      />

      {/* Client Details Dialog */}
      {selectedClientForDetails && (
        <ClientDetailsDialog
          open={showClientDetailsDialog}
          onOpenChange={setShowClientDetailsDialog}
          clientData={{
            clientRef: selectedClientForDetails.clientRef,
            name: selectedClientForDetails.name,
            customerNumber: selectedClientForDetails.customerNumber,
            clientType: selectedClientForDetails.clientType,
            address: selectedClientForDetails.address,
            contactPerson: selectedClientForDetails.contact,
            email: selectedClientForDetails.email,
            phone: selectedClientForDetails.phone,
            takeOnDate: selectedClientForDetails.onboardedDate,
            clientTags: selectedClientForDetails.clientTags,
            taxes: selectedClientForDetails.taxes
          }}
        />
      )}
      <AddClient dialogOpen={addClient} setDialogOpen={setAddClient}/>
    </div>
  );
};

export default ClientInformationTab;