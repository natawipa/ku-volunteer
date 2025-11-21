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
  const dataTestId = props['data-testid'];
  const inputErrorId = dataTestId ? `${dataTestId}-error` : undefined;
  const fieldId = props.id;
  const fieldErrorId = fieldId ? `${fieldId}-error` : undefined;
  
  return (
    <div className={className}>
      <label htmlFor={props.id} className="block text-sm font-medium text-gray-700 mb-2">
        {label}
      </label>
      <input
        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all duration-200 placeholder-gray-400"
        aria-describedby={error ? (inputErrorId || fieldErrorId) : undefined}
        {...register}
        {...props}
      />
      {error && (
        <p 
          id={inputErrorId || fieldErrorId}
          className="text-red-400 text-sm mt-1" 
          role="alert"
          data-testid={inputErrorId || (fieldId ? `${fieldId}-error` : undefined)}
        >
          {error}
        </p>
      )}
    </div>
  );
}