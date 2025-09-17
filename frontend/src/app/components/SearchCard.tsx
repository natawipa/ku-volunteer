"use client";
import { useState, useEffect } from "react";

// interface Card {
//   title: string;
//   category: string;
//   date: string; // format: YYYY-MM-DD
// }

// const cards: Card[] = [
//   { title: "plant for dad", category: "กิจกรรมมหาวิทยาลัย", date: "2025-09-14" },
//   { title: "read for blind", category: "กิจกรรมเพื่อการเสริมสร้างสมรรถนะ", date: "2025-09-20" },
//   { title: "help orphanage", category: "กิจกรรมเพื่อสังคม", date: "2025-10-01" },
// ];

export default function SearchFilter() {
  const [ , setQuery] = useState("");
  const [history, setHistory] = useState<string[]>([]);
  const [category, setCategory] = useState("All");
  const [date, setDate] = useState("");

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem("searchHistory") || "[]");
    setHistory(saved);
  }, []);
  
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

      {/* Category filter */}
      <div>
        <label className="block text-sm font-bold text-gray-700">Category</label>
        <select
          value={category}
          onChange={e => setCategory(e.target.value)}
          className="border p-2 rounded-lg w-full"
        >
          <option>กิจกรรมมหาวิทยาลัย</option>
          <option>กิจกรรมเพื่อการเสริมสร้างสมรรถนะ</option>
          <option>กิจกรรมเพื่อสังคม</option>
        </select>
      </div>

      {/* Date filter */}
      <div>
        <label className="block text-sm font-bold text-gray-700">Date</label>
        <input
          type="date"
          value={date}
          onChange={e => setDate(e.target.value)}
          className="border p-2 rounded-lg w-full"
        />
      </div>
    </div>
  );
}
