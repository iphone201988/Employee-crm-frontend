
interface ServiceRatesTeamMember {
    id?: string;
    name?: string;
    email?: string;
    avatarUrl?: string;
    department?: string;
    defaultRate: number;
    hourlyRate: number;
    isDefaultRateLocked: boolean;
    rates?: {
        accounts: number | string;
        audits: number | string;
        bookkeeping: number | string;
        companySecretarial: number | string;
        payroll: number | string;
        vat: number | string;
        cgt: number | string;
    };
    featureAccess?: {
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