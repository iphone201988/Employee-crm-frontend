export interface WipOpenBalance {
  id: string;
  amount: number;
  type?: string;
  status?: string;
  createdAt?: string;
  jobId?: string;
}

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
  targetMetStatus?: string;
  actionStatus: 'ready-to-invoice' | 'review' | 'upcoming';
  jobFee: number;
  wipBreakdown?: any[];
  wipOpenBalanceIds?: string[];
  openBalances?: WipOpenBalance[];
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
  address?: string;
  company?: { name?: string; email?: string };
  trigger: string | null;
  lastInvoiced: string | null;
  daysSinceLastInvoice: number | null;
  jobs: WIPJob[];
  activeExpenses: Expense[];
  clientWipOpenBalanceIds?: string[];
  clientOpenBalances?: WipOpenBalance[];
  clientWipBalance?: number;
  wipBreakdown?: any[];
  importedWipBalance?: number;
  importedWipDate?: string | null;
  clientTargetMet?: string;
  clientTargetOverall?: string;
}