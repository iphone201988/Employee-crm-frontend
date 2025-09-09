export interface WIPClientData {
  entries: any[];
  total: number;
}

export interface WIPClientSummary {
  [clientName: string]: WIPClientData;
}

export interface WIPBalanceCalculation {
  totalWIP: number;
  invoiceTarget: number;
  balanceLeftOver: number;
}

export interface WIPReportTabProps {
  wipEntries: any[];
  onWriteOffEntry: (entry: any) => void;
}