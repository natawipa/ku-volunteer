"use client";

import CategorySelect from "./CategorySelect";

interface FormFieldsProps {
  title: string;
  location: string;
  dateStart: string;
  dateEnd: string;
  timeStart: string;
  timeEnd: string; 
  hour: number | "";
  maxParticipants: number | "";
  categories: string[];
  description: string;
  
  onTitleChange: (value: string) => void;
  onLocationChange: (value: string) => void;
  onDateStartChange: (value: string) => void;
  onDateEndChange: (value: string) => void;
  onTimeStartChange: (value: string) => void;
  onTimeEndChange: (value: string) => void;
  onHourChange: (value: number | "") => void;
  onMaxParticipantsChange: (value: number | "") => void;
  onCategoriesChange: (value: string[]) => void;
  onDescriptionChange: (value: string) => void;
  
  errors: { [key: string]: string };
}

export default function FormFields({
  location,
  dateStart,
  dateEnd,
  timeStart,
  timeEnd,
  hour,
  maxParticipants,
  categories,
  description,
  onLocationChange,
  onDateStartChange,
  onDateEndChange,
  onTimeStartChange,
  onTimeEndChange,
  onHourChange,
  onMaxParticipantsChange,
  onCategoriesChange,
  onDescriptionChange,
  errors
}: FormFieldsProps) {
  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
        <label className="block text-sm"> Location </label>
          <input
            type="text"
            className="w-full border border-gray-400 rounded px-2 py-1"
            placeholder="Enter location"
            value={location}
            onChange={(e) => onLocationChange(e.target.value)}
          />
          {errors.location && <p className="text-red-600 text-sm">{errors.location}</p>}
        </div>

        <div className="grid grid-cols-4 gap-2">
          <div>
            <label className="block text-sm">Start Date</label>
              <input
                type="date"
                value={dateStart}
                onChange={(e) => onDateStartChange(e.target.value)}
                className="w-full border border-gray-400 rounded px-2 py-1 flex-1"
              />
              {errors.dateStart && <p className="text-red-600 text-sm">{errors.dateStart}</p>}
          </div>
          
          <div>
            <label className="block text-sm">Start Time</label>
            <input
              type="time"
              value={timeStart}
              onChange={(e) => onTimeStartChange(e.target.value)}
              className="w-full border border-gray-400 rounded px-2 py-2 text-sm"
            />
            {errors.timeStart && <p className="text-red-600 text-sm">{errors.timeStart}</p>}
          </div>

          <div>
            <label className="block text-sm">End Date *</label>
            <input
              type="date"
              value={dateEnd}
              onChange={(e) => onDateEndChange(e.target.value)}
              className="w-full border border-gray-400 rounded px-2 py-2 text-sm"
            />
            {errors.dateEnd && <p className="text-red-600 text-sm">{errors.dateEnd}</p>}
          </div>

          <div>
            <label className="block text-sm">End Time</label>
              <input
                type="time"
                value={timeEnd}
                onChange={(e) => onTimeEndChange(e.target.value)}
                className="w-full border border-gray-400 rounded px-2 py-2 text-sm"
              />
              {errors.timeEnd && <p className="text-red-600 text-sm">{errors.timeEnd}</p>}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm">Hour Reward</label>
          <input
            type="number"
            min="1"
            max="10"
            className="w-full border border-gray-400 rounded px-2 py-2 text-sm"
            value={hour}
            onChange={(e) => onHourChange(e.target.value ? Number(e.target.value) : "")}
            placeholder="Enter hours reward"
          />
          {errors.hour && <p className="text-red-600 text-sm">{errors.hour}</p>}
        </div>

        <div>
          <label className="block text-sm">Max Participants</label>
          <input
            type="number"
            min="1"
            value={maxParticipants}
            onChange={(e) => onMaxParticipantsChange(e.target.value ? Number(e.target.value) : "")}
            className="w-full border border-gray-400 rounded px-2 py-2 text-sm"
            placeholder="Enter max participants"
          />
          {errors.maxParticipants && <p className="text-red-600 text-sm">{errors.maxParticipants}</p>}
          </div>
        </div>

        <div>
        <label className="block text-sm">Category</label>
          <CategorySelect
            value={categories}
            onChange={onCategoriesChange}
          />
          {errors.categories && <p className="text-red-600 text-sm">{errors.categories}</p>}
        </div>

      <div>
      <label className="block text-sm">Description</label>
        <textarea
          rows={4}
          value={description}
          onChange={(e) => onDescriptionChange(e.target.value)}
          className="w-full border border-gray-400 rounded px-2 py-2 text-sm"
          placeholder="Write your event description..."
        />
        {errors.description && <p className="text-red-600 text-sm">{errors.description}</p>}
      </div>
    </>
  );
}