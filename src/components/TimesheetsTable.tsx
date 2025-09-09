import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Check, ChevronLeft, ChevronRight, FileText, Eye, ShieldCheck, X } from 'lucide-react';
import { getExpectedDailyHours, isDayUnderCapacity } from "@/utils/timesheetUtils";
import { getProfileImage, getUserInitials } from "@/utils/profiles";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import TimeLogsFilterDialog from './TimeLogsFilterDialog';
interface TimesheetsTableProps {
  staff: any[];
  currentWeek: string;
  setCurrentWeek: (week: string) => void;
  approvedRows: Set<number>;
  onApprove: (memberId: number) => void;
  onReject: (memberId: number) => void;
  onOpenNoteDialog: (member: any) => void;
  onOpenViewDialog: (member: any) => void;
  onOpenApprovalDialog: (member: any) => void;
}
const TimesheetsTable = ({
  staff,
  currentWeek,
  setCurrentWeek,
  approvedRows,
  onApprove,
  onReject,
  onOpenNoteDialog,
  onOpenViewDialog,
  onOpenApprovalDialog
}: TimesheetsTableProps) => {
  const days = ['Mon, 30 Jun', 'Tue, 1 Jul', 'Wed, 2 Jul', 'Thu, 3 Jul', 'Fri, 4 Jul', 'Sat, 5 Jul', 'Sun, 6 Jul'];
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState<'billable' | 'non-billable' | 'unknown'>('billable');
  const [dialogEntries, setDialogEntries] = useState<any[]>([]);
  // Calculate totals for summary cards
  const calculateTotals = () => {
    let totalBillable = 0;
    let totalNonBillable = 0;
    let totalUnknown = 0;

    staff.forEach(member => {
      member.timeEntries?.forEach((entry: any) => {
        const hours = parseFloat(entry.hours.split(':')[0]);
        const minutes = parseFloat(entry.hours.split(':')[1]);
        const timeInHours = hours + (minutes / 60);

        if (entry.billable === 'billable') {
          totalBillable += timeInHours;
        } else if (entry.billable === 'non-billable') {
          totalNonBillable += timeInHours;
        } else if (entry.billable === 'unknown') {
          totalUnknown += timeInHours;
        }
      });
    });

    const formatTime = (time: number) => {
      const hours = Math.floor(time);
      const minutes = Math.round((time - hours) * 60);
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:00`;
    };

    // Calculate billable value (assuming €75/hour rate)
    const billableValue = totalBillable * 75;

    return {
      billable: formatTime(totalBillable),
      nonBillable: formatTime(totalNonBillable),
      unknown: formatTime(totalUnknown),
      billableHours: totalBillable,
      billableValue
    };
  };

  const totals = calculateTotals();

  const handleSummaryCardClick = (type: 'billable' | 'non-billable' | 'unknown') => {
    const allEntries = staff.flatMap(member => 
      member.timeEntries?.filter((entry: any) => entry.billable === type) || []
    );
    setDialogEntries(allEntries);
    setDialogType(type);
    setDialogOpen(true);
  };

  const handlePreviousWeek = () => {
    // Logic to go to previous week
    const currentDate = new Date();
    currentDate.setDate(currentDate.getDate() - 7);
    const startOfWeek = new Date(currentDate);
    startOfWeek.setDate(currentDate.getDate() - currentDate.getDay() + 1);
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    
    const formatDate = (date: Date) => {
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      return `${months[date.getMonth()]} ${date.getDate()}`;
    };
    
    const newWeek = `${formatDate(startOfWeek)} - ${formatDate(endOfWeek)} (${endOfWeek.getFullYear()})`;
    setCurrentWeek(newWeek);
  };

  const handleNextWeek = () => {
    // Logic to go to next week
    const currentDate = new Date();
    currentDate.setDate(currentDate.getDate() + 7);
    const startOfWeek = new Date(currentDate);
    startOfWeek.setDate(currentDate.getDate() - currentDate.getDay() + 1);
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    
    const formatDate = (date: Date) => {
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      return `${months[date.getMonth()]} ${date.getDate()}`;
    };
    
    const newWeek = `${formatDate(startOfWeek)} - ${formatDate(endOfWeek)} (${endOfWeek.getFullYear()})`;
    setCurrentWeek(newWeek);
  };

  const handleToday = () => {
    // Logic to go to current week
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay() + 1);
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    
    const formatDate = (date: Date) => {
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      return `${months[date.getMonth()]} ${date.getDate()}`;
    };
    
    const newWeek = `${formatDate(startOfWeek)} - ${formatDate(endOfWeek)} (${endOfWeek.getFullYear()})`;
    setCurrentWeek(newWeek);
  };

  return <div className="space-y-4">
      <div className="flex justify-between items-center">
         <div className="grid grid-cols-3 gap-8">
           <div 
             className="bg-green-50 p-4 rounded-lg text-center min-w-[250px] cursor-pointer hover:bg-green-100 transition-colors"
             onClick={() => handleSummaryCardClick('billable')}
           >
             <div className="text-sm text-green-600 font-medium">Billable</div>
              <div className="text-lg font-bold text-green-700 flex items-center justify-center">
                {totals.billable} • <span className="text-lg text-green-700 font-bold">€{totals.billableValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
           </div>
           <div 
             className="bg-red-50 p-4 rounded-lg text-center min-w-[250px] cursor-pointer hover:bg-red-100 transition-colors"
             onClick={() => handleSummaryCardClick('non-billable')}
           >
             <div className="text-sm text-red-600 font-medium">Non-Billable</div>
             <div className="text-lg font-bold text-red-700">{totals.nonBillable === '00:00:00' ? 'N/A' : totals.nonBillable}</div>
           </div>
           <div 
             className="bg-gray-50 p-4 rounded-lg text-center min-w-[250px] cursor-pointer hover:bg-gray-100 transition-colors"
             onClick={() => handleSummaryCardClick('unknown')}
           >
             <div className="text-sm text-gray-600 font-medium">Unknown</div>
             <div className="text-lg font-bold text-gray-700">{totals.unknown === '00:00:00' ? 'N/A' : totals.unknown}</div>
           </div>
        </div>
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={handlePreviousWeek}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="font-medium">{currentWeek}</span>
          <Button variant="outline" size="sm" onClick={handleNextWeek}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={handleToday}>Today</Button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b bg-gray-50">
              <th className="text-left p-3 font-medium text-foreground h-10 w-48">Team Name</th>
              <th className="text-center p-3 font-medium text-foreground h-10 w-24">Client Ref</th>
               {days.map(day => <th key={day} className="text-center p-2 font-medium text-foreground h-10 w-16 bg-gray-100">
                   {day}
                 </th>)}
              <th className="text-center p-3 font-medium text-foreground h-10 w-24">Capacity</th>
              <th className="text-center p-3 font-medium text-foreground h-10 w-20">Logged</th>
              <th className="text-center p-3 font-medium text-foreground h-10 w-24">Variance</th>
              <th className="text-center p-3 font-medium text-foreground h-10 w-32">Actions</th>
            </tr>
          </thead>
          <tbody>
            {staff.map(member => {
            const expectedHours = getExpectedDailyHours(member);
            return <tr key={member.id} className={`border-b hover:bg-gray-50 ${approvedRows.has(member.id) ? 'bg-[#E0F2DE]' : ''}`}>
                  <td className="p-3">
                    <div className="flex items-center gap-3">
                      <Avatar className="w-8 h-8">
                        <AvatarImage src={getProfileImage(member.name)} alt={member.name} />
                        <AvatarFallback className="text-sm font-medium">
                          {getUserInitials(member.name)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-medium">{member.name}</span>
                    </div>
                  </td>
                  <td className="p-3 text-center">
                    <span className="text-sm text-gray-600 font-medium">
                      {member.refNumber}
                    </span>
                  </td>
                  {days.map((day, index) => {
                const isWeekend = index >= 5; // Saturday (5) and Sunday (6) are weekends
                const isUnder = !isWeekend && isDayUnderCapacity(member.dailyHours[index], expectedHours);
                return <td key={day} className="p-2 text-center">
                        <span className={`px-2 py-1 rounded text-sm ${isUnder && !approvedRows.has(member.id) ? 'bg-red-200 text-red-700' : approvedRows.has(member.id) ? 'bg-green-200 text-green-800' : 'bg-gray-200 text-gray-600'}`}>
                          {member.dailyHours[index]}
                        </span>
                      </td>;
              })}
                  <td className="p-3 text-center">
                    <span className="text-sm text-gray-600 font-medium">
                      {member.capacity}
                    </span>
                  </td>
                  <td className="p-3 text-center">
                    <span className={`text-sm ${approvedRows.has(member.id) ? 'text-gray-800' : 'text-gray-600'}`}>{member.totalLogged}</span>
                  </td>
                  <td className="p-3 text-center">
                    <span className={`px-2 py-1 rounded text-sm font-medium text-foreground`}>
                      {member.variance.startsWith('-') ? member.variance.substring(1) + ' under' : member.variance === '00:00:00' ? member.variance : member.variance + ' over'}
                    </span>
                  </td>
                  <td className="p-3 text-center">
                    <div className="flex gap-1 justify-center">
                      <Button size="sm" variant="outline" onClick={() => onOpenNoteDialog(member)}>
                        <FileText className="h-4 w-4" style={{ color: '#017DB9' }} />
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => onOpenViewDialog(member)}>
                        <Eye className="h-4 w-4" style={{ color: '#017DB9' }} />
                      </Button>
                      {!approvedRows.has(member.id) ? (
                        <>
                          <Button size="sm" variant="outline" onClick={() => onApprove(member.id)}>
                            <Check className="h-4 w-4" style={{ color: '#666666' }} />
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => onReject(member.id)}>
                            <X className="h-4 w-4" style={{ color: '#666666' }} />
                          </Button>
                        </>
                      ) : (
                        <Button size="sm" variant="outline" onClick={() => onOpenApprovalDialog(member)}>
                          <ShieldCheck className="h-4 w-4" style={{ color: '#666666' }} />
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>;
          })}
            <tr className="border-b border-gray-400 text-gray-600 font-medium">
              <td className="p-3">Capacity</td>
              <td className="p-3 text-center">-</td>
              {days.map((day, index) => {
              const isWeekend = index >= 5; // Saturday (5) and Sunday (6) are weekends
              if (isWeekend) {
                return <td key={day} className="p-3 text-center">00:00:00</td>;
              }
              const capacityTotal = staff.reduce((sum, member) => {
                const capacity = member.capacity;
                const hours = parseFloat(capacity.split(':')[0]);
                return sum + hours / 5; // Split across 5 weekdays only
              }, 0);
              const formattedTime = `${Math.floor(capacityTotal).toString().padStart(2, '0')}:${Math.round((capacityTotal - Math.floor(capacityTotal)) * 60).toString().padStart(2, '0')}:00`;
              return <td key={day} className="p-3 text-center">{formattedTime}</td>;
            })}
              <td className="p-3 text-center">165:00:00</td>
              <td className="p-3 text-center">165:00:00</td>
              
              
            </tr>
            <tr className="border-b border-gray-400 text-gray-600 font-medium">
              <td className="p-3">Logged</td>
              <td className="p-3 text-center">-</td>
              {days.map((day, index) => {
              const dayTotal = staff.reduce((sum, member) => {
                const time = member.dailyHours[index];
                const hours = parseFloat(time.split(':')[0]);
                const minutes = parseFloat(time.split(':')[1]);
                return sum + hours + minutes / 60;
              }, 0);
              const formattedTime = `${Math.floor(dayTotal).toString().padStart(2, '0')}:${Math.round((dayTotal - Math.floor(dayTotal)) * 60).toString().padStart(2, '0')}:00`;
              return <td key={day} className="p-3 text-center">{formattedTime}</td>;
            })}
              <td className="p-3 text-center">165:00:00</td>
              <td className="p-3 text-center">164:00:00</td>
              
              
            </tr>
            <tr className="border-b border-gray-400 text-gray-600 font-medium">
              <td className="p-3">Variance</td>
              <td className="p-3 text-center">-</td>
              {days.map((day, index) => {
              const dayTotal = staff.reduce((sum, member) => {
                const time = member.dailyHours[index];
                const hours = parseFloat(time.split(':')[0]);
                const minutes = parseFloat(time.split(':')[1]);
                return sum + hours + minutes / 60;
              }, 0);
              const isWeekend = index >= 5; // Saturday (5) and Sunday (6) are weekends
              const capacityTotal = isWeekend ? 0 : staff.reduce((sum, member) => {
                const capacity = member.capacity;
                const hours = parseFloat(capacity.split(':')[0]);
                return sum + hours / 5; // Split across 5 weekdays only
              }, 0);
              const variance = dayTotal - capacityTotal;
              const formattedVariance = `${Math.abs(Math.floor(variance)).toString().padStart(2, '0')}:${Math.abs(Math.round((variance - Math.floor(variance)) * 60)).toString().padStart(2, '0')}:00 ${variance < 0 ? 'under' : variance > 0 ? 'over' : ''}`;
              return <td key={day} className="p-3 text-center">{formattedVariance}</td>;
            })}
              <td className="p-3 text-center">01:00:00 under</td>
              <td className="p-3 text-center">01:00:00 under</td>
              
              
            </tr>
          </tbody>
        </table>
      </div>

      <TimeLogsFilterDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        title={dialogType.charAt(0).toUpperCase() + dialogType.slice(1).replace('-', ' ')}
        timeEntries={dialogEntries}
        totalHours={dialogType === 'billable' ? totals.billable : dialogType === 'non-billable' ? totals.nonBillable : totals.unknown}
        totalValue={dialogType === 'billable' ? totals.billableValue : undefined}
      />
    </div>;
};
export default TimesheetsTable;