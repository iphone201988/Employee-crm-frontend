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
interface ReportData {
  name: string;
  capacity: number;
  logged: number;
  nonBillable: number;
  billable: number;
  wroteOff: number;
  rate: number;
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
  const [timeFilter, setTimeFilter] = useState('weekly');
  const [currentPeriodOffset, setCurrentPeriodOffset] = useState(0);
  const { data: currentUserData }: any = useGetCurrentUserQuery();
  const [sortConfig, setSortConfig] = useState<{ key: keyof ReportData | null; direction: 'asc' | 'desc' }>({ key: null, direction: 'asc' });
  const [timeFormat, setTimeFormat] = useState<TimeFormat>('0:00');
  const [getTabAccess, { data: currentTabsUsers }] = useLazyGetTabAccessQuery()
  const reportData = useMemo(() => generateMockData(currentPeriodOffset, timeFilter), [currentPeriodOffset, timeFilter]);


  const hasReportPermission = currentUserData?.data?.features?.reports;

  const handlePeriodChange = (direction: 'prev' | 'next') => {
    setCurrentPeriodOffset(prev => direction === 'prev' ? prev - 1 : prev + 1);
  };

  const handleTimeFilterChange = (newFilter: string) => {
    setTimeFilter(newFilter);
    setCurrentPeriodOffset(0); // Reset to the current period
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

  const totals = useMemo(() => ({
    capacity: reportData.reduce((sum, item) => sum + item.capacity, 0),
    logged: reportData.reduce((sum, item) => sum + item.logged, 0),
    revenue: reportData.reduce((sum, item) => sum + item.billable * item.rate, 0),
  }), [reportData]);

  const getPercentage = (value: number, total: number) => (total > 0 ? (value / total) * 100 : 0);
  const formatHours = (hours: number) => formatTime(hours, timeFormat);

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
                        <AvatarFallback className="text-xs rounded-full">
                          {user?.name}
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
        <Card><CardContent className="p-4"><div className="text-2xl font-bold text-[#381980]">{reportData.length}</div><p className="text-sm text-muted-foreground">Team Members</p></CardContent></Card>
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
                {sortedData.map((member) => (
                  <TableRow key={member.name} className="h-8">
                    <TableCell className="p-1 px-4"><Avatar className="h-6 w-6"><AvatarImage src={getProfileImage(member.name)} /><AvatarFallback className="text-xs">{getUserInitials(member.name)}</AvatarFallback></Avatar></TableCell>
                    <TableCell className="font-medium p-1 text-xs">{member.name}</TableCell>
                    <TableCell className="text-center border-l p-1"><div className="text-xs font-medium">{formatHours(member.capacity)}</div></TableCell>
                    <TableCell className="text-center border-l p-1"><div className="flex flex-col items-center space-y-1"><div className="text-xs">{formatHours(member.logged)} ({getPercentage(member.logged, member.capacity).toFixed(1)}%)</div><Progress value={getPercentage(member.logged, member.capacity)} className="h-1 w-14" /></div></TableCell>
                    <TableCell className="text-center border-l p-1"><div className="flex flex-col items-center space-y-1"><div className="text-xs">{formatHours(member.billable)} ({getPercentage(member.billable, member.logged).toFixed(1)}%) - {formatCurrency(member.billable * member.rate)}</div><Progress value={getPercentage(member.billable, member.logged)} className="h-1 w-14" /></div></TableCell>
                    <TableCell className="text-center border-l p-1"><div className="flex flex-col items-center space-y-1"><div className="text-xs">{formatHours(member.nonBillable)} ({getPercentage(member.nonBillable, member.logged).toFixed(1)}%)</div><Progress value={getPercentage(member.nonBillable, member.logged)} className="h-1 w-14" /></div></TableCell>
                    <TableCell className="text-center border-l p-1"><div className="flex flex-col items-center space-y-1"><div className="text-xs">{formatHours(member.wroteOff)} ({getPercentage(member.wroteOff, member.logged).toFixed(1)}%) - {formatCurrency(member.wroteOff * member.rate)}</div><Progress value={getPercentage(member.wroteOff, member.logged)} className="h-1 w-14" /></div></TableCell>
                    <TableCell className="text-center border-l p-1"><div className="text-xs font-medium text-red-600">{formatCurrency(member.resourceCost)}</div></TableCell>
                    <TableCell className="text-center border-l p-1"><div className={`text-xs font-medium ${member.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>{formatCurrency(member.profit)}</div></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ReportsTab;
