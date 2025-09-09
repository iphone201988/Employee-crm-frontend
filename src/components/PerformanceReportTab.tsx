import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DashboardCard, DashboardGrid } from "@/components/ui/dashboard-card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, ArrowUpDown } from 'lucide-react';
import { TEAM_MEMBER_NAMES } from '@/constants/teamConstants';
import { getProfileImage, getUserInitials } from '@/utils/profiles';
import { formatCurrency } from '@/lib/currency';

interface PerformanceData {
  name: string;
  efficiency: number;
  clientSatisfaction: number;
  hoursWorked: number;
  targetHours: number;
  completedTasks: number;
  revenue: number;
  profitMargin: number;
}

const generatePerformanceData = (weekOffset: number = 0): PerformanceData[] => {
  return TEAM_MEMBER_NAMES.map((name, index) => {
    const weekVariation = Math.sin(weekOffset * 0.1 + index) * 0.2 + 1;
    
    return {
      name,
      efficiency: 75 + Math.random() * 20, // 75-95%
      clientSatisfaction: 4.0 + Math.random() * 1.0, // 4.0-5.0
      hoursWorked: Math.floor((30 + Math.random() * 15) * weekVariation), // 30-45 hours
      targetHours: 40,
      completedTasks: Math.floor((8 + Math.random() * 7) * weekVariation), // 8-15 tasks
      revenue: (5000 + Math.random() * 3000) * weekVariation, // €5k-8k
      profitMargin: 25 + Math.random() * 20 // 25-45%
    };
  });
};

const PerformanceReportTab = () => {
  const [timeFilter, setTimeFilter] = useState('weekly');
  const [currentWeek, setCurrentWeek] = useState(0);
  const [performanceData] = useState<PerformanceData[]>(generatePerformanceData(0));
  const [sortConfig, setSortConfig] = useState<{ key: keyof PerformanceData | null; direction: 'asc' | 'desc' }>({ key: null, direction: 'asc' });

  const getCurrentPeriodInfo = () => {
    const now = new Date();
    
    if (timeFilter === 'weekly') {
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - now.getDay() + 1 + (currentWeek * 7));
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      
      const formatDate = (date: Date) => {
        return date.toLocaleDateString('en-GB', { 
          day: '2-digit', 
          month: '2-digit', 
          year: 'numeric' 
        });
      };
      
      return {
        label: `${formatDate(startOfWeek)} to ${formatDate(endOfWeek)} - Week ${Math.floor(Date.now() / (1000 * 60 * 60 * 24 * 7)) + currentWeek}`
      };
    } else if (timeFilter === 'monthly') {
      const currentMonth = new Date(now.getFullYear(), now.getMonth() + currentWeek, 1);
      const monthName = currentMonth.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
      return {
        label: monthName
      };
    } else { // yearly
      const currentYear = now.getFullYear() + currentWeek;
      return {
        label: `${currentYear}`
      };
    }
  };

  const handlePeriodChange = (direction: 'prev' | 'next') => {
    const newWeek = direction === 'prev' ? currentWeek - 1 : currentWeek + 1;
    setCurrentWeek(newWeek);
  };

  const handleSort = (key: keyof PerformanceData) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const getSortedData = () => {
    if (!sortConfig.key) return performanceData;
    
    return [...performanceData].sort((a, b) => {
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

  const periodInfo = getCurrentPeriodInfo();

  // Calculate totals
  const totalRevenue = performanceData.reduce((sum, item) => sum + item.revenue, 0);
  const averageEfficiency = performanceData.reduce((sum, item) => sum + item.efficiency, 0) / performanceData.length;
  const averageClientSatisfaction = performanceData.reduce((sum, item) => sum + item.clientSatisfaction, 0) / performanceData.length;
  const totalTasksCompleted = performanceData.reduce((sum, item) => sum + item.completedTasks, 0);

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <DashboardGrid columns={4}>
        <DashboardCard
          title="Total Revenue"
          value={formatCurrency(totalRevenue)}
        />
        <DashboardCard
          title="Avg Efficiency"
          value={`${averageEfficiency.toFixed(1)}%`}
        />
        <DashboardCard
          title="Client Satisfaction"
          value={`${averageClientSatisfaction.toFixed(1)}/5.0`}
        />
        <DashboardCard
          title="Tasks Completed"
          value={totalTasksCompleted}
        />
      </DashboardGrid>

      {/* Time Filter Buttons */}
      <div className="flex items-center justify-center">
        <div className="flex items-center gap-1 bg-muted rounded-md p-1">
          <Button
            variant={timeFilter === 'weekly' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setTimeFilter('weekly')}
            className="h-8 px-3"
          >
            Weekly
          </Button>
          <Button
            variant={timeFilter === 'monthly' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setTimeFilter('monthly')}
            className="h-8 px-3"
          >
            Monthly
          </Button>
          <Button
            variant={timeFilter === 'yearly' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setTimeFilter('yearly')}
            className="h-8 px-3"
          >
            Yearly
          </Button>
        </div>
      </div>

      {/* Date Range Navigation */}
      <div className="flex items-center justify-center gap-2">
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => handlePeriodChange('prev')}
          className="h-8 w-8 p-0"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="text-sm font-medium whitespace-nowrap">
          {periodInfo.label}
        </span>
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => handlePeriodChange('next')}
          className="h-8 w-8 p-0"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Performance Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12"></TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSort('name')}
                      className="h-8 px-1 font-medium"
                    >
                      Team Member
                      <ArrowUpDown className="ml-1 h-4 w-4" />
                    </Button>
                  </TableHead>
                  <TableHead className="text-center border-l">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSort('efficiency')}
                      className="h-8 px-1 font-medium"
                    >
                      Efficiency
                      <ArrowUpDown className="ml-1 h-4 w-4" />
                    </Button>
                  </TableHead>
                  <TableHead className="text-center border-l">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSort('clientSatisfaction')}
                      className="h-8 px-1 font-medium"
                    >
                      Client Rating
                      <ArrowUpDown className="ml-1 h-4 w-4" />
                    </Button>
                  </TableHead>
                  <TableHead className="text-center border-l">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSort('hoursWorked')}
                      className="h-8 px-1 font-medium"
                    >
                      Hours Worked
                      <ArrowUpDown className="ml-1 h-4 w-4" />
                    </Button>
                  </TableHead>
                  <TableHead className="text-center border-l">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSort('completedTasks')}
                      className="h-8 px-1 font-medium"
                    >
                      Tasks Completed
                      <ArrowUpDown className="ml-1 h-4 w-4" />
                    </Button>
                  </TableHead>
                  <TableHead className="text-center border-l">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSort('revenue')}
                      className="h-8 px-1 font-medium"
                    >
                      Revenue
                      <ArrowUpDown className="ml-1 h-4 w-4" />
                    </Button>
                  </TableHead>
                  <TableHead className="text-center border-l">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSort('profitMargin')}
                      className="h-8 px-1 font-medium"
                    >
                      Profit Margin
                      <ArrowUpDown className="ml-1 h-4 w-4" />
                    </Button>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {getSortedData().map((member, index) => (
                  <TableRow key={index} className="h-12">
                    <TableCell className="p-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={getProfileImage(member.name)} />
                        <AvatarFallback className="text-xs">{getUserInitials(member.name)}</AvatarFallback>
                      </Avatar>
                    </TableCell>
                    <TableCell className="font-medium p-3 text-sm">{member.name}</TableCell>
                    <TableCell className="text-center border-l p-3">
                      <div className="flex items-center justify-center gap-4">
                        <div className="text-sm font-medium">{member.efficiency.toFixed(1)}%</div>
                        <div className="w-16">
                          <Progress 
                            value={member.efficiency} 
                            className="h-2"
                          />
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-center border-l p-3">
                      <div className="flex items-center justify-center gap-2">
                        <div className="text-sm font-medium">{member.clientSatisfaction.toFixed(1)}</div>
                        <div className="text-xs text-muted-foreground">/5.0</div>
                      </div>
                    </TableCell>
                    <TableCell className="text-center border-l p-3">
                      <div className="flex items-center justify-center gap-4">
                        <div className="text-sm font-medium">{member.hoursWorked}h</div>
                        <div className="text-xs text-muted-foreground">/{member.targetHours}h</div>
                        <div className="w-16">
                          <Progress 
                            value={(member.hoursWorked / member.targetHours) * 100} 
                            className="h-2"
                          />
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-center border-l p-3">
                      <div className="text-sm font-medium">{member.completedTasks}</div>
                    </TableCell>
                    <TableCell className="text-center border-l p-3">
                      <div className="text-sm font-medium text-green-600">
                        {formatCurrency(member.revenue)}
                      </div>
                    </TableCell>
                    <TableCell className="text-center border-l p-3">
                      <div className="text-sm font-medium">
                        {member.profitMargin.toFixed(1)}%
                      </div>
                    </TableCell>
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

export default PerformanceReportTab;