import { PlusCircle, X } from "lucide-react";
import Image from "next/image";
import type { ChangeEvent } from 'react';

interface PosterItem {
  id?: number | string;
  url: string;
}

interface ImageUploadSectionProps {
  cover: File | null;
  coverUrl?: string | null;
  pictures: File[]; // new uploads (File objects)
  existingPosters?: PosterItem[]; // posters already saved in backend
  onCoverChange: (file: File | null) => void;
  onPicturesChange: (files: File[]) => void;
  onDeleteExistingPoster?: (posterId: number | string) => void;
  coverError?: string;
}

export default function ImageUploadSection({
  cover,
  coverUrl,
  pictures,
  existingPosters = [],
  onCoverChange,
  onPicturesChange,
  onDeleteExistingPoster,
  coverError
}: ImageUploadSectionProps) {
  const MAX_POSTERS = 4;
  const totalPosters = existingPosters.length + pictures.length;
  const canAddMore = totalPosters < MAX_POSTERS;

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
        ) : coverUrl ? (
          <Image src={coverUrl} alt="cover" width={500} height={200} className="object-cover w-full h-full" unoptimized />
        ) : (
          <span className="text-gray-500">Upload Cover</span>
        )}

        <input
          type="file"
          accept="image/*"
          onChange={(e: ChangeEvent<HTMLInputElement>) => {
            if (e.target.files?.[0]) onCoverChange(e.target.files[0]);
          }}
          className="absolute inset-0 opacity-0 cursor-pointer"
        />

        {(cover || coverUrl) && (
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
      <div className="flex justify-between items-center mb-2">
        <p className="text-sm font-medium">Additional Pictures</p>
        <p className="text-xs text-gray-500">({totalPosters}/{MAX_POSTERS} posters)</p>
      </div>
      <div className="bg-mutegreen shadow rounded-xl p-6 space-y-6 py-7 mt-1">
        <div className="flex gap-4 overflow-x-auto">
          {/* existing posters from backend (read-only thumbnails with delete) */}
          {existingPosters.map((p, i) => (
            <div key={`existing-${p.id ?? i}`} className="relative flex-shrink-0 w-32 h-28">
              <Image src={p.url} alt={`poster-${i}`} width={128} height={112} className="object-cover w-full h-full rounded-lg" unoptimized />
              {onDeleteExistingPoster && p.id && (
                <button
                  type="button"
                  onClick={() => onDeleteExistingPoster(p.id!)}
                  className="absolute top-1 right-1 bg-white rounded-full p-1 shadow text-red-600 hover:text-red-800"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          ))}

          {/* newly selected pictures (File objects) */}
          {pictures.map((pic, i) => (
            <div key={`new-${i}`} className="relative flex-shrink-0 w-32 h-28">
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
          {canAddMore ? (
            <label className="flex-shrink-0 w-32 h-28 flex items-center justify-center bg-gray-300 rounded-lg cursor-pointer hover:bg-gray-400 transition-colors">
              <PlusCircle className="text-gray-500" size={28} />
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={(e: ChangeEvent<HTMLInputElement>) => {
                  if (e.target.files) {
                    const newFiles = Array.from(e.target.files);
                    const availableSlots = MAX_POSTERS - totalPosters;
                    const filesToAdd = newFiles.slice(0, availableSlots);
                    
                    if (newFiles.length > availableSlots) {
                      alert(`Maximum ${MAX_POSTERS} posters allowed. Only ${availableSlots} image(s) will be added.`);
                    }
                    
                    onPicturesChange([...pictures, ...filesToAdd]);
                  }
                }}
                className="hidden"
              />
            </label>
          ) : (
            <div className="flex-shrink-0 w-32 h-28 flex flex-col items-center justify-center bg-gray-200 rounded-lg cursor-not-allowed">
              <PlusCircle className="text-gray-400" size={28} />
              <span className="text-xs text-gray-400 mt-1">Max {MAX_POSTERS}</span>
            </div>
          )}
        </div>
      </div>
    </>
  );
}