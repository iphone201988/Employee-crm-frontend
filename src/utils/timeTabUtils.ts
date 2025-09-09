import { TimeEntry } from '@/types/timeTab';

export const formatHours = (hours: number) => {
  return hours.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
};

export const formatMoney = (amount: number) => {
  return `€${amount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`;
};

export const formatCellValue = (hours: string, billableRate: number, isNonChargeable: boolean, showMonetary: boolean) => {
  if (hours === '0.00' || !hours) return '';
  const numericHours = parseFloat(hours) || 0;
  if (showMonetary && isNonChargeable) return 'N/A';
  return showMonetary ? formatMoney(numericHours * billableRate) : hours;
};

export const isNonChargeableActivity = (wip: string, billable: boolean) => {
  return wip === 'Admin' || wip === 'Annual Leave' || wip === 'Bank Holiday' || wip === 'Training' || !billable;
};

export const calculateDailyTotals = (timeEntries: TimeEntry[]) => {
  const chargeableTotals = [0, 0, 0, 0, 0, 0, 0];
  const nonChargeableTotals = [0, 0, 0, 0, 0, 0, 0];
  
  timeEntries.forEach(entry => {
    entry.dailyHours.forEach((hours, index) => {
      const numericHours = parseFloat(hours) || 0;
      if (isNonChargeableActivity(entry.wip, entry.billable)) {
        nonChargeableTotals[index] += numericHours;
      } else {
        chargeableTotals[index] += numericHours;
      }
    });
  });

  return { chargeableTotals, nonChargeableTotals };
};

export const calculateDailyMonetaryTotals = (timeEntries: TimeEntry[]) => {
  const chargeableMonetaryTotals = [0, 0, 0, 0, 0, 0, 0];
  const nonChargeableMonetaryTotals = [0, 0, 0, 0, 0, 0, 0];
  
  timeEntries.forEach(entry => {
    entry.dailyHours.forEach((hours, index) => {
      const numericHours = parseFloat(hours) || 0;
      const monetaryValue = numericHours * entry.billableRate;
      if (isNonChargeableActivity(entry.wip, entry.billable)) {
        nonChargeableMonetaryTotals[index] += monetaryValue;
      } else {
        chargeableMonetaryTotals[index] += monetaryValue;
      }
    });
  });

  return { chargeableMonetaryTotals, nonChargeableMonetaryTotals };
};

export const calculateCategoryBreakdown = (timeEntries: TimeEntry[]) => {
  const breakdown: { [key: string]: number } = {};
  
  timeEntries.forEach(entry => {
    const totalHours = entry.dailyHours.reduce((sum, hours) => sum + (parseFloat(hours) || 0), 0);
    if (totalHours > 0) {
      const category = entry.wip || 'Other';
      breakdown[category] = (breakdown[category] || 0) + totalHours;
    }
  });

  return Object.entries(breakdown).map(([name, value]) => ({ name, value }));
};

export const createNewTimeEntry = (id: string): TimeEntry => ({
  id,
  client: '',
  clientName: '',
  job: '',
  wip: '',
  activity: '',
  billable: false,
  rate: '',
  billableRate: 100,
  dailyHours: ['', '', '', '', '', '', ''],
  notes: '',
  pass: false
});

// Helper function to generate client ref from client name
export const generateClientRef = (clientName: string): string => {
  if (!clientName || clientName === 'N/A') return '';
  
  const firstThreeLetters = clientName.substring(0, 3).toUpperCase();
  const years = ['99', '00', '01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12', '13', '14', '15', '16', '17', '18', '19', '20', '21', '22', '23', '24', '25'];
  const randomYear = years[Math.floor(Math.random() * years.length)];
  
  return `${firstThreeLetters}-${randomYear}`;
};