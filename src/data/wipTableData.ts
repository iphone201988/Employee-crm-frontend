import { WIPClient } from '@/types/wipTable';

export const wipTableData: WIPClient[] = [
  {
    id: 'client-1',
    clientName: 'John Kelly',
    clientCode: 'V12',
    trigger: 'monthly',
    lastInvoiced: '2024-11-15',
    daysSinceLastInvoice: 25,
    activeExpenses: [
      {
        id: 'exp-1',
        description: 'Travel expenses to client site',
        submittedBy: 'John Smith',
        amount: 45.50,
        hasAttachment: true,
        dateLogged: '2024-12-01',
        vatPercentage: 23,
        totalAmount: 55.97
      },
      {
        id: 'exp-2', 
        description: 'Software license for project',
        submittedBy: 'Sarah Johnson',
        amount: 120.00,
        hasAttachment: false,
        dateLogged: '2024-12-02',
        vatPercentage: 23,
        totalAmount: 147.60
      }
    ],
    jobs: [
      {
        id: 'job-1',
        jobName: 'VAT (01/01/2025 - 28/02/2025)',
        jobStatus: 'active',
        hoursLogged: 23.0,
        wipAmount: 2300,
        invoicedToDate: 2000,
        toInvoice: 2500,
        lastInvoiced: '2024-11-15',
        daysSinceLastInvoice: 25,
        trigger: 'threshold-2500',
        triggerMet: true,
        actionStatus: 'ready-to-invoice',
        jobFee: 3500
      },
      {
        id: 'job-2',
        jobName: 'Annual Returns - 2024',
        jobStatus: 'active',
        hoursLogged: 13.0,
        wipAmount: 1300,
        invoicedToDate: 5000,
        toInvoice: 2800,
        lastInvoiced: '2024-10-30',
        daysSinceLastInvoice: 41,
        trigger: 'threshold-5000',
        triggerMet: false,
        actionStatus: 'review',
        jobFee: 4200
      }
    ]
  },
  {
    id: 'client-2',
    clientName: 'TechStart Solutions Ltd',
    clientCode: 'O22',
    trigger: null,
    lastInvoiced: '2024-12-01',
    daysSinceLastInvoice: 10,
    activeExpenses: [
      {
        id: 'exp-3',
        description: 'Office supplies',
        submittedBy: 'Mike Wilson',
        amount: 75.25,
        hasAttachment: true,
        dateLogged: '2024-11-30',
        vatPercentage: 23,
        totalAmount: 92.56
      }
    ],
    jobs: [
      {
        id: 'job-3',
        jobName: 'VAT (01/01/2025 - 28/02/2025)',
        jobStatus: 'completed',
        hoursLogged: 1.5,
        wipAmount: 150,
        invoicedToDate: 0,
        toInvoice: 3200,
        lastInvoiced: null,
        daysSinceLastInvoice: null,
        trigger: 'job-closed',
        triggerMet: true,
        actionStatus: 'ready-to-invoice',
        jobFee: 3500
      },
      {
        id: 'job-4',
        jobName: 'Audit - 2024',
        jobStatus: 'active',
        hoursLogged: 10.0,
        wipAmount: 1000,
        invoicedToDate: 1500,
        toInvoice: 1000,
        lastInvoiced: '2024-12-01',
        daysSinceLastInvoice: 10,
        trigger: 'threshold-7500',
        triggerMet: false,
        actionStatus: 'upcoming',
        jobFee: 5000
      }
    ]
  },
  {
    id: 'client-3',
    clientName: 'Green Energy Corp',
    clientCode: 'C141',
    trigger: null,
    lastInvoiced: '2024-11-20',
    daysSinceLastInvoice: 20,
    activeExpenses: [],
    jobs: [
      {
        id: 'job-5',
        jobName: 'Annual Returns - 2024',
        jobStatus: 'active',
        hoursLogged: 10.0,
        wipAmount: 1000,
        invoicedToDate: 0,
        toInvoice: 1500,
        lastInvoiced: null,
        daysSinceLastInvoice: null,
        trigger: 'manual-review',
        triggerMet: false,
        actionStatus: 'review',
        jobFee: 2200
      },
      {
        id: 'job-6',
        jobName: 'Payroll - January 2025',
        jobStatus: 'active',
        hoursLogged: 1.5,
        wipAmount: 150,
        invoicedToDate: 1000,
        toInvoice: 1200,
        lastInvoiced: '2024-11-20',
        daysSinceLastInvoice: 20,
        trigger: 'threshold-5000',
        triggerMet: true,
        actionStatus: 'ready-to-invoice',
        jobFee: 1800
      }
    ]
  },
  {
    id: 'client-4',
    clientName: 'Mary Duffy',
    clientCode: 'O22',
    trigger: 'threshold-7500',
    lastInvoiced: '2024-12-05',
    daysSinceLastInvoice: 6,
    activeExpenses: [
      {
        id: 'exp-4',
        description: 'Meeting room rental',
        submittedBy: 'Lisa Parker',
        amount: 200.00,
        hasAttachment: true,
        dateLogged: '2024-12-03',
        vatPercentage: 23,
        totalAmount: 246.00
      }
    ],
    jobs: [
      {
        id: 'job-7',
        jobName: 'Payroll - W5 2025',
        jobStatus: 'active',
        hoursLogged: 10.0,
        wipAmount: 1250,
        invoicedToDate: 800,
        toInvoice: 1000,
        lastInvoiced: '2024-12-05',
        daysSinceLastInvoice: 6,
        trigger: 'threshold-2500',
        triggerMet: true,
        actionStatus: 'ready-to-invoice',
        jobFee: 1500
      }
    ]
  },
  {
    id: 'client-5',
    clientName: 'Digital Marketing Pro Ltd',
    clientCode: 'D155',
    trigger: null,
    lastInvoiced: '2024-11-30',
    daysSinceLastInvoice: 11,
    activeExpenses: [],
    jobs: [
      {
        id: 'job-8',
        jobName: 'Income Tax Returns - 2024',
        jobStatus: 'active',
        hoursLogged: 1.5,
        wipAmount: 150,
        invoicedToDate: 500,
        toInvoice: 700,
        lastInvoiced: '2024-11-30',
        daysSinceLastInvoice: 11,
        trigger: '30-days',
        triggerMet: false,
        actionStatus: 'upcoming',
        jobFee: 1200
      }
    ]
  },
  {
    id: 'client-6',
    clientName: 'Sarah Murphy',
    clientCode: 'M89',
    trigger: 'bi-monthly',
    lastInvoiced: '2024-12-15',
    daysSinceLastInvoice: 15,
    activeExpenses: [],
    jobs: [
      {
        id: 'job-9',
        jobName: 'VAT (01/03/2025 - 31/03/2025)',
        jobStatus: 'active',
        hoursLogged: 17.5,
        wipAmount: 1750,
        invoicedToDate: 2000,
        toInvoice: 1500,
        lastInvoiced: '2024-12-15',
        daysSinceLastInvoice: 15,
        trigger: 'threshold-2500',
        triggerMet: true,
        actionStatus: 'ready-to-invoice',
        jobFee: 2800
      }
    ]
  },
  {
    id: 'client-7',
    clientName: 'O\'Brien Construction Ltd',
    clientCode: 'B201',
    trigger: null,
    lastInvoiced: '2024-11-25',
    daysSinceLastInvoice: 35,
    activeExpenses: [],
    jobs: [
      {
        id: 'job-10',
        jobName: 'Bookkeeping - Q1 2025',
        jobStatus: 'active',
        hoursLogged: 32.5,
        wipAmount: 3250,
        invoicedToDate: 4000,
        toInvoice: 2500,
        lastInvoiced: '2024-11-25',
        daysSinceLastInvoice: 35,
        trigger: '30-days',
        triggerMet: true,
        actionStatus: 'ready-to-invoice',
        jobFee: 4500
      },
      {
        id: 'job-11',
        jobName: 'Management Accounts - February 2025',
        jobStatus: 'completed',
        hoursLogged: 25.0,
        wipAmount: 2500,
        invoicedToDate: 0,
        toInvoice: 5000,
        lastInvoiced: null,
        daysSinceLastInvoice: null,
        trigger: 'job-closed',
        triggerMet: true,
        actionStatus: 'ready-to-invoice',
        jobFee: 6000
      }
    ]
  },
  {
    id: 'client-8',
    clientName: 'Thompson & Associates',
    clientCode: 'T156',
    trigger: null,
    lastInvoiced: '2024-10-15',
    daysSinceLastInvoice: 55,
    activeExpenses: [],
    jobs: [
      {
        id: 'job-12',
        jobName: 'Corporation Tax Returns - 2024',
        jobStatus: 'active',
        hoursLogged: 40.0,
        wipAmount: 4000,
        invoicedToDate: 6000,
        toInvoice: 2000,
        lastInvoiced: '2024-10-15',
        daysSinceLastInvoice: 55,
        trigger: 'threshold-10000',
        triggerMet: false,
        actionStatus: 'review',
        jobFee: 8500
      }
    ]
  },
  {
    id: 'client-9',
    clientName: 'James Wilson',
    clientCode: 'W78',
    trigger: 'monthly',
    lastInvoiced: '2024-12-20',
    daysSinceLastInvoice: 10,
    activeExpenses: [],
    jobs: [
      {
        id: 'job-13',
        jobName: 'Payroll Services - March 2025',
        jobStatus: 'active',
        hoursLogged: 15.0,
        wipAmount: 1500,
        invoicedToDate: 1500,
        toInvoice: 1500,
        lastInvoiced: '2024-12-20',
        daysSinceLastInvoice: 10,
        trigger: 'bi-monthly',
        triggerMet: false,
        actionStatus: 'upcoming',
        jobFee: 2200
      },
      {
        id: 'job-14',
        jobName: 'VAT Returns - Q4 2024',
        jobStatus: 'completed',
        hoursLogged: 7.5,
        wipAmount: 1500,
        invoicedToDate: 0,
        toInvoice: 1500,
        lastInvoiced: null,
        daysSinceLastInvoice: null,
        trigger: 'job-closed',
        triggerMet: true,
        actionStatus: 'ready-to-invoice',
        jobFee: 1800
      }
    ]
  },
  {
    id: 'client-10',
    clientName: 'Retail Express Group',
    clientCode: 'D123',
    trigger: null,
    lastInvoiced: '2024-11-10',
    daysSinceLastInvoice: 40,
    activeExpenses: [],
    jobs: [
      {
        id: 'job-15',
        jobName: 'Annual Accounts - 2024',
        jobStatus: 'active',
        hoursLogged: 57.5,
        wipAmount: 5750,
        invoicedToDate: 8000,
        toInvoice: 3500,
        lastInvoiced: '2024-11-10',
        daysSinceLastInvoice: 40,
        trigger: '30-days',
        triggerMet: true,
        actionStatus: 'ready-to-invoice',
        jobFee: 12000
      }
    ]
  },
  {
    id: 'client-11',
    clientName: 'Clarke Financial Services',
    clientCode: 'C245',
    trigger: 'threshold-2500',
    lastInvoiced: '2024-12-01',
    daysSinceLastInvoice: 20,
    activeExpenses: [],
    jobs: [
      {
        id: 'job-16',
        jobName: 'Tax Advisory - 2025',
        jobStatus: 'active',
        hoursLogged: 22.5,
        wipAmount: 2250,
        invoicedToDate: 2250,
        toInvoice: 2250,
        lastInvoiced: '2024-12-01',
        daysSinceLastInvoice: 20,
        trigger: 'threshold-2500',
        triggerMet: false,
        actionStatus: 'review',
        jobFee: 3500
      },
      {
        id: 'job-17',
        jobName: 'Compliance Review',
        jobStatus: 'on-hold',
        hoursLogged: 10.0,
        wipAmount: 1000,
        invoicedToDate: 0,
        toInvoice: 2000,
        lastInvoiced: null,
        daysSinceLastInvoice: null,
        trigger: 'manual-review',
        triggerMet: false,
        actionStatus: 'review',
        jobFee: 2500
      }
    ]
  },
  {
    id: 'client-12',
    clientName: 'Sophie Anderson',
    clientCode: 'A890',
    trigger: null,
    lastInvoiced: '2024-12-10',
    daysSinceLastInvoice: 20,
    activeExpenses: [],
    jobs: [
      {
        id: 'job-18',
        jobName: 'Bookkeeping - February 2025',
        jobStatus: 'active',
        hoursLogged: 5.0,
        wipAmount: 1000,
        invoicedToDate: 500,
        toInvoice: 500,
        lastInvoiced: '2024-12-10',
        daysSinceLastInvoice: 20,
        trigger: 'threshold-2500',
        triggerMet: true,
        actionStatus: 'ready-to-invoice',
        jobFee: 1200
      }
    ]
  }
];