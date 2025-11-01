"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeftIcon } from "@heroicons/react/20/solid";
import { apiService, type User } from "../../../lib/api";
import { EditProfileForm } from "../components/EditProfileForm";
import HeroImage from "@/app/components/HeroImage";

export default function EditProfile() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const result = await apiService.getCurrentUser();
        if (result.success && result.data) {
          setUser(result.data);
        } else {
          setFormError(result.error || 'Failed to load profile');
        }
      } catch {
        setFormError('Network error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  if (loading) {
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
          <div className="flex justify-center items-center h-96">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
          </div>
        </div>
      </div>
    );
  }

  if (formError || !user) {
    return (
      <div className="relative min-h-screen pt-6 px-4">
        <HeroImage containerHeight='120px' mountainHeight='140px' />
        <div className="relative p-6">
          <button
            onClick={() => router.back()}
            className="absolute left-6 top-6 flex items-center gap-1 font-extrabold text-white bg-[#215701] rounded px-4 py-2
           hover:bg-[#00361C] transition-all duration-200 hover:cursor-pointer hover:shadow-md">
            <ChevronLeftIcon className="w-5 h-5" />
            Back
          </button>
          <div className="flex justify-center items-center h-96">
            <div className="text-center">
              <h2 className="text-xl font-bold text-red-600 mb-2">Error Loading Profile</h2>
              <p className="text-gray-600">{formError || "User data not found"}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const initialData = {
    title: user.title || "",
    first_name: user.first_name || "",
    last_name: user.last_name || "",
    email: user.email || "",
    profile: {
      student_id_external: user.profile?.student_id_external || "",
      year: user.profile?.year?.toString() || "",
      faculty: user.profile?.faculty || "",
      major: user.profile?.major || "",
    },
    organizer_profile: {
      organization_type: user.organizer_profile?.organization_type || "internal",
      organization_name: user.organizer_profile?.organization_name || "",
    },
  };

  return <EditProfileForm user={user} initialData={initialData} />;
}