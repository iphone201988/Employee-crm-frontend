import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DashboardCard, DashboardGrid } from "@/components/ui/dashboard-card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, TrendingUp, Users, Clock, ChevronLeft, ChevronRight, ArrowUpDown } from 'lucide-react';
import { TEAM_MEMBER_NAMES } from '@/constants/teamConstants';
import { getProfileImage, getUserInitials } from '@/utils/profiles';
import { formatCurrency } from '@/lib/currency';
import { formatTime, TimeFormat } from '@/utils/timeFormat';
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
const generateMockData = (weekOffset: number = 0, timeFilter: string = 'weekly'): ReportData[] => {
  // If it's a future date, return empty data
  if (weekOffset > 0) {
    return TEAM_MEMBER_NAMES.map((name, index) => ({
      name,
      capacity: 0,
      logged: 0,
      nonBillable: 0,
      billable: 0,
      wroteOff: 0,
      rate: 0,
      resourceCost: 0,
      profit: 0
    }));
  }
  return TEAM_MEMBER_NAMES.map((name, index) => {
    // Add some variation based on week offset to simulate different weeks
    const weekVariation = Math.sin(weekOffset * 0.1 + index) * 0.2 + 1;

    // Calculate capacity based on time period
    let capacity = 37.5; // Default weekly capacity
    if (timeFilter === 'daily') {
      capacity = 8; // 8 hours per day
    } else if (timeFilter === 'monthly') {
      capacity = 160; // 40 hours * 4 weeks
    } else if (timeFilter === 'yearly') {
      capacity = 2080; // 40 hours * 52 weeks
    }

    // Base logged hours on capacity with some variation
    const capacityUtilization = 0.8 + Math.random() * 0.2; // 80-100% utilization
    const rawLogged = capacity * capacityUtilization * weekVariation;
    const logged = Math.min(rawLogged, capacity); // Don't exceed capacity

    // Calculate billable vs non-billable vs wrote off split based on final logged value
    const billableRatio = 0.7 + Math.random() * 0.15; // 70-85% billable
    const wroteOffRatio = 0.05 + Math.random() * 0.1; // 5-15% wrote off
    const billable = logged * billableRatio;
    const wroteOff = logged * wroteOffRatio;
    const nonBillable = logged - billable - wroteOff; // Ensure they add up to logged

    const rate = 75 + Math.random() * 50; // €75-125 per hour
    const teamHourlyRate = rate * 0.6; // Team hourly rate is lower than billable rate
    const resourceCost = capacity * (rate / 2); // Capacity × half hourly rate

    // Updated profit calculation: billable amount minus resource cost
    const billableValue = billable * rate;
    const wroteOffValue = wroteOff * rate;
    const profit = billableValue - resourceCost;
    return {
      name,
      capacity,
      logged,
      nonBillable,
      billable,
      wroteOff,
      rate,
      resourceCost,
      profit
    };
  });
};
const ReportsTab = () => {
  const [timeFilter, setTimeFilter] = useState('weekly');
  const [currentWeek, setCurrentWeek] = useState(0);
  const [reportData, setReportData] = useState<ReportData[]>(generateMockData(0, 'weekly'));
  const [sortConfig, setSortConfig] = useState<{
    key: keyof ReportData | null;
    direction: 'asc' | 'desc';
  }>({
    key: null,
    direction: 'asc'
  });
  const [timeFormat, setTimeFormat] = useState<TimeFormat>('0:00');
  const getCurrentPeriodInfo = () => {
    const now = new Date();
    if (timeFilter === 'daily') {
      const targetDate = new Date(now);
      targetDate.setDate(now.getDate() + currentWeek);
      const formatDate = (date: Date) => {
        return date.toLocaleDateString('en-GB', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric'
        });
      };
      return {
        label: formatDate(targetDate)
      };
    } else if (timeFilter === 'weekly') {
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - now.getDay() + 1 + currentWeek * 7); // Monday
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6); // Sunday

      const formatDate = (date: Date) => {
        return date.toLocaleDateString('en-GB', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric'
        });
      };
      const getWeekNumber = (date: Date) => {
        const start = new Date(date.getFullYear(), 0, 1);
        const diff = date.getTime() - start.getTime();
        const oneWeek = 1000 * 60 * 60 * 24 * 7;
        return Math.floor(diff / oneWeek) + 1;
      };
      return {
        label: `${formatDate(startOfWeek)} to ${formatDate(endOfWeek)} - Week ${getWeekNumber(startOfWeek)}`
      };
    } else if (timeFilter === 'monthly') {
      const currentMonth = new Date(now.getFullYear(), now.getMonth() + currentWeek, 1);
      const monthName = currentMonth.toLocaleDateString('en-GB', {
        month: 'long',
        year: 'numeric'
      });
      return {
        label: monthName
      };
    } else {
      // yearly
      const currentYear = now.getFullYear() + currentWeek;
      return {
        label: `${currentYear}`
      };
    }
  };
  const handleWeekChange = (direction: 'prev' | 'next') => {
    const newWeek = direction === 'prev' ? currentWeek - 1 : currentWeek + 1;
    setCurrentWeek(newWeek);
    setReportData(generateMockData(newWeek));
  };
  const handlePeriodChange = (direction: 'prev' | 'next') => {
    const newWeek = direction === 'prev' ? currentWeek - 1 : currentWeek + 1;
    setCurrentWeek(newWeek);
    setReportData(generateMockData(newWeek, timeFilter));
  };
  const handleTimeFilterChange = (newFilter: string) => {
    setTimeFilter(newFilter);
    setCurrentWeek(0);
    setReportData(generateMockData(0, newFilter));
  };
  const handleSort = (key: keyof ReportData) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({
      key,
      direction
    });
  };
  const getSortedData = () => {
    if (!sortConfig.key) return reportData;
    return [...reportData].sort((a, b) => {
      const aValue = a[sortConfig.key!];
      const bValue = b[sortConfig.key!];
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortConfig.direction === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
      }
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortConfig.direction === 'asc' ? aValue - bValue : bValue - aValue;
      }
      return 0;
    });
  };
  const periodInfo = getCurrentPeriodInfo();
  const getCapacityPercentage = (logged: number, capacity: number) => {
    return Math.min(logged / capacity * 100, 100);
  };
  const getLoggedPercentage = (logged: number, capacity: number) => {
    if (currentWeek > 0) return 0; // Future dates show 0.0%
    return logged / capacity * 100;
  };
  const getNonBillablePercentage = (nonBillable: number, logged: number) => {
    return logged > 0 ? nonBillable / logged * 100 : 0;
  };
  const getBillablePercentage = (billable: number, logged: number) => {
    return logged > 0 ? billable / logged * 100 : 0;
  };
  const getWroteOffPercentage = (wroteOff: number, logged: number) => {
    return logged > 0 ? wroteOff / logged * 100 : 0;
  };
  const formatHours = (hours: number) => {
    return formatTime(hours, timeFormat);
  };
  const totalCapacity = reportData.reduce((sum, item) => sum + item.capacity, 0);
  const totalLogged = reportData.reduce((sum, item) => sum + item.logged, 0);
  const totalNonBillable = reportData.reduce((sum, item) => sum + item.nonBillable, 0);
  const totalBillable = reportData.reduce((sum, item) => sum + item.billable, 0);
  const totalWroteOff = reportData.reduce((sum, item) => sum + item.wroteOff, 0);
  const totalRevenue = reportData.reduce((sum, item) => sum + item.billable * item.rate, 0);
  return <div className="space-y-6">

    {/* Summary Cards */}
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <Card className="h-full">
        <CardContent className="p-4">
          <div className="text-2xl font-bold !text-[#381980]">
            {reportData.length}
          </div>
          <p className="text-sm text-muted-foreground">Team Members</p>
        </CardContent>
      </Card>
      <Card className="h-full">
        <CardContent className="p-4">
          <div className="text-2xl font-bold !text-[#381980]">
            {formatHours(totalCapacity)}
          </div>
          <p className="text-sm text-muted-foreground">Total Capacity</p>
        </CardContent>
      </Card>
      <Card className="h-full">
        <CardContent className="p-4">
          <div className="text-2xl font-bold !text-[#381980]">
            {formatHours(totalLogged)}
          </div>
          <p className="text-sm text-muted-foreground">Total Logged</p>
        </CardContent>
      </Card>
      <Card className="h-full">
        <CardContent className="p-4">
          <div className="text-2xl font-bold !text-[#381980]">
            {formatCurrency(totalRevenue)}
          </div>
          <p className="text-sm text-muted-foreground">Total Revenue</p>
        </CardContent>
      </Card>
    </div>

    {/* Time Filter Buttons - Moved above date navigation */}
    <div className="flex items-center justify-center">
      <div className="flex items-center gap-1 bg-muted rounded-md p-1">
        <Button variant={timeFilter === 'daily' ? 'default' : 'ghost'} size="sm" onClick={() => handleTimeFilterChange('daily')} className="h-8 px-3">
          Daily
        </Button>
        <Button variant={timeFilter === 'weekly' ? 'default' : 'ghost'} size="sm" onClick={() => handleTimeFilterChange('weekly')} className="h-8 px-3">
          Weekly
        </Button>
        <Button variant={timeFilter === 'monthly' ? 'default' : 'ghost'} size="sm" onClick={() => handleTimeFilterChange('monthly')} className="h-8 px-3">
          Monthly
        </Button>
        <Button variant={timeFilter === 'yearly' ? 'default' : 'ghost'} size="sm" onClick={() => handleTimeFilterChange('yearly')} className="h-8 px-3">
          Yearly
        </Button>
      </div>
    </div>

    {/* Date Range Navigation */}
    <div className="flex items-center justify-center gap-2">
      <Button variant="outline" size="sm" onClick={() => handlePeriodChange('prev')} className="h-8 w-8 p-0">
        <ChevronLeft className="h-4 w-4" />
      </Button>
      <span className="text-sm font-medium whitespace-nowrap">
        {periodInfo.label}
      </span>
      <Button variant="outline" size="sm" onClick={() => handlePeriodChange('next')} className="h-8 w-8 p-0">
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>

    {/* Reports Table */}
    <Card>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10"></TableHead>
                <TableHead>
                  <Button variant="ghost" size="sm" onClick={() => handleSort('name')} className="h-6 px-1 font-medium text-xs">
                    Team Member
                    <ArrowUpDown className="ml-1 h-3 w-3" />
                  </Button>
                </TableHead>
                <TableHead className="text-center border-l">
                  <Button variant="ghost" size="sm" onClick={() => handleSort('capacity')} className="h-6 px-1 font-medium text-xs">
                    Capacity
                    <ArrowUpDown className="ml-1 h-3 w-3" />
                  </Button>
                </TableHead>
                <TableHead className="text-center border-l">
                  <Button variant="ghost" size="sm" onClick={() => handleSort('logged')} className="h-6 px-1 font-medium text-xs">
                    Logged
                    <ArrowUpDown className="ml-1 h-3 w-3" />
                  </Button>
                </TableHead>
                <TableHead className="text-center border-l">
                  <Button variant="ghost" size="sm" onClick={() => handleSort('billable')} className="h-6 px-1 font-medium text-xs">
                    Billable
                    <ArrowUpDown className="ml-1 h-3 w-3" />
                  </Button>
                </TableHead>
                <TableHead className="text-center border-l">
                  <Button variant="ghost" size="sm" onClick={() => handleSort('nonBillable')} className="h-6 px-1 font-medium text-xs">
                    Non-Billable
                    <ArrowUpDown className="ml-1 h-3 w-3" />
                  </Button>
                </TableHead>
                <TableHead className="text-center border-l">
                  <Button variant="ghost" size="sm" onClick={() => handleSort('wroteOff')} className="h-6 px-1 font-medium text-xs">
                    Write Off
                    <ArrowUpDown className="ml-1 h-3 w-3" />
                  </Button>
                </TableHead>
                <TableHead className="text-center border-l">
                  <Button variant="ghost" size="sm" onClick={() => handleSort('resourceCost')} className="h-6 px-1 font-medium text-xs">
                    Resource Cost
                    <ArrowUpDown className="ml-1 h-3 w-3" />
                  </Button>
                </TableHead>
                <TableHead className="text-center border-l">
                  <Button variant="ghost" size="sm" onClick={() => handleSort('profit')} className="h-6 px-1 font-medium text-xs">
                    Profit
                    <ArrowUpDown className="ml-1 h-3 w-3" />
                  </Button>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {getSortedData().map((member, index) => <TableRow key={index} className="h-8">
                <TableCell className="p-1 mx-0 my-0 py-[15px] px-[18px]">
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={getProfileImage(member.name)} />
                    <AvatarFallback className="text-xs">{getUserInitials(member.name)}</AvatarFallback>
                  </Avatar>
                </TableCell>
                <TableCell className="font-medium p-1 text-xs">{member.name}</TableCell>
                <TableCell className="text-center border-l p-1">
                  <div className="text-xs font-medium">{formatHours(member.capacity)}</div>
                </TableCell>
                <TableCell className="text-center border-l p-1">
                  <div className="flex flex-col items-center space-y-1">
                    <div className="text-xs font-medium">{formatHours(member.logged)} ({getLoggedPercentage(member.logged, member.capacity).toFixed(1)}%)</div>
                    <div className="w-14">
                      <Progress value={getLoggedPercentage(member.logged, member.capacity)} className="h-1" />
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-center border-l p-1">
                  <div className="flex flex-col items-center space-y-1">
                    <div className="text-xs font-medium">{formatHours(member.billable)} ({getBillablePercentage(member.billable, member.logged).toFixed(1)}%) - {formatCurrency(member.billable * member.rate)}</div>
                    <div className="w-14">
                      <Progress value={getBillablePercentage(member.billable, member.logged)} className="h-1" />
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-center border-l p-1">
                  <div className="flex flex-col items-center space-y-1">
                    <div className="text-xs font-medium">{formatHours(member.nonBillable)} ({getNonBillablePercentage(member.nonBillable, member.logged).toFixed(1)}%)</div>
                    <div className="w-14">
                      <Progress value={getNonBillablePercentage(member.nonBillable, member.logged)} className="h-1" />
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-center border-l p-1">
                  <div className="flex flex-col items-center space-y-1">
                    <div className="text-xs font-medium">{formatHours(member.wroteOff)} ({getWroteOffPercentage(member.wroteOff, member.logged).toFixed(1)}%) - {formatCurrency(member.wroteOff * member.rate)}</div>
                    <div className="w-14">
                      <Progress value={getWroteOffPercentage(member.wroteOff, member.logged)} className="h-1" />
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-center border-l p-1">
                  <div className="text-xs font-medium text-red-600">
                    {formatCurrency(member.resourceCost)}
                  </div>
                </TableCell>
                <TableCell className="text-center border-l p-1">
                  <div className={`text-xs font-medium ${member.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(member.profit)}
                  </div>
                </TableCell>
              </TableRow>)}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  </div>;
};
export default ReportsTab;