import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DashboardCard, DashboardGrid } from "@/components/ui/dashboard-card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronLeft, ChevronRight, ArrowUpDown, Search } from 'lucide-react';
import { formatCurrency } from '@/lib/currency';
import { formatTime, TimeFormat } from '@/utils/timeFormat';

interface WriteOffDetail {
  clientName: string;
  projectName: string;
  writeOffAmount: number;
  originalValue: number;
  writeOffPercentage: number;
  reason: string;
  writeOffDate: string;
  approvedBy: string;
  category: string;
  hoursWrittenOff: number;
}

const generateWriteOffData = (): WriteOffDetail[] => {
  const clients = [
    'Water Savers Limited', 'Green Gardens Limited', 'Brown Enterprises', 
    'Smith & Associates', 'Tech Solutions Inc.', 'Financial Advisors Co.',
    'Maritime Logistics Ltd.', 'Creative Design Studio', 'Phoenix Construction',
    'Emerald Hospitality'
  ];
  
  const projects = [
    'Annual Audit', 'VAT Return Q4', 'Payroll Setup', 'Company Formation',
    'Tax Advisory', 'Financial Review', 'Compliance Check', 'Business Valuation',
    'Restructuring', 'Due Diligence'
  ];
  
  const reasons = [
    'Client dispute', 'Scope creep', 'Poor performance', 'Client financial difficulty',
    'Internal error', 'Relationship management', 'Market conditions', 'Quality issues'
  ];
  
  const categories = ['Bad Debt', 'Relationship', 'Performance', 'Strategic', 'Administrative'];
  const approvers = ['John Smith', 'Sarah Johnson', 'Michael Brown', 'Emma Wilson'];

  return Array.from({ length: 25 }, (_, index) => {
    const originalValue = 1000 + Math.random() * 5000;
    const writeOffAmount = originalValue * (0.1 + Math.random() * 0.4); // 10-50% write-off
    const writeOffPercentage = (writeOffAmount / originalValue) * 100;
    
    return {
      clientName: clients[index % clients.length],
      projectName: projects[index % projects.length],
      writeOffAmount,
      originalValue,
      writeOffPercentage,
      reason: reasons[index % reasons.length],
      writeOffDate: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      approvedBy: approvers[index % approvers.length],
      category: categories[index % categories.length],
      hoursWrittenOff: Math.floor(writeOffAmount / (75 + Math.random() * 50)) // Hours based on hourly rate
    };
  });
};

const WriteOffReportDetailTab = () => {
  const [writeOffData] = useState<WriteOffDetail[]>(generateWriteOffData());
  const [sortConfig, setSortConfig] = useState<{ key: keyof WriteOffDetail | null; direction: 'asc' | 'desc' }>({ key: null, direction: 'desc' });
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [timeFormat] = useState<TimeFormat>('0:00');

  const handleSort = (key: keyof WriteOffDetail) => {
    let direction: 'asc' | 'desc' = 'desc';
    if (sortConfig.key === key && sortConfig.direction === 'desc') {
      direction = 'asc';
    }
    setSortConfig({ key, direction });
  };

  const getFilteredAndSortedData = () => {
    let filtered = writeOffData;

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(item => 
        item.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.projectName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.reason.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.approvedBy.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply category filter
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(item => item.category === categoryFilter);
    }

    // Apply sorting
    if (sortConfig.key) {
      filtered = [...filtered].sort((a, b) => {
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
    }

    return filtered;
  };

  const filteredData = getFilteredAndSortedData();

  // Calculate summary statistics
  const totalWriteOffs = filteredData.reduce((sum, item) => sum + item.writeOffAmount, 0);
  const averageWriteOffPercentage = filteredData.reduce((sum, item) => sum + item.writeOffPercentage, 0) / filteredData.length || 0;
  const totalHoursWrittenOff = filteredData.reduce((sum, item) => sum + item.hoursWrittenOff, 0);
  const uniqueClients = new Set(filteredData.map(item => item.clientName)).size;

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'Bad Debt': return 'bg-red-100 text-red-800';
      case 'Relationship': return 'bg-blue-100 text-blue-800';
      case 'Performance': return 'bg-orange-100 text-orange-800';
      case 'Strategic': return 'bg-purple-100 text-purple-800';
      case 'Administrative': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const categories = [...new Set(writeOffData.map(item => item.category))];

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <DashboardGrid columns={4}>
        <DashboardCard
          title="Total Write-offs"
          value={formatCurrency(totalWriteOffs)}
        />
        <DashboardCard
          title="Avg Write-off %"
          value={`${averageWriteOffPercentage.toFixed(1)}%`}
        />
        <DashboardCard
          title="Hours Written Off"
          value={formatTime(totalHoursWrittenOff, timeFormat)}
        />
        <DashboardCard
          title="Affected Clients"
          value={uniqueClients}
        />
      </DashboardGrid>

      {/* Filters */}
      <div className="flex items-center gap-4 bg-white p-4 rounded-lg">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search clients, projects, reasons..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-white"
          />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-48 bg-white">
            <SelectValue placeholder="Filter by category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            {categories.map(category => (
              <SelectItem key={category} value={category}>{category}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Write-offs Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSort('clientName')}
                      className="h-8 px-1 font-medium"
                    >
                      Client
                      <ArrowUpDown className="ml-1 h-4 w-4" />
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSort('projectName')}
                      className="h-8 px-1 font-medium"
                    >
                      Project
                      <ArrowUpDown className="ml-1 h-4 w-4" />
                    </Button>
                  </TableHead>
                  <TableHead className="text-center">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSort('originalValue')}
                      className="h-8 px-1 font-medium"
                    >
                      Original Value
                      <ArrowUpDown className="ml-1 h-4 w-4" />
                    </Button>
                  </TableHead>
                  <TableHead className="text-center">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSort('writeOffAmount')}
                      className="h-8 px-1 font-medium"
                    >
                      Write-off Amount
                      <ArrowUpDown className="ml-1 h-4 w-4" />
                    </Button>
                  </TableHead>
                  <TableHead className="text-center">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSort('writeOffPercentage')}
                      className="h-8 px-1 font-medium"
                    >
                      Write-off %
                      <ArrowUpDown className="ml-1 h-4 w-4" />
                    </Button>
                  </TableHead>
                  <TableHead className="text-center">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSort('hoursWrittenOff')}
                      className="h-8 px-1 font-medium"
                    >
                      Hours
                      <ArrowUpDown className="ml-1 h-4 w-4" />
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSort('category')}
                      className="h-8 px-1 font-medium"
                    >
                      Category
                      <ArrowUpDown className="ml-1 h-4 w-4" />
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSort('reason')}
                      className="h-8 px-1 font-medium"
                    >
                      Reason
                      <ArrowUpDown className="ml-1 h-4 w-4" />
                    </Button>
                  </TableHead>
                  <TableHead className="text-center">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSort('writeOffDate')}
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
                      onClick={() => handleSort('approvedBy')}
                      className="h-8 px-1 font-medium"
                    >
                      Approved By
                      <ArrowUpDown className="ml-1 h-4 w-4" />
                    </Button>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredData.map((item, index) => (
                  <TableRow key={index} className="h-12">
                    <TableCell className="font-medium p-3 text-sm">{item.clientName}</TableCell>
                    <TableCell className="p-3 text-sm">{item.projectName}</TableCell>
                    <TableCell className="text-center p-3">
                      <div className="text-sm font-medium">
                        {formatCurrency(item.originalValue)}
                      </div>
                    </TableCell>
                    <TableCell className="text-center p-3">
                      <div className="text-sm font-medium text-red-600">
                        {formatCurrency(item.writeOffAmount)}
                      </div>
                    </TableCell>
                    <TableCell className="text-center p-3">
                      <div className="text-sm font-medium">
                        {item.writeOffPercentage.toFixed(1)}%
                      </div>
                    </TableCell>
                    <TableCell className="text-center p-3">
                      <div className="text-sm font-medium">
                        {formatTime(item.hoursWrittenOff, timeFormat)}
                      </div>
                    </TableCell>
                    <TableCell className="p-3">
                      <Badge variant="outline" className={`text-xs ${getCategoryColor(item.category)}`}>
                        {item.category}
                      </Badge>
                    </TableCell>
                    <TableCell className="p-3 text-sm max-w-[200px] truncate" title={item.reason}>
                      {item.reason}
                    </TableCell>
                    <TableCell className="text-center p-3">
                      <div className="text-sm">
                        {new Date(item.writeOffDate).toLocaleDateString('en-GB')}
                      </div>
                    </TableCell>
                    <TableCell className="p-3 text-sm">{item.approvedBy}</TableCell>
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

export default WriteOffReportDetailTab;