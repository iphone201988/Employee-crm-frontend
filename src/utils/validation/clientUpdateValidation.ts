// src/utils/clientValidation.ts

export interface ClientData {
    clientRef: string;
    name: string;
    businessTypeId: any;
    taxNumber: string;
    croNumber?: string;
    croLink?: string;
    clientManagerId?: string;
    address: string;
    email: string;
    phone: string;
    onboardedDate: Date | string;
    clientStatus?: string;
    yearEnd?: string;
    arDate?: Date | string;
}

export interface ValidationResult {
    isValid: boolean;
    errors: Partial<Record<keyof ClientData, string>>;
}

export const validateClientRef = (clientRef: string): string | null => {
    if (!clientRef || !clientRef.trim()) return 'Client reference is required';
    if (clientRef.trim().length < 2) return 'Client reference must be at least 2 characters';
    return null;
};

export const validateClientName = (name: string): string | null => {
    if (!name || !name.trim()) return 'Client name is required';
    if (name.trim().length < 2) return 'Client name must be at least 2 characters';
    return null;
};

export const validateBusinessType = (businessTypeId: string): string | null => {
    if (!businessTypeId) return 'Business type is required';
    return null;
};

export const validateTaxNumber = (taxNumber: string): string | null => {
    // TAX/PPS NO is optional, only validate format if provided
    if (!taxNumber || !taxNumber.trim() || taxNumber.trim() === 'N/A') {
        return null;
    }
    if (!/^[a-zA-Z0-9]+$/.test(taxNumber.trim())) return 'Tax number format is invalid.';
    return null;
};

export const validateCroNumber = (croNumber?: string): string | null => {
    // CRO Number is optional, only validate format if provided
    if (croNumber && croNumber.trim() && croNumber.trim() !== 'N/A' && !/^[a-zA-Z0-9]+$/.test(croNumber.trim())) {
        return 'CRO number must contain only letters and numbers';
    }
    return null;
};

export const validateAddress = (address: string): string | null => {
    // Address is optional, no validation needed
    return null;
};


export const validateEmail = (email: string): string | null => {
    // Email is optional, only validate format if provided
    if (email && email.trim() && email.trim() !== 'N/A' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
        return 'Please enter a valid email address';
    }
    return null;
};

export const validatePhone = (phone: string): string | null => {
    // Phone is optional, only validate format if provided
    if (phone && phone.trim() && phone.trim() !== 'N/A' && !/^[\+]?[0-9\s\-\(\)]{10,}$/.test(phone.trim())) {
        return 'Please enter a valid phone number';
    }
    return null;
};

export const validateOnboardedDate = (onboardedDate: Date | string | null | undefined): string | null => {
    // Onboarded Date is optional, only validate if provided
    if (!onboardedDate) return null;
    const date = new Date(onboardedDate);
    if (isNaN(date.getTime())) return 'Invalid date format';
    if (date > new Date()) return 'Onboarded date cannot be in the future';
    return null;
};

export const validateClientForm = (formData: Partial<ClientData>): ValidationResult => {
    const errors: Partial<Record<keyof ClientData, string>> = {};

    // Only validate required fields
    if (validateClientName(formData.name || '')) errors.name = validateClientName(formData.name || '');
    if (validateBusinessType(formData.businessTypeId || '')) errors.businessTypeId = validateBusinessType(formData.businessTypeId || '');
    
    // Validate optional fields only if they have values
    const taxNumberError = validateTaxNumber(formData.taxNumber || '');
    if (taxNumberError) errors.taxNumber = taxNumberError;
    
    const croNumberError = validateCroNumber(formData.croNumber || '');
    if (croNumberError) errors.croNumber = croNumberError;
    
    // Address, email, phone are optional - only validate format if provided
    const addressError = validateAddress(formData.address || '');
    if (addressError) errors.address = addressError;
    
    const emailError = validateEmail(formData.email || '');
    if (emailError) errors.email = emailError;
    
    const phoneError = validatePhone(formData.phone || '');
    if (phoneError) errors.phone = phoneError;
    
    const onboardedDateError = validateOnboardedDate(formData.onboardedDate);
    if (onboardedDateError) errors.onboardedDate = onboardedDateError;

    return {
        isValid: Object.keys(errors).length === 0,
        errors,
    };
};
