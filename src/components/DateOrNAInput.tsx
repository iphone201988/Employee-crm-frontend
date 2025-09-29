// components/DateOrNAInput.tsx

import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface DateOrNAInputProps {
    label: string;
    id: string;
    value: string | Date | null;
    onChange: (value: string | Date | null) => void;
    error?: string;
    disabled?: boolean;
}

// Helper to format date for display and input
const formatDateForInput = (date: string | Date | null): string => {
    if (!date || date === 'N/A') return '';
    try {
        const d = new Date(date);
        // Check if date is valid
        if (isNaN(d.getTime())) return '';
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    } catch {
        return '';
    }
};

export const DateOrNAInput: React.FC<DateOrNAInputProps> = ({
    label,
    id,
    value,
    onChange,
    error,
    disabled,
}) => {
    const [isDateInput, setIsDateInput] = useState(false);

    const handleFocus = () => {
        // Switch to date picker on focus
        setIsDateInput(true);
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
        // If the input is empty after focus, it means the user might want N/A or nothing
        if (!e.target.value) {
            setIsDateInput(false);
        }
    };

    const handleClear = () => {
        onChange('N/A');
        setIsDateInput(false);
    };
    
    // The value to display in the input field
    const displayValue = value === 'N/A' ? 'N/A' : formatDateForInput(value);

    return (
        <div>
            <Label htmlFor={id} className="text-sm font-medium">
                {label}
            </Label>
            <div className="relative mt-1">
                <Input
                    id={id}
                    type={isDateInput ? 'date' : 'text'}
                    value={isDateInput ? formatDateForInput(value) : displayValue}
                    onChange={(e) => onChange(e.target.value)}
                    onFocus={handleFocus}
                    onBlur={handleBlur}
                    placeholder="Select a date or choose N/A"
                    disabled={disabled}
                    className={error ? 'border-red-500' : ''}
                />
                {!isDateInput && value !== 'N/A' && (
                     <button
                        type="button"
                        onClick={handleClear}
                        className="absolute inset-y-0 right-0 flex items-center pr-3 text-sm text-gray-500 hover:text-gray-700"
                        aria-label="Not Applicable"
                    >
                        N/A
                    </button>
                )}
            </div>
            {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
        </div>
    );
};
