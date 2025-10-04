"use client";

import CategorySelect from "./CategorySelect";

interface FormFieldsProps {
  // Form values
  title: string;
  location: string;
  dateStart: string;
  dateEnd: string;
  hour: number | "";
  maxParticipants: number | "";
  categories: string[];
  description: string;
  
  // Form handlers
  onTitleChange: (value: string) => void;
  onLocationChange: (value: string) => void;
  onDateStartChange: (value: string) => void;
  onDateEndChange: (value: string) => void;
  onHourChange: (value: number | "") => void;
  onMaxParticipantsChange: (value: number | "") => void;
  onCategoriesChange: (value: string[]) => void;
  onDescriptionChange: (value: string) => void;
  
  // Errors
  errors: { [key: string]: string };
}

export default function FormFields({
  location,
  dateStart,
  dateEnd,
  hour,
  maxParticipants,
  categories,
  description,
  onLocationChange,
  onDateStartChange,
  onDateEndChange,
  onHourChange,
  onMaxParticipantsChange,
  onCategoriesChange,
  onDescriptionChange,
  errors
}: FormFieldsProps) {
  return (
    <>
      {/* Basic Info Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Location */}
        <label className="flex flex-col text-sm">
          Location
          <input
            type="text"
            className="border border-gray-400 rounded px-2 py-1"
            placeholder="Enter location"
            value={location}
            onChange={(e) => onLocationChange(e.target.value)}
          />
          {errors.location && <p className="text-red-600 text-sm">{errors.location}</p>}
        </label>

        {/* Date */}
        <label className="flex flex-col text-sm">
          Date
          <div className="flex gap-2">
            <input
              type="date"
              value={dateStart}
              onChange={(e) => onDateStartChange(e.target.value)}
              className="border border-gray-400 rounded px-2 py-1 flex-1"
            />
            <div className=""> to </div>
            <input
              type="date"
              value={dateEnd}
              className="border border-gray-400 rounded px-2 py-1 flex-1"
              onChange={(e) => onDateEndChange(e.target.value)}
            />
          </div>
          {errors.dateStart && <p className="text-red-600 text-sm">{errors.dateStart}</p>}
          {errors.dateEnd && <p className="text-red-600 text-sm">{errors.dateEnd}</p>}
        </label>

        {/* Hour */}
        <label className="flex flex-col text-sm">
          Hour
          <input
            type="number"
            min="1"
            max="10"
            className="border border-gray-400 rounded px-2 py-1"
            value={hour}
            onChange={(e) => onHourChange(e.target.value ? Number(e.target.value) : "")}
            placeholder="Enter hours reward"
          />
          {errors.hour && <p className="text-red-600 text-sm">{errors.hour}</p>}
        </label>

        {/* Max Participants */}
        <label className="flex flex-col text-sm">
          Max Participants
          <input
            type="number"
            min="1"
            value={maxParticipants}
            onChange={(e) => onMaxParticipantsChange(e.target.value ? Number(e.target.value) : "")}
            className="border border-gray-400 rounded px-2 py-1"
            placeholder="Enter max participants"
          />
          {errors.maxParticipants && <p className="text-red-600 text-sm">{errors.maxParticipants}</p>}
        </label>
      </div>

      {/* Category Select */}
      <CategorySelect
        value={categories}
        onChange={onCategoriesChange}
      />
      {errors.categories && <p className="text-red-600 text-sm">{errors.categories}</p>}

      {/* Description */}
      <label className="flex flex-col text-sm">
        Description
        <textarea
          rows={4}
          value={description}
          onChange={(e) => onDescriptionChange(e.target.value)}
          className="border border-gray-400 rounded px-2 py-1"
          placeholder="Write your event description..."
        />
        {errors.description && <p className="text-red-600 text-sm">{errors.description}</p>}
      </label>
    </>
  );
}