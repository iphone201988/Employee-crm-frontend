import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Download, AlertCircle, ArrowUpDown, Search } from 'lucide-react';
import { formatCurrency } from '@/lib/currency';
import { formatDate } from '@/utils/dateFormat';
import ClientNameLink from './ClientNameLink';

interface ImportData {
  incomeTax: number;
  corporationTax: number;
  vat: number;
  payeEmp: number;
  capitalGainsTax: number;
  clients: {
    name: string;
    customerNumber: string;
    incomeTax: boolean;
    corporationTax: boolean;
    vat: boolean;
    payeEmp: boolean;
    capitalGainsTax: boolean;
  }[];
  clientInfo: {
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
  }[];
}

interface ImportHistory {
  date: string;
  status: 'Completed' | 'Failed';
  clientsImported: number;
  numberOfConflicts: number;
  daysSinceImport: number;
  csvFile: string;
}

const ImportTab = () => {
  const [activeTab, setActiveTab] = useState('current');
  const [currentImportData] = useState<ImportData>({
    incomeTax: 3,
    corporationTax: 3,
    vat: 4,
    payeEmp: 3,
    capitalGainsTax: 3,
    clients: [
      {
        name: 'Water Savers Limited',
        customerNumber: '1234567T',
        incomeTax: true,
        corporationTax: false,
        vat: true,
        payeEmp: true,
        capitalGainsTax: false
      },
      {
        name: 'Green Gardens Limited',
        customerNumber: '2345678U',
        incomeTax: false,
        corporationTax: true,
        vat: true,
        payeEmp: false,
        capitalGainsTax: true
      },
      {
        name: 'Brown Enterprises',
        customerNumber: '3456789V',
        incomeTax: true,
        corporationTax: false,
        vat: false,
        payeEmp: false,
        capitalGainsTax: true
      },
      {
        name: 'Smith & Associates',
        customerNumber: '4567890W',
        incomeTax: true,
        corporationTax: true,
        vat: true,
        payeEmp: true,
        capitalGainsTax: false
      },
      {
        name: 'Tech Solutions Inc.',
        customerNumber: '5678901X',
        incomeTax: false,
        corporationTax: true,
        vat: true,
        payeEmp: true,
        capitalGainsTax: true
      },
      {
        name: 'Financial Advisors Co.',
        customerNumber: '6789012Y',
        incomeTax: true,
        corporationTax: true,
        vat: false,
        payeEmp: true,
        capitalGainsTax: false
      },
      {
        name: 'Healthcare Systems Ltd.',
        customerNumber: '7890123Z',
        incomeTax: false,
        corporationTax: true,
        vat: true,
        payeEmp: false,
        capitalGainsTax: true
      },
      {
        name: 'Marine Consulting Ltd.',
        customerNumber: '8901234A',
        incomeTax: true,
        corporationTax: false,
        vat: true,
        payeEmp: true,
        capitalGainsTax: false
      }
    ],
    clientInfo: [
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
        clientTags: ['Corporation Tax', 'VAT'],
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
        clientTags: ['Income Tax', 'Corporation Tax'],
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
    ]
  });

  const [importHistory] = useState<ImportHistory[]>([
    {
      date: '2024-01-15',
      status: 'Completed',
      clientsImported: 826,
      numberOfConflicts: 3,
      daysSinceImport: 45,
      csvFile: 'clients_2024_01_15.csv'
    },
    {
      date: '2024-01-10',
      status: 'Completed',
      clientsImported: 826,
      numberOfConflicts: 1,
      daysSinceImport: 67,
      csvFile: 'clients_2024_01_10.csv'
    },
    {
      date: '2024-01-05',
      status: 'Completed',
      clientsImported: 826,
      numberOfConflicts: 12,
      daysSinceImport: 89,
      csvFile: 'clients_2024_01_05.csv'
    },
    {
      date: '2024-01-01',
      status: 'Completed',
      clientsImported: 826,
      numberOfConflicts: 0,
      daysSinceImport: 121,
      csvFile: 'clients_2024_01_01.csv'
    }
  ]);

  // Sort state for all three tabs
  const [clientsSortConfig, setClientsSortConfig] = useState<{ key: string | null; direction: 'asc' | 'desc' }>({ key: null, direction: 'asc' });
  const [historySortConfig, setHistorySortConfig] = useState<{ key: string | null; direction: 'asc' | 'desc' }>({ key: null, direction: 'asc' });
  const [clientInfoSortConfig, setClientInfoSortConfig] = useState<{ key: string | null; direction: 'asc' | 'desc' }>({ key: null, direction: 'asc' });

  // Client info filters
  const [clientInfoSearch, setClientInfoSearch] = useState('');
  const [clientTypeFilter, setClientTypeFilter] = useState('all');
  const [clientTagsFilter, setClientTagsFilter] = useState('all');
  const [inconsistentDataDialogOpen, setInconsistentDataDialogOpen] = useState(false);

  // Sort functions
  const handleClientsSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (clientsSortConfig.key === key && clientsSortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setClientsSortConfig({ key, direction });
  };

  const handleHistorySort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (historySortConfig.key === key && historySortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setHistorySortConfig({ key, direction });
  };

  const handleClientInfoSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (clientInfoSortConfig.key === key && clientInfoSortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setClientInfoSortConfig({ key, direction });
  };

  const getSortedClients = () => {
    if (!clientsSortConfig.key) return currentImportData.clients;
    
    return [...currentImportData.clients].sort((a, b) => {
      const aValue = a[clientsSortConfig.key as keyof typeof a];
      const bValue = b[clientsSortConfig.key as keyof typeof b];
      
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return clientsSortConfig.direction === 'asc' 
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }
      
      return 0;
    });
  };

  const getSortedHistory = () => {
    if (!historySortConfig.key) return importHistory;
    
    return [...importHistory].sort((a, b) => {
      const aValue = a[historySortConfig.key as keyof typeof a];
      const bValue = b[historySortConfig.key as keyof typeof b];
      
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return historySortConfig.direction === 'asc' 
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }
      
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return historySortConfig.direction === 'asc' 
          ? aValue - bValue
          : bValue - aValue;
      }
      
      return 0;
    });
  };

  // Filter and sort client info
  const filteredAndSortedClientInfo = useMemo(() => {
    let filtered = currentImportData.clientInfo;
    
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
  }, [currentImportData.clientInfo, clientInfoSearch, clientTypeFilter, clientTagsFilter, clientInfoSortConfig]);

  const availableClientTypes = [...new Set(currentImportData.clientInfo.map(client => client.clientType))];
  const availableClientTags = [...new Set(currentImportData.clientInfo.flatMap(client => client.clientTags))];

  const handleSubmitImport = () => {
    console.log('Submitting ROS import...');
  };

  const handleDownloadCsv = (filename: string) => {
    console.log('Downloading CSV:', filename);
  };

  const getStatusBadge = (status: string) => {
    if (status === 'Completed') {
      return <Badge variant="default" className="bg-green-100 text-green-800 border-green-300">Completed</Badge>;
    }
    return <Badge variant="destructive">Failed</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Tab Buttons */}
      <div className="flex gap-2 mb-6">
        <Button 
          variant={activeTab === 'current' ? 'default' : 'outline'}
          onClick={() => setActiveTab('current')}
        >
          ROS Import
        </Button>
        <Button 
          variant={activeTab === 'history' ? 'default' : 'outline'}
          onClick={() => setActiveTab('history')}
        >
          Previous ROS Imports
        </Button>
      </div>

      {activeTab === 'current' && (
        <div className="space-y-6">
          {/* Import Client Button */}
          <div className="flex justify-end">
            <Button style={{ backgroundColor: '#017DB9', color: 'white' }} className="hover:opacity-90">
              Import Clients
            </Button>
          </div>
          {/* Summary Cards */}
          <div className="grid grid-cols-5 gap-4">
            <Card className="h-[calc(100%-0.8rem)]">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Income Tax</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold" style={{color: '#381980'}}>{currentImportData.incomeTax}</div>
              </CardContent>
            </Card>
            <Card className="h-[calc(100%-0.8rem)]">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Corporation Tax</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold" style={{color: '#381980'}}>{currentImportData.corporationTax}</div>
              </CardContent>
            </Card>
            <Card className="h-[calc(100%-0.8rem)]">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">VAT</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold" style={{color: '#381980'}}>{currentImportData.vat}</div>
              </CardContent>
            </Card>
            <Card className="h-[calc(100%-0.8rem)]">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">PAYE-EMP</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold" style={{color: '#381980'}}>{currentImportData.payeEmp}</div>
              </CardContent>
            </Card>
            <Card className="h-[calc(100%-0.8rem)]">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Capital Gains Tax</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold" style={{color: '#381980'}}>{currentImportData.capitalGainsTax}</div>
              </CardContent>
            </Card>
          </div>

          {/* Clients Table */}
          <Card>
            <CardContent className="pt-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleClientsSort('name')}
                        className="h-8 px-1 font-medium"
                      >
                        Client Name
                        <ArrowUpDown className="ml-1 h-4 w-4" />
                      </Button>
                    </TableHead>
                    <TableHead>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleClientsSort('customerNumber')}
                        className="h-8 px-1 font-medium"
                      >
                        Customer Number
                        <ArrowUpDown className="ml-1 h-4 w-4" />
                      </Button>
                    </TableHead>
                    <TableHead>Income Tax</TableHead>
                    <TableHead>Corporation Tax</TableHead>
                    <TableHead>VAT</TableHead>
                    <TableHead>PAYE-EMP</TableHead>
                    <TableHead>Capital Gains Tax</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {getSortedClients().map((client, index) => (
                    <TableRow key={index}>
                       <TableCell className="font-medium">
                         <ClientNameLink clientName={client.name} />
                       </TableCell>
                      <TableCell>{client.customerNumber}</TableCell>
                      <TableCell className="text-center">
                        {client.incomeTax ? (
                          <span className="text-green-600">✓</span>
                        ) : (
                          <span className="text-red-600">✗</span>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        {client.corporationTax ? (
                          <span className="text-green-600">✓</span>
                        ) : (
                          <span className="text-red-600">✗</span>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        {client.vat ? (
                          <span className="text-green-600">✓</span>
                        ) : (
                          <span className="text-red-600">✗</span>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        {client.payeEmp ? (
                          <span className="text-green-600">✓</span>
                        ) : (
                          <span className="text-red-600">✗</span>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        {client.capitalGainsTax ? (
                          <span className="text-green-600">✓</span>
                        ) : (
                          <span className="text-red-600">✗</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'history' && (
        <div className="space-y-6">
          {/* Import Client Button */}
          <div className="flex justify-end">
            <Button style={{ backgroundColor: '#017DB9', color: 'white' }} className="hover:opacity-90">
              Import Clients
            </Button>
          </div>
          <Card>
            <CardContent className="pt-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleHistorySort('date')}
                        className="h-8 px-1 font-medium"
                      >
                        Date
                        <ArrowUpDown className="ml-1 h-4 w-4" />
                      </Button>
                    </TableHead>
                    <TableHead>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleHistorySort('status')}
                        className="h-8 px-1 font-medium"
                      >
                        Status
                        <ArrowUpDown className="ml-1 h-4 w-4" />
                      </Button>
                    </TableHead>
                    <TableHead>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleHistorySort('clientsImported')}
                        className="h-8 px-1 font-medium"
                      >
                        Clients Imported
                        <ArrowUpDown className="ml-1 h-4 w-4" />
                      </Button>
                    </TableHead>
                    <TableHead>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleHistorySort('numberOfConflicts')}
                        className="h-8 px-1 font-medium"
                      >
                        Inconsistent Data Fields
                        <ArrowUpDown className="ml-1 h-4 w-4" />
                      </Button>
                    </TableHead>
                    <TableHead>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleHistorySort('daysSinceImport')}
                        className="h-8 px-1 font-medium"
                      >
                        Days Since Import
                        <ArrowUpDown className="ml-1 h-4 w-4" />
                      </Button>
                    </TableHead>
                    <TableHead>Attachment</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {getSortedHistory().map((entry, index) => (
                    <TableRow key={index}>
                      <TableCell>{entry.date}</TableCell>
                      <TableCell>{getStatusBadge(entry.status)}</TableCell>
                      <TableCell>{entry.clientsImported}</TableCell>
                       <TableCell>
                          {entry.numberOfConflicts > 0 ? (
                            <Dialog open={inconsistentDataDialogOpen} onOpenChange={setInconsistentDataDialogOpen}>
                              <DialogTrigger asChild>
                                <div className="flex items-center gap-2 cursor-pointer">
                                  <span className="text-red-600">{entry.numberOfConflicts}</span>
                                  <AlertCircle className="h-4 w-4 text-red-600" />
                                </div>
                              </DialogTrigger>
                              <DialogContent className="max-w-lg">
                                <DialogHeader>
                                  <DialogTitle>Inconsistent Data Fields Details</DialogTitle>
                                </DialogHeader>
                                <div className="space-y-2">
                                  {Array.from({ length: entry.numberOfConflicts }, (_, index) => (
                                    <div key={index} className="p-3 bg-red-50 rounded-lg border border-red-200">
                                      <p className="text-sm text-muted-foreground">
                                        Cell number <span className="font-medium">L{24 + index}</span> was <span className="font-medium">VAT</span> now it is <span className="font-medium">Blank</span>.
                                      </p>
                                    </div>
                                  ))}
                                </div>
                              </DialogContent>
                            </Dialog>
                          ) : (
                            <span>{entry.numberOfConflicts}</span>
                          )}
                        </TableCell>
                      <TableCell>{entry.daysSinceImport} days</TableCell>
                      <TableCell>
                        <Button variant="outline" size="sm">
                          ros_import_{entry.date.replace(/\//g, '_')}.csv
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default ImportTab;