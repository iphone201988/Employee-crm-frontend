// components/DateOrNAInput.tsx

import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface DateOrNAInputProps {
    label: string;
    id: string;
    value: Date | null | undefined;
    onChange: (value: Date | null | undefined) => void;
    error?: string;
    disabled?: boolean;
}

// Helper to format date for display and input
const formatDateForInput = (date: Date | null | undefined): string => {
    if (!date) return '';
    try {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
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
        onChange(undefined);
        setIsDateInput(false);
    };
    
    const displayValue = value ? formatDateForInput(value) : '';

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!isDateInput) return;
        const pickedValue = e.target.value;
        if (!pickedValue) {
            onChange(undefined);
            return;
        }
        const parsed = new Date(`${pickedValue}T00:00:00`);
        if (isNaN(parsed.getTime())) {
            onChange(undefined);
            return;
        }
        onChange(parsed);
    };

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
                    onChange={handleChange}
                    onFocus={handleFocus}
                    onBlur={handleBlur}
                    readOnly={!isDateInput}
                    placeholder="Select a date or choose N/A"
                    disabled={disabled}
                    className={error ? 'border-red-500' : ''}
                />
                {!isDateInput && value && (
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
