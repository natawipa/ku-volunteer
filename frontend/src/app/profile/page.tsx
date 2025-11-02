"use client";

import React, { useEffect, useState, useRef } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ChevronLeft, Camera } from "lucide-react";
import HeroImage from "../components/HeroImage";
import { apiService, User, UserUpdate, StudentProfileUpdate, OrganizerProfile } from "../../lib/api";
import { activitiesApi } from "../../lib/activities";
import EventCardSquare from "../components/EventCard/EventCardSquare";
import { getMyEvents } from "../components/EventCard/utils";
import type { EventCardData, EventFilterConfig } from "../components/EventCard/utils";
import type { Activity, ActivityApplication } from "../../lib/types";
import { auth } from "../../lib/utils";
import { validateImageFile, validateProfileForm, YEAR_OPTIONS, ORGANIZATION_TYPE_OPTIONS } from "./validation";

// Profile field configuration
const profileFields = [
  { key: 'first_name', label: 'First Name', type: 'text', roles: ['student', 'organizer'] },
  { key: 'last_name', label: 'Last Name', type: 'text', roles: ['student', 'organizer'] },
  { key: 'profile.student_id_external', label: 'Student ID', type: 'text', roles: ['student'], editable: false },
  { key: 'profile.year', label: 'Year', type: 'number', roles: ['student'] },
  { key: 'profile.faculty', label: 'Faculty', type: 'text', roles: ['student'] },
  { key: 'profile.major', label: 'Major', type: 'text', roles: ['student'] },
  { key: 'organizer_profile.organization_name', label: 'Organization Name', type: 'text', roles: ['organizer'] },
  { key: 'organizer_profile.organization_type', label: 'Organization Type', type: 'text', roles: ['organizer'] },
];

const getNestedValue = (obj: unknown, path: string): string | number | undefined => {
  if (typeof obj !== 'object' || obj === null) return undefined;

  const result = path.split('.').reduce<unknown>((acc, part) => {
    if (typeof acc === 'object' && acc !== null && Object.prototype.hasOwnProperty.call(acc, part)) {
      return (acc as Record<string, unknown>)[part];
    }
    return undefined;
  }, obj);

  if (typeof result === 'string' || typeof result === 'number') return result;
  return undefined;
};

export default function Profile() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [formData, setFormData] = useState<UserUpdate>({});
  const [isEditing, setIsEditing] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageError, setImageError] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [saveLoading, setSaveLoading] = useState(false);

  // Events state (for My Events section)
  const [activities, setActivities] = useState<Activity[]>([]);
  const [userApplications, setUserApplications] = useState<ActivityApplication[]>([]);
  const [myEvents, setMyEvents] = useState<EventCardData[]>([]);
  const [eventsLoading, setEventsLoading] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Fetch current user
  useEffect(() => {
    async function fetchUser() {
      const res = await apiService.getCurrentUser();
      if (res.success && res.data) {
        setUser(res.data);
        setFormData({
          first_name: res.data.first_name,
          last_name: res.data.last_name,
          email: res.data.email,
          profile: res.data.profile
            ? {
                student_id_external: res.data.profile.student_id_external,
                year: res.data.profile.year,
                faculty: res.data.profile.faculty,
                major: res.data.profile.major,
              }
            : undefined,
          organizer_profile: res.data.organizer_profile
            ? {
                organization_name: res.data.organizer_profile.organization_name,
                organization_type: res.data.organizer_profile.organization_type,
              }
            : undefined,
        });
      }
    }
    fetchUser();
  }, []);

  // Fetch activities and applications for My Events section
  useEffect(() => {
    const fetchEvents = async () => {
      setEventsLoading(true);
      try {
        const activitiesRes = await activitiesApi.getActivities();
        if (activitiesRes.success && activitiesRes.data) {
          setActivities(activitiesRes.data);
        } else {
          setActivities([]);
        }

        // If authenticated student, fetch their applications
        if (auth.isAuthenticated()) {
          const appsRes = await activitiesApi.getUserApplications();
          if (appsRes.success && appsRes.data) setUserApplications(appsRes.data);
        }

        // compute my events whenever we have activities and user info
      } catch (err) {
        console.error('Failed to fetch events for profile page', err);
        setActivities([]);
        setUserApplications([]);
      } finally {
        setEventsLoading(false);
      }
    };

    fetchEvents();
  }, []);

  // Recompute myEvents when activities, user, or applications change
  useEffect(() => {
    const cfg: EventFilterConfig = {
      activities,
      userRole: user?.role || auth.getUserRole(),
      isAuthenticated: auth.isAuthenticated(),
      userApplications,
      organizerProfileId: user?.organizer_profile?.id ?? null,
    };

    try {
      const computed = getMyEvents(cfg);
      setMyEvents(computed || []);
    } catch (e) {
      console.error('Failed to compute myEvents', e);
      setMyEvents([]);
    }
  }, [activities, user, userApplications]);

  const handleImageClick = () => {
    if (isEditing) fileInputRef.current?.click();
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validation = validateImageFile(file);
    if (!validation.valid) {
      setFormErrors({ profile_image: validation.error || "" });
      return;
    }

    // Preview image
    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result as string);
    reader.readAsDataURL(file);

    if (user?.id) {
      const res = await apiService.uploadProfileImage(user.id, file);
      if (res.success && res.data) {
        setUser(res.data);
        setImagePreview(apiService.getProfileImageUrl(res.data.profile_image));
      } else {
        setFormErrors({ profile_image: res.error || "Upload failed" });
      }
    }
  };

  const handleChange = (field: string, value: string | number) => {
    // clear field-specific error when user edits the field
    setFormErrors((prev) => {
      if (!prev || !prev[field]) return prev;
      const copy = { ...prev };
      delete copy[field];
      return copy;
    });

    if (field === 'first_name' || field === 'last_name' || field === 'email') {
      setFormData((prev) => ({ ...prev, [field]: value }));
    } else if (field === 'profile.student_id_external') {
      setFormData((prev) => ({
        ...prev,
        profile: {
          student_id_external: value as string,
          year: prev.profile?.year,
          faculty: prev.profile?.faculty,
          major: prev.profile?.major,
        },
      }));
    } else if (field === 'profile.year') {
      setFormData((prev) => ({
        ...prev,
        profile: {
          student_id_external: prev.profile?.student_id_external,
          // allow clearing the year (empty string) which will become undefined
          year: value === "" ? undefined : Number(value),
          faculty: prev.profile?.faculty,
          major: prev.profile?.major,
        },
      }));
    } else if (field === 'profile.faculty') {
      setFormData((prev) => ({
        ...prev,
        profile: {
          student_id_external: prev.profile?.student_id_external,
          year: prev.profile?.year,
          faculty: value as string,
          major: prev.profile?.major,
        },
      }));
    } else if (field === 'profile.major') {
      setFormData((prev) => ({
        ...prev,
        profile: {
          student_id_external: prev.profile?.student_id_external,
          year: prev.profile?.year,
          faculty: prev.profile?.faculty,
          major: value as string,
        },
      }));
    } else if (field === 'organizer_profile.organization_name') {
      setFormData((prev) => ({
        ...prev,
        organizer_profile: {
          organization_name: value as string,
          organization_type: prev.organizer_profile?.organization_type || '',
          id: prev.organizer_profile?.id,
        },
      }));
    } else if (field === 'organizer_profile.organization_type') {
      setFormData((prev) => ({
        ...prev,
        organizer_profile: {
          organization_name: prev.organizer_profile?.organization_name || '',
          organization_type: value as string,
          id: prev.organizer_profile?.id,
        },
      }));
    }
  };

  const handleSave = async () => {
    if (!user?.id) return;
    // Validate before submitting
    const base = validateProfileForm({
      first_name: (formData.first_name as string) || "",
      last_name: (formData.last_name as string) || "",
      email: (formData.email as string) || "",
    });

    const errors: Record<string, string> = { ...(base || {}) };

    // Role-specific validations
    if (user?.role === 'student') {
      const pf = (formData.profile as StudentProfileUpdate) || {};
      if (!pf.student_id_external || String(pf.student_id_external).trim() === '') {
        errors['profile.student_id_external'] = 'Student ID is required';
      }
      if (!pf.year || Number(pf.year) <= 0) {
        errors['profile.year'] = 'Year is required';
      }
    }

    if (user?.role === 'organizer') {
      const op = (formData.organizer_profile as OrganizerProfile) || {};
      if (!op.organization_name || String(op.organization_name).trim() === '') {
        errors['organizer_profile.organization_name'] = 'Organization name is required';
      }
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      // scroll to first error (optional)
      const firstKey = Object.keys(errors)[0];
      // try to focus corresponding input by name attribute if present
      const el = document.querySelector(`[name="${firstKey}"]`) as HTMLElement | null;
      if (el) el.focus();
      return;
    }

    setSaveLoading(true);
    // Cast formData to Partial<User> for the API call
    // Backend UserSerializer expects student profile fields (year, faculty, major)
    // and organizer fields (organization_type, organization_name) as top-level
    // write-only fields. Flatten nested objects accordingly before sending.
    type UpdatePayload = Partial<User> & {
      year?: number;
      faculty?: string;
      major?: string;
      organization_type?: string;
      organization_name?: string;
      profile?: unknown;
      organizer_profile?: unknown;
    };

    const payload: UpdatePayload = { ...(formData as Partial<User>) };

    if (formData.profile) {
      const pf = formData.profile as StudentProfileUpdate;
      if (pf.year !== undefined) payload.year = pf.year;
      if (pf.faculty !== undefined) payload.faculty = pf.faculty;
      if (pf.major !== undefined) payload.major = pf.major;
      // student_id_external is intentionally read-only on update in the backend serializer,
      // so we don't attempt to send it here (and the field is non-editable in the UI).
      delete payload.profile;
    }

    if (formData.organizer_profile) {
      const op = formData.organizer_profile as OrganizerProfile;
      if (op.organization_type !== undefined) payload.organization_type = op.organization_type;
      if (op.organization_name !== undefined) payload.organization_name = op.organization_name;
      delete payload.organizer_profile;
    }

    const res = await apiService.updateUser(user.id, payload as Partial<User>);
    setSaveLoading(false);

    if (res.success && res.data) {
      setUser(res.data);
      setIsEditing(false);
      setFormErrors({});
    } else {
      alert(res.error);
    }
  };

  const handleCancel = () => {
    if (user) {
      setFormData({
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
        profile: user.profile ? {
          student_id_external: user.profile.student_id_external,
          year: user.profile.year,
          faculty: user.profile.faculty,
          major: user.profile.major,
        } : undefined,
        organizer_profile: user.organizer_profile ? {
          organization_name: user.organizer_profile.organization_name,
          organization_type: user.organizer_profile.organization_type,
        } : undefined,
      });
    }
    setIsEditing(false);
  };

  const displayName = `${formData.first_name || ""} ${formData.last_name || ""}`.trim() || "User";

  return (
    <div className="relative min-h-screen">
      <HeroImage containerHeight="160px" mountainHeight="130px" />
      <div className="h-[160px]" aria-hidden="true" />

      {/* Back Button */}
      <div className="relative pt-6 px-4">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-4"
        >
          <ChevronLeft className="w-5 h-5" />
          <span>Back</span>
        </button>
      </div>

      {/* Profile Info */}
      <div className="relative px-4">
        <div className="flex w-full items-center justify-between mb-8">
          <div className="flex items-center gap-6">
            {/* Profile Image */}
            <div
              className="relative group cursor-pointer"
              onClick={handleImageClick}
            >
              <Image
                src={
                  imagePreview || 
                  (imageError ? "/avatar.jpg" : apiService.getProfileImageUrl(user?.profile_image))
                }
                alt="profile"
                width={80}
                height={80}
                className="w-[80px] h-[80px] rounded-full object-cover border-4 border-white shadow"
                unoptimized
                onError={() => setImageError(true)}
              />

              {/* Hover camera icon when editing */}
              {isEditing && (
                <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <Camera className="w-6 h-6 text-white" />
                </div>
              )}

              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
              />
            </div>

            <div>
              <h2 className="font-bold text-2xl text-gray-900">{displayName}</h2>
              <p className="text-gray-500 text-base">{user?.email}</p>
            </div>
          </div>

          {/* Edit / Save / Cancel Buttons */}
          {!isEditing ? (
            <button
              onClick={() => setIsEditing(true)}
              className="btn bg-[#215701] text-white px-4 py-2 rounded hover:bg-[#00361C] transition-all duration-200"
            >
              Edit
            </button>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={handleCancel}
                disabled={saveLoading}
                className="btn bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400 transition-all duration-200 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saveLoading}
                className="btn bg-[#215701] text-white px-4 py-2 rounded hover:bg-[#00361C] transition-all duration-200 disabled:opacity-50"
              >
                {saveLoading ? "Saving..." : "Save"}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Profile Details */}
      <div className="relative px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-4">
          {profileFields
            .filter(field => field.roles.includes(user?.role || ''))
            .map((field) => {
              const disabled = !isEditing || field.editable === false;
              return (
                <div key={field.key}>
                  <label className="block text-sm font-semibold text-gray-600 mb-1">
                    {field.label}
                  </label>

                  {/* Render dropdown for year and organization type, or default input. Honor field.editable */}
                  {field.key === 'profile.year' ? (
                    <select
                      name={field.key}
                      value={String(getNestedValue(formData, field.key) ?? "")}
                      onChange={(e) => handleChange(field.key, e.target.value)}
                      disabled={disabled}
                      className="w-full p-3 border rounded-lg disabled:bg-gray-100 text-gray-700"
                    >
                      <option value="">Select year</option>
                      {YEAR_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  ) : field.key === 'organizer_profile.organization_type' ? (
                    <select
                      name={field.key}
                      value={String(getNestedValue(formData, field.key) ?? "")}
                      onChange={(e) => handleChange(field.key, e.target.value)}
                      disabled={disabled}
                      className="w-full p-3 border rounded-lg disabled:bg-gray-100 text-gray-700"
                    >
                      <option value="">Select organization type</option>
                      {ORGANIZATION_TYPE_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  ) : (
                    <input
                      name={field.key}
                      type={field.type}
                      value={getNestedValue(formData, field.key) || ""}
                      onChange={(e) => handleChange(field.key, e.target.value)}
                      disabled={disabled}
                      className="w-full p-3 border rounded-lg disabled:bg-gray-100 text-gray-700"
                    />
                  )}

                  {formErrors[field.key] && (
                    <p className="text-sm text-red-600 mt-1">{formErrors[field.key]}</p>
                  )}
                </div>
              );
            })}
        </div>
      </div>

      {/* My Events Section */}
      {auth.isAuthenticated() && (
        <div className="relative px-4 mt-8">
          <h3 className="text-xl font-bold text-gray-900 mb-6">My Event</h3>

            {eventsLoading ? (
              <div className="flex items-center justify-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600" />
              </div>
            ) : (
              <div className="flex gap-4 overflow-x-auto pb-4">
                {myEvents.length ? (
                  myEvents.map((e) => (
                    <EventCardSquare key={e.id} event={e} />
                  ))
                ) : (
                  <p className="text-gray-600">You have no events yet.</p>
                )}
              </div>
            )}
          </div>
        )}
    </div>
  );
}