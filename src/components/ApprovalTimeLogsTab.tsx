import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DashboardCard, DashboardGrid } from "@/components/ui/dashboard-card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { calculateAmount } from '@/utils/approvalTimeLogsUtils';
import { CLIENT_NAMES, DESCRIPTIONS, HOURLY_RATES } from '@/constants/approvalTimeLogsConstants';
import ApprovalTimeLogsClientHeader from './ApprovalTimeLogsClientHeader';
import ApprovalTimeLogsEntryRow from './ApprovalTimeLogsEntryRow';

interface ApprovalTimeLogsTabProps {
  approvedEntries: any[];
  onMarkAsInvoiced?: (entries: any[]) => void;
}

const ApprovalTimeLogsTab = ({ approvedEntries, onMarkAsInvoiced }: ApprovalTimeLogsTabProps) => {
  const [selectedEntries, setSelectedEntries] = useState<Set<string>>(new Set());
  const [selectedClients, setSelectedClients] = useState<Set<string>>(new Set());
  const [currentWeek, setCurrentWeek] = useState('Jun 30 - Jul 6 (2025)');
  const [weekNumber, setWeekNumber] = useState(27);

  // Week navigation data
  const weeks = [
    { week: 'Jun 23 - Jun 29 (2025)', number: 26 },
    { week: 'Jun 30 - Jul 6 (2025)', number: 27 },
    { week: 'Jul 7 - Jul 13 (2025)', number: 28 },
    { week: 'Jul 14 - Jul 20 (2025)', number: 29 },
  ];

  const currentWeekIndex = weeks.findIndex(w => w.week === currentWeek);

  const handlePreviousWeek = () => {
    if (currentWeekIndex > 0) {
      const prevWeek = weeks[currentWeekIndex - 1];
      setCurrentWeek(prevWeek.week);
      setWeekNumber(prevWeek.number);
    }
  };

  const handleNextWeek = () => {
    if (currentWeekIndex < weeks.length - 1) {
      const nextWeek = weeks[currentWeekIndex + 1];
      setCurrentWeek(nextWeek.week);
      setWeekNumber(nextWeek.number);
    }
  };

  const handleSelectEntry = (entryId: string, checked: boolean) => {
    setSelectedEntries(prev => {
      const newSet = new Set(prev);
      if (checked) {
        newSet.add(entryId);
      } else {
        newSet.delete(entryId);
      }
      return newSet;
    });
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allEntryIds = approvedEntries.flatMap(member => 
        member.timeEntries?.map((_: any, index: number) => `${member.id}-${index}`) || []
      );
      setSelectedEntries(new Set(allEntryIds));
    } else {
      setSelectedEntries(new Set());
    }
  };

  const handleSelectClient = (clientName: string, checked: boolean) => {
    setSelectedClients(prev => {
      const newSet = new Set(prev);
      if (checked) {
        newSet.add(clientName);
      } else {
        newSet.delete(clientName);
      }
      return newSet;
    });

    // Update selected entries for this client
    const clientEntryIds = approvedEntries.flatMap(member => 
      member.timeEntries?.map((_: any, index: number) => `${member.id}-${index}`)
        .filter(entryId => {
          const entry = member.timeEntries?.find((_: any, idx: number) => `${member.id}-${idx}` === entryId);
          return entry?.client === clientName;
        }) || []
    );

    setSelectedEntries(prev => {
      const newSet = new Set(prev);
      if (checked) {
        clientEntryIds.forEach(id => newSet.add(id));
      } else {
        clientEntryIds.forEach(id => newSet.delete(id));
      }
      return newSet;
    });
  };

  const handleMarkAsInvoiced = () => {
    if (!onMarkAsInvoiced || selectedEntries.size === 0) return;

    const entriesToMark = approvedEntries.flatMap(member => 
      member.timeEntries?.map((entry: any, index: number) => {
        const entryId = `${member.id}-${index}`;
        if (selectedEntries.has(entryId)) {
            const purpose = DESCRIPTIONS[Math.floor(Math.random() * DESCRIPTIONS.length)];
            const rate = HOURLY_RATES[Math.floor(Math.random() * HOURLY_RATES.length)];
            const amount = calculateAmount(entry.hours, rate);
            const jobNames = ['VAT Jan + Feb 2025', 'Audit 2024', 'Income Tax 2024', 'CT1 2024', 'Payroll Jan 2025', 'Payroll Feb 2025'];
            const randomJobName = jobNames[Math.floor(Math.random() * jobNames.length)];
            
            return {
              id: entryId,
              date: entry.date,
              client: entry.client,
              jobName: randomJobName,
              status: entry.billable,
              purpose,
              description: entry.description,
              logged: member.name,
              duration: entry.hours,
              rate,
              amount
            };
        }
        return null;
      }).filter(Boolean) || []
    );

    onMarkAsInvoiced(entriesToMark);
    setSelectedEntries(new Set());
    setSelectedClients(new Set());
  };

  const allEntriesSelected = approvedEntries.length > 0 && 
    approvedEntries.every(member => 
      member.timeEntries?.every((_: any, index: number) => 
        selectedEntries.has(`${member.id}-${index}`)
      ) ?? true
    );

  const totalEntries = approvedEntries.flatMap(member => member.timeEntries || []).length;
  const totalAmount = approvedEntries.flatMap(member => 
    member.timeEntries?.map((entry: any, index: number) => {
      const rate = HOURLY_RATES[Math.floor(Math.random() * HOURLY_RATES.length)];
      return calculateAmount(entry.hours, rate);
    }) || []
  ).reduce((sum, amount) => sum + amount, 0);

  return (
    <div className="space-y-6">
      {/* Date Range Header with Navigation */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePreviousWeek}
            disabled={currentWeekIndex <= 0}
            className="h-8 w-8 p-0"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          
          <div className="text-center">
            <h2 className="text-xl font-semibold">{currentWeek} - Week {weekNumber}</h2>
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleNextWeek}
            disabled={currentWeekIndex >= weeks.length - 1}
            className="h-8 w-8 p-0"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <Button style={{ backgroundColor: '#017DB9', color: 'white' }} className="hover:opacity-90">
          View Timesheets
        </Button>
      </div>

      {/* Dashboard Cards */}
      <DashboardGrid columns={4}>
        <DashboardCard
          title="Total Entries"
          value={totalEntries}
        />
        
        <DashboardCard
          title="Selected Entries"
          value={selectedEntries.size}
        />
        
        <DashboardCard
          title="Total Amount"
          value={`€${totalAmount.toFixed(2)}`}
        />
        
        <DashboardCard
          title="Unique Clients"
          value={new Set(approvedEntries.flatMap(member => member.timeEntries?.map((entry: any) => entry.client) || [])).size}
        />
      </DashboardGrid>

      <Card>
        <CardHeader>
        </CardHeader>
        <CardContent>
          {selectedEntries.size > 0 && (
            <div className="mb-4 p-3 bg-blue-50 rounded-lg flex justify-between items-center">
              <span className="text-sm text-blue-700 font-medium">
                {selectedEntries.size} item(s) selected
              </span>
               <Button onClick={handleMarkAsInvoiced} className="bg-blue-600 hover:bg-blue-700 text-white">
                Move to WIP Report
              </Button>
            </div>
          )}
          
          {approvedEntries.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No approved time logs yet.</p>
              <p className="text-sm text-gray-400 mt-1">
                Approve time logs in the Timesheets tab to see them here.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox
                        checked={allEntriesSelected}
                        onCheckedChange={handleSelectAll}
                        aria-label="Select all entries"
                      />
                    </TableHead>
                    <TableHead>Logged</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Client Name</TableHead>
                    <TableHead>Job Name</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Purpose</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Rate (€)</TableHead>
                    <TableHead>Amount (€)</TableHead>
                    
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(() => {
                    // Group entries by client name
                    const groupedByClient = approvedEntries.reduce((groups: Record<string, any[]>, member) => {
                      member.timeEntries?.forEach((entry: any, index: number) => {
                        const entryId = `${member.id}-${index}`;
                        const purpose = DESCRIPTIONS[Math.floor(Math.random() * DESCRIPTIONS.length)];
                        const rate = HOURLY_RATES[Math.floor(Math.random() * HOURLY_RATES.length)];
                        const amount = calculateAmount(entry.hours, rate);
                        
                         const jobNames = ['VAT Jan + Feb 2025', 'Audit 2024', 'Income Tax 2024', 'CT1 2024', 'Payroll Jan 2025', 'Payroll Feb 2025'];
                         const randomJobName = jobNames[Math.floor(Math.random() * jobNames.length)];
                         
                         const entryWithDetails = {
                          ...entry,
                          entryId,
                          memberName: member.name,
                          purpose,
                          rate,
                          amount,
                          jobName: randomJobName
                        };
                        
                        if (!groups[entry.client]) {
                          groups[entry.client] = [];
                        }
                        groups[entry.client].push(entryWithDetails);
                      });
                      return groups;
                    }, {});

                    return Object.entries(groupedByClient).map(([clientName, entries]: [string, any[]]) => {
                      const isClientSelected = selectedClients.has(clientName);
                      
                      return [
                        // Client header row
                        <ApprovalTimeLogsClientHeader
                          key={`client-${clientName}`}
                          clientName={clientName}
                          entries={entries}
                          isSelected={isClientSelected}
                          onSelectionChange={handleSelectClient}
                        />,
                        // Client entries
                        ...entries.map((entry: any) => (
                          <ApprovalTimeLogsEntryRow
                            key={entry.entryId}
                            entry={entry}
                            isSelected={selectedEntries.has(entry.entryId)}
                            onSelectionChange={handleSelectEntry}
                          />
                        ))
                      ];
                    }).flat();
                  })()}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ApprovalTimeLogsTab;