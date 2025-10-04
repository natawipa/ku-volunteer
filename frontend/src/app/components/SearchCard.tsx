"use client";
import { useState, useEffect, ChangeEvent } from "react";

interface SearchCardProps {
  showCategory?: boolean;
  showDate?: boolean;
  categories?: string[];            // Optional override list
  query?: string;                   // Search query text
  setQuery?: (query: string) => void;
  category?: string;                // Selected category
  setCategory?: (category: string) => void;
  date?: string;                    // Selected date (YYYY-MM-DD)
  setDate?: (date: string) => void;
  onKeyDown?: (e: React.KeyboardEvent) => void; // Key down handler for input fields
  onApply?: () => void;            // Called when search is applied
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
  query = "",
  setQuery = () => {},
  category = "All Categories",
  setCategory = () => {},
  date = "",
  setDate = () => {},
  onApply = () => {}
}: SearchCardProps) {
  const [history, setHistory] = useState<string[]>([]);
  const categoryList = categories && categories.length ? categories : DEFAULT_CATEGORIES;

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem("searchHistory") || "[]");
    setHistory(saved);
  }, []);
  
  const handleCategoryChange = (e: ChangeEvent<HTMLSelectElement>) => {
    setCategory(e.target.value);
  };

  const handleDateChange = (e: ChangeEvent<HTMLInputElement>) => {
    setDate(e.target.value);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      onApply();
    }
  };
  
  return (
    <div className="bg-white shadow-md rounded-lg p-4 space-y-4">

      {/* History */}
      {history.length > 0 && (
        <>
          <div className="max-h-20 overflow-y-auto space-y-1">
            {history.map((item, idx) => (
              <p
                key={idx}
                onClick={() => setQuery(item)}
                className="cursor-pointer hover:underline text-gray-600"
              >
                {item}
              </p>
            ))}
          </div>
          <hr />
        </>
      )}

      {showCategory && (
        <div>
          <label className="block text-sm font-bold text-gray-700">Category</label>
          <select
            value={category}
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
          <div className="space-y-2">
            <input
              type="date"
              value={date}
              onChange={handleDateChange}
              onKeyDown={handleKeyDown}
              className="border p-2 rounded-lg w-full"
              min="2023-01-01"
              max="2026-12-31"
            />
            <p className="text-xs text-gray-500">
              Shows events that are active on this date (between start and end dates)
            </p>
          </div>
        </div>
      )}

      {/* Apply button */}
      <button
        onClick={onApply}
        className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors"
      >
        Search
      </button>
    </div>
  );
}
