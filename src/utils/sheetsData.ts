import { TimesheetEntry } from "@/types/sheets";
import { TEAM_MEMBER_NAMES } from "@/constants/teamConstants";

// Generate sample data based on period selection
export const generateTimesheetData = (period?: string, dateRange?: string): TimesheetEntry[] => {
  const departments = ['Audit', 'Tax', 'Advisory', 'Accounts', 'Admin', 'IT'];
  const positions = ['Senior Partner', 'Partner', 'Director', 'Senior Manager', 'Manager', 'Senior', 'Semi-Senior', 'Junior', 'Trainee'];
  const statuses: TimesheetEntry['status'][] = ['submitted', 'awaiting', 'approved', 'rejected'];

  const capacityOptions = [37.5, 35, 20];

  // Determine multiplier based on period to increase table size
  const getDataMultiplier = (period?: string) => {
    switch (period) {
      case 'daily': return 1;
      case 'weekly': return 1; 
      case 'monthly': return 3;
      case 'yearly': return 8;
      default: return 1;
    }
  };

  const multiplier = getDataMultiplier(period);
  const baseData = TEAM_MEMBER_NAMES;
  
  // Create additional entries for longer periods
  const expandedData = [];
  for (let i = 0; i < multiplier; i++) {
    expandedData.push(...baseData.map((name, index) => ({
      name: i === 0 ? name : `${name} (${i + 1})`,
      originalIndex: index
    })));
  }

  return expandedData.map(({ name, originalIndex }, dataIndex) => {
    const isSubmitted = Math.random() > 0.1; // 90% submission rate
    const status = isSubmitted ? statuses[Math.floor(Math.random() * statuses.length)] : 'awaiting';
    const capacity = capacityOptions[Math.floor(Math.random() * capacityOptions.length)];
    const totalHours = isSubmitted ? capacity * 0.8 + Math.random() * capacity * 0.4 : capacity * 0.6 + Math.random() * capacity * 0.4;
    const billableHours = isSubmitted ? totalHours * (0.7 + Math.random() * 0.3) : 0;
    
    return {
      id: `emp-${dataIndex + 1}`,
      name,
      department: departments[Math.floor(Math.random() * departments.length)],
      position: positions[Math.floor(Math.random() * positions.length)],
      weekEnding: dateRange?.includes('Week') ? dateRange.split(' - ')[0].split(' to ')[1] : '29/06/2025',
      capacity,
      totalHours: Math.round(totalHours * 10) / 10,
      billableHours: Math.round(billableHours * 10) / 10,
      status,
      submittedDate: isSubmitted ? `${25 + Math.floor(Math.random() * 4)}/06/2025` : undefined,
      approvedBy: status === 'approved' ? 'John Kelly' : undefined,
      notes: status === 'rejected' ? 'Missing client codes' : undefined
    };
  });
};