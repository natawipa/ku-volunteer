"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { UserCircleIcon } from "@heroicons/react/24/solid";
import { useRouter } from "next/navigation";

import FormFields from "./components/FormFields";
import ImageUploadSection from "./components/ImageUploadSection";


export default function EventForm() {
  const router = useRouter();
  
  const [title, setTitle] = useState("");
  const [location, setLocation] = useState("");
  const [dateStart, setDateStart] = useState<string>("");
  const [dateEnd, setDateEnd] = useState<string>("");
  const [hour, setHour] = useState<number | "">("");
  const [maxParticipants, setMaxParticipants] = useState<number | "">("");
  const [categories, setCategories] = useState<string[]>([]);
  const [description, setDescription] = useState("");
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [cover, setCover] = useState<File | null>(null);
  const [pictures, setPictures] = useState<File[]>([]);

  /**
   * collect all form data for API and delete confirmation
    id is a mock id so it need to be replace with real event id*/
  const eventData = {
    id: "mock-event-id-" + Date.now(),
    title: title,
    location: location,
    dateStart: dateStart,
    dateEnd: dateEnd,
    hour: hour,
    maxParticipants: maxParticipants,
    categories: categories,
    description: description,
  };

  const handleDeleteClick = () => {
    if (!title.trim()) {
      alert("Please enter an event title before deleting");
      return;
    }
    
    router.push(`/delete-confirmation?eventData=${encodeURIComponent(JSON.stringify(eventData))}`);
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!title.trim()) newErrors.title = "Title is required";
    if (!location.trim()) newErrors.location = "Location is required";
    if (!dateStart) newErrors.dateStart = "Start date is required";
    if (!dateEnd) newErrors.dateEnd = "End date is required";
    if (dateStart && dateEnd && new Date(dateStart) > new Date(dateEnd)) {
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
    if (categories.length === 0) newErrors.categories = "Select at least one category";
    if (!description.trim()) newErrors.description = "Description is required";
    if (!cover) newErrors.cover = "Cover image is required";
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };


  const handleSave = async () => {
    if (!validate()) return;
    
    try {
      const response = await fetch('/api/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: title,
          location: location,
          dateStart: dateStart,
          dateEnd: dateEnd,
          hour: hour,
          maxParticipants: maxParticipants,
          categories: categories,
          description: description,
        }),
      });
  
      if (response.ok) {
        const savedEvent = await response.json();
        console.log('Event created:', savedEvent);
        alert('Event created successfully!');
        
        // backend return real ID
        console.log('Real event ID:', savedEvent.id);
      } else {
        alert('Failed to create event');
      }
    } catch (error) {
      console.error('Error creating event:', error);
      alert('Error creating event');
    }
  };

  const clearError = (field: string) => {
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }));
    }
  };

  return (
    <div className="relative">
      {/* Background styling */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#DAE9DC] to-white h-[130px]"></div>
      <Image
        src="/mountain.svg"
        alt="mountain"
        width={1920}
        height={510}
        className="absolute inset-0 top-0 w-full h-[120px] object-cover pt-11"
      />

      {/* Main content */}
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
              <UserCircleIcon className="w-10 h-10 text-[#215701] hover:text-[#00361C] transition-all duration-200" />
            </Link>
          </nav>
        </header>

        {/* Event Form Container */}
        <div className="max-w-5xl mx-auto bg-white shadow space-y-2 rounded-xl p-6 py-7 mt-13">
          {/* Header with title and delete button */}
          <div className="flex items-center justify-between mb-6">
            <input
              type="text"
              placeholder="Input Event Title"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                clearError("title");
              }}
              className="text-2xl font-semibold border-b focus:outline-none"
            />
            
            <button 
              onClick={handleDeleteClick}
              className="flex items-center gap-2 px-4 py-2 sm:px-5 sm:py-2 h-10 
                     text-sm sm:text-base text-red-600 border border-red-600 
                     rounded-lg hover:bg-red-50 focus:outline-none 
                     focus:ring-2 focus:ring-red-300 cursor-pointer"
            >
              <Trash2 size={16} /> 
              <span className="hidden sm:inline">Delete Event</span>
            </button>
          </div>
          {errors.title && <p className="text-red-600 text-sm">{errors.title}</p>}

          {/* Image Upload Section */}
          <ImageUploadSection
            cover={cover}
            pictures={pictures}
            onCoverChange={setCover}
            onPicturesChange={setPictures}
            coverError={errors.cover}
          />

          {/* Form Fields Section */}
          <FormFields
            // Form values
            title={title}
            location={location}
            dateStart={dateStart}
            dateEnd={dateEnd}
            hour={hour}
            maxParticipants={maxParticipants}
            categories={categories}
            description={description}
            // Form handlers
            onTitleChange={(value) => { setTitle(value); clearError("title"); }}
            onLocationChange={(value) => { setLocation(value); clearError("location"); }}
            onDateStartChange={(value) => { setDateStart(value); clearError("dateStart"); }}
            onDateEndChange={(value) => { setDateEnd(value); clearError("dateEnd"); }}
            onHourChange={(value) => { setHour(value); clearError("hour"); }}
            onMaxParticipantsChange={(value) => { setMaxParticipants(value); clearError("maxParticipants"); }}
            onCategoriesChange={(value) => { setCategories(value); clearError("categories"); }}
            onDescriptionChange={(value) => { setDescription(value); clearError("description"); }}
            // Errors
            errors={errors}
          />

          {/* Action Buttons */}
          <div className="flex justify-between pt-4 border-t mt-6">
            <button className="text-gray-600 hover:text-gray-900 cursor-pointer">
              Cancel
            </button>
            <button 
              className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 cursor-pointer"
              onClick={handleSave}
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}