// src/utils/clientValidation.ts

export interface ClientData {
    clientRef: string;
    name: string;
    businessTypeId: any;
    taxNumber: string;
    croNumber?: string;
    address: string;
    contactName: string;
    email: string;
    phone: string;
    onboardedDate: Date | string;
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
    if (!taxNumber || !taxNumber.trim()) return 'Tax number is required';
    if (!/^[a-zA-Z0-9]+$/.test(taxNumber.trim())) return 'Tax number format is invalid.';
    return null;
};

export const validateCroNumber = (croNumber?: string): string | null => {
    if (croNumber && croNumber.trim() && !/^[0-9]+$/.test(croNumber.trim())) {
        return 'CRO number must contain only numbers';
    }
    return null;
};

export const validateAddress = (address: string): string | null => {
    if (!address || !address.trim()) return 'Address is required';
    if (address.trim().length < 10) return 'Please provide a complete address (at least 10 characters)';
    return null;
};

export const validateContactName = (contactName: string): string | null => {
    if (!contactName || !contactName.trim()) return 'Contact name is required';
    return null;
};

export const validateEmail = (email: string): string | null => {
    if (!email || !email.trim()) return 'Email address is required';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return 'Please enter a valid email address';
    return null;
};

export const validatePhone = (phone: string): string | null => {
    if (!phone || !phone.trim()) return 'Phone number is required';
    if (!/^[\+]?[0-9\s\-\(\)]{10,}$/.test(phone.trim())) return 'Please enter a valid phone number';
    return null;
};

export const validateOnboardedDate = (onboardedDate: Date | string): string | null => {
    if (!onboardedDate) return 'Onboarded date is required';
    const date = new Date(onboardedDate);
    if (isNaN(date.getTime())) return 'Invalid date format';
    if (date > new Date()) return 'Onboarded date cannot be in the future';
    return null;
};

export const validateClientForm = (formData: Partial<ClientData>): ValidationResult => {
    const errors: Partial<Record<keyof ClientData, string>> = {};

    if (validateClientRef(formData.clientRef || '')) errors.clientRef = validateClientRef(formData.clientRef || '');
    if (validateClientName(formData.name || '')) errors.name = validateClientName(formData.name || '');
    if (validateBusinessType(formData.businessTypeId || '')) errors.businessTypeId = validateBusinessType(formData.businessTypeId || '');
    if (validateTaxNumber(formData.taxNumber || '')) errors.taxNumber = validateTaxNumber(formData.taxNumber || '');
    if (validateCroNumber(formData.croNumber || '')) errors.croNumber = validateCroNumber(formData.croNumber || '');
    if (validateAddress(formData.address || '')) errors.address = validateAddress(formData.address || '');
    if (validateContactName(formData.contactName || '')) errors.contactName = validateContactName(formData.contactName || '');
    if (validateEmail(formData.email || '')) errors.email = validateEmail(formData.email || '');
    if (validatePhone(formData.phone || '')) errors.phone = validatePhone(formData.phone || '');
    if (validateOnboardedDate(formData.onboardedDate || '')) errors.onboardedDate = validateOnboardedDate(formData.onboardedDate || '');

    return {
        isValid: Object.keys(errors).length === 0,
        errors,
    };
};
