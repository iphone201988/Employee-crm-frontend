import { TimeEntry, DailySummary } from '@/store/timesheetApi';

// Convert minutes to hours (decimal format)
export const minutesToHours = (minutes: number): number => {
  return minutes / 60;
};

// Convert hours to minutes
export const hoursToMinutes = (hours: number): number => {
  return Math.round(hours * 60);
};

// Format hours for display (e.g., 8.5 -> "08:30")
export const formatHours = (hours: number): string => {
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
};

// Parse time input (supports both "8:30" and "8.5" formats)
export const parseTimeInput = (input: string): number => {
  if (input === '') return 0;
  
  // Handle "8:30" format
  if (input.match(/^\d{1,2}:\d{2}$/)) {
    const [hours, minutes] = input.split(':').map(Number);
    return hours + minutes / 60;
  }
  
  // Handle "8.5" format
  if (input.match(/^\d*\.?\d*$/)) {
    return parseFloat(input) || 0;
  }
  
  return 0;
};

// Get week start and end dates for a given date
export const getWeekRange = (date: Date): { weekStart: string; weekEnd: string } => {
  const current = new Date(date);

  // getUTCDay(): 0 (Sun), 1 (Mon), ... 6 (Sat)
  const day = current.getUTCDay();

  // Calculate diff to Monday (UTC)
  const diffToMonday = (day === 0 ? -6 : 1 - day);

  // Week start (Monday 00:00 UTC)
  const weekStart = new Date(Date.UTC(
    current.getUTCFullYear(),
    current.getUTCMonth(),
    current.getUTCDate() + diffToMonday,
    0, 0, 0, 0
  ));

  // Week end (Sunday 23:59:59.999 UTC)
  const weekEnd = new Date(Date.UTC(
    weekStart.getUTCFullYear(),
    weekStart.getUTCMonth(),
    weekStart.getUTCDate() + 6,
    23, 59, 59, 999
  ));

  return {
    weekStart: weekStart.toISOString(),
    weekEnd: weekEnd.toISOString(),
  };
};


// Get current week range
export const getCurrentWeekRange = (): { weekStart: string; weekEnd: string } => {
  return getWeekRange(new Date());
};

// Convert time entries to timesheet rows format
export const convertTimeEntriesToRows = (
  timeEntries: TimeEntry[],
  clients: Array<{ _id: string; name: string; clientRef: string }>,
  jobs: Array<{ _id: string; name: string; clientId: string }>,
  jobCategories: Array<{ _id: string; name: string }>
): Array<{
  id: string;
  ref: string;
  client: string;
  job: string;
  category: string;
  description: string;
  billable: boolean;
  rate: string;
  hours: {
    mon: number;
    tue: number;
    wed: number;
    thu: number;
    fri: number;
    sat: number;
    sun: number;
  };
}> => {
  return timeEntries.map((entry) => {
    const client = clients.find(c => c._id === entry.clientId);
    const job = jobs.find(j => j._id === entry.jobId);
    const category = jobCategories.find(c => c._id === entry.timeCategoryId);
    
    // Initialize hours for each day
    const hours = {
      mon: 0,
      tue: 0,
      wed: 0,
      thu: 0,
      fri: 0,
      sat: 0,
      sun: 0,
    };
    
    // Map logs to days of the week
    entry.logs.forEach((log) => {
      const logDate = new Date(log.date);
      const dayOfWeek = logDate.getDay(); // 0 = Sunday, 1 = Monday, etc.
      const hoursValue = minutesToHours(log.duration);
      
      switch (dayOfWeek) {
        case 0: hours.sun = hoursValue; break;
        case 1: hours.mon = hoursValue; break;
        case 2: hours.tue = hoursValue; break;
        case 3: hours.wed = hoursValue; break;
        case 4: hours.thu = hoursValue; break;
        case 5: hours.fri = hoursValue; break;
        case 6: hours.sat = hoursValue; break;
      }
    });
    
    return {
      id: entry._id,
      ref: client?.clientRef || 'N/A',
      client: client?.name || 'Unknown Client',
      job: job?.name || 'Unknown Job',
      category: category?.name || 'Unknown Category',
      description: entry.description || '',
      billable: entry.isbillable,
      rate: `€${entry.rate?.toFixed(2) || '0.00'}`,
      hours,
    };
  });
};

// Calculate totals from timesheet rows
export const calculateTotals = (rows: Array<{ hours: { mon: number; tue: number; wed: number; thu: number; fri: number; sat: number; sun: number }; billable: boolean }>) => {
  const billable = {
    mon: 0,
    tue: 0,
    wed: 0,
    thu: 0,
    fri: 0,
    sat: 0,
    sun: 0,
    total: 0
  };
  const nonBillable = {
    mon: 0,
    tue: 0,
    wed: 0,
    thu: 0,
    fri: 0,
    sat: 0,
    sun: 0,
    total: 0
  };
  const logged = {
    mon: 0,
    tue: 0,
    wed: 0,
    thu: 0,
    fri: 0,
    sat: 0,
    sun: 0,
    total: 0
  };
  
  rows.forEach(row => {
    const days = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const;
    days.forEach(day => {
      const hours = row.hours[day] || 0;
      if (row.billable) {
        billable[day] += hours;
      } else {
        nonBillable[day] += hours;
      }
      logged[day] += hours;
    });
  });
  
  // Calculate totals
  billable.total = Object.values(billable).slice(0, -1).reduce((sum, val) => sum + val, 0);
  nonBillable.total = Object.values(nonBillable).slice(0, -1).reduce((sum, val) => sum + val, 0);
  logged.total = Object.values(logged).slice(0, -1).reduce((sum, val) => sum + val, 0);
  
  return { billable, nonBillable, logged };
};

// Convert timesheet rows back to time entries format for API
export const convertRowsToTimeEntries = (
  rows: Array<{
    id: string;
    ref: string;
    client: string;
    job: string;
    category: string;
    description: string;
    billable: boolean;
    rate: string;
    hours: {
      mon: number;
      tue: number;
      wed: number;
      thu: number;
      fri: number;
      sat: number;
      sun: number;
    };
  }>,
  clients: Array<{ _id: string; name: string }>,
  jobs: Array<{ _id: string; name: string }>,
  jobCategories: Array<{ _id: string; name: string }>,
  weekStart: string
): Array<{
  _id?: string;
  clientId: string;
  jobId: string;
  timeCategoryId: string;
  description: string;
  isbillable: boolean;
  rate?: number;
  logs: Array<{
    date: string;
    duration: number;
  }>;
}> => {
  const weekStartDate = new Date(weekStart);
  
  return rows.map((row) => {
    const client = clients.find(c => c.name === row.client);
    const job = jobs.find(j => j.name === row.job);
    const category = jobCategories.find(c => c.name === row.category);
    
    const logs: Array<{ date: string; duration: number }> = [];
    const days = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const;
    
    days.forEach((day, index) => {
      const hours = row.hours[day];
      if (hours > 0) {
        const logDate = new Date(weekStartDate);
        logDate.setDate(weekStartDate.getDate() + index);
        logs.push({
          date: logDate.toISOString(),
          duration: hoursToMinutes(hours),
        });
      }
    });
    
    return {
      _id: row.id.startsWith('temp-') ? undefined : row.id,
      clientId: client?._id || '',
      jobId: job?._id || '',
      timeCategoryId: category?._id || '',
      description: row.description,
      isbillable: row.billable,
      rate: row.billable ? parseFloat(row.rate.replace('€', '')) : undefined,
      logs,
    };
  });
};

// Get daily summary data for display
export const getDailySummaryData = (dailySummary: DailySummary[]) => {
  const summary = {
    mon: { billable: 0, nonBillable: 0, logged: 0, capacity: 0, variance: 0 },
    tue: { billable: 0, nonBillable: 0, logged: 0, capacity: 0, variance: 0 },
    wed: { billable: 0, nonBillable: 0, logged: 0, capacity: 0, variance: 0 },
    thu: { billable: 0, nonBillable: 0, logged: 0, capacity: 0, variance: 0 },
    fri: { billable: 0, nonBillable: 0, logged: 0, capacity: 0, variance: 0 },
    sat: { billable: 0, nonBillable: 0, logged: 0, capacity: 0, variance: 0 },
    sun: { billable: 0, nonBillable: 0, logged: 0, capacity: 0, variance: 0 },
  };
  
  dailySummary.forEach((day) => {
    const date = new Date(day.date);
    const dayOfWeek = date.getDay();
    
    const dayData = {
      billable: minutesToHours(day.billable),
      nonBillable: minutesToHours(day.nonBillable),
      logged: minutesToHours(day.totalLogged),
      capacity: minutesToHours(day.capacity),
      variance: minutesToHours(day.variance),
    };
    
    switch (dayOfWeek) {
      case 0: summary.sun = dayData; break;
      case 1: summary.mon = dayData; break;
      case 2: summary.tue = dayData; break;
      case 3: summary.wed = dayData; break;
      case 4: summary.thu = dayData; break;
      case 5: summary.fri = dayData; break;
      case 6: summary.sat = dayData; break;
    }
  });
  
  return summary;
};