"use client";
import { useState, useEffect, ChangeEvent } from "react";

interface SearchCardProps {
  showCategory?: boolean;
  showDate?: boolean;
  categories?: string[];            // Optional override list
  selectedCategory?: string;        // Controlled category value
  selectedDate?: string;            // Controlled date value (YYYY-MM-DD)
  onCategoryChange?: (value: string) => void;
  onDateChange?: (value: string) => void;
}


const DEFAULT_CATEGORIES = [
  'All Categories',
  'University Activities',
  'Social Impact',
  'Environmental',
  'Education'
];

export default function SearchCard({
  showCategory = true,
  showDate = true,
  categories,
  selectedCategory,
  selectedDate,
  onCategoryChange,
  onDateChange
}: SearchCardProps) {
  const [ , setQuery] = useState("");
  const [history, setHistory] = useState<string[]>([]);
  const [internalCategory, setInternalCategory] = useState("All Categories");
  const [internalDate, setInternalDate] = useState("");

  const effectiveCategory = selectedCategory ?? internalCategory;
  const effectiveDate = selectedDate ?? internalDate;
  const categoryList = categories && categories.length ? categories : DEFAULT_CATEGORIES;

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem("searchHistory") || "[]");
    setHistory(saved);
  }, []);
  
  const handleCategoryChange = (e: ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    if (selectedCategory === undefined) setInternalCategory(val);
    onCategoryChange?.(val);
  };

  const handleDateChange = (e: ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (selectedDate === undefined) setInternalDate(val);
    onDateChange?.(val);
  };
  
  return (
    <div className="bg-white shadow-md rounded-lg p-4 space-y-4">

      {/* History */}
      <div className="max-h-20 overflow-y-auto space-y-1">
        {history.map((item, idx) => (
          <p
            key={idx}
            onClick={() => setQuery(item)}
            className="cursor-pointer hover:underline"
          >
            {item}
          </p>
        ))}
      </div>

      <hr />

      {showCategory && (
        <div>
          <label className="block text-sm font-bold text-gray-700">Category</label>
          <select
            value={effectiveCategory}
            onChange={handleCategoryChange}
            className="border p-2 rounded-lg w-full"
          >
            {categoryList.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
      )}

      {showDate && (
        <div>
          <label className="block text-sm font-bold text-gray-700">Date</label>
          <input
            type="date"
            value={effectiveDate}
            onChange={handleDateChange}
            className="border p-2 rounded-lg w-full"
          />
        </div>
      )}
    </div>
  );
}
