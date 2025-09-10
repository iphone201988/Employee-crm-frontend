import { TeamMember as ApiTeamMember } from './APIs/teamApiType';

export interface BaseTeamMember {
  id: string;
  name: string;
  email: string;
  avatarUrl: string;
  department: string;
  defaultRate: number;
  hourlyRate: number;
  isDefaultRateLocked: boolean|any;
  rates: {
    accounts: number | string;
    audits: number | string;
    bookkeeping: number | string;
    companySecretarial: number | string;
    payroll: number | string;
    vat: number | string;
    cgt: number | string;
  };
}

// Service Rates specific interface
export interface ServiceRatesTeamMember extends BaseTeamMember {}

// Approvals specific interface
export interface ApprovalsTeamMember extends BaseTeamMember {
  permissions: {
    approveTimesheets: boolean;
    editServices: boolean;
    editJobBuilder: boolean;
    editJobTemplates: boolean;
  };
}

// Access specific interface
export interface AccessTeamMember extends BaseTeamMember {
  featureAccess: {
    myTimesheet: boolean;
    allTimesheets: boolean;
    timeLogs: boolean;
    WIP: boolean;
    agedWIP: boolean;
    invoices: boolean;
    agedDebtors: boolean;
    writeOff: boolean;
    clientList: boolean;
    clientBreakdown: boolean;
    services: boolean;
    jobTemplates: boolean;
    jobBuilder: boolean;
    jobList: boolean;
    clientExpenses: boolean;
    teamExpenses: boolean;
    reports: boolean;
    teamList: boolean;
    rates: boolean;
    permissions: boolean;
    access: boolean;
    general: boolean;
    invoicing: boolean;
    tags: boolean;
    clientImport: boolean;
    timeLogsImport: boolean;
    integrations: boolean;
  };
}

export const transformToServiceRates = (apiMember: ApiTeamMember): ServiceRatesTeamMember => ({
  id: apiMember._id,
  name: apiMember.name,
  email: apiMember.email,
  avatarUrl: apiMember.avatarUrl || '',
  department: apiMember.department?.name || 'Unknown',
  defaultRate: apiMember.billableRate || apiMember.hourlyRate * 2,
  hourlyRate: apiMember.hourlyRate,
  isDefaultRateLocked: apiMember?.status === 'active' ? true : false,
  rates: {
    accounts: (apiMember as any).accounts || 0,
    audits: (apiMember as any).audits || 0,
    bookkeeping: (apiMember as any).bookkeeping || 0,
    companySecretarial: (apiMember as any).companySecretarial || 0,
    payroll: (apiMember as any).payroll || 0,
    vat: (apiMember as any).vat || 0,
    cgt: (apiMember as any).cgt || 0,
  }
});

export const transformToApprovals = (apiMember: ApiTeamMember): ApprovalsTeamMember => ({
  ...transformToServiceRates(apiMember),
  permissions: {
    approveTimesheets: apiMember.permission?.approveTimesheets || false,
    editServices: apiMember.permission?.editServices || false,
    editJobBuilder: apiMember.permission?.editJobBuilder || false,
    editJobTemplates: apiMember.permission?.editJobTemplates || false,
  }
});

export const transformToAccess = (apiMember: ApiTeamMember): AccessTeamMember => ({
  ...transformToServiceRates(apiMember),
  featureAccess: {
    myTimesheet: (apiMember.featureAccess as any)?.myTimesheet || false,
    allTimesheets: (apiMember.featureAccess as any)?.allTimesheets || false,
    timeLogs: (apiMember.featureAccess as any)?.timeLogs || false,
    WIP: (apiMember.featureAccess as any)?.WIP || false,
    agedWIP: (apiMember.featureAccess as any)?.agedWIP || false,
    invoices: (apiMember.featureAccess as any)?.invoices || false,
    agedDebtors: (apiMember.featureAccess as any)?.agedDebtors || false,
    writeOff: (apiMember.featureAccess as any)?.writeOff || false,
    clientList: (apiMember.featureAccess as any)?.clientList || false,
    clientBreakdown: (apiMember.featureAccess as any)?.clientBreakdown || false,
    services: (apiMember.featureAccess as any)?.services || false,
    jobTemplates: (apiMember.featureAccess as any)?.jobTemplates || false,
    jobBuilder: (apiMember.featureAccess as any)?.jobBuilder || false,
    jobList: (apiMember.featureAccess as any)?.jobList || false,
    clientExpenses: (apiMember.featureAccess as any)?.clientExpenses || false,
    teamExpenses: (apiMember.featureAccess as any)?.teamExpenses || false,
    reports: (apiMember.featureAccess as any)?.reports || false,
    teamList: (apiMember.featureAccess as any)?.teamList || false,
    rates: (apiMember.featureAccess as any)?.rates || false,
    permissions: (apiMember.featureAccess as any)?.permissions || false,
    access: (apiMember.featureAccess as any)?.access || false,
    general: (apiMember.featureAccess as any)?.general || false,
    invoicing: (apiMember.featureAccess as any)?.invoicing || false,
    tags: (apiMember.featureAccess as any)?.tags || false,
    clientImport: (apiMember.featureAccess as any)?.clientImport || false,
    timeLogsImport: (apiMember.featureAccess as any)?.timeLogsImport || false,
    integrations: (apiMember.featureAccess as any)?.integrations || false,
  }
});
