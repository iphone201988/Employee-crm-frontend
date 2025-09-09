

export interface ValidationError {
    field: keyof ClientData;
    message: string;
}

export interface ValidationResult {
    isValid: boolean;
    errors: Partial<Record<keyof ClientData, string>>;
}

export const validateClientRef = (clientRef: string): string | null => {
    if (!clientRef.trim()) {
        return 'Client reference is required';
    }
    if (clientRef.trim().length < 2) {
        return 'Client reference must be at least 2 characters';
    }
    return null;
};

export const validateClientName = (clientName: string): string | null => {
    if (!clientName.trim()) {
        return 'Client name is required';
    }
    if (clientName.trim().length < 2) {
        return 'Client name must be at least 2 characters';
    }
    return null;
};

export const validateBusinessType = (businessType: string): string | null => {
    if (!businessType.trim()) {
        return 'Business type is required';
    }
    return null;
};

export const validateTaxNumber = (taxNumber: string): string | null => {
    if (!taxNumber.trim()) {
        return 'Tax number is required';
    }
    if (!/^[0-9]+$/.test(taxNumber.trim())) {
        return 'Tax number must contain only numbers';
    }
    return null;
};

export const validateCroNumber = (croNumber?: string): string | null => {
    if (croNumber && croNumber.trim() && !/^[0-9]+$/.test(croNumber.trim())) {
        return 'CRO number must contain only numbers';
    }
    return null;
};

export const validateAddress = (address: string): string | null => {
    if (!address.trim()) {
        return 'Address is required';
    }
    if (address.trim().length < 10) {
        return 'Please provide a complete address (at least 10 characters)';
    }
    return null;
};

export const validateContactName = (contactName: string): string | null => {
    if (!contactName.trim()) {
        return 'Contact name is required';
    }
    if (contactName.trim().length < 2) {
        return 'Contact name must be at least 2 characters';
    }
    return null;
};

export const validateEmail = (email: string): string | null => {
    if (!email.trim()) {
        return 'Email address is required';
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
        return 'Please enter a valid email address';
    }
    return null;
};

export const validatePhone = (phone: string): string | null => {
    if (!phone.trim()) {
        return 'Phone number is required';
    }
    if (!/^[\+]?[0-9\s\-\(\)]{10,}$/.test(phone.trim())) {
        return 'Please enter a valid phone number';
    }
    return null;
};

export const validateOnboardedDate = (onboardedDate: Date): string | null => {
    if (!onboardedDate || isNaN(onboardedDate.getTime())) {
        return 'Onboarded date is required';
    }
    if (onboardedDate > new Date()) {
        return 'Onboarded date cannot be in the future';
    }
    return null;
};

export const validateClientForm = (formData: ClientData): ValidationResult => {
    const errors: Partial<Record<keyof ClientData, string>> = {};

    // Validate each field
    const clientRefError = validateClientRef(formData.clientRef);
    if (clientRefError) errors.clientRef = clientRefError;

    const clientNameError = validateClientName(formData.clientName);
    if (clientNameError) errors.clientName = clientNameError;

    const businessTypeError = validateBusinessType(formData.businessType);
    if (businessTypeError) errors.businessType = businessTypeError;

    const taxNumberError = validateTaxNumber(formData.taxNumber);
    if (taxNumberError) errors.taxNumber = taxNumberError;

    const croNumberError = validateCroNumber(formData.croNumber);
    if (croNumberError) errors.croNumber = croNumberError;

    const addressError = validateAddress(formData.address);
    if (addressError) errors.address = addressError;

    const contactNameError = validateContactName(formData.contactName);
    if (contactNameError) errors.contactName = contactNameError;

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
        case 'businessType':
            return validateBusinessType(value);
        case 'taxNumber':
            return validateTaxNumber(value);
        case 'croNumber':
            return validateCroNumber(value);
        case 'address':
            return validateAddress(value);
        case 'contactName':
            return validateContactName(value);
        case 'email':
            return validateEmail(value);
        case 'phone':
            return validatePhone(value);
        case 'onboardedDate':
            return validateOnboardedDate(value);
        default:
            return null;
    }
};
