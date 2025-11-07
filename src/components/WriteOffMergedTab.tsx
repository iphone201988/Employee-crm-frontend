import React, { useMemo, useState } from 'react';
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
import { useGetWriteOffDashboardQuery, useGetWriteOffQuery } from '@/store/wipApi';

interface WriteOffMergedData {
  id?: string;
  name: string;
  ref?: string;
  clientName?: string;
  clientRef?: string;
  clientId?: string;
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
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [logPage, setLogPage] = useState(1);
  const [logLimit, setLogLimit] = useState(10);

  // API integration: map active filter to backend type
  const apiType: 'client' | 'job' | 'jobtype' | 'team' = useMemo(() => {
    if (activeFilter === 'clients') return 'client';
    if (activeFilter === 'jobs') return 'job';
    if (activeFilter === 'job-type') return 'jobtype';
    return 'team';
  }, [activeFilter]);

  const { data: dashboardResp, isLoading } = useGetWriteOffDashboardQuery({ type: apiType, page, limit });

  // Preserve raw data for dialogs
  const rawItems: any[] = dashboardResp?.data || [];

  // Map API data to table rows per type
  const generateData = (): WriteOffMergedData[] => {
    if (!rawItems || rawItems.length === 0) return [];
    return rawItems.map((item: any) => {
      if (apiType === 'client') {
        return {
          id: item._id,
          name: item.name || 'N/A',
          ref: item.clientRef || 'N/A',
          clientId: item._id || undefined,
          writeOffOccasions: Array.isArray(item.occasionDetails) ? item.occasionDetails.length : 0,
          totalWriteOffValue: Number(item.totalWriteOffValue || 0),
          noJobsWithWriteOff: Number(item.jobsWithWriteOffCount || (Array.isArray(item.jobsWithWriteOff) ? item.jobsWithWriteOff.length : 0)),
          totalFees: Number(item.totalFees || 0),
          writeOffValue: Number(item.totalWriteOffValue || 0),
          percentageWriteOff: Number(item.writeOffPercentage || 0),
          jobsWithWriteOff: (item.uniqueJobs || []).map((j: any) => j.name)
        } as WriteOffMergedData;
      }
      if (apiType === 'team') {
        return {
          id: item._id,
          name: item.name || 'N/A',
          writeOffOccasions: Array.isArray(item.occasionDetails) ? item.occasionDetails.length : 0,
          totalWriteOffValue: Number(item.totalWriteOffValue || 0),
          noJobsWithWriteOff: Number(item.jobsCount || 0),
          totalFees: Number(item.totalFees || 0),
          writeOffValue: Number(item.totalWriteOffValue || 0),
          percentageWriteOff: Number(item.writeOffPercentage || 0),
          jobsWithWriteOff: (item.uniqueJobs || []).map((j: any) => j.name)
        } as WriteOffMergedData;
      }
      if (apiType === 'jobtype') {
        return {
          id: item._id,
          name: item.categoryName || 'N/A',
          writeOffOccasions: Array.isArray(item.occasionDetails) ? item.occasionDetails.length : 0,
          totalWriteOffValue: Number(item.totalWriteOffValue || 0),
          noJobsWithWriteOff: Number(item.jobsCount || 0),
          totalFees: Number(item.totalFees || 0),
          writeOffValue: Number(item.totalWriteOffValue || 0),
          percentageWriteOff: Number(item.writeOffPercentage || 0),
          jobsWithWriteOff: (item.uniqueJobs || []).map((j: any) => j.name)
        } as WriteOffMergedData;
      }
      // job
      return {
        id: item._id,
        name: item.name || 'N/A',
        clientName: item.clientDetails?.name || 'N/A',
        clientRef: item.clientDetails?.clientRef || 'N/A',
        clientId: item.clientDetails?._id || undefined,
        writeOffOccasions: Array.isArray(item.occasionDetails) ? item.occasionDetails.length : 0,
        totalWriteOffValue: Number(item.totalWriteOffValue || 0),
        noJobsWithWriteOff: 1,
        totalFees: Number(item.totalFees || 0),
        writeOffValue: Number(item.totalWriteOffValue || 0),
        percentageWriteOff: Number(item.writeOffPercentage || 0),
        jobsWithWriteOff: (item.uniqueJobs || []).map((j: any) => j.name)
      } as WriteOffMergedData;
    });
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
  const avgPercentage = filteredData.reduce((sum, item) => sum + item.percentageWriteOff, 0) / (filteredData.length || 1);

  const handleOccasionsClick = (item: WriteOffMergedData) => {
    // Find matching raw item to get real occasionDetails
    const match = rawItems.find((ri: any) => {
      if (apiType === 'client') return ri.name === item.name;
      if (apiType === 'team') return ri.name === item.name;
      if (apiType === 'jobtype') return ri.categoryName === item.name;
      return ri.name === item.name;
    });
    const details: WriteOffDetail[] = Array.isArray(match?.occasionDetails)
      ? match.occasionDetails.map((d: any) => ({
          amount: Number(d.amount || 0),
          date: d.date ? new Date(d.date).toLocaleDateString('en-GB') : '-',
          by: d.by || 'N/A',
          logic: d.logic || '-',
          reason: d.reason || '-'
        }))
      : [];
    setSelectedOccasions({ name: item.name, occasions: details.length, details });
  };

  const handleJobsClick = (item: WriteOffMergedData) => {
    setSelectedJobs({ name: item.name, jobs: item.jobsWithWriteOff || [] });
  };

  // Fetch write-off log data
  const { data: writeOffLogResp, isLoading: isLoadingLog } = useGetWriteOffQuery(
    showLogView ? { page: logPage, limit: logLimit } : undefined,
    { skip: !showLogView }
  );

  const logData = useMemo(() => {
    if (!writeOffLogResp?.data || !Array.isArray(writeOffLogResp.data)) return [];
    return writeOffLogResp.data.map((item: any) => {
      const clientDetails = typeof item.clientDetails === 'object' && item.clientDetails !== null 
        ? item.clientDetails 
        : null;
      const jobs = Array.isArray(item.jobs) && item.jobs.length > 0 && typeof item.jobs[0] === 'object'
        ? item.jobs
        : [];
      const firstJob = jobs.length > 0 ? jobs[0] : null;
      
      return {
        id: item._id,
        date: item.createdAt ? new Date(item.createdAt).toISOString() : null,
        client: clientDetails?.name || 'N/A',
        clientId: clientDetails?._id || undefined,
        job: firstJob?.name || (Array.isArray(item.jobs) && item.jobs[0] === 'N/A' ? 'N/A' : 'N/A'),
        amount: Number(item.amount || 0),
        by: item.by || 'N/A',
        reason: item.reason || 'N/A',
        logic: item.logic === 'proportionally' ? 'Proportionally' : item.logic === 'manually' ? 'Manually' : item.logic || 'N/A'
      };
    });
  }, [writeOffLogResp]);

  const logTotalWriteOffs = writeOffLogResp?.totalWriteOffs || logData.reduce((sum, entry) => sum + entry.amount, 0);

  if (showLogView) {
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
                  {isLoadingLog ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        Loading write-off log...
                      </TableCell>
                    </TableRow>
                  ) : logData.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        No write-off records found
                      </TableCell>
                    </TableRow>
                  ) : (
                    logData.map((entry) => (
                      <TableRow key={entry.id}>
                        <TableCell className="text-left">
                          {entry.date ? new Date(entry.date).toLocaleDateString('en-GB') : 'N/A'}
                        </TableCell>
                        <TableCell className="text-left font-medium">
                          <ClientNameLink name={entry.client} ciientId={entry.clientId} />
                        </TableCell>
                        <TableCell className="text-left">{entry.job}</TableCell>
                        <TableCell className="text-left font-medium text-red-600">{formatCurrency(entry.amount)}</TableCell>
                        <TableCell className="text-left">{entry.by}</TableCell>
                        <TableCell className="text-left">{entry.reason}</TableCell>
                        <TableCell className="text-left">{entry.logic}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
                <tfoot className="bg-muted/50 border-t-2">
                  <tr>
                    <td className="p-3 text-left font-medium" colSpan={3}>Total Write Offs</td>
                    <td className="p-3 text-left font-medium text-red-600">
                      {formatCurrency(logTotalWriteOffs)}
                    </td>
                    <td className="p-3" colSpan={3}></td>
                  </tr>
                </tfoot>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Pagination Controls for Log View */}
        {writeOffLogResp?.pagination && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Show:</span>
                <select
                  value={logLimit}
                  onChange={(e) => { setLogPage(1); setLogLimit(Number(e.target.value)); }}
                  className="border border-gray-300 rounded px-2 py-1 text-sm"
                >
                  <option value={5}>5 per page</option>
                  <option value={10}>10 per page</option>
                  <option value={20}>20 per page</option>
                  <option value={50}>50 per page</option>
                </select>
              </div>
              <div className="text-sm text-gray-500">
                {(() => {
                  const total = writeOffLogResp.pagination.total || 0;
                  const start = total > 0 ? ((logPage - 1) * logLimit) + 1 : 0;
                  const end = Math.min(logPage * logLimit, total);
                  return `Showing ${start} to ${end} of ${total} records`;
                })()}
              </div>
            </div>
            {(() => {
              const totalPages = Math.max(1, Number(writeOffLogResp.pagination.totalPages || 1));
              if (totalPages <= 1) return null;
              return (
                <div className="flex justify-center items-center gap-2">
                  <Button onClick={() => setLogPage(p => Math.max(1, p - 1))} disabled={logPage === 1} variant="outline" size="sm">Previous</Button>
                  <span className="text-sm">Page {logPage} of {totalPages}</span>
                  <Button onClick={() => setLogPage(p => Math.min(totalPages, p + 1))} disabled={logPage >= totalPages} variant="outline" size="sm">Next</Button>
                </div>
              );
            })()}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Pagination Controls */}
      {dashboardResp?.pagination && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Show:</span>
              <select
                value={limit}
                onChange={(e) => { setPage(1); setLimit(Number(e.target.value)); }}
                className="border border-gray-300 rounded px-2 py-1 text-sm"
              >
                <option value={5}>5 per page</option>
                <option value={10}>10 per page</option>
                <option value={20}>20 per page</option>
                <option value={50}>50 per page</option>
              </select>
            </div>
            <div className="text-sm text-gray-500">
              {(() => {
                const total = dashboardResp.pagination.total || 0;
                const start = total > 0 ? ((page - 1) * limit) + 1 : 0;
                const end = Math.min(page * limit, total);
                return `Showing ${start} to ${end} of ${total} records`;
              })()}
            </div>
          </div>
          {(() => {
            const totalPages = Math.max(1, Number(dashboardResp.pagination.totalPages || 1));
            if (totalPages <= 1) return null;
            return (
              <div className="flex justify-center items-center gap-2">
                <Button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} variant="outline" size="sm">Previous</Button>
                <span className="text-sm">Page {page} of {totalPages}</span>
                <Button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages} variant="outline" size="sm">Next</Button>
              </div>
            );
          })()}
        </div>
      )}
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
      <div className="flex items-center justify-between p-[6px] rounded-sm bg-[#E7E5F2]">
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant={activeFilter === 'clients' ? 'default' : 'outline'}
            onClick={() => setActiveFilter('clients')}
            className="px-3 py-1 h-8 text-sm rounded-sm"
          >
            Clients
          </Button>
          <Button
            size="sm"
            variant={activeFilter === 'jobs' ? 'default' : 'outline'}
            onClick={() => setActiveFilter('jobs')}
            className="px-3 py-1 h-8 text-sm rounded-sm"
          >
            Jobs
          </Button>
          <Button
            size="sm"
            variant={activeFilter === 'job-type' ? 'default' : 'outline'}
            onClick={() => setActiveFilter('job-type')}
            className="px-3 py-1 h-8 text-sm rounded-sm"
          >
            Job Type
          </Button>
          <Button
            size="sm"
            variant={activeFilter === 'team' ? 'default' : 'outline'}
            onClick={() => setActiveFilter('team')}
            className="px-3 py-1 h-8 text-sm rounded-sm"
          >
            Team
          </Button>
        </div>

        {/* Log Button */}
        <Button
          onClick={() => setShowLogView(true)}
          variant="outline"
          className="flex items-center gap-2 px-3 py-1 h-8 text-sm rounded-sm"
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
              <TableHeader className='!bg-[#edecf4] !text-[#381980]'>
                <TableRow>
                  {activeFilter === 'clients' && (
                    <TableHead className="text-left px-3">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleSort('ref')}
                        className="h-8 px-1 font-medium justify-start text-[12px]"
                      >
                        Client Ref.
                        <ArrowUpDown className="ml-1 h-4 w-4" />
                      </Button>
                    </TableHead>
                  )}
                  <TableHead className="text-left px-3">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSort('name')}
                      className="h-8 px-1 font-medium justify-start text-[12px]"
                    >
                      {activeFilter === 'clients' ? 'Client Name' :
                        activeFilter === 'jobs' ? 'Job Name' :
                          activeFilter === 'job-type' ? 'Service Type' : 'Team Member'}
                      <ArrowUpDown className="ml-1 h-4 w-4" />
                    </Button>
                  </TableHead>
                  {activeFilter === 'jobs' && (
                    <>
                      <TableHead className="text-left px-3">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleSort('clientRef')}
                          className="h-8 px-1 font-medium justify-start text-[12px]"
                        >
                          Client Ref.
                          <ArrowUpDown className="ml-1 h-4 w-4" />
                        </Button>
                      </TableHead>
                      <TableHead className="text-left px-3">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleSort('clientName')}
                          className="h-8 px-1 font-medium justify-start text-[12px]"
                        >
                          Client Name
                          <ArrowUpDown className="ml-1 h-4 w-4" />
                        </Button>
                      </TableHead>
                    </>
                  )}
                  <TableHead className="text-left px-3">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSort('writeOffOccasions')}
                      className="h-8 px-1 font-medium justify-start text-[12px]"
                    >
                      Occasions
                      <ArrowUpDown className="ml-1 h-4 w-4" />
                    </Button>
                  </TableHead>
                  <TableHead className="text-left px-3">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSort('totalWriteOffValue')}
                      className="h-8 px-1 font-medium justify-start text-[12px]"
                    >
                      Total Write Off Value
                      <ArrowUpDown className="ml-1 h-4 w-4" />
                    </Button>
                  </TableHead>
                  <TableHead className="text-left px-3">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSort('noJobsWithWriteOff')}
                      className="h-8 px-1 font-medium justify-start text-[12px]"
                    >
                      Jobs With Write Off
                      <ArrowUpDown className="ml-1 h-4 w-4" />
                    </Button>
                  </TableHead>
                  <TableHead className="text-left px-3">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSort('totalFees')}
                      className="h-8 px-1 font-medium justify-start text-[12px]"
                    >
                      Total Fees
                      <ArrowUpDown className="ml-1 h-4 w-4" />
                    </Button>
                  </TableHead>
                  <TableHead className="text-left px-3">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSort('writeOffValue')}
                      className="h-8 px-1 font-medium justify-start text-[12px]"
                    >
                      Write Off Value
                      <ArrowUpDown className="ml-1 h-4 w-4" />
                    </Button>
                  </TableHead>
                  <TableHead className="text-left px-3">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSort('percentageWriteOff')}
                      className="h-8 px-1 font-medium justify-start text-[12px]"
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
                      <ClientNameLink name={item.name} ciientId={item.clientId} />
                    ) : (
                      item.name
                    )}
                    </TableCell>
                    {activeFilter === 'jobs' && (
                      <>
                        <TableCell className="p-3 text-sm text-left">{item.clientRef}</TableCell>
                        <TableCell className="p-3 text-sm text-left">
                          <ClientNameLink name={item.clientName || ''} ciientId={item.clientId} />
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