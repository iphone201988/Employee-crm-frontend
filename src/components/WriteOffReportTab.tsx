import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DashboardCard, DashboardGrid } from "@/components/ui/dashboard-card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { formatCurrency } from '@/lib/currency';
import ClientNameLink from './ClientNameLink';

interface WriteOffEntry {
  clientName: string;
  clientRef?: string;
  writeOffAmount: number;
  totalInvoiced: number;
  totalPaid: number;
  invoiceNumber?: string;
}

interface WriteOffReportTabProps {
  writeOffEntries: WriteOffEntry[];
  onUseAsWIPBalance?: (entry: WriteOffEntry, index: number) => void;
}

const WriteOffReportTab = ({ writeOffEntries, onUseAsWIPBalance }: WriteOffReportTabProps) => {
  const [selectedOccasions, setSelectedOccasions] = useState<{ clientName: string; occasions: number } | null>(null);
  const [viewMode, setViewMode] = useState<'clients' | 'jobs' | 'team'>('clients');
  const [sortConfig, setSortConfig] = useState<{ key: string | null; direction: 'asc' | 'desc' }>({ key: null, direction: 'asc' });
  // Generate dummy data for different clients (reduced by 60% further)
  const clientData = [
    { ref: 'WAT-23', name: 'Water Savers Limited', writeOff: 1450.00, occasions: 2, wipAmount: 1200.00 },
    { ref: 'GRE-25', name: 'Green Gardens Limited', writeOff: 920.00, occasions: 3, wipAmount: 850.00 },
    { ref: 'SMI-22', name: 'Smith & Associates', writeOff: 580.00, occasions: 1, wipAmount: 2150.00 },
    { ref: 'TEC-25', name: 'Tech Solutions Ltd', writeOff: 1200.00, occasions: 4, wipAmount: 3200.00 },
    { ref: 'MAR-20', name: 'Marketing Pro', writeOff: 675.00, occasions: 2, wipAmount: 1800.00 }
  ];

  const jobData = [
    { ref: 'WAT-23-ACC', name: 'Annual Accounts Preparation', clientRef: 'WAT-23', clientName: 'Water Savers Limited', writeOff: 1450.00, occasions: 2, wipAmount: 1200.00 },
    { ref: 'GRE-25-BK', name: 'Monthly Bookkeeping', clientRef: 'GRE-25', clientName: 'Green Gardens Limited', writeOff: 920.00, occasions: 3, wipAmount: 850.00 }
  ];

  const teamData = [
    { ref: 'JS001', name: 'John Smith', role: 'Senior Accountant', department: 'Audit', writeOff: 2450.00, occasions: 5, efficiency: 92, clientsHandled: 12 },
    { ref: 'SC002', name: 'Sarah Connor', role: 'Tax Specialist', department: 'Tax', writeOff: 1820.00, occasions: 3, efficiency: 88, clientsHandled: 8 },
    { ref: 'MJ003', name: 'Mike Johnson', role: 'Junior Accountant', department: 'Bookkeeping', writeOff: 980.00, occasions: 2, efficiency: 85, clientsHandled: 15 },
    { ref: 'AB004', name: 'Anna Brown', role: 'Partner', department: 'Advisory', writeOff: 3200.00, occasions: 6, efficiency: 95, clientsHandled: 6 },
    { ref: 'DW005', name: 'David Wilson', role: 'Manager', department: 'Audit', writeOff: 1650.00, occasions: 4, efficiency: 90, clientsHandled: 10 }
  ];

  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const getSortedData = (data: any[]) => {
    if (!sortConfig.key) return data;
    
    return [...data].sort((a, b) => {
      const aValue = a[sortConfig.key!];
      const bValue = b[sortConfig.key!];
      
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortConfig.direction === 'asc' 
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }
      
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortConfig.direction === 'asc' 
          ? aValue - bValue
          : bValue - aValue;
      }
      
      return 0;
    });
  };

  const currentData = getSortedData(
    viewMode === 'clients' ? clientData : 
    viewMode === 'jobs' ? jobData : teamData
  );
  
  // Calculate totals based on current view
  const totalWriteOff = currentData.reduce((sum, entry) => sum + entry.writeOff, 0);
  const uniqueClients = viewMode === 'clients' ? currentData.length : 
                       viewMode === 'jobs' ? new Set(jobData.map(entry => entry.clientName)).size :
                       currentData.length;
  const avgWriteOff = currentData.length > 0 ? totalWriteOff / currentData.length : 0;

  return (
    <div className="space-y-6">
      {/* Dashboard Cards moved to top */}
      <DashboardGrid columns={4}>
        <DashboardCard
          title="Total Write Offs"
          value={formatCurrency(totalWriteOff)}
        />
        
        <DashboardCard
          title={viewMode === 'clients' ? 'Number of Clients' : viewMode === 'jobs' ? 'Number of Jobs' : 'Number of Team Members'}
          value={viewMode === 'clients' ? uniqueClients : currentData.length}
        />
        
        <DashboardCard
          title="Average Write Off"
          value={formatCurrency(avgWriteOff)}
        />
        
        <DashboardCard
          title="Total Occasions"
          value={currentData.reduce((sum, entry) => sum + entry.occasions, 0)}
        />
      </DashboardGrid>

      {/* View Mode Switcher */}
      <div className="flex items-center justify-center gap-6">
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant={viewMode === 'clients' ? 'default' : 'outline'}
            onClick={() => setViewMode('clients')}
            className="px-3 py-1 h-8 text-sm"
          >
            Clients
          </Button>
          <Button
            size="sm"
            variant={viewMode === 'jobs' ? 'default' : 'outline'}
            onClick={() => setViewMode('jobs')}
            className="px-3 py-1 h-8 text-sm"
          >
            Jobs
          </Button>
          <Button
            size="sm"
            variant={viewMode === 'team' ? 'default' : 'outline'}
            onClick={() => setViewMode('team')}
            className="px-3 py-1 h-8 text-sm"
          >
            Team
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b bg-gray-50">
                   {viewMode !== 'team' && (
                     <th 
                       className="text-left p-3 text-foreground h-12 cursor-pointer hover:bg-gray-100"
                       onClick={() => handleSort('ref')}
                     >
                        <div className="flex items-center gap-1">
                          {viewMode === 'clients' ? 'Client Ref.' : 'Job Ref.'}
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
                          </svg>
                        </div>
                      </th>
                    )}
                   <th 
                     className="text-left p-3 text-foreground h-12 cursor-pointer hover:bg-gray-100"
                     onClick={() => handleSort('name')}
                   >
                     <div className="flex items-center gap-1">
                       {viewMode === 'clients' ? 'Client Name' : viewMode === 'jobs' ? 'Job Name' : 'Team Member'}
                       <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
                       </svg>
                     </div>
                   </th>
                  {viewMode === 'jobs' && (
                    <th 
                      className="text-left p-3 text-foreground h-12 cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('clientRef')}
                    >
                      <div className="flex items-center gap-1">
                        Client Ref.
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
                        </svg>
                      </div>
                    </th>
                  )}
                   {viewMode === 'jobs' && (
                     <th 
                       className="text-left p-3 text-foreground h-12 cursor-pointer hover:bg-gray-100"
                       onClick={() => handleSort('clientName')}
                     >
                       <div className="flex items-center gap-1">
                         Client Name
                         <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
                         </svg>
                       </div>
                     </th>
                   )}
                   {viewMode === 'team' && (
                     <th 
                       className="text-left p-3 text-foreground h-12 cursor-pointer hover:bg-gray-100"
                       onClick={() => handleSort('department')}
                     >
                       <div className="flex items-center gap-1">
                         Department
                         <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
                         </svg>
                       </div>
                     </th>
                   )}
                  <th 
                    className="text-right p-3 text-foreground h-12 cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('writeOff')}
                  >
                    <div className="flex items-center gap-1 justify-end">
                      Total Write Off Value
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
                      </svg>
                    </div>
                  </th>
                  <th 
                    className="text-center p-3 text-foreground h-12 cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('occasions')}
                  >
                    <div className="flex items-center gap-1 justify-center">
                      Write off Occasions
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
                      </svg>
                    </div>
                  </th>
                  <th className="text-center p-3 text-foreground h-12">Action</th>
                </tr>
              </thead>
              <tbody>
                {currentData.map((item, index) => (
                  <tr key={index} className="border-b hover:bg-gray-50 h-12">
                     {viewMode !== 'team' && (
                       <td className="p-3">
                         <div className="text-sm">{item.ref}</div>
                       </td>
                     )}
                     <td className="p-3">
                       <div className="text-sm">
                         {viewMode === 'clients' ? (
                           <ClientNameLink clientName={item.name} />
                         ) : (
                           item.name
                         )}
                       </div>
                     </td>
                      {viewMode === 'jobs' && <td className="p-3"><div className="text-sm">{(item as any).clientRef}</div></td>}
                       {viewMode === 'jobs' && (
                         <td className="p-3">
                           <div className="text-sm">
                             <ClientNameLink clientName={(item as any).clientName} />
                           </div>
                         </td>
                       )}
                      {viewMode === 'team' && <td className="p-3"><div className="text-sm">{(item as any).department}</div></td>}
                    <td className="p-3 text-right text-sm">{formatCurrency(item.writeOff)}</td>
                    <td className="p-3 text-center">
                      <span 
                        className="inline-flex items-center justify-center h-8 w-8 rounded-full text-xs font-medium cursor-pointer hover:opacity-80 transition-colors bg-gradient-to-br from-primary/20 to-primary/30 text-primary border border-primary/20"
                        onClick={() => setSelectedOccasions({ clientName: item.name, occasions: item.occasions })}
                      >
                        {item.occasions}
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      <Button
                        size="sm"
                        variant="outline"
                        className="px-2 py-1 h-6 text-xs bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200"
                      >
                        Add Write Off Value to WIP Balance
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
                <tfoot>
                <tr className="border-t-2 bg-gray-100">
                   {viewMode !== 'team' && <td className="p-3"></td>}
                   <td className="p-3 text-sm">TOTALS</td>
                   {viewMode === 'jobs' && <td className="p-3"></td>}
                   {viewMode === 'jobs' && <td className="p-3"></td>}
                   {viewMode === 'team' && <td className="p-3"></td>}
                  <td className="p-3 text-right text-sm">{formatCurrency(totalWriteOff)}</td>
                  <td className="p-3 text-center">-</td>
                  <td className="p-3 text-center">-</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Write Off Occasions Dialog */}
      <Dialog open={selectedOccasions !== null} onOpenChange={() => setSelectedOccasions(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Write Off Details</DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            <div className="space-y-4">
              <p className="text-sm font-medium text-gray-700">
                <strong>Client:</strong> {selectedOccasions?.clientName}
              </p>
              <p className="text-sm font-medium text-gray-700">
                <strong>Number of Write Off Occasions:</strong> {selectedOccasions?.occasions}
              </p>
            </div>
            
            <div className="space-y-4">
              <h4 className="font-medium text-gray-900">Write Off Details:</h4>
              <div className="overflow-x-auto">
                <Table>
                   <TableHeader>
                     <TableRow className="border-b border-border bg-muted/50">
                        <TableHead className="border-r p-3 text-foreground">Amount</TableHead>
                        <TableHead className="border-r p-3 text-foreground">Date</TableHead>
                        <TableHead className="border-r p-3 text-foreground">By</TableHead>
                        <TableHead className="border-r p-3 text-foreground">Write Off Logic</TableHead>
                        <TableHead className="p-3 text-foreground">Write Off Reason</TableHead>
                     </TableRow>
                   </TableHeader>
                  <TableBody>
                     <TableRow className="border-b border-border hover:bg-muted/30 transition-colors">
                       <TableCell className="p-3 border-r">{formatCurrency(450.00)}</TableCell>
                       <TableCell className="p-3 border-r">15/12/2024</TableCell>
                       <TableCell className="p-3 border-r">John Smith</TableCell>
                       <TableCell className="p-3 border-r">Proportionally</TableCell>
                       <TableCell className="p-3">Job went 25% over on time</TableCell>
                     </TableRow>
                     <TableRow className="border-b border-border hover:bg-muted/30 transition-colors">
                       <TableCell className="p-3 border-r">{formatCurrency(320.00)}</TableCell>
                       <TableCell className="p-3 border-r">22/11/2024</TableCell>
                       <TableCell className="p-3 border-r">Sarah Connor</TableCell>
                       <TableCell className="p-3 border-r">Manually</TableCell>
                       <TableCell className="p-3">John Smith was slow with his client work</TableCell>
                     </TableRow>
                     <TableRow className="border-b border-border hover:bg-muted/30 transition-colors">
                       <TableCell className="p-3 border-r">{formatCurrency(250.00)}</TableCell>
                       <TableCell className="p-3 border-r">05/10/2024</TableCell>
                       <TableCell className="p-3 border-r">Mike Johnson</TableCell>
                       <TableCell className="p-3 border-r">Proportionally</TableCell>
                       <TableCell className="p-3">Client requested discount for delayed delivery</TableCell>
                     </TableRow>
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default WriteOffReportTab;