"use client";
import { useState, useEffect, ChangeEvent } from "react";

interface HistoryItem {
  query: string;
  category: string;
  date: string;
}

interface SearchCardProps {
  showCategory?: boolean;
  showDate?: boolean;
  categories?: string[];
  query?: string;                   // Current search query
  setQuery?: (query: string) => void;
  category?: string;                // Selected category
  setCategory?: (category: string) => void;
  date?: string;                    // Selected date (YYYY-MM-DD)
  setDate?: (date: string) => void;
  onKeyDown?: (e: React.KeyboardEvent) => void; // Key down handler for input fields
  onApply?: () => void;            // Called when search is applied
  history?: HistoryItem[];         // optional controlled history (list of queries + meta)
  setHistory?: (history: HistoryItem[]) => void; // optional setter when parent controls history
  onSelectHistory?: (item: HistoryItem) => void; // notify parent when user selects a history entry
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
  setQuery = () => {},
  category = "All Categories",
  setCategory = () => {},
  date = "",
  setDate = () => {},
   onApply = () => {},
  history,
  setHistory,
  onSelectHistory
}: SearchCardProps) {
  // local fallback history now stores only the query strings
  const [localHistory, setLocalHistory] = useState<string[]>([]);

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

  const categoryList = categories && categories.length ? categories : DEFAULT_CATEGORIES;

  const handleCategoryChange = (e: ChangeEvent<HTMLSelectElement>) => {
    setCategory(e.target.value);
  };

  const handleDateChange = (e: ChangeEvent<HTMLInputElement>) => {
    setDate(e.target.value);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      onApply();
    }
  };
  
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
