import React from 'react';
import type { LucideIcon } from 'lucide-react';

interface InputFieldProps {
    icon: LucideIcon;
    label?: string;
    type?: string;
    placeholder?: string;
    required?: boolean;
    value?: string;
    onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
    rightElement?: React.ReactNode;
}

export const InputField = ({
    icon: Icon,
    label,
    type = 'text',
    placeholder,
    required = false,
    value,
    onChange,
    rightElement,
}: InputFieldProps) => (
    <div className="flex flex-col gap-1.5">
        {label && (
            <div className="flex justify-between items-center">
                <label className="text-slate-700 dark:text-slate-300 text-sm font-medium">{label}</label>
                {rightElement}
            </div>
        )}
        <div className="relative">
            <Icon size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
                className="w-full pl-10 pr-4 py-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-600 outline-none transition-all"
                placeholder={placeholder}
                type={type}
                required={required}
                value={value}
                onChange={onChange}
            />
        </div>
    </div>
);
