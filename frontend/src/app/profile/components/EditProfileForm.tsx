"use client";
import React, { useState } from 'react';
import { useRouter } from "next/navigation";
import { ChevronLeftIcon } from "@heroicons/react/20/solid";
import Image from "next/image";
import { apiService, type User } from "../../../lib/api";
import { Dropdown } from "../dropdown";
import { 
  validateEmail, 
  validateProfileForm, 
  TITLE_OPTIONS, 
  YEAR_OPTIONS, 
  ORGANIZATION_TYPE_OPTIONS 
} from "../validation";
import HeroImage from '@/app/components/HeroImage';

interface EditProfileFormProps {
  user: User;
  initialData: {
    title: string;
    first_name: string;
    last_name: string;
    email: string;
    profile: {
      student_id_external: string;
      year: string;
      faculty: string;
      major: string;
    };
    organizer_profile: {
      organization_type: string;
      organization_name: string;
    };
  };
}

export const EditProfileForm: React.FC<EditProfileFormProps> = ({ user, initialData }) => {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState(initialData);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [imageError, setImageError] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;

    if (fieldErrors[name]) {
      setFieldErrors(prev => ({ ...prev, [name]: "" }));
    }

    if (name === "email" && value) {
      const isValidEmail = validateEmail(value);
      if (!isValidEmail) {
        setFieldErrors(prev => ({ ...prev, email: "Please enter a valid email address" }));
      } else {
        setFieldErrors(prev => ({ ...prev, email: "" }));
      }
    }

    if (name.startsWith("profile.")) {
      const profileField = name.split(".")[1];
      setFormData(prev => ({
        ...prev,
        profile: {
          ...prev.profile,
          [profileField]: value,
        },
      }));
    } else if (name.startsWith("organizer_profile.")) {
      const orgField = name.split(".")[1];
      setFormData(prev => ({
        ...prev,
        organizer_profile: {
          ...prev.organizer_profile,
          [orgField]: value,
        },
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleDropdownChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleYearChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      profile: { ...prev.profile, year: value },
    }));
  };

  const handleOrganizationTypeChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      organizer_profile: { ...prev.organizer_profile, organization_type: value },
    }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setFieldErrors(prev => ({ ...prev, profile_image: 'Please select an image file' }));
        return;
      }
      
      // Validate file size (e.g., 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setFieldErrors(prev => ({ ...prev, profile_image: 'Image size must be less than 5MB' }));
        return;
      }

      setSelectedImage(file);
      setFieldErrors(prev => ({ ...prev, profile_image: '' }));
      
      // Create preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setFormError(null);
    
    const errors = validateProfileForm(formData);
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setSaving(false);
      return;
    }

    try {
      if (!user) {
        throw new Error("User data not loaded");
      }

      // First, upload profile image if selected
      if (selectedImage) {
        const uploadResult = await apiService.uploadProfileImage(user.id, selectedImage);
        if (!uploadResult.success) {
          setFormError('Failed to upload profile image: ' + uploadResult.error);
          setSaving(false);
          return;
        }
        console.log('Profile image uploaded successfully');
      }

      const updateData: {
        title: string;
        first_name: string;
        last_name: string;
        email: string;
        year?: number;
        faculty?: string;
        major?: string;
        organization_type?: string;
        organization_name?: string;
      } = {
        title: formData.title,
        first_name: formData.first_name,
        last_name: formData.last_name,
        email: formData.email,
      };

      if (user.role === 'student') {
        updateData.year = parseInt(formData.profile.year) || 0;
        updateData.faculty = formData.profile.faculty;
        updateData.major = formData.profile.major;
      } else if (user.role === 'organizer') {
        updateData.organization_type = formData.organizer_profile.organization_type;
        updateData.organization_name = formData.organizer_profile.organization_name;
      }

      const result = await apiService.updateUser(user.id, updateData as Partial<User>);
      
      if (result.success) {
        // Add a small delay to ensure the backend has processed the image
        await new Promise(resolve => setTimeout(resolve, 500));
        // Navigate to profile page with cache busting
        router.push("/profile");
        router.refresh(); // Force page refresh to show new image
        // Force reload to ensure fresh data
        window.location.href = "/profile";
      } else {
        if (typeof result.error === 'object') {
          const apiErrors: Record<string, string> = {};
          Object.entries(result.error).forEach(([key, messages]) => {
            if (Array.isArray(messages) && messages.length > 0) {
              apiErrors[key] = messages[0];
            }
          });
          setFieldErrors(apiErrors);
        } else {
          setFormError(result.error || 'Failed to update profile');
        }
      }
    } catch (err) {
      setFormError('Failed to update profile: ' + (err instanceof Error ? err.message : 'Unknown error'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="relative pt-6 px-4">
      <HeroImage containerHeight='120px' mountainHeight='140px' />

      <div className="relative p-6">
        <button
          onClick={() => router.back()}
            className="absolute left-6 top-6 flex items-center gap-1 font-extrabold text-white bg-[#215701] rounded px-4 py-2
          hover:bg-[#00361C] transition-all duration-200 hover:cursor-pointer hover:shadow-md">
          <ChevronLeftIcon className="w-5 h-5" />
          Back
        </button>

        <div className="flex flex-col items-center p-8 space-y-4 ml-0 sm:ml-4 md:ml-8 lg:ml-16 transition-all duration-300">
          <div className="relative">
            <div className="w-[120px] h-[120px] rounded-full p-[4px] bg-gradient-to-t from-[#ACE9A9] to-[#CCDDCA]">
              <Image
                src={previewUrl || (imageError ? '/avatar.jpg' : apiService.getProfileImageUrl(user?.profile_image))}
                alt="profile"
                width={120}
                height={120}
                className="w-full h-full rounded-full object-cover"
                unoptimized
                onError={() => {
                  console.error('Failed to load profile image in edit form');
                  setImageError(true);
                }}
              />
            </div>
            <input
              type="file"
              id="profile-image-upload"
              accept="image/*"
              onChange={handleImageChange}
              className="hidden"
            />
            <label
              htmlFor="profile-image-upload"
              className="absolute bottom-2 right-2 bg-green-500 text-white p-1 rounded-full hover:bg-green-600 transition-colors cursor-pointer"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </label>
          </div>
          {fieldErrors.profile_image && (
            <p className="text-sm text-red-600 mt-2">{fieldErrors.profile_image}</p>
          )}
          
          <h1 className="text-2xl font-bold text-gray-800">Edit Profile</h1>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col w-full max-w-4xl mx-auto mb-8 p-6 
                bg-gradient-to-b from-[#D7EBCA]/50 to-[#EDFFCC]/50 
                rounded-3xl shadow-md">
          
          {formError && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600 text-sm">{formError}</p>
            </div>
          )}

          <div className="font-extrabold ml-8 mr-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 gap-y-6 text-sm mb-6">
            <div className="flex justify-between items-center">
              <span>Title</span>
              <div className="w-48 mr-8">
                <Dropdown
                  value={formData.title}
                  onChange={(value) => handleDropdownChange('title', value)}
                  options={TITLE_OPTIONS}
                  placeholder="Select Title"
                  error={fieldErrors.title}
                />
                {fieldErrors.title && <p className="mt-1 text-sm text-red-600">{fieldErrors.title}</p>}
              </div>
            </div>

            <div className="flex justify-between items-center">
              <span>First Name</span>
              <div className="w-48 mr-8">
                <input
                  type="text"
                  name="first_name"
                  value={formData.first_name}
                  onChange={handleInputChange}
                  className={`w-full h-7 bg-white px-4 py-1 ring-1 ${
                    fieldErrors.first_name ? 'ring-red-500' : 'ring-[#B4DDB6]'
                  } rounded-xl`}
                />
                {fieldErrors.first_name && <p className="mt-1 text-sm text-red-600">{fieldErrors.first_name}</p>}
              </div>
            </div>

            <div className="flex justify-between items-center">
              <span>Last Name</span>
              <div className="w-48 mr-8">
                <input
                  type="text"
                  name="last_name"
                  value={formData.last_name}
                  onChange={handleInputChange}
                  className={`w-full h-7 bg-white px-4 py-1 ring-1 ${
                    fieldErrors.last_name ? 'ring-red-500' : 'ring-[#B4DDB6]'
                  } rounded-xl`}
                />
                {fieldErrors.last_name && <p className="mt-1 text-sm text-red-600">{fieldErrors.last_name}</p>}
              </div>
            </div>

            <div className="flex justify-between items-center">
              <span>Email</span>
              <div className="w-48 mr-8">
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className={`w-full h-7 bg-white px-4 py-1 ring-1 ${
                    fieldErrors.email ? 'ring-red-500' : 'ring-[#B4DDB6]'
                  } rounded-xl`}
                />
                {fieldErrors.email && <p className="mt-1 text-sm text-red-600">{fieldErrors.email}</p>}
              </div>
            </div>
          </div>

          {user?.role === 'student' && (
            <div className="font-extrabold ml-8 mr-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 gap-y-6 text-sm mb-6">
              <div className="flex justify-between items-center">
                <span>Student ID</span>
                <input
                  type="text"
                  name="profile.student_id_external"
                  value={formData.profile.student_id_external}
                  onChange={handleInputChange}
                  readOnly
                  className="w-48 h-7 bg-white px-4 py-1 ring-1 ring-[#B4DDB6] rounded-xl mr-8"
                />
              </div>

              <div className="flex justify-between items-center">
                <span>Year</span>
                <div className="w-48 mr-8">
                  <Dropdown
                    value={formData.profile.year}
                    onChange={handleYearChange}
                    options={YEAR_OPTIONS}
                    placeholder="Select Year"
                  />
                </div>
              </div>

              <div className="flex justify-between items-center">
                <span>Faculty</span>
                <input
                  type="text"
                  name="profile.faculty"
                  value={formData.profile.faculty}
                  onChange={handleInputChange}
                  className="w-48 h-7 bg-white px-4 py-1 ring-1 ring-[#B4DDB6] rounded-xl mr-8"
                />
              </div>

              <div className="flex justify-between items-center">
                <span>Major</span>
                <input
                  type="text"
                  name="profile.major"
                  value={formData.profile.major}
                  onChange={handleInputChange}
                  className="w-48 h-7 bg-white px-4 py-1 ring-1 ring-[#B4DDB6] rounded-xl mr-8"
                />
              </div>
            </div>
          )}

          {user?.role === 'organizer' && (
            <div className="font-extrabold ml-8 mr-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 gap-y-6 text-sm mb-6">
              <div className="flex justify-between items-center">
                <span>Organization Type</span>
                <div className="w-48 mr-8">
                  <Dropdown
                    value={formData.organizer_profile.organization_type}
                    onChange={handleOrganizationTypeChange}
                    options={ORGANIZATION_TYPE_OPTIONS}
                    placeholder="Select Type"
                  />
                </div>
              </div>

              <div className="flex justify-between items-center">
                <span>Organization Name</span>
                <input
                  type="text"
                  name="organizer_profile.organization_name"
                  value={formData.organizer_profile.organization_name}
                  onChange={handleInputChange}
                  className="w-48 h-7 bg-white px-4 py-1 ring-1 ring-[#B4DDB6] rounded-xl mr-8"
                />
              </div>
            </div>
          )}

          <div className="flex justify-center space-x-4 mt-6">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2 bg-[#215701] text-white rounded-lg hover:bg-[#00361C] disabled:opacity-50 transition-colors"
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};