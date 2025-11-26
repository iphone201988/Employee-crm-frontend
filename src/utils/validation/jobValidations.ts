// src/utils/jobValidation.ts

export interface JobFormData {
    name: string;
    clientId: string;
    clientName: string;
    jobTypeId: string;
    startDate: string;
    endDate: string;
    jobCost?: number;
    jobManagerId: string;
    teamMembers?: string[];
    description?: string;
}

export interface ValidationResult {
    isValid: boolean;
    errors: Partial<Record<keyof JobFormData | 'teamMembers', string>>;
}

export const validateJobName = (name: string): string | null => {
    if (!name.trim()) return 'Job name is required.';
    if (name.trim().length < 3) return 'Job name must be at least 3 characters.';
    return null;
};

export const validateClient = (clientId: string, clientName: string, clientList: { _id: string, name: string }[]): string | null => {
    if (!clientName.trim()) return 'Client name is required.';
    if (!clientId) return 'Please select a valid client from the suggestions.';
    const isValidClient = clientList.some(client => client._id === clientId && client.name === clientName);
    if (!isValidClient) return 'The selected client is not valid.';
    return null;
};

export const validateJobType = (jobTypeId: string): string | null => {
    if (!jobTypeId) return 'Job type is required.';
    return null;
};

export const validateJobManager = (jobManagerId: string): string | null => {
    if (!jobManagerId) return 'Job manager is required.';
    return null;
};

export const validateStartDate = (startDate: string): string | null => {
    if (!startDate) return 'Start date is required.';
    if (isNaN(new Date(startDate).getTime())) return 'Invalid start date format.';
    return null;
};

export const validateEndDate = (endDate: string, startDate: string): string | null => {
    if (!endDate) return 'End date is required.';
    if (isNaN(new Date(endDate).getTime())) return 'Invalid end date format.';
    if (startDate && new Date(endDate) < new Date(startDate)) {
        return 'End date cannot be before the start date.';
    }
    return null;
};

export const validateJobCost = (jobCost?: number): string | null => {
    if (jobCost === undefined || jobCost === null) return 'Job fee is required.';
    if (typeof jobCost !== 'number' || isNaN(jobCost) || jobCost < 0) {
        return 'Job fee must be a non-negative number.';
    }
    // Allow 0 as a valid value
    return null;
};

export const validateTeamMembers = (teamMembers?: string[]): string | null => {
    if (!teamMembers || !Array.isArray(teamMembers) || teamMembers.length === 0) {
        return 'At least one team member is required.';
    }
    return null;
};

export const validateJobForm = (formData: JobFormData, clientList: { _id: string, name: string }[]): ValidationResult => {
    const errors: Partial<Record<keyof JobFormData | 'teamMembers', string>> = {};

    const nameError = validateJobName(formData.name);
    if (nameError) errors.name = nameError;

    const clientError = validateClient(formData.clientId, formData.clientName, clientList);
    if (clientError) errors.clientName = clientError;

    const jobTypeError = validateJobType(formData.jobTypeId);
    if (jobTypeError) errors.jobTypeId = jobTypeError;

    const jobManagerError = validateJobManager(formData.jobManagerId);
    if (jobManagerError) errors.jobManagerId = jobManagerError;

    const startDateError = validateStartDate(formData.startDate);
    if (startDateError) errors.startDate = startDateError;

    const endDateError = validateEndDate(formData.endDate, formData.startDate);
    if (endDateError) errors.endDate = endDateError;

    const jobCostError = validateJobCost(formData.jobCost);
    if (jobCostError) errors.jobCost = jobCostError;

    const teamMembersError = validateTeamMembers(formData.teamMembers);
    if (teamMembersError) errors.teamMembers = teamMembersError;

    // Description is optional, no validation needed

    return {
        isValid: Object.keys(errors).length === 0,
        errors,
    };
};
