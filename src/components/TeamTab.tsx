import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Plus, Edit3, ChevronUp, ChevronDown, ArrowUpDown } from 'lucide-react';
import { TEAM_MEMBER_NAMES, DEFAULT_SERVICE_RATES } from '@/constants/teamConstants';
import { getProfileImage, getUserInitials } from '@/utils/profiles';
import AddTeamMemberDialog from './AddTeamMemberDialog';
import CustomTabs from './Tabs';
import DetailsContent from './Team/DetailsContent';
import { ServiceRatesContent } from './Team/ServiceRatesContent';
import ApprovalsContent from './Team/ApprovalsContent';

interface TeamMember {
  id: string;
  name: string;
  defaultRate: number;
  isDefaultRateLocked: boolean;
  rates: {
    accounts: number | string;
    audit: number | string;
    bookkeeping: number | string;
    companySecretary: number | string;
    corporationTax: number | string;
    managementAccounts: number | string;
    payroll: number | string;
    personalTax: number | string;
    vat: number | string;
    cgt: number | string;
  };
}

// Main services for the billable rates table (matching reference image)
const mainServices = [
  { key: 'accounts', label: 'Accounts' },
  { key: 'audit', label: 'Audit' },
  { key: 'bookkeeping', label: 'Bookkeeping' },
  { key: 'payroll', label: 'Payroll' },
  { key: 'vat', label: 'VAT' },
  { key: 'companySecretary', label: 'Company Secretarial' },
  { key: 'cgt', label: 'CGT' },
];

const services = [
  { key: 'accounts', label: 'Accounts' },
  { key: 'audit', label: 'Audit' },
  { key: 'bookkeeping', label: 'Bookkeeping' },
  { key: 'companySecretary', label: 'Company Secretary' },
  { key: 'corporationTax', label: 'Corporation Tax' },
  { key: 'managementAccounts', label: 'Management Accounts' },
  { key: 'payroll', label: 'Payroll' },
  { key: 'personalTax', label: 'Personal Tax' },
  { key: 'vat', label: 'VAT' },
  { key: 'cgt', label: 'CGT' },
];

const initialTeamMembers: TeamMember[] = TEAM_MEMBER_NAMES.map((name, index) => {
  const rates = { ...DEFAULT_SERVICE_RATES };

  // Add some N/A values throughout the table
  if (index === 2) { // Michael Brown
    rates.bookkeeping = 'N/A' as any;
    rates.payroll = 'N/A' as any;
  }
  if (index === 5) { // Lisa Anderson
    rates.audit = 'N/A' as any;
    rates.corporationTax = 'N/A' as any;
  }
  if (index === 8) { // Robert Thomas
    rates.companySecretary = 'N/A' as any;
    rates.cgt = 'N/A' as any;
  }
  if (index === 11) { // Amanda Lewis
    rates.personalTax = 'N/A' as any;
    rates.managementAccounts = 'N/A' as any;
  }

  // Add VAT values for all members
  if (index === 0) rates.vat = 130; // John Smith
  if (index === 1) rates.vat = 140; // Sarah Johnson
  if (index === 2) rates.vat = 120; // Michael Brown
  if (index === 3) rates.vat = 135; // Emma Wilson
  if (index === 4) rates.vat = 145; // David Wilson
  if (index === 5) rates.vat = 'N/A' as any; // Lisa Anderson
  if (index === 6) rates.vat = 125; // James Taylor
  if (index === 7) rates.vat = 150; // Jennifer White
  if (index === 8) rates.vat = 115; // Robert Thomas
  if (index === 9) rates.vat = 140; // Jessica Hall
  if (index === 10) rates.vat = 130; // Christopher Rodriguez
  if (index === 11) rates.vat = 135; // Amanda Lewis
  if (index === 12) rates.vat = 145; // Matthew Walker

  // Mix and match lock default values
  const isLocked = index % 3 === 0; // Lock every third member

  return {
    id: (index + 1).toString(),
    name,
    defaultRate: 75 + (index * 5), // Different default rates for each member
    isDefaultRateLocked: isLocked,
    rates
  };
});

const systemFeatures = {
  'Time': {
    features: ['My Timesheet', 'All Timesheets', 'Time Logs']
  },
  'WIP & Debtors': {
    features: ['WIP', 'Aged WIP', 'Invoices', 'Aged Debtors', 'Write Off']
  },
  'Clients': {
    features: ['Client List', 'Client Breakdown']
  },
  'Jobs': {
    features: ['Services', 'Job Templates', 'Job Builder', 'Job List']
  },
  'Expenses': {
    features: ['Client', 'Team']
  },
  'Reports': {
    features: ['Reports']
  },
  'Team': {
    features: ['Team List', 'Rates', 'Permissions', 'Access']
  },
  'Settings': {
    features: ['General', 'Invoicing', 'Tags', 'Client Import', 'Time Logs Import', 'Integrations']
  }
};


const TeamTab = () => {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>(initialTeamMembers);
  const [editingCell, setEditingCell] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>('details');
  const [editingValue, setEditingValue] = useState<string>('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberRates, setNewMemberRates] = useState({ ...DEFAULT_SERVICE_RATES });
  const [newMemberDefaultRate, setNewMemberDefaultRate] = useState(75);
  const [sortField, setSortField] = useState<'name' | keyof typeof DEFAULT_SERVICE_RATES | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [timesheetApprovers, setTimesheetApprovers] = useState<{ [key: string]: boolean }>({});
  const [servicesApprovers, setServicesApprovers] = useState<{ [key: string]: boolean }>({});
  const [jobBuilderApprovers, setJobBuilderApprovers] = useState<{ [key: string]: boolean }>({});
  const [jobTemplatesApprovers, setJobTemplatesApprovers] = useState<{ [key: string]: boolean }>({});

  const handleCellClick = (memberId: string, serviceKey: string, currentValue: number | string) => {
    const cellId = `${memberId}-${serviceKey}`;
    setEditingCell(cellId);
    setEditingValue(currentValue === 'N/A' ? 'N/A' : currentValue.toString());
  };

  const handleCellSave = (memberId: string, serviceKey: string) => {
    let finalValue: number | string = editingValue.trim();

    // Allow N/A as a valid value
    if (finalValue.toLowerCase() === 'n/a' || finalValue === '') {
      finalValue = 'N/A';
    } else {
      const numericValue = parseFloat(finalValue);
      finalValue = isNaN(numericValue) ? 'N/A' : numericValue;
    }

    setTeamMembers(prev =>
      prev.map(member =>
        member.id === memberId
          ? {
            ...member,
            rates: {
              ...member.rates,
              [serviceKey]: finalValue
            }
          }
          : member
      )
    );
    setEditingCell(null);
    setEditingValue('');
  };

  const handleKeyDown = (e: React.KeyboardEvent, memberId: string, serviceKey: string) => {
    if (e.key === 'Enter') {
      handleCellSave(memberId, serviceKey);
    } else if (e.key === 'Escape') {
      setEditingCell(null);
      setEditingValue('');
    }
  };

  const addTeamMember = () => {
    if (newMemberName.trim()) {
      const newMember: TeamMember = {
        id: Date.now().toString(),
        name: newMemberName.trim(),
        defaultRate: newMemberDefaultRate,
        isDefaultRateLocked: false,
        rates: { ...newMemberRates }
      };
      setTeamMembers(prev => [...prev, newMember]);
      setNewMemberName('');
      setNewMemberRates({ ...DEFAULT_SERVICE_RATES });
      setNewMemberDefaultRate(75);
      setIsAddDialogOpen(false);
    }
  };

  const handleSort = (field: 'name' | keyof typeof DEFAULT_SERVICE_RATES) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection(field === 'name' ? 'asc' : 'desc');
    }
  };

  const getSortIcon = (field: 'name' | keyof typeof DEFAULT_SERVICE_RATES) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />;
  };

  const sortedTeamMembers = [...teamMembers].sort((a, b) => {
    if (!sortField) return 0;

    if (sortField === 'name') {
      const aValue = a.name;
      const bValue = b.name;
      return sortDirection === 'asc'
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue);
    } else {
      const aValue = a.rates[sortField];
      const bValue = b.rates[sortField];

      // Handle N/A values - put them at the end
      if (aValue === 'N/A' && bValue === 'N/A') return 0;
      if (aValue === 'N/A') return 1;
      if (bValue === 'N/A') return -1;

      const aNum = typeof aValue === 'number' ? aValue : parseFloat(aValue.toString());
      const bNum = typeof bValue === 'number' ? bValue : parseFloat(bValue.toString());

      return sortDirection === 'asc' ? aNum - bNum : bNum - aNum;
    }
  });

  const toggleDefaultRateLock = (memberId: string) => {
    setTeamMembers(prev =>
      prev.map(member =>
        member.id === memberId
          ? { ...member, isDefaultRateLocked: !member.isDefaultRateLocked }
          : member
      )
    );
  };

  const calculateHourlyRate = (member: TeamMember) => {
    // Return 50% of the member's default rate (billable rate)
    return member.defaultRate / 2;
  };

 



 

  const AccessContent = () => {
    const [memberPermissions, setMemberPermissions] = useState<{ [key: string]: { [key: string]: { [key: string]: boolean } } }>(
      TEAM_MEMBER_NAMES.reduce((acc, member) => {
        acc[member] = Object.keys(systemFeatures).reduce((featureAcc, category) => {
          featureAcc[category] = systemFeatures[category as keyof typeof systemFeatures].features.reduce((subAcc, feature) => {
            subAcc[feature] = Math.random() > 0.3; // Random initial state for demo
            return subAcc;
          }, {} as { [key: string]: boolean });
          return featureAcc;
        }, {} as { [key: string]: { [key: string]: boolean } });
        return acc;
      }, {} as { [key: string]: { [key: string]: { [key: string]: boolean } } })
    );

    const handlePermissionChange = (member: string, category: string, feature: string, checked: boolean) => {
      setMemberPermissions(prev => ({
        ...prev,
        [member]: {
          ...prev[member],
          [category]: {
            ...prev[member][category],
            [feature]: checked
          }
        }
      }));
    };

    const handleSelectAllForMember = (member: string) => {
      const allChecked = Object.keys(systemFeatures).every(category =>
        systemFeatures[category as keyof typeof systemFeatures].features.every(feature =>
          memberPermissions[member]?.[category]?.[feature]
        )
      );

      setMemberPermissions(prev => ({
        ...prev,
        [member]: Object.keys(systemFeatures).reduce((categoryAcc, category) => {
          categoryAcc[category] = systemFeatures[category as keyof typeof systemFeatures].features.reduce((featureAcc, feature) => {
            featureAcc[feature] = !allChecked;
            return featureAcc;
          }, {} as { [key: string]: boolean });
          return categoryAcc;
        }, {} as { [key: string]: { [key: string]: boolean } })
      }));
    };

    return (
      <div className="space-y-6">
        <div className="flex justify-end mb-4 pt-4">
          <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
            Save Changes
          </Button>
        </div>

        <div className="w-full">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[200px] p-4 font-medium text-base text-left border-r">
                      Team Member
                    </TableHead>
                    {Object.keys(systemFeatures).map((category) => (
                      <TableHead key={category} className="p-4 font-medium text-base text-left border-r">
                        {category}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {TEAM_MEMBER_NAMES.slice(0, 6).map((member) => (
                    <TableRow key={member}>
                      <TableCell className="p-4 border-r">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={getProfileImage(member)} alt={member} />
                            <AvatarFallback className="text-xs">{getUserInitials(member)}</AvatarFallback>
                          </Avatar>
                          <span className="text-base">{member}</span>
                          <Checkbox
                            checked={Object.keys(systemFeatures).every(category =>
                              systemFeatures[category as keyof typeof systemFeatures].features.every(feature =>
                                memberPermissions[member]?.[category]?.[feature]
                              )
                            )}
                            onCheckedChange={() => handleSelectAllForMember(member)}
                            className="h-4 w-4"
                          />
                        </div>
                      </TableCell>
                      {Object.keys(systemFeatures).map((category) => (
                        <TableCell key={category} className="p-4 border-r">
                          <div className="space-y-2">
                            {systemFeatures[category as keyof typeof systemFeatures].features.map((feature) => (
                              <div key={feature} className="flex items-center gap-2">
                                <Checkbox
                                  id={`${member}-${category}-${feature}`}
                                  checked={memberPermissions[member]?.[category]?.[feature] || false}
                                  onCheckedChange={(checked) =>
                                    handlePermissionChange(member, category, feature, !!checked)
                                  }
                                  className="h-4 w-4"
                                />
                                <Label
                                  htmlFor={`${member}-${category}-${feature}`}
                                  className="text-sm cursor-pointer flex-1 font-normal"
                                >
                                  {feature}
                                </Label>
                              </div>
                            ))}
                          </div>
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  };

  // const CapacityContent = () => {
  //   const [currentPage, setCurrentPage] = useState(1);
  //   const itemsPerPage = 10;
  //   const totalPages = Math.ceil(TEAM_MEMBER_NAMES.length / itemsPerPage);
  //   const [timeSlots, setTimeSlots] = useState<{ [key: string]: { [key: string]: { startTime: string, endTime: string } } }>({});

  //   const getCurrentPageMembers = () => {
  //     const startIndex = (currentPage - 1) * itemsPerPage;
  //     const endIndex = startIndex + itemsPerPage;
  //     return TEAM_MEMBER_NAMES.slice(startIndex, endIndex);
  //   };

  //   const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  //   const timeBlocks = [
  //     { label: 'Start - End', startTime: '09:00', endTime: '17:00' },
  //     { label: 'AM Break', startTime: '10:30', endTime: '10:45' },
  //     { label: 'Lunchtime', startTime: '13:00', endTime: '13:30' },
  //     { label: 'PM Break', startTime: '15:30', endTime: '15:45' }
  //   ];

  //   const currentMembers = getCurrentPageMembers();

  //   const handleTimeSlotChange = (memberName: string, day: string, blockIndex: number, type: 'startTime' | 'endTime', value: string) => {
  //     setTimeSlots(prev => ({
  //       ...prev,
  //       [memberName]: {
  //         ...prev[memberName],
  //         [`${day}-${blockIndex}`]: {
  //           ...prev[memberName]?.[`${day}-${blockIndex}`],
  //           [type]: value
  //         }
  //       }
  //     }));
  //   };

  //   const getTimeSlotValue = (memberName: string, day: string, blockIndex: number, type: 'startTime' | 'endTime') => {
  //     return timeSlots[memberName]?.[`${day}-${blockIndex}`]?.[type] || '';
  //   };

  //   const handleSkip = (memberName: string, day: string) => {
  //     const skipKey = `${day}-skip`;
  //     const isCurrentlySkipped = timeSlots[memberName]?.[skipKey]?.startTime === 'skip';

  //     setTimeSlots(prev => ({
  //       ...prev,
  //       [memberName]: {
  //         ...prev[memberName],
  //         [skipKey]: isCurrentlySkipped ? undefined : { startTime: 'skip', endTime: 'skip' }
  //       }
  //     }));
  //   };

  //   const handleCopyForward = (memberName: string, day: string) => {
  //     // Copy current day's settings to next day
  //     const dayIndex = days.indexOf(day);
  //     if (dayIndex < days.length - 1) {
  //       const nextDay = days[dayIndex + 1];
  //       timeBlocks.forEach((_, blockIndex) => {
  //         const currentStart = getTimeSlotValue(memberName, day, blockIndex, 'startTime');
  //         const currentEnd = getTimeSlotValue(memberName, day, blockIndex, 'endTime');

  //         setTimeSlots(prev => ({
  //           ...prev,
  //           [memberName]: {
  //             ...prev[memberName],
  //             [`${nextDay}-${blockIndex}`]: {
  //               startTime: currentStart,
  //               endTime: currentEnd
  //             }
  //           }
  //         }));
  //       });
  //     }
  //   };

  //   return (
  //     <div className="space-y-6">
  //       <div className="flex justify-end mb-4 pt-4">
  //         <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
  //           Save Changes
  //         </Button>
  //       </div>
  //       <Card>
  //         <CardContent className="pt-6">
  //           <div className="overflow-x-auto">
  //             <Table>
  //               <TableHeader>
  //                 <TableRow>
  //                   <TableHead className="sticky left-0 bg-background border-r min-w-[120px] text-left">
  //                     <Button variant="ghost" className="h-auto p-0 font-medium hover:bg-transparent" onClick={() => handleSort('name')}>
  //                       Team
  //                       <ArrowUpDown className="ml-2 h-4 w-4" />
  //                     </Button>
  //                   </TableHead>
  //                   <TableHead className="min-w-[100px] border-r">Blocks</TableHead>
  //                   {days.map((day) => (
  //                     <TableHead key={day} className="text-center min-w-[120px] border-r">
  //                       {day}
  //                     </TableHead>
  //                   ))}
  //                 </TableRow>
  //               </TableHeader>
  //               <TableBody>
  //                 {currentMembers.map((memberName) => (
  //                   <React.Fragment key={memberName}>
  //                     {timeBlocks.map((block, blockIndex) => (
  //                       <TableRow key={`${memberName}-${blockIndex}`}>
  //                         {blockIndex === 0 && (
  //                           <TableCell
  //                             rowSpan={timeBlocks.length + 1}
  //                             className="sticky left-0 bg-background border-r align-top p-4"
  //                           >
  //                             <div className="flex flex-col items-start gap-2">
  //                               <Avatar className="h-8 w-8">
  //                                 <AvatarImage src={getProfileImage(memberName)} alt={memberName} />
  //                                 <AvatarFallback>{getUserInitials(memberName)}</AvatarFallback>
  //                               </Avatar>
  //                               <span className="font-medium text-sm text-left">{memberName}</span>
  //                             </div>
  //                           </TableCell>
  //                         )}
  //                         <TableCell className="border-r p-2">
  //                           <div className="text-sm font-medium">{block.label}</div>
  //                         </TableCell>
  //                         {days.map((day) => {
  //                           const isSkipped = timeSlots[memberName]?.[`${day}-skip`]?.startTime === 'skip';
  //                           return (
  //                             <TableCell key={day} className="text-center border-r p-2">
  //                               {isSkipped ? (
  //                                 <div className="bg-muted/30 text-muted-foreground p-2 rounded text-center text-sm h-8 flex items-center justify-center">
  //                                   SKIPPED
  //                                 </div>
  //                               ) : (
  //                                 <div className="flex items-center justify-center gap-2">
  //                                   <Input
  //                                     type="time"
  //                                     value={getTimeSlotValue(memberName, day, blockIndex, 'startTime')}
  //                                     onChange={(e) => handleTimeSlotChange(memberName, day, blockIndex, 'startTime', e.target.value)}
  //                                     className="w-20 h-8 text-xs"
  //                                     placeholder="--:--"
  //                                   />
  //                                   <Input
  //                                     type="time"
  //                                     value={getTimeSlotValue(memberName, day, blockIndex, 'endTime')}
  //                                     onChange={(e) => handleTimeSlotChange(memberName, day, blockIndex, 'endTime', e.target.value)}
  //                                     className="w-20 h-8 text-xs"
  //                                     placeholder="--:--"
  //                                   />
  //                                 </div>
  //                               )}
  //                             </TableCell>
  //                           );
  //                         })}
  //                       </TableRow>
  //                     ))}
  //                     {/* Skip Day and Copy Forward row */}
  //                     <TableRow>
  //                       <TableCell className="border-r p-2"></TableCell>
  //                       {days.map((day) => {
  //                         const isSkipped = timeSlots[memberName]?.[`${day}-skip`]?.startTime === 'skip';
  //                         return (
  //                           <TableCell key={day} className="text-center border-r p-2">
  //                             {isSkipped ? (
  //                               <div className="flex items-center justify-center gap-2">
  //                                 <Button
  //                                   variant="outline"
  //                                   size="sm"
  //                                   onClick={() => handleSkip(memberName, day)}
  //                                   className="h-7 px-2 text-xs bg-muted"
  //                                 >
  //                                   Unskip
  //                                 </Button>
  //                                 <Button
  //                                   variant="outline"
  //                                   size="sm"
  //                                   onClick={() => handleCopyForward(memberName, day)}
  //                                   className="h-7 px-2 text-xs"
  //                                   disabled
  //                                 >
  //                                   Copy Forward
  //                                 </Button>
  //                               </div>
  //                             ) : (
  //                               <div className="flex items-center justify-center gap-2">
  //                                 <Button
  //                                   variant="outline"
  //                                   size="sm"
  //                                   onClick={() => handleSkip(memberName, day)}
  //                                   className="h-7 px-2 text-xs"
  //                                 >
  //                                   Skip
  //                                 </Button>
  //                                 <Button
  //                                   variant="outline"
  //                                   size="sm"
  //                                   onClick={() => handleCopyForward(memberName, day)}
  //                                   className="h-7 px-2 text-xs"
  //                                 >
  //                                   Copy Forward
  //                                 </Button>
  //                               </div>
  //                             )}
  //                           </TableCell>
  //                         );
  //                       })}
  //                     </TableRow>
  //                   </React.Fragment>
  //                 ))}
  //               </TableBody>
  //             </Table>
  //           </div>

  //           {/* Pagination */}
  //           <div className="flex items-center justify-between mt-4">
  //             <div className="flex items-center gap-2">
  //               <span className="text-sm text-muted-foreground">Show</span>
  //               <span className="text-sm font-medium">{itemsPerPage}</span>
  //               <span className="text-sm text-muted-foreground">per page</span>
  //             </div>
  //             <div className="flex items-center gap-2">
  //               <Button
  //                 variant="outline"
  //                 size="sm"
  //                 onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
  //                 disabled={currentPage === 1}
  //               >
  //                 Previous
  //               </Button>
  //               <span className="text-sm font-medium">{currentPage}</span>
  //               <Button
  //                 variant="outline"
  //                 size="sm"
  //                 onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
  //                 disabled={currentPage === totalPages}
  //               >
  //                 Next
  //               </Button>
  //             </div>
  //           </div>
  //         </CardContent>
  //       </Card>
  //     </div>
  //   );
  // };


  // const TeamPerformanceContent = () => {
  //   const [additionalHolidays, setAdditionalHolidays] = useState(0);

  //   // Constants
  //   const WORKING_DAYS_PER_YEAR = 261; // Typical working days in a year (365 - 104 weekend days)
  //   const BANK_HOLIDAYS = 11;
  //   const STANDARD_HOLIDAYS = 20;
  //   const HOURS_PER_DAY = 8;

  //   const calculatePerformanceMetrics = (member: TeamMember) => {
  //     const weeklyCost = (member.defaultRate * 40 * 52) / 52; // Assuming 40 hours/week as base salary calculation
  //     const yearlySalary = member.defaultRate * 40 * 52; // Rough estimate for salary

  //     // Calculate available working days
  //     const totalHolidayDays = BANK_HOLIDAYS + STANDARD_HOLIDAYS + additionalHolidays;
  //     const availableWorkingDays = WORKING_DAYS_PER_YEAR - totalHolidayDays;
  //     const totalCapacityHours = availableWorkingDays * HOURS_PER_DAY;

  //     // Mock billable hours logged (in real app this would come from time tracking data)
  //     const billableHoursLogged = Math.floor(Math.random() * 1000) + 800; // Random between 800-1800

  //     // Calculate billable time metrics
  //     const billableTimeLeft = Math.max(0, totalCapacityHours - billableHoursLogged);
  //     const utilizationRate = (billableHoursLogged / totalCapacityHours) * 100;

  //     // Calculate financial metrics
  //     const totalRevenue = billableHoursLogged * member.defaultRate;
  //     const profitContribution = totalRevenue - yearlySalary;

  //     return {
  //       yearlySalary,
  //       weeklyCost,
  //       totalCapacityHours,
  //       billableHoursLogged,
  //       billableTimeLeft,
  //       utilizationRate,
  //       totalRevenue,
  //       profitContribution
  //     };
  //   };

  //   return (
  //     <div className="space-y-6">
  //       <div className="flex justify-between items-center">
  //         <h3 className="text-lg font-semibold">Team Performance</h3>
  //         <Dialog>
  //           <DialogTrigger asChild>
  //             <Button variant="outline" size="sm">
  //               Holiday Settings
  //             </Button>
  //           </DialogTrigger>
  //           <DialogContent>
  //             <DialogHeader>
  //               <DialogTitle>Holiday Configuration</DialogTitle>
  //             </DialogHeader>
  //             <div className="space-y-4">
  //               <div>
  //                 <Label>Bank Holidays: {BANK_HOLIDAYS} days (fixed)</Label>
  //               </div>
  //               <div>
  //                 <Label>Standard Holidays: {STANDARD_HOLIDAYS} days (fixed)</Label>
  //               </div>
  //               <div>
  //                 <Label htmlFor="additional-holidays">Additional Holidays</Label>
  //                 <Input
  //                   id="additional-holidays"
  //                   type="number"
  //                   value={additionalHolidays}
  //                   onChange={(e) => setAdditionalHolidays(Number(e.target.value))}
  //                   min="0"
  //                 />
  //               </div>
  //               <div className="text-sm text-muted-foreground">
  //                 Total Holiday Days: {BANK_HOLIDAYS + STANDARD_HOLIDAYS + additionalHolidays}
  //               </div>
  //             </div>
  //           </DialogContent>
  //         </Dialog>
  //       </div>

  //       <Card>
  //         <CardContent>
  //           <div className="overflow-x-auto">
  //             <Table>
  //               <TableHeader>
  //                 <TableRow>
  //                   <TableHead>Team Member</TableHead>
  //                   <TableHead className="text-right">Yearly Salary</TableHead>
  //                   <TableHead className="text-right">Weekly Cost</TableHead>
  //                   <TableHead className="text-right">Total Capacity (hrs)</TableHead>
  //                   <TableHead className="text-right">Billable Hours Logged</TableHead>
  //                   <TableHead className="text-right">Billable Time Left (hrs)</TableHead>
  //                   <TableHead className="text-right">Utilization %</TableHead>
  //                   <TableHead className="text-right">Total Revenue</TableHead>
  //                   <TableHead className="text-right">Profit Contribution</TableHead>
  //                 </TableRow>
  //               </TableHeader>
  //               <TableBody>
  //                 {teamMembers.map((member) => {
  //                   const metrics = calculatePerformanceMetrics(member);
  //                   return (
  //                     <TableRow key={member.id}>
  //                       <TableCell className="font-medium">
  //                         <div className="flex items-center gap-3">
  //                           <Avatar className="h-8 w-8">
  //                             <AvatarImage src={getProfileImage(member.name)} alt={member.name} />
  //                             <AvatarFallback>{getUserInitials(member.name)}</AvatarFallback>
  //                           </Avatar>
  //                           {member.name}
  //                         </div>
  //                       </TableCell>
  //                       <TableCell className="text-right">€{metrics.yearlySalary.toLocaleString()}</TableCell>
  //                       <TableCell className="text-right">€{metrics.weeklyCost.toFixed(0)}</TableCell>
  //                       <TableCell className="text-right">{metrics.totalCapacityHours}</TableCell>
  //                       <TableCell className="text-right">{metrics.billableHoursLogged}</TableCell>
  //                       <TableCell className="text-right">{metrics.billableTimeLeft}</TableCell>
  //                       <TableCell className="text-right">
  //                         <span className={metrics.utilizationRate >= 80 ? 'text-green-600' : metrics.utilizationRate >= 60 ? 'text-yellow-600' : 'text-red-600'}>
  //                           {metrics.utilizationRate.toFixed(1)}%
  //                         </span>
  //                       </TableCell>
  //                       <TableCell className="text-right">€{metrics.totalRevenue.toLocaleString()}</TableCell>
  //                       <TableCell className="text-right">
  //                         <span className={metrics.profitContribution >= 0 ? 'text-green-600' : 'text-red-600'}>
  //                           €{metrics.profitContribution.toLocaleString()}
  //                         </span>
  //                       </TableCell>
  //                     </TableRow>
  //                   );
  //                 })}
  //               </TableBody>
  //             </Table>
  //           </div>
  //         </CardContent>
  //       </Card>

  //       <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
  //         <Card>
  //           <CardHeader>
  //             <CardTitle className="text-sm">Total Team Salary Cost</CardTitle>
  //           </CardHeader>
  //           <CardContent>
  //             <p className="text-2xl font-bold">
  //               €{teamMembers.reduce((sum, member) => {
  //                 const metrics = calculatePerformanceMetrics(member);
  //                 return sum + metrics.yearlySalary;
  //               }, 0).toLocaleString()}
  //             </p>
  //           </CardContent>
  //         </Card>

  //         <Card>
  //           <CardHeader>
  //             <CardTitle className="text-sm">Total Revenue Generated</CardTitle>
  //           </CardHeader>
  //           <CardContent>
  //             <p className="text-2xl font-bold">
  //               €{teamMembers.reduce((sum, member) => {
  //                 const metrics = calculatePerformanceMetrics(member);
  //                 return sum + metrics.totalRevenue;
  //               }, 0).toLocaleString()}
  //             </p>
  //           </CardContent>
  //         </Card>

  //         <Card>
  //           <CardHeader>
  //             <CardTitle className="text-sm">Total Profit Contribution</CardTitle>
  //           </CardHeader>
  //           <CardContent>
  //             <p className="text-2xl font-bold">
  //               €{teamMembers.reduce((sum, member) => {
  //                 const metrics = calculatePerformanceMetrics(member);
  //                 return sum + metrics.profitContribution;
  //               }, 0).toLocaleString()}
  //             </p>
  //           </CardContent>
  //         </Card>
  //       </div>
  //     </div>
  //   );
  // };

  const tabs = [
    {
      id: 'details',
      label: 'Details'
    },
    {
      id: 'rates',
      label: 'Rates'
    },
    {
      id: 'approvals',
      label: 'Approvals'
    },
    {
      id: 'access',
      label: 'Access'
    }
  ]

  return (
    <div className="space-y-6">
      <CustomTabs
        tabs={tabs}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />
        {
          activeTab === 'details' && (
            <DetailsContent />
          )
        }

        {
          activeTab === 'rates' && (
            <ServiceRatesContent/>
          )
        }

        {
          activeTab === 'approvals' && (
            <ApprovalsContent />
          )
        }

        {
          activeTab === 'access' && (
            <AccessContent />
          )
        }

    </div>
  );
};

export default TeamTab;