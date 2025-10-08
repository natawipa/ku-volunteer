"use client";
import { useState, useEffect, ChangeEvent, useRef } from "react";
import { ChevronDownIcon } from "@heroicons/react/20/solid";

interface HistoryItem {
  query: string;
  category: string;
  date: string;
}

interface SearchCardProps {
  showCategory?: boolean;
  showDate?: boolean;
  showEndAfterCheckbox?: boolean;
  categories?: string[];
  query?: string;                   // Current search query
  setQuery?: (query: string) => void;
  categoriesSelected?: string[];                // Selected category
  setCategoriesSelected?: (category: string[]) => void;
  onSearchChange?: (val: string) => void;
  onCategoryChange?: (val: string) => void;
  onDateRangeChange?: (start: Date | null, end: Date | null) => void;
  dateStart?: string;                    // Selected date (YYYY-MM-DD)
  dateEnd?: string;                      // Selected end date (YYYY-MM-DD)
  setStartDate?: (date: string) => void;
  setEndDate?: (date: string) => void;
  endAfterChecked?: boolean;            // Whether "end after" is checked
  setEndAfterChecked?: (checked: boolean) => void;
  // Event handlers
  onKeyDown?: (e: React.KeyboardEvent) => void; // Key down handler for input fields
  onApply?: () => void;            // Called when search is applied
  history?: HistoryItem[];         // optional controlled history (list of queries + meta)
  setHistory?: (history: HistoryItem[]) => void; // optional setter when parent controls history
  onSelectHistory?: (item: HistoryItem) => void; // notify parent when user selects a history entry
}

const DEFAULT_CATEGORIES = [
  'University Activities',
  'Morality and Ethics',
  'Thinking and Learning Skills',
  'Interpersonal Skills and Relationship Building',
  'Health and Well-being',
  'Social Engagement Activities'
];

export default function SearchCard({
  showCategory = true,
  showDate = true,
  showEndAfterCheckbox = true,
  categories,
  setQuery = () => {},
  categoriesSelected = [],
  setCategoriesSelected = () => {},
  dateStart = "",
  setStartDate = () => {},
  dateEnd = "",
  setEndDate = () => {},
  endAfterChecked = false,
  setEndAfterChecked = () => {},
  onApply = () => {},
  history,
  setHistory,
  onSelectHistory
}: SearchCardProps) {
  // local fallback history now stores only the query strings
  const [localHistory, setLocalHistory] = useState<string[]>([]);
  const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false);
  const categoryDropdownRef = useRef<HTMLDivElement>(null);

  const isControlledCategories = Array.isArray(categoriesSelected) && typeof setCategoriesSelected === 'function';
  const [internalSelected, setInternalSelected] = useState<string[]>(() => (isControlledCategories ? categoriesSelected : []));


  // Load local history on mount unless parent supplies history
  useEffect(() => {
    if (Array.isArray(history)) return; // parent controls history (we read it below)
    try {
      const raw = localStorage.getItem("ku_search_history") || localStorage.getItem("searchHistory") || "[]";
      const parsed = JSON.parse(raw);
    
      // Normalize both old string arrays and object arrays into string[] of queries
      const normalized: string[] = Array.isArray(parsed)
        ? parsed
      .map((p: string | { query?: string }) => {
        if (typeof p === "string") return p;
        return String(p?.query ?? "");
      })
      .filter(Boolean): [];

      setLocalHistory(normalized);
    } catch {
      setLocalHistory([]);
    }
  }, [history]);

  // effectiveHistoryStrings: prefer controlled history (map to strings) else use local strings
  const effectiveHistoryStrings: string[] = Array.isArray(history)
    ? history.map(h => String(h?.query ?? "")).filter(Boolean)
    : localHistory;

  const persistLocalHistory = (items: string[]) => {
    try {
      localStorage.setItem("ku_search_history", JSON.stringify(items));
      setLocalHistory(items);
    } catch {}
  };

  const handleDelete = (index: number) => {
    const updated = (effectiveHistoryStrings || []).filter((_, i) => i !== index);
    if (Array.isArray(history) && typeof setHistory === "function") {
      // convert back to HistoryItem[] for parent
      setHistory(updated.map(q => ({ query: q, category: "All Categories", date: "" })));
    } else {
      persistLocalHistory(updated);
    }
  };

  const handleClear = () => {
    if (Array.isArray(history) && typeof setHistory === "function") {
      setHistory([]);
    } else {
      persistLocalHistory([]);
    }
  };

  // keep internalSelected in sync if parent flips from uncontrolled -> controlled
  useEffect(() => {
    if (isControlledCategories) return; // parent controls it
    // if parent didn't control, keep local only
  }, [isControlledCategories]);
  // helper to update selected categories (works for controlled & uncontrolled)
  const updateSelectedCategories = (next: string[]) => {
    if (isControlledCategories) {
      setCategoriesSelected(next); // parent will re-render with the new array
    } else {
      setInternalSelected(next);
    }
  };
  const selectedCategories = isControlledCategories ? (categoriesSelected || []) : internalSelected;

  const handleDateStartChange = (e: ChangeEvent<HTMLInputElement>) => {
    setStartDate(e.target.value);
  };

  const handleDateEndChange = (e: ChangeEvent<HTMLInputElement>) => {
    setEndDate(e.target.value);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      onApply();
    }
  };

  // Close category dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (categoryDropdownRef.current && !categoryDropdownRef.current.contains(event.target as Node)) {
        setCategoryDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);
  
  return (
    <div className="bg-white shadow-md rounded-lg p-4 space-y-4">

      {/* History (now simple strings) */}
      {effectiveHistoryStrings && effectiveHistoryStrings.length > 0 && (
        <>
          <div className="max-h-20 overflow-y-auto space-y-1">
            {effectiveHistoryStrings.map((q, idx) => (
              <div key={idx} className="flex items-start justify-between gap-3">
                <button
                  onClick={() => {
                    if (typeof onSelectHistory === "function") {
                      onSelectHistory({ query: q, category: "All Categories", date: "" });
                    } else {
                      if (setQuery) {
                        setQuery(q);
                      }
                    }}}
                  className="text-left flex-1"
                  title={`${q}`}
                >
                  <p className="cursor-pointer hover:underline text-gray-700 truncate">{q || "(empty query)"}</p>
                </button>

                <button
                  onClick={() => handleDelete(idx)}
                  className="ml-2 text-red-500 hover:text-red-700 px-2 py-1 text-sm"
                  aria-label={`Delete history item ${idx}`}
                >
                  ×
                </button>
              </div>
            ))}
          </div>

          <div className="flex justify-between items-center">
            <button
              onClick={handleClear}
              className="text-sm text-gray-500 hover:underline"
            >
              Clear history
            </button>
            <span className="text-xs text-gray-400">{effectiveHistoryStrings.length} saved</span>
          </div>

          <hr />
        </>
      )}

      {showCategory && (
        <div 
          ref={categoryDropdownRef}
          onMouseDown={(e) => e.stopPropagation()} /* prevent parent from closing on mousedown */
          className="relative"
        >
          <label className="block text-sm font-bold text-gray-700 mb-2">Categories</label>

          {/* Dropdown trigger */}
          <div
            onClick={() => setCategoryDropdownOpen(!categoryDropdownOpen)}
            className="flex items-center justify-between w-full px-3 py-2 border border-gray-300 rounded-lg bg-white cursor-pointer hover:border-gray-400 transition-colors"
          >
            <span className="text-gray-700">
              {selectedCategories.length > 0 
                ? `${selectedCategories.length} selected`
                : "Select categories..."
              }
            </span>
            <ChevronDownIcon 
              className={`w-5 h-5 text-gray-400 transition-transform ${
                categoryDropdownOpen ? "rotate-180" : ""
              }`}
            />
          </div>

          {/* Selected chips */}
          {selectedCategories.length > 0 ? (
            <div className="flex flex-wrap gap-2 mt-2">
              {selectedCategories.map(cat => (
                <span
                  key={cat}
                  className="flex items-center bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs"
                >
                  <span className="truncate max-w-[8rem] inline-block">{cat}</span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      updateSelectedCategories(selectedCategories.filter(c => c !== cat));
                    }}
                    className="ml-1 text-green-700 hover:text-green-900"
                    aria-label={`Remove ${cat}`}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          ) : null}

          {/* Dropdown menu */}
          {categoryDropdownOpen && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-50 max-h-48 overflow-y-auto">
              {(categories?.length ? categories : DEFAULT_CATEGORIES).map(cat => {
                const isSelected = selectedCategories.includes(cat);
                return (
                  <div
                    key={cat}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (isSelected) {
                        updateSelectedCategories(selectedCategories.filter(c => c !== cat));
                      } else {
                        updateSelectedCategories([...selectedCategories, cat]);
                      }
                    }}
                    className="flex items-center px-3 py-2 hover:bg-gray-50 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      readOnly
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-700">{cat}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}


      {showDate && (
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-1">Date Range</label>
          <div className="flex gap-4 items-end">
            <div className="flex flex-col flex-1">
              <label className="text-xs text-gray-700 mb-1">Start Date</label>
              <input
                type="date"
                value={dateStart}
                onChange={handleDateStartChange}
                onKeyDown={handleKeyDown}
                className="border p-2 rounded-lg w-full"
                min="2023-01-01"
                max="2026-12-31"
              />
            </div>
            <div className="flex flex-col flex-1">
              <label className="text-xs text-gray-700 mb-1">End Date</label>
              <input
                type="date"
                value={dateEnd}
                onChange={handleDateEndChange}
                onKeyDown={handleKeyDown}
                className="border p-2 rounded-lg w-full"
                min="2023-01-01"
                max="2026-12-31"
              />
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Shows events that are active on this date (between start and end dates)
          </p>
        </div>
      )}

      {/* End after checkbox */}
      {showEndAfterCheckbox && (
        <div className="flex items-center gap-2 mt-2">
          <input
            type="checkbox"
            id="endAfterCheckbox"
            checked={endAfterChecked}
            onChange={e => setEndAfterChecked(e.target.checked)}
          />
          <label htmlFor="endAfterCheckbox" className="text-sm">
            Include events that end after selected end date
          </label>
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
