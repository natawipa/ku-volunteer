"use client";

import { useState, useRef, useEffect } from "react";
import { PlusCircle, Trash2, Edit2, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import {UserCircleIcon } from "@heroicons/react/24/solid";
import { date } from "zod";

type CategoryNode = {
  label: string;
  selectable?: boolean;
  children?: CategoryNode[];
};

const categories: CategoryNode[] = [
  { label: "กิจกรรมมหาวิทยาลัย", selectable: true },
  {
    label: "กิจกรรมเพื่อเสริมสร้างสมรรถนะ",
    selectable: false,
    children: [
      { label: "ด้านพัฒนาคุณธรรมและจริยธรม", selectable: true },
      { label: "ด้านพัฒนาทักษะการคิดและการเรียนรู้", selectable: true },
      { label: "ด้านพัฒนาทักษะและเสริมสร้างความสัมพันธ์ระหว่างบุคคล", selectable: true },
      { label: "ด้านพัฒนาสุขภาพ", selectable: true },
    ],
  },
  { label: "กิจกรรมเพื่อสังคม", selectable: true },
];

function CategorySelect() {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
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
    if (selected.includes(option)) {
      setSelected(selected.filter((o) => o !== option));
    } else if (selected.length < 3) {
      setSelected([...selected, option]);
    }
  };

  const removeCategory = (option: string) => {
    setSelected(selected.filter((o) => o !== option));
  };

  return (
    <div className="flex flex-col text-sm space-y-2 relative" ref={ref}>
      <label className="flex flex-col text-sm">Category</label>

      {/* White Box */}
      <div
        className="border border-gray-400 rounded-lg p-2 flex flex-wrap gap-2 cursor-pointer min-h-[48px] bg-white"
        onClick={() => setOpen(!open)}
      >
        {selected.length === 0 && (
          <span className="text-gray-400">Select up to 3 categories</span>
        )}

        {selected.map((cat) => (
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

      {/* Dropdown overlay */}
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
              >
                {cat.label}
            </div>
            {cat.children && (
              <div className="px-5 py-2 space-y-1">
                {cat.children.map((child) => (
                <div
                  key={child.label}
                  className={`px-2 py-1 rounded cursor-pointer ${
                    selected.includes(child.label)
                      ? "bg-green-600 text-white"
                      : "hover:bg-green-200"
                  }`}
                  onClick={() => toggleCategory(child.label)}
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

export default function EventForm() {
  const [title, setTitle] = useState("");
  const [location, setLocation] = useState("");
  const [dateStart, setDateStart] = useState<string>("");
  const [dateEnd, setDateEnd] = useState<string>("");
  const [hour, setHour] = useState<number | "">("");
  const [maxParticipants, setMaxParticipants] = useState<number | "">("");
  const [description, setDescription] = useState("");
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!title.trim()) newErrors.title = "Title is required";
    if (!location.trim()) newErrors.location = "Location is required";
    if (!dateStart) newErrors.dateStart = "Start date is required";
    if (!dateEnd) newErrors.dateEnd = "End date is required";
    if (dateStart && dateEnd && dateStart > dateEnd) {
      newErrors.dateEnd = "End date must be after start date";
    }

    if (!hour) newErrors.hour = "Hour is required";
    else if (Number(hour) < 1 || Number(hour) > 10) {
      newErrors.hour = "Hour must be between 1 and 10";
    }

    if (!maxParticipants) newErrors.maxParticipants = "Max participants required";
    else if (Number(maxParticipants) < 1) {
      newErrors.maxParticipants = "Must be at least 1";
    }
    if (!description.trim()) newErrors.description = "Description is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const [questions, setQuestions] = useState<string[]>([]);

  const handleSave = () => {
    if (validate()) {
      alert("Form is valid — submit here 🚀");
    }
  };

  const addQuestion = () => setQuestions([...questions, ""]);
  const [cover, setCover] = useState<File | null>(null);
  const [pictures, setPictures] = useState<File[]>([]);

  return (
    <div className="relative">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#DAE9DC] to-white h-[130px]"></div>

      {/* Mountain background */}
      <Image
        src="/mountain.svg"
        alt="mountain"
        width={1920}
        height={510}
        className="absolute inset-0 top-0 w-full h-[120px] object-cover pt-11"
      />

      {/* Foreground content */}
      <div className="relative p-6">
        <header className="flex justify-between items-center">
          <Image
            src="/Logo_Staff.svg"
            alt="Small Logo"
            width={64}
            height={64}
            className="object-cover"
          />
          <nav className="flex items-center space-x-8">
            <Link
              href="/document"
              className="relative border-b-1 border-transparent hover:border-black transition-all duration-200"
            >
              Document
            </Link>
            <Link
              href="/all-events"
              className="relative border-b-1 border-transparent hover:border-black transition-all duration-200"
            >
              All Event
            </Link>

            <Link href="/profile">
              {
                <UserCircleIcon className="w-10 h-10 text-[#215701] hover:text-[#00361C] transition-all duration-200" />
              }
            </Link>
          </nav>
        </header>

      {/* --------------- Form Fields --------------- */}

        <div className="max-w-5xl mx-auto bg-white shadow rounded-xl p-6 space-y-6 py-7 mt-13">
          {/* Header */}
          <div className="flex items-center justify-between">
            <input
              type="text"
              placeholder="Input Event Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="text-2xl font-semibold border-b focus:outline-none"
            />
            <button className="flex items-center gap-2 px-4 py-2 sm:px-5 sm:py-2 h-10 
                   text-sm sm:text-base text-red-600 border border-red-600 
                   rounded-lg hover:bg-red-50 focus:outline-none 
                   focus:ring-2 focus:ring-red-300 cursor-pointer">
              <Trash2 size={16} /> 
              <span className="hidden sm:inline">Delete Event</span>
            </button>
          </div>
          {errors.title && <p className="text-red-600 text-sm">{errors.title}</p>}

          {/* Cover Image */}
          <div className="relative w-full h-52 bg-gray-200 rounded-lg flex items-center justify-center overflow-hidden">
            {cover ? (
              // Show preview if cover is uploaded
              <Image
                src={URL.createObjectURL(cover)}
                alt="cover"
                width={500}
                height={200}
                className="object-cover w-full h-full"
              />
            ) : (
              <span className="text-gray-500">Upload Cover</span>
            )}

            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                if (e.target.files?.[0]) setCover(e.target.files[0]);
              }}
              className="absolute inset-0 opacity-0 cursor-pointer"
            />

            {cover && (
              <button
                type="button"
                onClick={() => setCover(null)}
                className="absolute top-2 right-2 bg-white shadow px-2 py-1 text-sm rounded flex items-center gap-1 cursor-pointer hover:bg-gray-100"
              >
                <Edit2 size={14} /> 
                <span className="hidden sm:inline">Change</span>
              </button>
            )}
          </div>

          {/* Title, Location, Date, Category */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="flex flex-col text-sm">
              Location
              <input
                type="text"
                className="border border-gray-400 rounded px-2 py-1"
                placeholder="Enter location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
              {errors.location && <p className="text-red-600 text-sm">{errors.location}</p>}
            </label>

            <label className="flex flex-col text-sm">
              Date
              <div className="flex gap-2">
                <input
                  type="date"
                  value={dateStart}
                  onChange={(e) => setDateStart(e.target.value)}
                  className="border border-gray-400 rounded px-2 py-1 flex-1"
                />

                <div className=""> to </div>
                <input
                  type="date"
                  value={dateEnd}
                  className="border border-gray-400 rounded px-2 py-1 flex-1"
                  onChange={(e) => setDateEnd(e.target.value)}
                />
              </div>
              {errors.dateStart && <p className="text-red-600 text-sm">{errors.dateStart}</p>}
              {errors.dateEnd && <p className="text-red-600 text-sm">{errors.dateEnd}</p>}
            </label>

            <label className="flex flex-col text-sm">
              Hour
              <input
                type="number"
                min="1"
                max="10"
                className="border border-gray-400 rounded px-2 py-1"
                value={hour}
                onChange={(e) => setHour(e.target.value ? Number(e.target.value) : "")}
                placeholder="Enter hours reward"
              />
              {errors.hour && <p className="text-red-600 text-sm">{errors.hour}</p>}
          </label>

          <label className="flex flex-col text-sm">
              Max Participants
              <input
                type="number"
                min="1"
                value={maxParticipants}
                onChange={(e) => setMaxParticipants(e.target.value ? Number(e.target.value) : "")}
                className="border border-gray-400 rounded px-2 py-1"
                placeholder="Enter max participants"
              />
              {errors.maxParticipants && <p className="text-red-600 text-sm">{errors.maxParticipants}</p>}
          </label>
          </div>

          {/* Category Select */}
          <CategorySelect />

          {/* Description */}
          <label className="flex flex-col text-sm">
            Description
            <textarea
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="border border-gray-400 rounded px-2 py-1"
              placeholder="Write your event description..."
            />
            {errors.description && <p className="text-red-600 text-sm">{errors.description}</p>}
          </label>

          

          <p className="text-sm font-medium mb-2">Additional Pictures</p>
            <div className="bg-mutegreen shadow rounded-xl p-6 space-y-6 py-7 mt-1">
              <div className="flex gap-4 overflow-x-auto">
                {pictures.map((pic, i) => (
                  <div key={i} className="relative flex-shrink-0 w-32 h-28">
                    <Image
                      src={URL.createObjectURL(pic)}
                      alt={`pic-${i}`}
                      width={128}
                      height={112}
                      className="object-cover w-full h-full rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setPictures(pictures.filter((_, idx) => idx !== i))
                      }
                      className="absolute top-1 right-1 bg-white rounded-full p-1 shadow text-red-600 hover:text-red-800"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}

                {/* Upload button */}
                <label className="flex-shrink-0 w-32 h-28 flex items-center justify-center bg-gray-300 rounded-lg cursor-pointer">
                  <PlusCircle className="text-gray-500" size={28} />
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(e) => {
                      if (e.target.files) {
                        setPictures([...pictures, ...Array.from(e.target.files)]);
                      }
                    }}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

          {/* Additional Questions */}
        <div>
            <p className="text-sm font-medium mb-2">Additional Questions</p>
            {questions.map((q, idx) => (
              <div key={idx} className="relative mb-2">
                <label className="block text-sm font-medium mb-1">
                  Question {idx + 1}
                </label>

                <input
                  type="text"
                  placeholder={`Enter question ${idx + 1}`}
                  value={q}
                  onChange={(e) => {
                    const copy = [...questions];
                    copy[idx] = e.target.value;
                    setQuestions(copy);
                  }}
                  className="w-full border border-gray-400 rounded px-2 py-1 pr-10"
                />

                {/* Delete button inside the input */}
                <button
                  type="button"
                  onClick={() => {
                    const copy = [...questions];
                    copy.splice(idx, 1);
                    setQuestions(copy);
                  }}
                  className="absolute right-3 top-[35px] text-red-600 hover:text-red-800"
                >
                  <X size={16} />
                </button>
              </div>

            ))}
            <button
                onClick={addQuestion}
                className="flex items-center gap-1 text-green-600 border border-green-600 px-3 py-1 rounded hover:bg-green-50 cursor-pointer"
            >
                <PlusCircle size={16} /> Add Question
            </button>
            </div>

          {/* Footer buttons */}
          <div className="flex justify-between pt-4 border-t">
            <button className="text-gray-600 hover:text-gray-900 cursor-pointer">
              Cancel
            </button>
            
            <button className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 cursor-pointer"
              onClick={handleSave}>
              Save
            </button>
        </div>
      </div>
      </div>
    </div>
  );
}