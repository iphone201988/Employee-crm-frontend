// components/component/Input.tsx

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";

interface IInput {
    label: string;
    id: string;
    type?: 'text' | 'email' | 'tel' | 'date' | 'textarea' | 'checkbox' | 'password' | 'number';
    value?: string | boolean;
    onChange?: (value: string | boolean) => void;
    placeholder?: string;
    required?: boolean;
    className?: string;
    error?: string;
    autoComplete?: string; // Added for completeness
    onFocus?: () => void;   // <<< --- ADD THIS LINE ---
}

const InputComponent = ({
    label,
    id,
    type = 'text',
    value,
    onChange,
    placeholder,
    required = false,
    className = "",
    error,
    autoComplete,
    onFocus, // <<< --- ADD THIS LINE ---
}: IInput) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        if (type === 'checkbox') {
            onChange?.((e.target as HTMLInputElement).checked);
        } else {
            onChange?.(e.target.value);
        }
    };

    if (type === 'textarea') {
        return (
            <div className={className}>
                <Label htmlFor={id} className="text-sm font-medium">
                    {label} {required && <span className="text-red-500">*</span>}
                </Label>
                <Textarea
                    id={id}
                    value={value as string || ''}
                    onChange={handleChange}
                    placeholder={placeholder}
                    required={required}
                    className={`mt-1 ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
                    autoComplete={autoComplete}
                />
                {error && (
                    <p className="mt-1 text-sm text-red-600">{error}</p>
                )}
            </div>
        );
    }

    if (type === 'checkbox') {
        return (
            <div className={className}>
                <div className="flex items-center space-x-2">
                    <Checkbox
                        id={id}
                        checked={value as boolean || false}
                        onCheckedChange={(checked) => onChange?.(checked as boolean)}
                        className={error ? 'border-red-500' : ''}
                    />
                    <Label htmlFor={id} className="text-sm font-medium cursor-pointer">
                        {label}
                    </Label>
                </div>
                {error && (
                    <p className="mt-1 text-sm text-red-600">{error}</p>
                )}
            </div>
        );
    }

    return (
        <div className={className}>
            <Label htmlFor={id} className="text-sm font-medium">
                {label} {required && <span className="text-red-500">*</span>}
            </Label>
            <Input
                id={id}
                type={type}
                value={value as string || ''}
                onChange={handleChange}
                placeholder={placeholder}
                required={required}
                className={`mt-1 ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
                autoComplete={autoComplete}
                onFocus={onFocus} // <<< --- ADD THIS LINE ---
            />
            {error && (
                <p className="mt-1 text-sm text-red-600">{error}</p>
            )}
        </div>
    );
};

export default InputComponent;
