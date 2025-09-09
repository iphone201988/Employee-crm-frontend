
export interface TimeEntry {
  id: string;
  date: string;
  client: string;
  clientNo: string;
  jobCode: string;
  jobName: string;
  jobType: string;
  description: string;
  purpose: string;
  staff: string;
  hours: number;
  rate: number;
  amount: number;
  status: 'unbilled' | 'billed';
  assignedTo?: string;
  billableStatus: 'billable' | 'non-billable' | 'unknown';
}
