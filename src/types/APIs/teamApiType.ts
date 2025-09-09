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
    status: 'active' | 'inactive';
    avatarUrl: string;
    role: 'team' | 'admin'; // Or other roles
    departmentId: string;
    hourlyRate: number;
    billableRate: number;
    workSchedule: WorkSchedule;
    createdAt: string;
    updatedAt: string;
    __v: number;
    department: Department;
    featureAccess: FeatureAccess;
    permission: Permission;
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
    // Add other feature access flags as needed...
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
    page: number;
    limit: number;
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
    data?: any; // You can make this more specific based on your API response
}