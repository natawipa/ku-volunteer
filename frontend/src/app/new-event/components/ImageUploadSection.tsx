import { PlusCircle, X } from "lucide-react";
import Image from "next/image";

interface ImageUploadSectionProps {
  cover: File | null;
  pictures: File[];
  onCoverChange: (file: File | null) => void;
  onPicturesChange: (files: File[]) => void;
  coverError?: string;
}

export default function ImageUploadSection({
  cover,
  pictures,
  onCoverChange,
  onPicturesChange,
  coverError
}: ImageUploadSectionProps) {
  return (
    <>
      {/* Cover Image Upload */}
      <div className="relative w-full h-52 bg-gray-200 rounded-lg flex items-center justify-center overflow-hidden mb-4">
        {cover ? (
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
            if (e.target.files?.[0]) onCoverChange(e.target.files[0]);
          }}
          className="absolute inset-0 opacity-0 cursor-pointer"
        />

        {cover && (
          <button
            type="button"
            onClick={() => onCoverChange(null)}
            className="absolute top-2 right-2 bg-white shadow px-2 py-1 text-sm rounded flex items-center gap-1 cursor-pointer hover:bg-gray-100"
          >
            Change
          </button>
        )}
      </div>
      {coverError && <p className="text-red-600 text-sm">{coverError}</p>}

      {/* Additional Pictures */}
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
                  onPicturesChange(pictures.filter((_, idx) => idx !== i))
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
                  onPicturesChange([...pictures, ...Array.from(e.target.files)]);
                }
              }}
              className="hidden"
            />
          </label>
        </div>
      </div>
    </>
  );
}