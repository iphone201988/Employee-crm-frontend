// src/utils/teamMemberValidation.ts

export interface TeamMemberData {
    name: string;
    email: string;
    departmentId: string;
    avatarUrl: string;
    hourlyRate: number | string;
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

export interface ValidationResult {
    isValid: boolean;
    errors: Partial<Record<keyof TeamMemberData, string>>;
}

export const validateTeamMemberName = (name: string): string | null => {
    if (!name || !name.trim()) {
        return 'Team member name is required';
    }
    if (name.trim().length < 2) {
        return 'Name must be at least 2 characters';
    }
    return null;
};

export const validateEmail = (email: string): string | null => {
    if (!email || !email.trim()) {
        return 'Email address is required';
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
        return 'Please enter a valid email address';
    }
    return null;
};

export const validateDepartment = (departmentId: string): string | null => {
    if (!departmentId) {
        return 'Department is required';
    }
    return null;
};

export const validateAvatar = (avatarUrl: string): string | null => {
    if (!avatarUrl) {
        return 'Profile image is required. Please upload one.';
    }
    return null;
};

export const validateHourlyRate = (hourlyRate: number | string): string | null => {
    const rate = Number(hourlyRate);
    if (isNaN(rate) || rate < 0) {
        return 'Hourly rate must be a non-negative number.';
    }
    return null;
};

export const validateTeamMemberForm = (formData: TeamMemberData): ValidationResult => {
    const errors: Partial<Record<keyof TeamMemberData, string>> = {};

    const nameError = validateTeamMemberName(formData.name);
    if (nameError) errors.name = nameError;

    const emailError = validateEmail(formData.email);
    if (emailError) errors.email = emailError;

    const departmentError = validateDepartment(formData.departmentId);
    if (departmentError) errors.departmentId = departmentError;

    const avatarError = validateAvatar(formData.avatarUrl);
    if (avatarError) errors.avatarUrl = avatarError;

    const hourlyRateError = validateHourlyRate(formData.hourlyRate);
    if (hourlyRateError) errors.hourlyRate = hourlyRateError;

    return {
        isValid: Object.keys(errors).length === 0,
        errors,
    };
};
