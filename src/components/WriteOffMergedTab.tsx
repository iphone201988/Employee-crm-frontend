import React, { useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { DashboardCard, DashboardGrid } from "@/components/ui/dashboard-card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Search, ArrowUpDown } from 'lucide-react';
import { formatCurrency } from '@/lib/currency';
import { formatTime, TimeFormat } from '@/utils/timeFormat';
import ClientNameLink from './ClientNameLink';

interface WriteOffMergedData {
  name: string;
  ref?: string;
  clientName?: string;
  clientRef?: string;
  department?: string;
  jobType?: string;
  writeOffOccasions: number;
  totalWriteOffValue: number;
  noJobsWithWriteOff: number;
  totalFees: number;
  writeOffValue: number;
  percentageWriteOff: number;
  jobsWithWriteOff?: string[]; // Array of job names for the popup
}

interface WriteOffDetail {
  amount: number;
  date: string;
  by: string;
  logic: string;
  reason: string;
}

const WriteOffMergedTab = () => {
  console.log("WriteOffMergedTab");
  const [activeFilter, setActiveFilter] = useState<'clients' | 'jobs' | 'job-type' | 'team'>('clients');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState<{ key: string | null; direction: 'asc' | 'desc' }>({ key: null, direction: 'desc' });
  const [selectedOccasions, setSelectedOccasions] = useState<{ name: string; occasions: number; details: WriteOffDetail[] } | null>(null);
  const [selectedJobs, setSelectedJobs] = useState<{ name: string; jobs: string[] } | null>(null);
  const [showLogView, setShowLogView] = useState(false);
  const [timeFormat] = useState<TimeFormat>('0:00');

  // Generate comprehensive data for all filter types
  const generateData = (): WriteOffMergedData[] => {
    const clientsData = [
      { name: 'Water Savers Limited', ref: 'WAT-23', writeOffOccasions: 3, totalWriteOffValue: 2450.00, noJobsWithWriteOff: 2, totalFees: 12000.00, writeOffValue: 2450.00, percentageWriteOff: 20.4, jobsWithWriteOff: ['Annual Accounts Preparation', 'Monthly Bookkeeping'] },
      { name: 'Green Gardens Limited', ref: 'GRE-25', writeOffOccasions: 5, totalWriteOffValue: 1920.00, noJobsWithWriteOff: 3, totalFees: 8500.00, writeOffValue: 1920.00, percentageWriteOff: 22.6, jobsWithWriteOff: ['VAT Return Quarterly', 'Payroll Services', 'Tax Advisory'] },
      { name: 'Smith & Associates', ref: 'SMI-22', writeOffOccasions: 2, totalWriteOffValue: 980.00, noJobsWithWriteOff: 1, totalFees: 6200.00, writeOffValue: 980.00, percentageWriteOff: 15.8, jobsWithWriteOff: ['Corporation Tax Return'] },
      { name: 'Tech Solutions Ltd', ref: 'TEC-25', writeOffOccasions: 4, totalWriteOffValue: 3200.00, noJobsWithWriteOff: 3, totalFees: 15000.00, writeOffValue: 3200.00, percentageWriteOff: 21.3, jobsWithWriteOff: ['Management Accounts', 'Business Advisory', 'Financial Planning'] },
      { name: 'Marketing Pro', ref: 'MAR-20', writeOffOccasions: 2, totalWriteOffValue: 1675.00, noJobsWithWriteOff: 1, totalFees: 7800.00, writeOffValue: 1675.00, percentageWriteOff: 21.5, jobsWithWriteOff: ['Budget Preparation'] }
    ];

    const jobsData = [
      { name: 'Annual Accounts Preparation', ref: 'WAT-23-ACC', clientName: 'Water Savers Limited', clientRef: 'WAT-23', writeOffOccasions: 2, totalWriteOffValue: 1450.00, noJobsWithWriteOff: 1, totalFees: 6000.00, writeOffValue: 1450.00, percentageWriteOff: 24.2, jobsWithWriteOff: ['Annual Accounts Preparation'] },
      { name: 'Monthly Bookkeeping', ref: 'GRE-25-BK', clientName: 'Green Gardens Limited', clientRef: 'GRE-25', writeOffOccasions: 3, totalWriteOffValue: 920.00, noJobsWithWriteOff: 1, totalFees: 4200.00, writeOffValue: 920.00, percentageWriteOff: 21.9, jobsWithWriteOff: ['Monthly Bookkeeping'] },
      { name: 'VAT Return Quarterly', ref: 'SMI-22-VAT', clientName: 'Smith & Associates', clientRef: 'SMI-22', writeOffOccasions: 1, totalWriteOffValue: 580.00, noJobsWithWriteOff: 1, totalFees: 3600.00, writeOffValue: 580.00, percentageWriteOff: 16.1, jobsWithWriteOff: ['VAT Return Quarterly'] },
      { name: 'Tax Advisory Services', ref: 'TEC-25-TAX', clientName: 'Tech Solutions Ltd', clientRef: 'TEC-25', writeOffOccasions: 2, totalWriteOffValue: 1800.00, noJobsWithWriteOff: 1, totalFees: 8500.00, writeOffValue: 1800.00, percentageWriteOff: 21.2, jobsWithWriteOff: ['Tax Advisory Services'] }
    ];

    const jobTypeData = [
      { name: 'Annual Accounts', writeOffOccasions: 8, totalWriteOffValue: 4850.00, noJobsWithWriteOff: 5, totalFees: 28000.00, writeOffValue: 4850.00, percentageWriteOff: 17.3, jobsWithWriteOff: ['WAT-23-ACC', 'GRE-25-ACC', 'SMI-22-ACC', 'TEC-25-ACC', 'MAR-20-ACC'] },
      { name: 'Bookkeeping Services', writeOffOccasions: 12, totalWriteOffValue: 3200.00, noJobsWithWriteOff: 8, totalFees: 18500.00, writeOffValue: 3200.00, percentageWriteOff: 17.3, jobsWithWriteOff: ['Monthly Bookkeeping - Client A', 'Weekly Bookkeeping - Client B', 'Quarterly Bookkeeping - Client C', 'Annual Bookkeeping - Client D', 'Daily Bookkeeping - Client E', 'Monthly Bookkeeping - Client F', 'Weekly Bookkeeping - Client G', 'Quarterly Bookkeeping - Client H'] },
      { name: 'Tax Advisory', writeOffOccasions: 6, totalWriteOffValue: 2850.00, noJobsWithWriteOff: 4, totalFees: 15200.00, writeOffValue: 2850.00, percentageWriteOff: 18.8, jobsWithWriteOff: ['Tax Planning - Client A', 'Tax Advisory - Client B', 'Tax Optimization - Client C', 'Tax Compliance - Client D'] },
      { name: 'VAT Returns', writeOffOccasions: 4, totalWriteOffValue: 1320.00, noJobsWithWriteOff: 3, totalFees: 7800.00, writeOffValue: 1320.00, percentageWriteOff: 16.9, jobsWithWriteOff: ['VAT Return Q1 - Client A', 'VAT Return Q2 - Client B', 'VAT Return Q3 - Client C'] }
    ];

    const teamData = [
      { name: 'John Smith', writeOffOccasions: 8, totalWriteOffValue: 3450.00, noJobsWithWriteOff: 6, totalFees: 18500.00, writeOffValue: 3450.00, percentageWriteOff: 18.6, jobsWithWriteOff: ['Annual Accounts - Water Savers', 'VAT Return - Smith & Associates', 'Tax Advisory - Tech Solutions', 'Bookkeeping - Green Gardens', 'Payroll - Marketing Pro', 'Management Accounts - ABC Ltd'] },
      { name: 'Sarah Connor', writeOffOccasions: 5, totalWriteOffValue: 2820.00, noJobsWithWriteOff: 4, totalFees: 15200.00, writeOffValue: 2820.00, percentageWriteOff: 18.5, jobsWithWriteOff: ['Corporation Tax - Client A', 'Tax Planning - Client B', 'Advisory Services - Client C', 'Compliance Review - Client D'] },
      { name: 'Mike Johnson', writeOffOccasions: 6, totalWriteOffValue: 1980.00, noJobsWithWriteOff: 5, totalFees: 12000.00, writeOffValue: 1980.00, percentageWriteOff: 16.5, jobsWithWriteOff: ['Monthly Bookkeeping - Client A', 'Weekly Reconciliation - Client B', 'Quarterly Accounts - Client C', 'Annual Setup - Client D', 'Daily Processing - Client E'] },
      { name: 'Anna Brown', writeOffOccasions: 4, totalWriteOffValue: 3200.00, noJobsWithWriteOff: 3, totalFees: 16500.00, writeOffValue: 3200.00, percentageWriteOff: 19.4, jobsWithWriteOff: ['Business Advisory - Client A', 'Strategic Planning - Client B', 'Financial Review - Client C'] },
      { name: 'David Wilson', writeOffOccasions: 7, totalWriteOffValue: 2650.00, noJobsWithWriteOff: 5, totalFees: 14200.00, writeOffValue: 2650.00, percentageWriteOff: 18.7, jobsWithWriteOff: ['Audit Preparation - Client A', 'Statutory Audit - Client B', 'Internal Audit - Client C', 'Risk Assessment - Client D', 'Compliance Audit - Client E'] }
    ];

    switch (activeFilter) {
      case 'clients': return clientsData;
      case 'jobs': return jobsData;
      case 'job-type': return jobTypeData;
      case 'team': return teamData;
      default: return clientsData;
    }
  };

  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'desc';
    if (sortConfig.key === key && sortConfig.direction === 'desc') {
      direction = 'asc';
    }
    setSortConfig({ key, direction });
  };

  const getFilteredAndSortedData = () => {
    let data = generateData();

    // Apply search filter
    if (searchTerm) {
      data = data.filter(item =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.ref && item.ref.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (item.clientName && item.clientName.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (item.department && item.department.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Apply sorting
    if (sortConfig.key) {
      data = [...data].sort((a, b) => {
        const aValue = a[sortConfig.key as keyof WriteOffMergedData];
        const bValue = b[sortConfig.key as keyof WriteOffMergedData];

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
    }

    return data;
  };

  const filteredData = getFilteredAndSortedData();

  // Calculate summary statistics
  const totalWriteOffs = filteredData.reduce((sum, item) => sum + item.totalWriteOffValue, 0);
  const totalOccasions = filteredData.reduce((sum, item) => sum + item.writeOffOccasions, 0);
  const totalJobs = filteredData.reduce((sum, item) => sum + item.noJobsWithWriteOff, 0);
  const avgPercentage = filteredData.reduce((sum, item) => sum + item.percentageWriteOff, 0) / filteredData.length || 0;

  const handleOccasionsClick = (item: WriteOffMergedData) => {
    // Generate mock details for the dialog
    const details: WriteOffDetail[] = Array.from({ length: item.writeOffOccasions }, (_, i) => ({
      amount: Math.floor(item.totalWriteOffValue / item.writeOffOccasions * (0.8 + Math.random() * 0.4)),
      date: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000).toLocaleDateString('en-GB'),
      by: ['John Smith', 'Sarah Connor', 'Mike Johnson'][i % 3],
      logic: i % 2 === 0 ? 'Proportionally' : 'Manually',
      reason: ['Client dispute over scope', 'Performance issues', 'Relationship management', 'Quality concerns'][i % 4]
    }));

    setSelectedOccasions({ name: item.name, occasions: item.writeOffOccasions, details });
  };

  const handleJobsClick = (item: WriteOffMergedData) => {
    setSelectedJobs({ name: item.name, jobs: item.jobsWithWriteOff || [] });
  };

  // Generate log data for the log view
  const generateLogData = () => {
    return [
      { id: 1, date: '2024-01-15', client: 'Water Savers Limited', job: 'Annual Accounts Preparation', amount: 1450.00, by: 'John Smith', reason: 'Client dispute over scope', logic: 'Proportionally' },
      { id: 2, date: '2024-01-22', client: 'Green Gardens Limited', job: 'Monthly Bookkeeping', amount: 920.00, by: 'Sarah Connor', reason: 'Performance issues', logic: 'Manually' },
      { id: 3, date: '2024-02-03', client: 'Smith & Associates', job: 'VAT Return Quarterly', amount: 580.00, by: 'Mike Johnson', reason: 'Relationship management', logic: 'Proportionally' },
      { id: 4, date: '2024-02-18', client: 'Tech Solutions Ltd', job: 'Tax Advisory Services', amount: 1800.00, by: 'Anna Brown', reason: 'Quality concerns', logic: 'Manually' },
      { id: 5, date: '2024-03-05', client: 'Marketing Pro', job: 'Budget Preparation', amount: 1675.00, by: 'David Wilson', reason: 'Scope disagreement', logic: 'Proportionally' },
      { id: 6, date: '2024-03-12', client: 'Water Savers Limited', job: 'Monthly Bookkeeping', amount: 1000.00, by: 'John Smith', reason: 'Time overrun', logic: 'Manually' },
      { id: 7, date: '2024-03-25', client: 'Green Gardens Limited', job: 'Payroll Services', amount: 500.00, by: 'Sarah Connor', reason: 'Client relationship', logic: 'Proportionally' },
      { id: 8, date: '2024-04-02', client: 'Green Gardens Limited', job: 'Tax Advisory', amount: 500.00, by: 'Mike Johnson', reason: 'Performance adjustment', logic: 'Manually' }
    ];
  };

  if (showLogView) {
    const logData = generateLogData();

    console.log("enter herte ")
    return (
      <div className="space-y-6">
        {/* Header with back button */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              onClick={() => setShowLogView(false)}
              className="flex items-center gap-2"
            >
              ← Back
            </Button>
            <h2 className="text-xl font-semibold">Write Off Log</h2>
          </div>
        </div>

        {/* Log Table */}
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-left">Date</TableHead>
                    <TableHead className="text-left">Client</TableHead>
                    <TableHead className="text-left">Job</TableHead>
                    <TableHead className="text-left">Amount</TableHead>
                    <TableHead className="text-left">By</TableHead>
                    <TableHead className="text-left">Reason</TableHead>
                    <TableHead className="text-left">Logic</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logData.map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell className="text-left">{new Date(entry.date).toLocaleDateString('en-GB')}</TableCell>
                      <TableCell className="text-left font-medium">
                        <ClientNameLink clientName={entry.client} />
                      </TableCell>
                      <TableCell className="text-left">{entry.job}</TableCell>
                      <TableCell className="text-left font-medium text-red-600">{formatCurrency(entry.amount)}</TableCell>
                      <TableCell className="text-left">{entry.by}</TableCell>
                      <TableCell className="text-left">{entry.reason}</TableCell>
                      <TableCell className="text-left">{entry.logic}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
                <tfoot className="bg-muted/50 border-t-2">
                  <tr>
                    <td className="p-3 text-left font-medium" colSpan={3}>Total Write Offs</td>
                    <td className="p-3 text-left font-medium text-red-600">
                      {formatCurrency(logData.reduce((sum, entry) => sum + entry.amount, 0))}
                    </td>
                    <td className="p-3" colSpan={3}></td>
                  </tr>
                </tfoot>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="h-full">
          <CardContent className="p-4">
            <div className="text-2xl font-bold !text-[#381980]">
              {formatCurrency(totalWriteOffs)}
            </div>
            <p className="text-sm text-muted-foreground">Total Write-offs</p>
          </CardContent>
        </Card>
        <Card className="h-full">
          <CardContent className="p-4">
            <div className="text-2xl font-bold !text-[#381980]">
              {totalOccasions}
            </div>
            <p className="text-sm text-muted-foreground">Total Occasions</p>
          </CardContent>
        </Card>
        <Card className="h-full">
          <CardContent className="p-4">
            <div className="text-2xl font-bold !text-[#381980]">
              {totalJobs}
            </div>
            <p className="text-sm text-muted-foreground">Jobs with Write-offs</p>
          </CardContent>
        </Card>
        <Card className="h-full">
          <CardContent className="p-4">
            <div className="text-2xl font-bold !text-[#381980]">
              {`${avgPercentage.toFixed(1)}%`}
            </div>
            <p className="text-sm text-muted-foreground">Avg % Write-off</p>
          </CardContent>
        </Card>
      </div>


      {/* Filter Tabs */}
      <div className="flex items-center justify-between bg-white p-4 rounded-lg">
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant={activeFilter === 'clients' ? 'default' : 'outline'}
            onClick={() => setActiveFilter('clients')}
            className="px-3 py-1 h-8 text-sm"
          >
            Clients
          </Button>
          <Button
            size="sm"
            variant={activeFilter === 'jobs' ? 'default' : 'outline'}
            onClick={() => setActiveFilter('jobs')}
            className="px-3 py-1 h-8 text-sm"
          >
            Jobs
          </Button>
          <Button
            size="sm"
            variant={activeFilter === 'job-type' ? 'default' : 'outline'}
            onClick={() => setActiveFilter('job-type')}
            className="px-3 py-1 h-8 text-sm"
          >
            Job Type
          </Button>
          <Button
            size="sm"
            variant={activeFilter === 'team' ? 'default' : 'outline'}
            onClick={() => setActiveFilter('team')}
            className="px-3 py-1 h-8 text-sm"
          >
            Team
          </Button>
        </div>

        {/* Log Button */}
        <Button
          onClick={() => setShowLogView(true)}
          variant="outline"
          className="flex items-center gap-2"
        >
          Write Off Log
        </Button>
      </div>

      {/* Search */}
      <div className="flex items-center gap-4 bg-white p-4 rounded-lg">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-white"
          />
        </div>
      </div>

      {/* Data Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  {activeFilter === 'clients' && (
                    <TableHead className="text-left">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleSort('ref')}
                        className="h-8 px-1 font-medium justify-start"
                      >
                        Client Ref.
                        <ArrowUpDown className="ml-1 h-4 w-4" />
                      </Button>
                    </TableHead>
                  )}
                  <TableHead className="text-left">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSort('name')}
                      className="h-8 px-1 font-medium justify-start"
                    >
                      {activeFilter === 'clients' ? 'Client Name' :
                        activeFilter === 'jobs' ? 'Job Name' :
                          activeFilter === 'job-type' ? 'Service Type' : 'Team Member'}
                      <ArrowUpDown className="ml-1 h-4 w-4" />
                    </Button>
                  </TableHead>
                  {activeFilter === 'jobs' && (
                    <>
                      <TableHead className="text-left">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleSort('clientRef')}
                          className="h-8 px-1 font-medium justify-start"
                        >
                          Client Ref.
                          <ArrowUpDown className="ml-1 h-4 w-4" />
                        </Button>
                      </TableHead>
                      <TableHead className="text-left">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleSort('clientName')}
                          className="h-8 px-1 font-medium justify-start"
                        >
                          Client Name
                          <ArrowUpDown className="ml-1 h-4 w-4" />
                        </Button>
                      </TableHead>
                    </>
                  )}
                  <TableHead className="text-left">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSort('writeOffOccasions')}
                      className="h-8 px-1 font-medium justify-start"
                    >
                      Occasions
                      <ArrowUpDown className="ml-1 h-4 w-4" />
                    </Button>
                  </TableHead>
                  <TableHead className="text-left">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSort('totalWriteOffValue')}
                      className="h-8 px-1 font-medium justify-start"
                    >
                      Total Write Off Value
                      <ArrowUpDown className="ml-1 h-4 w-4" />
                    </Button>
                  </TableHead>
                  <TableHead className="text-left">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSort('noJobsWithWriteOff')}
                      className="h-8 px-1 font-medium justify-start"
                    >
                      Jobs With Write Off
                      <ArrowUpDown className="ml-1 h-4 w-4" />
                    </Button>
                  </TableHead>
                  <TableHead className="text-left">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSort('totalFees')}
                      className="h-8 px-1 font-medium justify-start"
                    >
                      Total Fees
                      <ArrowUpDown className="ml-1 h-4 w-4" />
                    </Button>
                  </TableHead>
                  <TableHead className="text-left">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSort('writeOffValue')}
                      className="h-8 px-1 font-medium justify-start"
                    >
                      Write Off Value
                      <ArrowUpDown className="ml-1 h-4 w-4" />
                    </Button>
                  </TableHead>
                  <TableHead className="text-left">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSort('percentageWriteOff')}
                      className="h-8 px-1 font-medium justify-start"
                    >
                      % Write Off
                      <ArrowUpDown className="ml-1 h-4 w-4" />
                    </Button>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredData.map((item, index) => (
                  <TableRow key={index} className="h-12">
                    {activeFilter === 'clients' && (
                      <TableCell className="p-3 text-sm text-left">{item.ref}</TableCell>
                    )}
                    <TableCell className="p-3 text-sm font-medium text-left">
                      {activeFilter === 'clients' ? (
                        <ClientNameLink clientName={item.name} />
                      ) : (
                        item.name
                      )}
                    </TableCell>
                    {activeFilter === 'jobs' && (
                      <>
                        <TableCell className="p-3 text-sm text-left">{item.clientRef}</TableCell>
                        <TableCell className="p-3 text-sm text-left">
                          <ClientNameLink clientName={item.clientName || ''} />
                        </TableCell>
                      </>
                    )}
                    <TableCell className="p-3 text-left">
                      <span
                        className="inline-flex items-center justify-center h-8 w-8 rounded-full text-xs font-medium cursor-pointer hover:opacity-80 transition-colors bg-gradient-to-br from-primary/20 to-primary/30 text-primary border border-primary/20"
                        onClick={() => handleOccasionsClick(item)}
                      >
                        {item.writeOffOccasions}
                      </span>
                    </TableCell>
                    <TableCell className="p-3 text-left text-sm font-medium">
                      {formatCurrency(item.totalWriteOffValue)}
                    </TableCell>
                    <TableCell className="p-3 text-left text-sm">
                      <span
                        className="cursor-pointer hover:underline text-blue-600"
                        onClick={() => handleJobsClick(item)}
                      >
                        {item.noJobsWithWriteOff}
                      </span>
                    </TableCell>
                    <TableCell className="p-3 text-left text-sm">
                      {formatCurrency(item.totalFees)}
                    </TableCell>
                    <TableCell className="p-3 text-left text-sm font-medium text-red-600">
                      {formatCurrency(item.writeOffValue)}
                    </TableCell>
                    <TableCell className="p-3 text-left text-sm font-medium">
                      {item.percentageWriteOff.toFixed(1)}%
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
              <tfoot>
                <tr className="border-t-2 bg-muted/50">
                  {activeFilter === 'clients' && <td className="p-3"></td>}
                  <td className="p-3 text-sm font-medium text-left">TOTALS</td>
                  {activeFilter === 'jobs' && <td className="p-3"></td>}
                  {activeFilter === 'jobs' && <td className="p-3"></td>}
                  <td className="p-3 text-left text-sm font-medium">{totalOccasions}</td>
                  <td className="p-3 text-left text-sm font-medium">{formatCurrency(totalWriteOffs)}</td>
                  <td className="p-3 text-left text-sm font-medium">{totalJobs}</td>
                  <td className="p-3 text-left text-sm font-medium">
                    {formatCurrency(filteredData.reduce((sum, item) => sum + item.totalFees, 0))}
                  </td>
                  <td className="p-3 text-left text-sm font-medium text-red-600">
                    {formatCurrency(filteredData.reduce((sum, item) => sum + item.writeOffValue, 0))}
                  </td>
                  <td className="p-3 text-left text-sm font-medium">{avgPercentage.toFixed(1)}%</td>
                </tr>
              </tfoot>
            </Table>
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
              <p className="text-sm font-medium">
                <strong>{activeFilter === 'clients' ? 'Client' : activeFilter === 'jobs' ? 'Job' : activeFilter === 'job-type' ? 'Service Type' : 'Team Member'}:</strong> {selectedOccasions?.name}
              </p>
              <p className="text-sm font-medium">
                <strong>Number of Write Off Occasions:</strong> {selectedOccasions?.occasions}
              </p>
            </div>

            <div className="space-y-4">
              <h4 className="font-medium">Write Off Details:</h4>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-left">Amount</TableHead>
                      <TableHead className="text-left">Date</TableHead>
                      <TableHead className="text-left">By</TableHead>
                      <TableHead className="text-left">Write Off Logic</TableHead>
                      <TableHead className="text-left">Write Off Reason</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedOccasions?.details.map((detail, index) => (
                      <TableRow key={index}>
                        <TableCell className="text-left">{formatCurrency(detail.amount)}</TableCell>
                        <TableCell className="text-left">{detail.date}</TableCell>
                        <TableCell className="text-left">{detail.by}</TableCell>
                        <TableCell className="text-left">{detail.logic}</TableCell>
                        <TableCell className="text-left">{detail.reason}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Jobs with Write Off Dialog */}
      <Dialog open={selectedJobs !== null} onOpenChange={() => setSelectedJobs(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Jobs with Write Off</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm font-medium">
              <strong>{activeFilter === 'clients' ? 'Client' : activeFilter === 'jobs' ? 'Job' : activeFilter === 'job-type' ? 'Service Type' : 'Team Member'}:</strong> {selectedJobs?.name}
            </p>
            <p className="text-sm font-medium">
              <strong>Number of Jobs with Write Off:</strong> {selectedJobs?.jobs.length}
            </p>

            <div className="space-y-2">
              <h4 className="font-medium">Jobs:</h4>
              <div className="max-h-60 overflow-y-auto">
                <ul className="space-y-1">
                  {selectedJobs?.jobs.map((job, index) => (
                    <li key={index} className="text-sm p-2 bg-muted/50 rounded border-l-2 border-primary">
                      {job}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default WriteOffMergedTab;