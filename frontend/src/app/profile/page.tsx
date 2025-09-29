"use client";
import EventCard from "../components/EventCard";
import { ChevronRightIcon } from "@heroicons/react/24/outline";
import { ChevronLeftIcon } from "@heroicons/react/20/solid";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { apiService, type User } from "../../lib/api";

// Fetch Data from example.json
import eventsData from "../example.json";

const events = eventsData.events;

// ------------------------------------


export default function Profile() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const result = await apiService.getCurrentUser();
        if (result.success && result.data) {
          setUser(result.data);
        } else {
          setError(result.error || 'Failed to load profile');
        }
      } catch (err) {
        console.error('Network error:', err);
        setError('Network error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  // Show loading state
  if (loading) {
    return (
      <div className="relative min-h-screen">
        <div className="absolute inset-0 h-[115px] bg-gradient-to-b from-[#B4DDB6] to-white">
          <Image
            src="/mountain.svg"
            alt="mountain"
            width={1920}
            height={510}
            className="flex absolute inset-x-0 top-0 w-full h-40 object-cover opacity-90"
          />
        </div>
        <div className="relative p-6">
          <button
            onClick={() => router.back()}
            className="absolute flex items-center gap-1 font-extrabold text-lg bg-white rounded-lg px-3 py-1 ring-[2px] ring-[#B4DDB6]
            hover:scale-105 transition-transform duration-200 hover:cursor-pointer hover:shadow-md"
          >
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

  // Show error state
  if (error) {
    return (
      <div className="relative min-h-screen">
        <div className="absolute inset-0 h-[115px] bg-gradient-to-b from-[#B4DDB6] to-white">
          <Image
            src="/mountain.svg"
            alt="mountain"
            width={1920}
            height={510}
            className="flex absolute inset-x-0 top-0 w-full h-40 object-cover opacity-90"
          />
        </div>
        <div className="relative p-6">
          <button
            onClick={() => router.back()}
            className="absolute flex items-center gap-1 font-extrabold text-lg bg-white rounded-lg px-3 py-1 ring-[2px] ring-[#B4DDB6]
            hover:scale-105 transition-transform duration-200 hover:cursor-pointer hover:shadow-md"
          >
            <ChevronLeftIcon className="w-5 h-5" />
            Back
          </button>
          <div className="flex justify-center items-center h-96">
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
              <h3 className="text-red-800 font-semibold mb-2">Error Loading Profile</h3>
              <p className="text-red-600">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="mt-4 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Get display name based on user data
  const displayName = user 
    ? `${user.title || ''} ${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email
    : 'Unknown User';

  return (
    <div className="relative">
      {/* Background gradient */}
      <div className="absolute inset-0 h-[115px] bg-gradient-to-b from-[#B4DDB6] to-white" >
        <Image
          src="/mountain.svg"
          alt="mountain"
          width={1920}
          height={510}
          className="flex absolute inset-x-0 top-0 w-full h-40 object-cover opacity-90  "
        />
      </div>

      {/* content */}
      <div className="relative p-6">

      {/* Back button */}
        <button
          onClick={() => router.back()}
          className="absolute flex items-center gap-1 font-extrabold text-lg bg-white rounded-lg px-3 py-1 ring-[2px] ring-[#B4DDB6]
          hover:scale-105 transition-transform duration-200 hover:cursor-pointer hover:shadow-md"
        >
          <ChevronLeftIcon className="w-5 h-5" />
          Back
        </button>


        {/* Profile card */}
        <div className="flex flex-col sm:flex-row items-center p-8 
                  space-y-4 sm:space-y-0 sm:space-x-8 
                  ml-0 sm:ml-4 md:ml-8 lg:ml-16 
                  transition-all duration-300">
          <Image
            src="/avatar.jpg"
            alt="profile"
            width={120}
            height={120}
            className="p-[4px] bg-gradient-to-t from-[#ACE9A9] to-[#CCDDCA] rounded-full object-cover"
          />
          <div>
            <h2 className="font-extrabold text-lg bg-white rounded-lg px-6 py-1 ring-[2px] ring-[#B4DDB6]">{displayName}</h2>
          </div>
        </div>

        {/* Profile Information */}
        <div className="flex flex-col w-full max-w-4xl mx-auto mb-8 p-6 
                bg-gradient-to-b from-[#D7EBCA]/50 to-[#EDFFCC]/50 
                rounded-3xl shadow-md">
          {user?.role === 'student' && user.profile && (
            <div className="font-extrabold ml-8 mr-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 gap-y-4 text-sm">
              {/* Row 1 */}
              <div className="flex justify-between items-center">
                <span>Student ID</span>
                <b className="w-48 h-7 bg-white px-4 py-1 ring-1 ring-[#B4DDB6] rounded-xl mr-8">
                  {user.profile.student_id_external || 'N/A'}
                </b>
              </div>
              {/* Row 2 */}
              <div className="flex justify-between items-center">
                <span>Year</span>
                <b className="w-48 h-7 bg-white px-4 py-1 ring-1 ring-[#B4DDB6] rounded-xl mr-8">
                  {user.profile.year || 'N/A'}
                </b>
              </div>
              {/* Row 3 */}
              <div className="flex justify-between items-center">
                <span>Faculty</span>
                <b className="w-48 h-7 bg-white px-4 py-1 ring-1 ring-[#B4DDB6] rounded-xl mr-8">
                  {user.profile.faculty || 'N/A'}
                </b>
              </div>
              {/* Row 4 */}
              <div className="flex justify-between items-center">
                <span>Major</span>
                <b className="w-48 bg-white px-4 py-1 ring-1 ring-[#B4DDB6] rounded-xl mr-8">
                  {user.profile.major || 'N/A'}
                </b>
              </div>
            </div>
          )}

          {user?.role === 'organizer' && user.organizer_profile && (
            <div className="font-extrabold ml-8 mr-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 gap-y-4 text-sm">
              {/* Row 1 */}
              <div className="flex justify-between items-center">
                <span>Organization Type</span>
                <b className="w-48 h-7 bg-white px-4 py-1 ring-1 ring-[#B4DDB6] rounded-xl mr-8">
                  {user.organizer_profile.organization_type === 'internal' ? 'Kasetsart University' : 
                   user.organizer_profile.organization_type === 'external' ? 'External Organization' : 'N/A'}
                </b>
              </div>
              {/* Row 2 */}
              <div className="flex justify-between items-center">
                <span>Organization Name</span>
                <b className="w-48 h-7 bg-white px-4 py-1 ring-1 ring-[#B4DDB6] rounded-xl mr-8">
                  {user.organizer_profile.organization_name || 'N/A'}
                </b>
              </div>
              {/* Row 3 */}
              <div className="flex justify-between items-center">
                <span>Email</span>
                <b className="w-48 h-7 bg-white px-4 py-1 ring-1 ring-[#B4DDB6] rounded-xl mr-8">
                  {user.email}
                </b>
              </div>
              {/* Row 4 */}
              <div className="flex justify-between items-center">
                <span>Role</span>
                <b className="w-48 bg-white px-4 py-1 ring-1 ring-[#B4DDB6] rounded-xl mr-8">
                  {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                </b>
              </div>
            </div>
          )}

          {user?.role === 'admin' && (
            <div className="font-extrabold ml-8 mr-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 gap-y-4 text-sm">
              {/* Row 1 */}
              <div className="flex justify-between items-center">
                <span>Email</span>
                <b className="w-48 h-7 bg-white px-4 py-1 ring-1 ring-[#B4DDB6] rounded-xl mr-8">
                  {user.email}
                </b>
              </div>
              {/* Row 2 */}
              <div className="flex justify-between items-center">
                <span>Role</span>
                <b className="w-48 h-7 bg-white px-4 py-1 ring-1 ring-[#B4DDB6] rounded-xl mr-8">
                  Administrator
                </b>
              </div>
              {/* Row 3 */}
              <div className="flex justify-between items-center">
                <span>First Name</span>
                <b className="w-48 h-7 bg-white px-4 py-1 ring-1 ring-[#B4DDB6] rounded-xl mr-8">
                  {user.first_name || 'N/A'}
                </b>
              </div>
              {/* Row 4 */}
              <div className="flex justify-between items-center">
                <span>Last Name</span>
                <b className="w-48 bg-white px-4 py-1 ring-1 ring-[#B4DDB6] rounded-xl mr-8">
                  {user.last_name || 'N/A'}
                </b>
              </div>
            </div>
          )}
        </div>

        

        {/* My Event */}
        <section className="mb-6">
          <h3 className="font-bold text-xl mb-2">My Event</h3>
          <div className="flex items-center">
            <div className="flex gap-4 overflow-x-auto">
              {events.map((e, i) => (
                <EventCard key={i} {...e} />
              ))}
            </div>
            <button className="ml-2 p-2 rounded-full bg-gray-200 hover:bg-gray-300">
              <ChevronRightIcon className="w-5 h-5" />
            </button>
          </div>
        </section>

        {/* Favorite Event */}
        <section>
          <h3 className="font-bold text-xl mb-2">
            Favorite Event <span>⭐</span>
          </h3>
          <div className="flex items-center">
            <div className="flex gap-4 overflow-x-auto">
              {events.map((event, i) => (
                <EventCard key={i} {...event} />
              ))}
            </div>
            <button className="ml-2 p-2 rounded-full bg-gray-200 hover:bg-gray-300">
              <ChevronRightIcon className="w-5 h-5" />
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
