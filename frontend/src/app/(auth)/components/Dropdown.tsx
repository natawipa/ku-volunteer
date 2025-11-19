import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';

interface DropdownProps<T extends string> {
  value: T | '';
  onChange: (value: T) => void;
  options: readonly T[];
  placeholder: string;
  label?: string;
  error?: string;
  className?: string;
  'data-testid'?: string;
}

export function Dropdown<T extends string>({
  value,
  onChange,
  options,
  placeholder,
  label,
  error,
  className = '',
  'data-testid': dataTestId,
}: DropdownProps<T>) {
  const [isOpen, setIsOpen] = useState(false);

  const handleSelect = (option: T) => {
    onChange(option);
    setIsOpen(false);
  };

  return (
    <div className={className}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
        </label>
      )}
      <div className="relative">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          data-testid={dataTestId}
          className="w-full px-4 py-2 border border-gray-200 rounded-lg bg-white flex items-center justify-between text-sm text-gray-700"
        >
          <span className={value ? "text-gray-900" : "text-gray-400"}>
            {value || placeholder}
          </span>
          <ChevronDown className="w-5 h-5 text-gray-400" />
        </button>

        {isOpen && (
          <div
            className="absolute mt-2 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto z-20"
            data-testid={dataTestId ? `${dataTestId}-options` : undefined}
          >
            {options.map((option) => (
              <button
                key={option}
                type="button"
                data-testid={dataTestId ? `${dataTestId}-option-${option}` : undefined}
                onClick={() => handleSelect(option)}
                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                {option}
              </button>
            ))}
          </div>
        )}
      </div>
      {error && (
        <p className="mt-1 text-sm text-red-400">{error}</p>
      )}
    </div>
  );
}