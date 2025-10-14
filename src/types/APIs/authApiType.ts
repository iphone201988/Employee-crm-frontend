export interface User {
  _id: string;
  name: string;
  email: string;
  status: string;
  role: string;
  hourlyRate: number;
  billableRate: number;
  isLocked: boolean;
  workSchedule: {
    monday: number;
    tuesday: number;
    wednesday: number;
    thursday: number;
    friday: number;
    saturday: number;
    sunday: number;
  };
  companyId: string;
  serviceFees: any[];
  JobFees: any[];
  createdAt: string;
  updatedAt: string;
  __v: number;
  passwordResetToken: string;
  deviceToken: string;
  deviceType: string | null;
  jti: string;
  jobFees: any[];
  rate: number;
  permissions: {
    _id: string;
    userId: string;
    companyId: string;
    approveTimesheets: boolean;
    editServices: boolean;
    editJobBuilder: boolean;
    editJobTemplates: boolean;
    __v: number;
  };
  features: {
    _id: string;
    userId: string;
    companyId: string;
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
    jobImport: boolean;
    timeLogsImport: boolean;
    integrations: boolean;
    __v: number;
  };
  settings: {
    _id: string;
    companyId: string;
    autoApproveTimesheets: boolean;
    wipWarningPercentage: number;
    __v: number;
  }[];
}

export interface GetCurrentUserResponse {
  success: boolean;
  message: string;
  data: User;
}

export interface LoginResponse {
  token: string;
  user: User;
}

export interface LoginRequest {
  email: string;
  password: string;
}