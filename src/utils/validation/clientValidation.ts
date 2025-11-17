

export interface ValidationError {
    field: keyof ClientData;
    message: string;
}

export interface ValidationResult {
    isValid: boolean;
    errors: Partial<Record<keyof ClientData, string>>;
}

export const validateClientRef = (clientRef: string): string | null => {
    // Client Ref is optional, no validation needed
    return null;
};

export const validateClientName = (clientName: string): string | null => {
    if (!clientName || !clientName.trim()) {
        return 'Client name is required';
    }
    if (clientName.trim().length < 2) {
        return 'Client name must be at least 2 characters';
    }
    return null;
};

export const validateBusinessType = (businessType: string): string | null => {
    if (!businessType || !businessType.trim()) {
        return 'Business type is required';
    }
    return null;
};

export const validateTaxNumber = (taxNumber: string): string | null => {
    if (!taxNumber || !taxNumber.trim()) {
        return 'Tax number is required';
    }
   
    return null;
};

export const validateCroNumber = (croNumber?: string): string | null => {
    // CRO Number is optional, only validate format if provided
    if (croNumber && croNumber.trim() && croNumber.trim() !== 'N/A' && !/^[0-9]+$/.test(croNumber.trim())) {
        return 'CRO number must contain only numbers';
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

export const validateOnboardedDate = (onboardedDate: Date): string | null => {
    // Onboarded Date is optional, only validate if provided
    if (onboardedDate && !isNaN(onboardedDate.getTime()) && onboardedDate > new Date()) {
        return 'Onboarded date cannot be in the future';
    }
    return null;
};

// Helper function to convert empty values to "N/A"
export const convertEmptyToNA = (value: string | undefined | null): string => {
    if (!value || value.trim() === '') {
        return 'N/A';
    }
    return value.trim();
};

export const validateClientForm = (formData: ClientData): ValidationResult => {
    const errors: Partial<Record<keyof ClientData, string>> = {};

    // Only validate required fields: name, businessTypeId, taxNumber
    const clientNameError = validateClientName(formData.name);
    if (clientNameError) errors.name = clientNameError;

    const businessTypeError = validateBusinessType(formData.businessTypeId);
    if (businessTypeError) errors.businessTypeId = businessTypeError;

    const taxNumberError = validateTaxNumber(formData.taxNumber);
    if (taxNumberError) errors.taxNumber = taxNumberError;

    // Validate optional fields only if they have values
    const croNumberError = validateCroNumber(formData.croNumber);
    if (croNumberError) errors.croNumber = croNumberError;

    const emailError = validateEmail(formData.email);
    if (emailError) errors.email = emailError;

    const phoneError = validatePhone(formData.phone);
    if (phoneError) errors.phone = phoneError;

    const onboardedDateError = validateOnboardedDate(formData.onboardedDate);
    if (onboardedDateError) errors.onboardedDate = onboardedDateError;

    return {
        isValid: Object.keys(errors).length === 0,
        errors
    };
};

export const validateSingleField = (field: keyof ClientData, value: any): string | null => {
    switch (field) {
        case 'clientRef':
            return validateClientRef(value);
        case 'clientName':
            return validateClientName(value);
        case 'businessTypeId':
            return validateBusinessType(value);
        case 'taxNumber':
            return validateTaxNumber(value);
        case 'croNumber':
            return validateCroNumber(value);
        case 'address':
            return validateAddress(value);
        case 'email':
            return validateEmail(value);
        case 'phone':
            return validatePhone(value);
        // case 'onboardedDate':
        //     return validateOnboardedDate(value);
        default:
            return null;
    }
};


