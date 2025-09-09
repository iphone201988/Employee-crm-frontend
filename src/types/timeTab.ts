export interface TimeEntry {
  id: string;
  client: string;
  clientName: string;
  job: string;
  wip: string;
  activity: string;
  billable: boolean;
  rate: string;
  billableRate: number; // hourly rate for monetary calculations
  dailyHours: string[];
  notes: string;
  pass: boolean;
}

export interface EditingCell {
  entryId: string;
  field: string;
  dayIndex?: number;
}

export interface DailyTotals {
  chargeableTotals: number[];
  nonChargeableTotals: number[];
}

export interface MonetaryTotals {
  chargeableMonetaryTotals: number[];
  nonChargeableMonetaryTotals: number[];
}

export interface CategoryBreakdownItem {
  name: string;
  value: number;
}