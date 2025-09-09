export interface WIPData {
  id: string;
  clientName: string;
  jobName: string;
  jobStatus: 'active' | 'completed' | 'on-hold';
  hoursLogged: number;
  wipAmount: number;
  invoicedAmount: number;
  unbilledAmount: number;
  outstandingAmount: number;
  lastInvoiceDate: string | null;
  daysSinceLastInvoice: number | null;
  billingTrigger: 'monthly' | 'job-completion' | 'manual-review' | 'threshold-500' | 'threshold-1000' | '30-days';
  triggerMet: boolean;
  action: 'invoice' | 'invoice-ready' | 'review';
  jobFee: number;
}

export interface WIPClientGroup {
  clientName: string;
  jobs: WIPData[];
  totalWIP: number;
  totalUnbilled: number;
  totalOutstanding: number;
}