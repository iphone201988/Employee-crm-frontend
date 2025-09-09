import React, { useState, useMemo } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TimesheetEntry, SummaryData } from "@/types/sheets";
import { generateTimesheetData } from "@/utils/sheetsData";
import { SheetsSummaryCards } from "./Sheets/SheetsSummaryCards";
import { SheetsWorkflowTabs } from "./Sheets/SheetsWorkflowTabs";
import { SheetsFilters } from "./Sheets/SheetsFilters";
import { SheetsTable } from "./Sheets/SheetsTable";
import ViewNoteDialog from './ViewNoteDialog';

interface SheetsTabProps {
  autoApproveTimesheets?: boolean;
}

const SheetsTab = ({ autoApproveTimesheets = false }: SheetsTabProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  
  const [sortField, setSortField] = useState<string>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [hiddenReminders, setHiddenReminders] = useState<string[]>([]);
  const [selectedNote, setSelectedNote] = useState<{ note: string; name: string } | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<string>('weekly');
  const [currentDateRange, setCurrentDateRange] = useState('23/06/2025 to 29/06/2025 - Week 26');
  
  const timesheetData = useMemo(() => generateTimesheetData(selectedPeriod, currentDateRange), [selectedPeriod, currentDateRange]);
  
  const sortedData = useMemo(() => {
    return [...timesheetData].sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (sortField) {
        case 'name':
          aValue = a.name;
          bValue = b.name;
          break;
        case 'department':
          aValue = a.department;
          bValue = b.department;
          break;
        case 'position':
          aValue = a.position;
          bValue = b.position;
          break;
        case 'capacity':
          aValue = a.capacity;
          bValue = b.capacity;
          break;
        case 'totalHours':
          aValue = a.totalHours;
          bValue = b.totalHours;
          break;
        case 'variance':
          aValue = a.capacity - a.totalHours;
          bValue = b.capacity - b.totalHours;
          break;
        case 'status':
          aValue = a.status;
          bValue = b.status;
          break;
        case 'submittedDate':
          aValue = a.submittedDate || '';
          bValue = b.submittedDate || '';
          break;
        default:
          return 0;
      }
      
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortDirection === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
      }
      
      if (sortDirection === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });
  }, [timesheetData, sortField, sortDirection]);
  
  const filteredData = useMemo(() => {
    return sortedData.filter(entry => {
      const matchesSearch = entry.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           entry.position.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = filterStatus === 'all' || entry.status === filterStatus;
      
      return matchesSearch && matchesStatus;
    });
  }, [sortedData, searchTerm, filterStatus]);

  const summary: SummaryData = useMemo(() => {
    const total = timesheetData.length;
    const submitted = timesheetData.filter(e => e.status === 'submitted').length;
    const awaiting = timesheetData.filter(e => e.status === 'awaiting').length;
    const approved = timesheetData.filter(e => e.status === 'approved').length;
    const rejected = timesheetData.filter(e => e.status === 'rejected').length;
    
    return { total, submitted, awaiting, approved, rejected };
  }, [timesheetData]);

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleSendReminder = (entryId: string) => {
    setHiddenReminders(prev => [...prev, entryId]);
  };

  const handleNoteClick = (note: string, name: string) => {
    setSelectedNote({ note, name });
  };

  const handlePeriodChange = (period: string) => {
    setSelectedPeriod(period);
    // Update date range based on period
    const dateRanges = {
      daily: '31/07/2025 - Day 212',
      weekly: '28/07/2025 to 03/08/2025 - Week 31', 
      monthly: 'July 2025 - Month 7',
      yearly: '2025 - Year'
    };
    setCurrentDateRange(dateRanges[period as keyof typeof dateRanges] || dateRanges.weekly);
  };

  const handlePreviousPeriod = () => {
    const dateRanges = {
      daily: '30/07/2025 - Day 211',
      weekly: '21/07/2025 to 27/07/2025 - Week 30',
      monthly: 'June 2025 - Month 6', 
      yearly: '2024 - Year'
    };
    setCurrentDateRange(dateRanges[selectedPeriod as keyof typeof dateRanges] || dateRanges.weekly);
  };

  const handleNextPeriod = () => {
    const dateRanges = {
      daily: '01/08/2025 - Day 213',
      weekly: '04/08/2025 to 10/08/2025 - Week 32',
      monthly: 'August 2025 - Month 8',
      yearly: '2026 - Year'
    };
    setCurrentDateRange(dateRanges[selectedPeriod as keyof typeof dateRanges] || dateRanges.weekly);
  };

  return (
    <div className="space-y-6">
      {/* Period Filter with Navigation */}
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <div className="inline-flex h-9 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground">
            <button 
              className={`inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ${
                selectedPeriod === 'daily' ? 'bg-background text-foreground shadow-sm' : ''
              }`}
              onClick={() => handlePeriodChange('daily')}
            >
              Daily
            </button>
            <button 
              className={`inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ${
                selectedPeriod === 'weekly' ? 'bg-background text-foreground shadow-sm' : ''
              }`}
              onClick={() => handlePeriodChange('weekly')}
            >
              Weekly
            </button>
            <button 
              className={`inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ${
                selectedPeriod === 'monthly' ? 'bg-background text-foreground shadow-sm' : ''
              }`}
              onClick={() => handlePeriodChange('monthly')}
            >
              Monthly
            </button>
            <button 
              className={`inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ${
                selectedPeriod === 'yearly' ? 'bg-background text-foreground shadow-sm' : ''
              }`}
              onClick={() => handlePeriodChange('yearly')}
            >
              Yearly
            </button>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            className="flex items-center justify-center w-8 h-8 rounded-md border border-input bg-background hover:bg-accent hover:text-accent-foreground"
            onClick={handlePreviousPeriod}
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div className="text-center">
            <h2 className="text-sm font-medium">{currentDateRange}</h2>
          </div>
          <button
            className="flex items-center justify-center w-8 h-8 rounded-md border border-input bg-background hover:bg-accent hover:text-accent-foreground"
            onClick={handleNextPeriod}
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      <SheetsSummaryCards summary={summary} />

      {/* Workflow Tabs and Filters */}
      {!autoApproveTimesheets && (
        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between mt-8">
          <div className="flex items-center gap-4">
            <SheetsWorkflowTabs 
              filterStatus={filterStatus}
              summary={summary} 
              onFilterChange={setFilterStatus}
            />
          </div>
          <div className="flex items-center gap-4">
            <SheetsFilters
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
            />
          </div>
        </div>
      )}

      <Card>
        <CardContent className="p-0">
          <SheetsTable
            filteredData={filteredData}
            sortField={sortField}
            sortDirection={sortDirection}
            hiddenReminders={hiddenReminders}
            filterStatus={filterStatus}
            onSort={handleSort}
            onSendReminder={handleSendReminder}
            onNoteClick={handleNoteClick}
          />
        </CardContent>
      </Card>

      <ViewNoteDialog
        isOpen={selectedNote !== null}
        onClose={() => setSelectedNote(null)}
        note={selectedNote?.note || ''}
        employeeName={selectedNote?.name || ''}
      />
    </div>
  );
};

export default SheetsTab;