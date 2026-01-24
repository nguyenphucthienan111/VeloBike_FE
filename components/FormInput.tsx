import React from 'react';

interface FormInputProps {
  label: string;
  name: string;
  type?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  error?: string;
  maxLength?: number;
  required?: boolean;
  helperText?: string;
}

export const FormInput: React.FC<FormInputProps> = ({
  label,
  name,
  type = 'text',
  value,
  onChange,
  placeholder,
  error,
  maxLength,
  required = false,
  helperText,
}) => {
  return (
    <div>
      <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-2">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        maxLength={maxLength}
        className={`w-full border px-4 py-3 text-sm rounded-lg focus:outline-none transition-colors ${
          error ? 'border-red-500 focus:border-red-500' : 'border-gray-300 focus:border-black'
        }`}
      />
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
      {helperText && !error && <p className="text-gray-500 text-xs mt-1">{helperText}</p>}
    </div>
  );
};
