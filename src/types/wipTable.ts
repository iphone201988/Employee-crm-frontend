export interface WIPJob {
  id: string;
  jobName: string;
  jobStatus: 'active' | 'completed' | 'on-hold';
  hoursLogged: number;
  wipAmount: number;
  invoicedToDate: number;
  toInvoice: number;
  lastInvoiced: string | null;
  daysSinceLastInvoice: number | null;
  trigger: string | null;
  triggerMet: boolean;
  actionStatus: 'ready-to-invoice' | 'review' | 'upcoming';
  jobFee: number;
}

export interface Expense {
  id: string;
  description: string;
  submittedBy: string;
  amount: number;
  hasAttachment: boolean;
  dateLogged: string;
  vatPercentage: number;
  totalAmount: number;
}

export interface WIPClient {
  id: string;
  clientName: string;
  clientCode: string;
  trigger: string | null;
  lastInvoiced: string | null;
  daysSinceLastInvoice: number | null;
  jobs: WIPJob[];
  activeExpenses: Expense[];
}