export interface TimesheetEntry {
  id: string;
  name: string;
  department: string;
  position: string;
  weekEnding: string;
  capacity: number;
  totalHours: number;
  billableHours: number;
  status: 'submitted' | 'awaiting' | 'approved' | 'rejected';
  submittedDate?: string;
  approvedBy?: string;
  notes?: string;
}

export interface SummaryData {
  total: number;
  submitted: number;
  awaiting: number;
  approved: number;
  rejected: number;
}