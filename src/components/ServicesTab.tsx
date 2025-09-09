import React, { useState, useMemo, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowUpDown, Search, FileText } from 'lucide-react';
import { DashboardCard, DashboardGrid } from "@/components/ui/dashboard-card";
import { Switch } from "@/components/ui/switch";
import ClientNameLink from './ClientNameLink';
import ServiceChangesLogDialog from './ServiceChangesLogDialog';

interface ClientInfo {
  name: string;
  address: string;
  contact: string;
  email: string;
  phone: string;
  clientType: string;
  clientRef: string;
  engagementDate: string;
  clientTags: string[];
  customerNumber: string;
  taxes: string[];
}

const ServicesTab = () => {
  const [serviceSelections, setServiceSelections] = useState<{[key: string]: {[key: string]: boolean}}>({});
  const [servicesLocked, setServicesLocked] = useState(true);
  const [showServiceLog, setShowServiceLog] = useState(false);
  const [clientInfo] = useState<ClientInfo[]>([
    {
      name: 'Water Savers Limited',
      address: '123 Water Street, Dublin 2',
      contact: 'John Smith',
      email: 'john@watersavers.ie',
      phone: '+353 1 234 5678',
      clientType: 'Limited Company',
      clientRef: 'WAT-23',
      engagementDate: '2024-01-15',
      clientTags: ['Audit', 'VAT'],
      customerNumber: '1234567T',
      taxes: ['VAT', 'PAYE-EMP', 'CT']
    },
    {
      name: 'Green Gardens Limited',
      address: '456 Garden Lane, Cork',
      contact: 'Sarah Johnson',
      email: 'sarah@greengardens.ie',
      phone: '+353 21 987 6543',
      clientType: 'Limited Company',
      clientRef: 'GRE-22',
      engagementDate: '2023-11-20',
      clientTags: ['Payroll', 'Income Tax'],
      customerNumber: '2345678U',
      taxes: ['CT', 'VAT']
    },
    {
      name: 'Brown Enterprises',
      address: '789 Business Park, Galway',
      contact: 'Michael Brown',
      email: 'michael@brownenterprises.ie',
      phone: '+353 91 555 0123',
      clientType: 'Sole Trader',
      clientRef: 'BRO-21',
      engagementDate: '2023-09-10',
      clientTags: ['Audit'],
      customerNumber: '3456789V',
      taxes: ['IT']
    },
    {
      name: 'Smith & Associates',
      address: '321 Professional Plaza, Limerick',
      contact: 'Emily Smith',
      email: 'emily@smithassociates.ie',
      phone: '+353 61 444 7890',
      clientType: 'Limited Company',
      clientRef: 'SMI-24',
      engagementDate: '2024-02-01',
      clientTags: ['VAT', 'Payroll'],
      customerNumber: '4567890W',
      taxes: ['IT', 'VAT']
    },
    {
      name: 'Tech Solutions Inc.',
      address: '654 Innovation Hub, Waterford',
      contact: 'David Wilson',
      email: 'david@techsolutions.ie',
      phone: '+353 51 222 3456',
      clientType: 'Limited Company',
      clientRef: 'TEC-25',
      engagementDate: '2024-03-12',
      clientTags: ['Income Tax', 'VAT'],
      customerNumber: '5678901X',
      taxes: ['CT', 'VAT', 'PAYE-EMP']
    },
    {
      name: 'Financial Advisors Co.',
      address: '987 Finance District, Dublin 4',
      contact: 'Lisa Thompson',
      email: 'lisa@financialadvisors.ie',
      phone: '+353 1 777 8901',
      clientType: 'Sole Trader',
      clientRef: 'FIN-20',
      engagementDate: '2023-12-05',
      clientTags: ['Audit', 'Income Tax'],
      customerNumber: '6789012Y',
      taxes: ['CT', 'VAT']
    },
    {
      name: 'Maritime Logistics Ltd.',
      address: '445 Port Avenue, Dublin 1',
      contact: 'Peter Murphy',
      email: 'peter@maritimelogistics.ie',
      phone: '+353 1 888 9999',
      clientType: 'Limited Company',
      clientRef: 'MAR-23',
      engagementDate: '2024-01-22',
      clientTags: ['VAT', 'Audit'],
      customerNumber: '7890123Z',
      taxes: ['CT', 'VAT']
    },
    {
      name: 'Creative Design Studio',
      address: '789 Art District, Cork',
      contact: 'Maria Garcia',
      email: 'maria@creativedesign.ie',
      phone: '+353 21 444 5555',
      clientType: 'Partnership',
      clientRef: 'CRE-24',
      engagementDate: '2024-02-10',
      clientTags: ['Income Tax', 'Payroll'],
      customerNumber: '8901234A',
      taxes: ['CT', 'IT']
    },
    {
      name: 'Phoenix Construction',
      address: '112 Industrial Park, Galway',
      contact: 'Sean O\'Brien',
      email: 'sean@phoenixconstruction.ie',
      phone: '+353 91 666 7777',
      clientType: 'Limited Company',
      clientRef: 'PHO-22',
      engagementDate: '2023-08-15',
      clientTags: ['VAT'],
      customerNumber: '9012345B',
      taxes: ['RCT', 'CT']
    },
    {
      name: 'Emerald Hospitality',
      address: '556 Tourism Avenue, Killarney',
      contact: 'Claire Kelly',
      email: 'claire@emeraldhospitality.ie',
      phone: '+353 64 333 4444',
      clientType: 'Limited Company',
      clientRef: 'EME-25',
      engagementDate: '2024-03-05',
      clientTags: ['Payroll', 'VAT', 'Audit'],
      customerNumber: '0123456C',
      taxes: ['CT', 'VAT', 'PAYE-EMP']
    },
    {
      name: 'Digital Solutions Pro',
      address: '298 Tech Boulevard, Dublin 18',
      contact: 'Alan Byrne',
      email: 'alan@digitalsolutions.ie',
      phone: '+353 1 222 3333',
      clientType: 'Limited Company',
      clientRef: 'DIG-24',
      engagementDate: '2024-01-30',
      clientTags: ['Income Tax'],
      customerNumber: '1234567D',
      taxes: ['CT', 'IT']
    },
    {
      name: 'Atlantic Fisheries',
      address: '77 Coastal Road, Donegal',
      contact: 'Fiona Walsh',
      email: 'fiona@atlanticfisheries.ie',
      phone: '+353 74 111 2222',
      clientType: 'Sole Trader',
      clientRef: 'ATL-23',
      engagementDate: '2023-06-12',
      clientTags: ['VAT'],
      customerNumber: '2345678E',
      taxes: ['VAT']
    }
  ]);

  const [clientInfoSearch, setClientInfoSearch] = useState('');
  const [clientTypeFilter, setClientTypeFilter] = useState('all');

  const availableClientTypes = [...new Set(clientInfo.map(client => client.clientType))];

  // Filter client info
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
    
    return filtered;
  }, [clientInfo, clientInfoSearch, clientTypeFilter]);

  // Initialize service selections once when component mounts
  useEffect(() => {
    if (Object.keys(serviceSelections).length === 0) {
      const initialSelections: {[key: string]: {[key: string]: boolean}} = {};
      clientInfo.forEach(client => {
      initialSelections[client.clientRef] = {
        accounts: Math.random() > 0.7,
        audit: client.clientTags.includes('Audit'),
        bookkeeping: Math.random() > 0.5,
        companySecretary: Math.random() > 0.8,
        corporationTax: Math.random() > 0.6,
        managementAccounts: Math.random() > 0.7,
        payroll: client.clientTags.includes('Payroll'),
        personalTax: client.clientTags.includes('Income Tax'),
        vat: client.clientTags.includes('VAT'),
        cgt: Math.random() > 0.9
      };
      });
      setServiceSelections(initialSelections);
    }
  }, [clientInfo]);

  // Calculate service counts based on current selections
  const serviceCounts = useMemo(() => {
    return {
      accounts: Object.values(serviceSelections).filter(services => services?.accounts).length,
      audit: Object.values(serviceSelections).filter(services => services?.audit).length,
      bookkeeping: Object.values(serviceSelections).filter(services => services?.bookkeeping).length,
      companySecretary: Object.values(serviceSelections).filter(services => services?.companySecretary).length,
      corporationTax: Object.values(serviceSelections).filter(services => services?.corporationTax).length,
      managementAccounts: Object.values(serviceSelections).filter(services => services?.managementAccounts).length,
      payroll: Object.values(serviceSelections).filter(services => services?.payroll).length,
      personalTax: Object.values(serviceSelections).filter(services => services?.personalTax).length,
      vat: Object.values(serviceSelections).filter(services => services?.vat).length,
      cgt: Object.values(serviceSelections).filter(services => services?.cgt).length
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
    <div className="space-y-8">
      <DashboardGrid columns={4}>
        <DashboardCard
          title="Audit Services"
          value={serviceCounts.audit}
        />
        
        <DashboardCard
          title="VAT Services"
          value={serviceCounts.vat}
        />
        
        <DashboardCard
          title="Payroll Services"
          value={serviceCounts.payroll}
        />
        
        <DashboardCard
          title="Bookkeeping Services"
          value={serviceCounts.bookkeeping}
        />
      </DashboardGrid>

      {/* Search and Filters */}
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
      </div>

      {/* Lock Button and Service Matrix Table */}
      <div className="flex justify-end mb-4 gap-2">
        <Button 
          variant={servicesLocked ? "default" : "outline"} 
          onClick={() => setServicesLocked(!servicesLocked)}
          className="flex items-center gap-2"
        >
          🔒 {servicesLocked ? 'Unlock Services' : 'Lock Services'}
        </Button>
      </div>

      {/* Service Matrix Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-20 border-r font-medium">CLIENT REF</TableHead>
                <TableHead className="w-32 border-r font-medium">CLIENT NAME</TableHead>
                <TableHead className="w-24 border-r font-medium">TYPE</TableHead>
                <TableHead className="w-20 border-r text-center font-medium">ACCOUNTS ({serviceCounts.accounts})</TableHead>
                <TableHead className="w-20 border-r text-center font-medium">AUDIT ({serviceCounts.audit})</TableHead>
                <TableHead className="w-20 border-r text-center font-medium">BOOKKEEPING ({serviceCounts.bookkeeping})</TableHead>
                <TableHead className="w-20 border-r text-center font-medium">COMPANY SEC ({serviceCounts.companySecretary})</TableHead>
                <TableHead className="w-20 border-r text-center font-medium">CORP TAX ({serviceCounts.corporationTax})</TableHead>
                <TableHead className="w-20 border-r text-center font-medium">MGT ACCOUNTS ({serviceCounts.managementAccounts})</TableHead>
                <TableHead className="w-20 border-r text-center font-medium">PAYROLL ({serviceCounts.payroll})</TableHead>
                <TableHead className="w-20 border-r text-center font-medium">PERSONAL TAX ({serviceCounts.personalTax})</TableHead>
                <TableHead className="w-20 border-r text-center font-medium">VAT ({serviceCounts.vat})</TableHead>
                <TableHead className="w-20 text-center font-medium">CGT ({serviceCounts.cgt})</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAndSortedClientInfo.map((client, index) => (
                <TableRow key={index} className="h-12">
                  <TableCell className="p-4 text-sm border-r">{client.clientRef}</TableCell>
                  <TableCell className="p-4 text-sm border-r font-medium">
                    <ClientNameLink clientName={client.name} />
                  </TableCell>
                  <TableCell className="p-4 text-sm border-r">{client.clientType}</TableCell>
                    <TableCell className="p-2 border-r text-center">
                      <Switch 
                        checked={serviceSelections[client.clientRef]?.accounts || false}
                        onCheckedChange={(checked) => handleServiceChange(client.clientRef, 'accounts', checked as boolean)}
                        disabled={servicesLocked}
                      />
                    </TableCell>
                    <TableCell className="p-2 border-r text-center">
                      <Switch 
                        checked={serviceSelections[client.clientRef]?.audit || false}
                        onCheckedChange={(checked) => handleServiceChange(client.clientRef, 'audit', checked as boolean)}
                        disabled={servicesLocked}
                      />
                    </TableCell>
                    <TableCell className="p-2 border-r text-center">
                      <Switch 
                        checked={serviceSelections[client.clientRef]?.bookkeeping || false}
                        onCheckedChange={(checked) => handleServiceChange(client.clientRef, 'bookkeeping', checked as boolean)}
                        disabled={servicesLocked}
                      />
                    </TableCell>
                    <TableCell className="p-2 border-r text-center">
                      <Switch 
                        checked={serviceSelections[client.clientRef]?.companySecretary || false}
                        onCheckedChange={(checked) => handleServiceChange(client.clientRef, 'companySecretary', checked as boolean)}
                        disabled={servicesLocked}
                      />
                    </TableCell>
                    <TableCell className="p-2 border-r text-center">
                      <Switch 
                        checked={serviceSelections[client.clientRef]?.corporationTax || false}
                        onCheckedChange={(checked) => handleServiceChange(client.clientRef, 'corporationTax', checked as boolean)}
                        disabled={servicesLocked}
                      />
                    </TableCell>
                    <TableCell className="p-2 border-r text-center">
                      <Switch 
                        checked={serviceSelections[client.clientRef]?.managementAccounts || false}
                        onCheckedChange={(checked) => handleServiceChange(client.clientRef, 'managementAccounts', checked as boolean)}
                        disabled={servicesLocked}
                      />
                    </TableCell>
                    <TableCell className="p-2 border-r text-center">
                      <Switch 
                        checked={serviceSelections[client.clientRef]?.payroll || false}
                        onCheckedChange={(checked) => handleServiceChange(client.clientRef, 'payroll', checked as boolean)}
                        disabled={servicesLocked}
                      />
                    </TableCell>
                    <TableCell className="p-2 border-r text-center">
                      <Switch 
                        checked={serviceSelections[client.clientRef]?.personalTax || false}
                        onCheckedChange={(checked) => handleServiceChange(client.clientRef, 'personalTax', checked as boolean)}
                        disabled={servicesLocked}
                      />
                    </TableCell>
                    <TableCell className="p-2 border-r text-center">
                      <Switch 
                        checked={serviceSelections[client.clientRef]?.vat || false}
                        onCheckedChange={(checked) => handleServiceChange(client.clientRef, 'vat', checked as boolean)}
                        disabled={servicesLocked}
                      />
                    </TableCell>
                    <TableCell className="p-2 text-center">
                      <Switch 
                        checked={serviceSelections[client.clientRef]?.cgt || false}
                        onCheckedChange={(checked) => handleServiceChange(client.clientRef, 'cgt', checked as boolean)}
                        disabled={servicesLocked}
                      />
                    </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
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