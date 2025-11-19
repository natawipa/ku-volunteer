import React from 'react';
import { UseFormRegisterReturn } from 'react-hook-form';

interface FormFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  register?: UseFormRegisterReturn;
  className?: string;
  'data-testid'?: string;
}

export function FormField({ label, error, register, className = '', ...props }: FormFieldProps) {
  return (
    <div className={className}>
      <label htmlFor={props.id} className="block text-sm font-medium text-gray-700 mb-2">
        {label}
      </label>
      <input
        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all duration-200 placeholder-gray-400"
        {...register}
        {...props}
      />
      {error && <p className="text-red-400 text-sm mt-1" data-testid={props['data-testid'] ? `${props['data-testid']}-error` : undefined}>{error}</p>}
    </div>
  );
}