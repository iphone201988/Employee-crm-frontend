import React, { useState } from 'react';
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DashboardCard, DashboardGrid } from "@/components/ui/dashboard-card";
import { CheckCircle, XCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import TimesheetsTable from './TimesheetsTable';
import NoteDialog from './NoteDialog';
import ViewDialog from './ViewDialog';
import ApprovalDialog from './ApprovalDialog';
import { TEAM_MEMBER_NAMES } from '@/constants/teamConstants';

interface TimesheetsTabProps {
  onApprovalUpdate?: (approvedMembers: any[]) => void;
}

const TimesheetsTab = ({ onApprovalUpdate }: TimesheetsTabProps) => {
  const [currentWeek, setCurrentWeek] = useState('Jun 30 - Jul 6 (2025)');
  const [weekNumber, setWeekNumber] = useState(27);
  const [approvedRows, setApprovedRows] = useState<Set<number>>(new Set());
  const [noteDialogOpen, setNoteDialogOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<any>(null);
  const [noteText, setNoteText] = useState('');
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [approvalDialogOpen, setApprovalDialogOpen] = useState(false);
  const [actionDialogOpen, setActionDialogOpen] = useState(false);
  const [actionType, setActionType] = useState<'approved' | 'rejected' | null>(null);
  const [tableFrozen, setTableFrozen] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<'daily' | 'weekly' | 'monthly' | 'yearly'>('weekly');

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
      // Clear approvals when changing weeks
      setApprovedRows(new Set());
    }
  };

  const handleNextWeek = () => {
    if (currentWeekIndex < weeks.length - 1) {
      const nextWeek = weeks[currentWeekIndex + 1];
      setCurrentWeek(nextWeek.week);
      setWeekNumber(nextWeek.number);
      // Clear approvals when changing weeks
      setApprovedRows(new Set());
    }
  };

  // Generate staff data using shared team member names
  const generateStaffData = () => {
    const capacityOptions = ['40:00:00', '25:00:00', '20:00:00'];
    const avatars = ['👩‍💼', '👨‍💼', '👩‍💻', '👨‍💻', '👨‍🔧', '👩‍🔬', '👨‍🎓', '👩‍🎨', '👨‍⚕️', '👩‍🚀', '👨‍🏫', '👩‍⚖️', '👨‍🍳'];
    
    return TEAM_MEMBER_NAMES.filter((_, index) => index !== 5 && index !== 10 && index !== 9).map((name, index) => {
      const capacity = capacityOptions[index % capacityOptions.length];
      const initials = name.split(' ').map(n => n[0]).join('');
      const avatar = avatars[index % avatars.length];
      
      // Generate random daily hours based on selected period and current week
      let daysCount = 7;
      let periodMultiplier = 1;
      
      if (selectedPeriod === 'daily') {
        daysCount = 1;
      } else if (selectedPeriod === 'weekly') {
        daysCount = 7;
      } else if (selectedPeriod === 'monthly') {
        daysCount = 30;
        periodMultiplier = 4; // Show more entries for monthly view
      } else if (selectedPeriod === 'yearly') {
        daysCount = 365;
        periodMultiplier = 12; // Show more entries for yearly view
      }
      
      const dailyHours = Array.from({ length: 7 }, (_, dayIndex) => {
        if (dayIndex >= 5 && selectedPeriod === 'weekly') return '00:00:00'; // Weekend for weekly view
        
        // Adjust hours based on period - more variation for longer periods
        let baseHours = Math.floor(Math.random() * 10) + 1;
        if (selectedPeriod === 'monthly') {
          baseHours = Math.floor(Math.random() * 12) + 6; // 6-18 hours for monthly
        } else if (selectedPeriod === 'yearly') {
          baseHours = Math.floor(Math.random() * 15) + 10; // 10-25 hours for yearly
        }
        
        const minutes = Math.floor(Math.random() * 4) * 15;
        return `${baseHours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:00`;
      });
      
      // Calculate total logged hours
      const totalMinutes = dailyHours.reduce((sum, time) => {
        const [h, m] = time.split(':').map(Number);
        return sum + h * 60 + m;
      }, 0);
      const totalHours = Math.floor(totalMinutes / 60);
      const remainingMinutes = totalMinutes % 60;
      const totalLogged = `${totalHours.toString().padStart(2, '0')}:${remainingMinutes.toString().padStart(2, '0')}:00`;
      
      // Calculate variance
      const capacityMinutes = parseInt(capacity.split(':')[0]) * 60 * periodMultiplier;
      const varianceMinutes = totalMinutes - capacityMinutes;
      const varianceHours = Math.floor(Math.abs(varianceMinutes) / 60);
      const varianceRemainingMinutes = Math.abs(varianceMinutes) % 60;
      const variance = `${varianceMinutes >= 0 ? '+' : '-'}${varianceHours.toString().padStart(2, '0')}:${varianceRemainingMinutes.toString().padStart(2, '0')}:00`;
      
      // Generate time entries
      const clients = ['Smith & Associates', 'Water Savers Limited', 'Green Gardens Limited', 'Johnson Retail', 'Brown Enterprises'];
      const descriptions = ['Project Planning', 'Code Review', 'Team Meeting', 'Bug Fixes', 'Client Call', 'System Maintenance'];
      const billableTypes = ['billable', 'non-billable', 'unknown'];
      
      // Generate reference number in format XXX-YY (same as clients tab)
      const generateRefNumber = (name: string, index: number) => {
        const prefix = name.substring(0, 3).toUpperCase();
        const year = (20 + (index % 6)).toString(); // Cycle through years 20-25
        return `${prefix}-${year}`;
      };
      
      // Generate more time entries for longer periods
      const entriesCount = selectedPeriod === 'daily' ? 1 : 
                          selectedPeriod === 'weekly' ? 5 : 
                          selectedPeriod === 'monthly' ? 20 : 50;
      
      const timeEntries = Array.from({ length: entriesCount }, (_, entryIndex) => {
        const dayIndex = entryIndex % 7;
        const hours = dailyHours[dayIndex];
        if (hours === '00:00:00' && selectedPeriod === 'weekly') return null;
        
        const days = selectedPeriod === 'daily' ? ['Today'] :
                    selectedPeriod === 'weekly' ? ['Mon, 30 Jun', 'Tue, 1 Jul', 'Wed, 2 Jul', 'Thu, 3 Jul', 'Fri, 4 Jul', 'Sat, 5 Jul', 'Sun, 6 Jul'] :
                    selectedPeriod === 'monthly' ? Array.from({ length: 30 }, (_, i) => `Day ${i + 1}`) :
                    Array.from({ length: 365 }, (_, i) => `Day ${i + 1}`);
        
        return {
          date: days[entryIndex % days.length],
          client: clients[Math.floor(Math.random() * clients.length)],
          description: descriptions[Math.floor(Math.random() * descriptions.length)],
          hours,
          billable: billableTypes[Math.floor(Math.random() * billableTypes.length)]
        };
      }).filter(Boolean);
      
      return {
        id: index + 1,
        name,
        initials,
        capacity,
        avatar,
        dailyHours,
        totalLogged,
        variance,
        timeEntries,
        refNumber: generateRefNumber(name, index)
      };
    });
  };

  const staff = generateStaffData();

  const handleApprove = (memberId: number) => {
    setTableFrozen(true);
    
    setApprovedRows(prev => {
      const newApprovedRows = new Set([...prev, memberId]);
      
      // Update the approved time log entries
      if (onApprovalUpdate) {
        const approvedMembers = staff.filter(member => newApprovedRows.has(member.id));
        onApprovalUpdate(approvedMembers);
      }
      
      return newApprovedRows;
    });
    
    // Show approval dialog
    setActionType('approved');
    setActionDialogOpen(true);
  };

  const handleReject = (memberId: number) => {
    setTableFrozen(true);
    
    // Find the member and open note dialog for rejection
    const member = staff.find(m => m.id === memberId);
    if (member) {
      setSelectedMember(member);
      setNoteDialogOpen(true);
      setNoteText('');
    }
  };

  const handleActionDialogClose = () => {
    setActionDialogOpen(false);
    setTableFrozen(false);
    setActionType(null);
  };

  const handleOpenNoteDialog = (member: any) => {
    setSelectedMember(member);
    setNoteDialogOpen(true);
    setNoteText('');
  };

  const handleSendNote = () => {
    // Here you would implement the actual note sending logic
    console.log(`Adding rejection note to ${selectedMember?.name}: ${noteText} at ${new Date().toLocaleString()}`);
    
    // Show rejection dialog after adding note
    setActionType('rejected');
    setActionDialogOpen(true);
    
    setNoteDialogOpen(false);
    setNoteText('');
    setSelectedMember(null);
    setTableFrozen(false);
  };

  const handleOpenViewDialog = (member: any) => {
    setSelectedMember(member);
    setViewDialogOpen(true);
  };

  const handleOpenApprovalDialog = (member: any) => {
    setSelectedMember(member);
    setApprovalDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Period Filter */}
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <div className="inline-flex h-9 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground">
            <button 
              className={`inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 ${selectedPeriod === 'daily' ? 'bg-background text-foreground shadow-sm' : ''}`}
              onClick={() => setSelectedPeriod('daily')}
            >
              Daily
            </button>
            <button 
              className={`inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 ${selectedPeriod === 'weekly' ? 'bg-background text-foreground shadow-sm' : ''}`}
              onClick={() => setSelectedPeriod('weekly')}
            >
              Weekly
            </button>
            <button 
              className={`inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 ${selectedPeriod === 'monthly' ? 'bg-background text-foreground shadow-sm' : ''}`}
              onClick={() => setSelectedPeriod('monthly')}
            >
              Monthly
            </button>
            <button 
              className={`inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 ${selectedPeriod === 'yearly' ? 'bg-background text-foreground shadow-sm' : ''}`}
              onClick={() => setSelectedPeriod('yearly')}
            >
              Yearly
            </button>
          </div>
        </div>
        
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
            <h2 className="text-sm font-medium">{currentWeek} - Week {weekNumber}</h2>
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
      </div>

      {/* Dashboard Cards */}
      <DashboardGrid columns={4}>
        <DashboardCard
          title="Total Team Members"
          value={staff.length}
        />
        
        <DashboardCard
          title="Awaiting Approval"
          value={staff.filter(member => !approvedRows.has(member.id)).length}
        />
        
        <DashboardCard
          title="Approved"
          value={approvedRows.size}
        />
        
        <DashboardCard
          title="Total Hours"
          value={staff.reduce((sum, member) => {
            const totalMinutes = member.dailyHours.reduce((acc, time) => {
              const [h, m] = time.split(':').map(Number);
              return acc + h * 60 + m;
            }, 0);
            return sum + Math.floor(totalMinutes / 60);
          }, 0)}
        />
      </DashboardGrid>

      <Card>
        <CardHeader>
          {/* Empty header to maintain layout */}
        </CardHeader>
        <CardContent>
          <div className={tableFrozen ? 'pointer-events-none opacity-50' : ''}>
            <TimesheetsTable
              staff={staff}
              currentWeek={currentWeek}
              setCurrentWeek={setCurrentWeek}
              approvedRows={approvedRows}
              onApprove={handleApprove}
              onReject={handleReject}
              onOpenNoteDialog={handleOpenNoteDialog}
              onOpenViewDialog={(member) => window.location.hash = 'sheets'}
              onOpenApprovalDialog={handleOpenApprovalDialog}
            />
          </div>
        </CardContent>
      </Card>

      <NoteDialog
        open={noteDialogOpen}
        onOpenChange={setNoteDialogOpen}
        selectedMember={selectedMember}
        noteText={noteText}
        onNoteTextChange={setNoteText}
        onSendNote={handleSendNote}
      />

      <ViewDialog
        open={viewDialogOpen}
        onOpenChange={setViewDialogOpen}
        selectedMember={selectedMember}
        currentWeek={currentWeek}
      />

      <ApprovalDialog
        open={approvalDialogOpen}
        onOpenChange={setApprovalDialogOpen}
        selectedMember={selectedMember}
      />

      <Dialog open={actionDialogOpen} onOpenChange={handleActionDialogClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {actionType === 'approved' ? (
                <>
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  Timesheets Approved
                </>
              ) : (
                <>
                  <XCircle className="h-5 w-5 text-red-600" />
                  Timesheets Rejected
                </>
              )}
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-gray-600">
              {actionType === 'approved' 
                ? 'The timesheets have been approved successfully.' 
                : 'The timesheets have been rejected and will need to be resubmitted.'}
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TimesheetsTab;
