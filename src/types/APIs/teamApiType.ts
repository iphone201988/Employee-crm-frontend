export interface AddTeamMemberRequest {
    name: string;
    email: string;
    departmentId: string;
    avatarUrl?: string; 
    workSchedule: {
        monday: number;
        tuesday: number;
        wednesday: number;
        thursday: number;
        friday: number;
        saturday: number;
        sunday: number;
    };
    hourlyRate: number;
    billableRate?: number;
}

export interface AddTeamMemberResponse {
    success: boolean;
    message: string;
    data: {};
}

export interface UploadImageResponse {
    success: boolean;
    message: string;
    fileUrl: string; 
}


export interface TeamMember {
    _id: string;
    name: string;
    email: string;
    status: 'active' | 'inActive';
    avatarUrl: string;
    role: 'team' | 'admin'; // Or other roles
    departmentId: string;
    hourlyRate: number;
    billableRate: number;
    accounts: number;
    audits: number;
    bookkeeping: number;
    payroll: number;
    vat: number;
    companySecretarial: number;
    cgt: number;
    workSchedule: WorkSchedule;
    createdAt: string;
    updatedAt: string;
    __v: number;
    department: Department;
    featureAccess: FeatureAccess;
    permission: Permission;
    companyId: string;
    myTimeLogs: boolean;
}

interface WorkSchedule {
    monday: number;
    tuesday: number;
    wednesday: number;
    thursday: number;
    friday: number;
    saturday: number;
    sunday: number;
}

interface Department {
    _id: string;
    name: string;
    __v: number;
}

interface FeatureAccess {
    _id: string;
    userId: string;
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
    __v: number;
}

interface Permission {
    _id: string;
    userId: string;
    approveTimesheets: boolean;
    editServices: boolean;
    editJobBuilder: boolean;
    editJobTemplates: boolean;
    __v: number;
}


export interface GetAllTeamMembersRequest {
    page?: number;
    limit?: number;
    search?: string;
    departmentType?: string;
}

export interface GetAllTeamMembersResponse {
  success: boolean;
  message: string;
  data: {
    teamMembers: TeamMember[];
    pagination: {
      total: number;
      totalPages: number;
    };
  };
}

export interface UpdateTeamMembersResponse {
    success: boolean;
    message: string;
    data: {};
}
export interface UpdateTeamMembersRequest {
    rates?: RateUpdate[];
    permissions?: PermissionUpdate[];
    featureAccess?: FeatureAccessUpdate[];
    blukWeeklyHours?: WeeklyHoursUpdate[];
    singleTeamMenber?: SingleMemberUpdate;
}
export interface WeeklyHoursUpdate {
    userId: string;
    workSchedule: {
        monday: number;
        tuesday: number;
        wednesday: number;
        thursday: number;
        friday: number;
        saturday: number;
        sunday: number;
    };
}
export interface RateUpdate { userId: string; [key: string]: any; }
export interface PermissionUpdate { userId: string; [key: string]: any; }
export interface FeatureAccessUpdate { userId: string; [key: string]: any; }
export interface SingleMemberUpdate { userId: string; [key: string]: any; }

export interface SendInviteRequest {
    email: string;
}

export interface SendInviteResponse {
    success: boolean;
    message: string;
    data?: any;
}

export interface AddCompanyRequest {
    name: string;
    email: string;
    avatarUrl: string;
}


export interface AddCompanyResponse {
    success: boolean;
    message: string;
    data?: any;
}

// In ../types/APIs/teamApiType.ts

// Type for the arguments of the new query
export interface GetAllCompanyMembersRequest {
    page: number;
    limit: number;
    search?: string;
}

// Types for the nested objects in the response






export interface CompanyMember {
    _id: string;
    name: string;
    email: string;
    status: string;
    avatarUrl: string;
    role: string;
    hourlyRate: number;
    billableRate: number;
    isLocked: boolean;
    workSchedule: WorkSchedule;
    companyId: string;
    serviceFees: any[];
    createdAt: string;
    updatedAt: string;
    __v: number;
    featureAccess: FeatureAccess;
    permission: Permission;
}

export interface Pagination {
    total: number;
    totalPages: number;
}

// The main response type for the new endpoint
export interface GetAllCompanyMembersResponse {
    success: boolean;
    message: string;
    data: {
        companyMembers: CompanyMember[];
        pagination: Pagination;
    };
}

// ... other existing types
