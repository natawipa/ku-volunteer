"use client";

import { useState, useRef, useEffect } from "react";
import { X } from "lucide-react";
import { CategorySelectProps, categories } from "../types";

export default function CategorySelect({ value, onChange }: CategorySelectProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleCategory = (option: string) => {
    if (value.includes(option)) {
      onChange(value.filter((o) => o !== option));
    } else if (value.length < 3) {
      onChange([...value, option]);
    }
  };

  const removeCategory = (option: string) => {
    onChange(value.filter((o) => o !== option));
  };

  return (
    <div className="flex flex-col text-sm space-y-2 relative" ref={ref}>

      <div
        className="border border-gray-400 rounded-lg p-2 flex flex-wrap gap-2 cursor-pointer min-h-[48px] bg-white"
        onClick={() => setOpen(!open)}
        data-testid="category-dropdown-toggle"
      >
        {value.length === 0 && (
          <span className="text-gray-400">Select up to 3 categories</span>
        )}

        {value.map((cat) => (
          <span
            key={cat}
            className="flex items-center bg-yellow-200 text-black px-3 py-1 rounded-full text-sm"
          >
            {cat}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                removeCategory(cat);
              }}
              className="ml-2 text-black hover:text-red-600"
            >
              <X size={14} />
            </button>
          </span>
        ))}
      </div>

      {open && (
        <div className="absolute top-full left-0 mt-2 w-full border border-gray-400 rounded-lg bg-white shadow-md max-h-60 overflow-y-auto z-20">
          {categories.map((cat, idx) => (
            <div key={idx} className="border-b border-gray-400 last:border-none">
              <div
                className={`px-3 py-2 ${
                  cat.selectable
                    ? "cursor-pointer hover:bg-green-200"
                    : "font-medium"
                }`}
                onClick={() =>
                  cat.selectable ? toggleCategory(cat.label) : undefined
                }
                data-testid={`category-${cat.label.toLowerCase().replace(/\s+/g, '-')}`}
              >
                {cat.label}
              </div>
              {cat.children && (
                <div className="px-5 py-2 space-y-1">
                  {cat.children.map((child) => (
                    <div
                      key={child.label}
                      className={`px-2 py-1 rounded cursor-pointer ${
                        value.includes(child.label)
                          ? "bg-green-600 text-white"
                          : "hover:bg-green-200"
                      }`}
                      onClick={() => toggleCategory(child.label)}
                      data-testid={`category-${child.label.toLowerCase().replace(/\s+/g, '-')}`}
                    >
                      {child.label}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}