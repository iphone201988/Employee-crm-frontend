import React, { useEffect, useMemo, useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, ArrowUpDown } from 'lucide-react';
import { TEAM_MEMBER_NAMES } from '@/constants/teamConstants';
import { getProfileImage, getUserInitials } from '@/utils/profiles';
import { formatCurrency } from '@/lib/currency';
import { formatTime, TimeFormat } from '@/utils/timeFormat';
import { useGetCurrentUserQuery } from '@/store/authApi';
import { useLazyGetTabAccessQuery } from '@/store/authApi';
import { get } from 'http';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@radix-ui/react-tooltip';
import { useGetReportsQuery } from '@/store/teamApi';
interface ReportData {
  name: string;
  avatarUrl?: string;
  hourlyRate?: number;
  capacity: number;
  logged: number;
  nonBillable: number;
  billable: number;
  wroteOff: number;
  rate: number;
  billableAmount?: number;
  resourceCost: number;
  profit: number;
}

// This function generates mock data for demonstration purposes.
const generateMockData = (weekOffset: number = 0, timeFilter: string = 'weekly'): ReportData[] => {
  if (weekOffset > 0) {
    return TEAM_MEMBER_NAMES.map(name => ({
      name, capacity: 0, logged: 0, nonBillable: 0, billable: 0, wroteOff: 0, rate: 0, resourceCost: 0, profit: 0
    }));
  }

  return TEAM_MEMBER_NAMES.map((name, index) => {
    const weekVariation = Math.sin(weekOffset * 0.1 + index) * 0.2 + 1;
    let capacity = 37.5; // Weekly default
    if (timeFilter === 'daily') capacity = 8;
    else if (timeFilter === 'monthly') capacity = 160;
    else if (timeFilter === 'yearly') capacity = 2080;

    const logged = Math.min(capacity * (0.8 + Math.random() * 0.2) * weekVariation, capacity);
    const billable = logged * (0.7 + Math.random() * 0.15);
    const wroteOff = logged * (0.05 + Math.random() * 0.1);
    const nonBillable = logged - billable - wroteOff;
    const rate = 75 + Math.random() * 50;
    const resourceCost = capacity * (rate / 2);
    const profit = (billable * rate) - resourceCost;

    return { name, capacity, logged, nonBillable, billable, wroteOff, rate, resourceCost, profit };
  });
};

const ReportsTab = () => {
  const [timeFilter, setTimeFilter] = useState<'daily' | 'weekly' | 'monthly' | 'yearly'>('yearly');
  const [currentPeriodOffset, setCurrentPeriodOffset] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const { data: currentUserData }: any = useGetCurrentUserQuery();
  const [sortConfig, setSortConfig] = useState<{ key: keyof ReportData | null; direction: 'asc' | 'desc' }>({ key: null, direction: 'asc' });
  const [timeFormat, setTimeFormat] = useState<TimeFormat>('0:00');
  const [getTabAccess, { data: currentTabsUsers }] = useLazyGetTabAccessQuery()


  const hasReportPermission = currentUserData?.data?.features?.reports;

  // Calculate date range based on time filter and offset
  const { startDate, endDate } = useMemo(() => {
    const now = new Date();
    
    if (timeFilter === 'daily') {
      const targetDate = new Date();
      targetDate.setDate(now.getDate() + currentPeriodOffset);
      const start = new Date(targetDate.setHours(0, 0, 0, 0));
      const end = new Date(targetDate.setHours(23, 59, 59, 999));
      return { 
        startDate: start.toISOString(), 
        endDate: end.toISOString() 
      };
    }
    
    if (timeFilter === 'weekly') {
      const startOfWeek = new Date();
      startOfWeek.setDate(now.getDate() - now.getDay() + 1 + currentPeriodOffset * 7);
      startOfWeek.setHours(0, 0, 0, 0);
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      endOfWeek.setHours(23, 59, 59, 999);
      return { 
        startDate: startOfWeek.toISOString(), 
        endDate: endOfWeek.toISOString() 
      };
    }
    
    if (timeFilter === 'monthly') {
      const d = new Date(now.getFullYear(), now.getMonth() + currentPeriodOffset, 1);
      const start = new Date(d.getFullYear(), d.getMonth(), 1);
      start.setHours(0, 0, 0, 0);
      const end = new Date(d.getFullYear(), d.getMonth() + 1, 0);
      end.setHours(23, 59, 59, 999);
      return { 
        startDate: start.toISOString(), 
        endDate: end.toISOString() 
      };
    }
    
    // Yearly
    const year = now.getFullYear() + currentPeriodOffset;
    const start = new Date(year, 0, 1);
    start.setHours(0, 0, 0, 0);
    const end = new Date(year, 11, 31);
    end.setHours(23, 59, 59, 999);
    return { 
      startDate: start.toISOString(), 
      endDate: end.toISOString() 
    };
  }, [timeFilter, currentPeriodOffset]);

  // Fetch reports data from API
  const { data: reportsData, isLoading, isError } = useGetReportsQuery({
    startDate,
    endDate,
    periodType: timeFilter,
    page,
    limit
  });

  const handlePeriodChange = (direction: 'prev' | 'next') => {
    setCurrentPeriodOffset(prev => direction === 'prev' ? prev - 1 : prev + 1);
    setPage(1); // Reset to first page when changing period
  };

  const handleTimeFilterChange = (newFilter: string) => {
    setTimeFilter(newFilter as 'daily' | 'weekly' | 'monthly' | 'yearly');
    setCurrentPeriodOffset(0); // Reset to the current period
    setPage(1); // Reset to first page when changing filter
  };

  const handleSort = (key: keyof ReportData) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  useEffect(() => {
    let usersForTab = getTabAccess('reports')
    console.log('usersForTab=================sncbdsjh,csdhjkcbgdsfvkjdsfjk', usersForTab)
  }, [currentUserData])

  // Convert API data to ReportData format
  const reportData = useMemo(() => {
    if (!reportsData?.data?.reports) return [];
    
    return reportsData.data.reports.map(member => {
      // Calculate values from seconds
      const capacityHours = member.capacity / 3600;
      const loggedHours = member.logged / 3600;
      const billableHours = member.billable / 3600;
      const nonBillableHours = member.nonBillable / 3600;
      const writeOffHours = member.writeOff / 3600;
      
      // Calculate resource cost: hourlyRate * logged hours
      const resourceCost = member.hourlyRate * loggedHours;
      
      // Calculate profit: billableAmount - resourceCost
      const profit = member.billableAmount - resourceCost;
      
      return {
        name: member.name,
        avatarUrl: member.avatarUrl,
        hourlyRate: member.hourlyRate,
        capacity: capacityHours,
        logged: loggedHours,
        billable: billableHours,
        nonBillable: nonBillableHours,
        wroteOff: writeOffHours,
        rate: member.hourlyRate,
        billableAmount: member.billableAmount,
        resourceCost,
        profit
      };
    });
  }, [reportsData]);

  const sortedData = useMemo(() => {
    if (!sortConfig.key) return reportData;
    return [...reportData].sort((a, b) => {
      const aValue = a[sortConfig.key!];
      const bValue = b[sortConfig.key!];
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortConfig.direction === 'asc' ? aValue - bValue : bValue - aValue;
      }
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortConfig.direction === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
      }
      return 0;
    });
  }, [reportData, sortConfig]);

  const periodInfo = useMemo(() => {
    const now = new Date();
    const formatDate = (date: Date) => date.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });

    if (timeFilter === 'daily') {
      const targetDate = new Date();
      targetDate.setDate(now.getDate() + currentPeriodOffset);
      return { label: formatDate(targetDate) };
    }
    if (timeFilter === 'weekly') {
      const startOfWeek = new Date();
      startOfWeek.setDate(now.getDate() - now.getDay() + 1 + currentPeriodOffset * 7);
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      const getWeekNumber = (d: Date) => {
        const onejan = new Date(d.getFullYear(), 0, 1);
        return Math.ceil((((d.getTime() - onejan.getTime()) / 86400000) + onejan.getDay() + 1) / 7);
      }
      return { label: `${formatDate(startOfWeek)} to ${formatDate(endOfWeek)} - Week ${getWeekNumber(startOfWeek)}` };
    }
    if (timeFilter === 'monthly') {
      const d = new Date(now.getFullYear(), now.getMonth() + currentPeriodOffset, 1);
      return { label: d.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' }) };
    }
    // Yearly
    return { label: `${now.getFullYear() + currentPeriodOffset}` };
  }, [timeFilter, currentPeriodOffset]);

  const totals = useMemo(() => {
    if (!reportsData?.data) return { capacity: 0, logged: 0, revenue: 0, teamMembers: 0 };
    
    const totalCapacity = reportsData.data.totalCapacity / 3600; // Convert seconds to hours
    const totalLogged = reportsData.data.totalLogged / 3600; // Convert seconds to hours
    const totalRevenue = reportsData.data.totalRevenue;
    const teamMembers = reportsData.data.teamMembers;
    
    return { capacity: totalCapacity, logged: totalLogged, revenue: totalRevenue, teamMembers };
  }, [reportsData]);

  const getPercentage = (value: number, total: number) => (total > 0 ? (value / total) * 100 : 0);
  const formatHours = (hours: number) => formatTime(hours, timeFormat);
  
  // Format time as HH:MM:SS
  const formatHoursToHHMMSS = (hours: number) => {
    const totalSeconds = Math.max(0, Math.round((hours || 0) * 3600));
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  // Use a guard clause for permission checking
  if (!hasReportPermission) {
    return <p>You do not have permission to view this page.</p>
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <h1 className="text-xl sm:text-2xl font-semibold text-foreground">Reports</h1>
          <div className="flex -space-x-2 overflow-x-auto pb-2 sm:pb-0">
            {/* Wrap the list of avatars in a single TooltipProvider */}
            <TooltipProvider>
              {currentTabsUsers?.result.length > 0 &&
                currentTabsUsers?.result.map((user: any, index) => (
                  <Tooltip key={user?.id || index} delayDuration={100}>
                    <TooltipTrigger asChild>
                      <Avatar
                        className="border-2 border-background w-8 h-8 sm:w-10 sm:h-10 flex-shrink-0 rounded-full"
                      // The native `title` attribute is no longer needed
                      >
                        <AvatarImage
                          src={
                            import.meta.env.VITE_BACKEND_BASE_URL + user?.avatarUrl
                          }
                          className="rounded-full"
                        />
                        <AvatarFallback className="text-xs rounded-full bg-gray-400">
                          {user?.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{user?.name}</p>
                    </TooltipContent>
                  </Tooltip>
                ))}
            </TooltipProvider>
          </div>
        </div>
      </div>
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card><CardContent className="p-4"><div className="text-2xl font-bold text-[#381980]">{totals.teamMembers}</div><p className="text-sm text-muted-foreground">Team Members</p></CardContent></Card>
        <Card><CardContent className="p-4"><div className="text-2xl font-bold text-[#381980]">{formatHours(totals.capacity)}</div><p className="text-sm text-muted-foreground">Total Capacity</p></CardContent></Card>
        <Card><CardContent className="p-4"><div className="text-2xl font-bold text-[#381980]">{formatHours(totals.logged)}</div><p className="text-sm text-muted-foreground">Total Logged</p></CardContent></Card>
        <Card><CardContent className="p-4"><div className="text-2xl font-bold text-[#381980]">{formatCurrency(totals.revenue)}</div><p className="text-sm text-muted-foreground">Total Revenue</p></CardContent></Card>
      </div>

      {/* Controls */}
      <div className="flex flex-col items-center gap-4">
        <div className="flex items-center gap-1 bg-muted rounded-md p-1">
          <Button variant={timeFilter === 'daily' ? 'default' : 'ghost'} size="sm" onClick={() => handleTimeFilterChange('daily')}>Daily</Button>
          <Button variant={timeFilter === 'weekly' ? 'default' : 'ghost'} size="sm" onClick={() => handleTimeFilterChange('weekly')}>Weekly</Button>
          <Button variant={timeFilter === 'monthly' ? 'default' : 'ghost'} size="sm" onClick={() => handleTimeFilterChange('monthly')}>Monthly</Button>
          <Button variant={timeFilter === 'yearly' ? 'default' : 'ghost'} size="sm" onClick={() => handleTimeFilterChange('yearly')}>Yearly</Button>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="h-8 w-8 p-0" onClick={() => handlePeriodChange('prev')}><ChevronLeft className="h-4 w-4" /></Button>
          <span className="text-sm font-medium whitespace-nowrap">{periodInfo.label}</span>
          <Button variant="outline" size="sm" className="h-8 w-8 p-0" onClick={() => handlePeriodChange('next')}><ChevronRight className="h-4 w-4" /></Button>
        </div>
      </div>

      {/* Reports Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10"></TableHead>
                  <TableHead><Button variant="ghost" size="sm" className="h-6 px-1 text-xs" onClick={() => handleSort('name')}>Team Member <ArrowUpDown className="ml-1 h-3 w-3" /></Button></TableHead>
                  <TableHead className="text-center"><Button variant="ghost" size="sm" className="h-6 px-1 text-xs" onClick={() => handleSort('capacity')}>Capacity <ArrowUpDown className="ml-1 h-3 w-3" /></Button></TableHead>
                  <TableHead className="text-center"><Button variant="ghost" size="sm" className="h-6 px-1 text-xs" onClick={() => handleSort('logged')}>Logged <ArrowUpDown className="ml-1 h-3 w-3" /></Button></TableHead>
                  <TableHead className="text-center"><Button variant="ghost" size="sm" className="h-6 px-1 text-xs" onClick={() => handleSort('billable')}>Billable <ArrowUpDown className="ml-1 h-3 w-3" /></Button></TableHead>
                  <TableHead className="text-center"><Button variant="ghost" size="sm" className="h-6 px-1 text-xs" onClick={() => handleSort('nonBillable')}>Non-Billable <ArrowUpDown className="ml-1 h-3 w-3" /></Button></TableHead>
                  <TableHead className="text-center"><Button variant="ghost" size="sm" className="h-6 px-1 text-xs" onClick={() => handleSort('wroteOff')}>Write Off <ArrowUpDown className="ml-1 h-3 w-3" /></Button></TableHead>
                  <TableHead className="text-center"><Button variant="ghost" size="sm" className="h-6 px-1 text-xs" onClick={() => handleSort('resourceCost')}>Resource Cost <ArrowUpDown className="ml-1 h-3 w-3" /></Button></TableHead>
                  <TableHead className="text-center"><Button variant="ghost" size="sm" className="h-6 px-1 text-xs" onClick={() => handleSort('profit')}>Profit <ArrowUpDown className="ml-1 h-3 w-3" /></Button></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading && (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center py-10">
                      Loading reports...
                    </TableCell>
                  </TableRow>
                )}
                {isError && (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center py-10 text-red-500">
                      Failed to load reports.
                    </TableCell>
                  </TableRow>
                )}
                {!isLoading && !isError && sortedData.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center py-10">
                      No data available for this period.
                    </TableCell>
                  </TableRow>
                )}
                {!isLoading && sortedData.map((member: any) => (
                  <TableRow key={member.name} className="h-8">
                    <TableCell className="p-1 px-4">
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={member.avatarUrl ? import.meta.env.VITE_BACKEND_BASE_URL + member.avatarUrl : getProfileImage(member.name)} />
                        <AvatarFallback className="text-xs">{getUserInitials(member.name)}</AvatarFallback>
                      </Avatar>
                    </TableCell>
                    <TableCell className="font-medium p-1 text-xs">{member.name}</TableCell>
                    <TableCell className="text-center border-l p-1"><div className="text-xs font-medium">{formatHoursToHHMMSS(member.capacity)}</div></TableCell>
                    <TableCell className="text-center border-l p-1"><div className="flex flex-col items-center space-y-1"><div className="text-xs">{formatHoursToHHMMSS(member.logged)} ({getPercentage(member.logged, member.capacity).toFixed(1)}%)</div><Progress value={getPercentage(member.logged, member.capacity)} className="h-1 w-14" /></div></TableCell>
                    <TableCell className="text-center border-l p-1"><div className="flex flex-col items-center space-y-1"><div className="text-xs">{formatHoursToHHMMSS(member.billable)} ({getPercentage(member.billable, member.logged).toFixed(1)}%) - {formatCurrency(member.billableAmount)}</div><Progress value={getPercentage(member.billable, member.logged)} className="h-1 w-14" /></div></TableCell>
                    <TableCell className="text-center border-l p-1"><div className="flex flex-col items-center space-y-1"><div className="text-xs">{formatHoursToHHMMSS(member.nonBillable)} ({getPercentage(member.nonBillable, member.logged).toFixed(1)}%)</div><Progress value={getPercentage(member.nonBillable, member.logged)} className="h-1 w-14" /></div></TableCell>
                    <TableCell className="text-center border-l p-1"><div className="flex flex-col items-center space-y-1"><div className="text-xs">{formatHoursToHHMMSS(member.wroteOff)} ({getPercentage(member.wroteOff, member.logged).toFixed(1)}%)</div><Progress value={getPercentage(member.wroteOff, member.logged)} className="h-1 w-14" /></div></TableCell>
                    <TableCell className="text-center border-l p-1"><div className="text-xs font-medium text-red-600">{formatCurrency(member.resourceCost)}</div></TableCell>
                    <TableCell className="text-center border-l p-1"><div className={`text-xs font-medium ${member.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>{formatCurrency(member.profit)}</div></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Pagination */}
      {reportsData?.data?.pagination && reportsData.data.pagination.total > 0 && (
        <div className="space-y-4 mt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Show:</span>
              <select
                value={limit}
                onChange={(e) => { setPage(1); setLimit(Number(e.target.value)); }}
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
              Showing {((page - 1) * limit) + 1} to {Math.min(page * limit, reportsData.data.pagination.total)} of {reportsData.data.pagination.total} members
            </div>
          </div>
          
          {Math.ceil(reportsData.data.pagination.total / limit) > 1 && (
            <div className="flex justify-center items-center gap-2">
              <Button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1 || isLoading}
                variant="outline"
                size="sm"
              >
                <ChevronLeft className="h-4 w-4" /> Previous
              </Button>

              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, Math.ceil(reportsData.data.pagination.total / limit)) }, (_, i) => {
                  let pageNum;
                  const totalPages = Math.ceil(reportsData.data.pagination.total / limit);
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (page <= 3) {
                    pageNum = i + 1;
                  } else if (page >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
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
                disabled={page >= Math.ceil(reportsData.data.pagination.total / limit) || isLoading}
                variant="outline"
                size="sm"
              >
                Next <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ReportsTab;
