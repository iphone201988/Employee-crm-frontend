
interface ServiceRatesTeamMember {
    id: string;
    name: string;
    email: string;
    avatarUrl: string;
    department: string;
    defaultRate: number;
    hourlyRate: number;
    isDefaultRateLocked: boolean;
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