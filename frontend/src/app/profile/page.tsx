"use client";
import EventCardSquare from "../components/EventCard/EventCardSquare";
import { transformActivityToEvent } from "../components/EventCard/utils"
import { ChevronRightIcon } from "@heroicons/react/24/outline";
import { ChevronLeftIcon } from "@heroicons/react/20/solid";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { apiService, type User } from "../../lib/api";
import { activitiesApi } from "../../lib/activities";
import { type Activity } from "../../lib/types";
import Link from "next/link";


export default function Profile() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [events, setEvents] = useState<Activity[]>([]);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const result = await apiService.getCurrentUser();
        if (result.success && result.data) {
          const userData = result.data;
          setUser(userData);
          
          // get user's events based on role
          if (userData.role === 'organizer') {
            const eventsResult = await activitiesApi.getActivities();
            if (eventsResult.success && eventsResult.data) {
              // Filter events
              const userOrganizationName = userData.organizer_profile?.organization_name;
              
              if (userOrganizationName) {
                const userEvents = eventsResult.data.filter(activity => 
                  activity.organizer_name === userOrganizationName
                ) || [];
                
                setEvents(userEvents.slice(0, 4));
                console.log(`Found ${userEvents.length} activities for organization: ${userOrganizationName}`);
              } else {
                // show empty for no event with this organization name
                setEvents([]);
                console.log('No organization name found for user');
              }
            }
          } else if (userData.role === 'student') {
            // student dont have event yet
            setEvents([]);
          }
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
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-b from-[#DAE9DC] to-white h-[99px]">
          <Image
            src="/images/wavewave.png"
            alt="mountain"
            width={1920}
            height={510}
            className="fixed w-full h-[310px] inset-0 -top-16 object-cover"
          />
        </div>
        <div className="relative p-6">
          <button
            onClick={() => router.push("/")}
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
            onClick={() => {
              router.push('/');
            }}
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


  const displayName = user 
    ? `${user.title || ''} ${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email
    : 'Unknown User';

  return (
    <div className="relative">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#DAE9DC] to-white h-[20vh]"></div>

      {/* Mountain background */}
      <Image
        src="/mountain.svg"
        alt="mountain"
        width={1920}
        height={510}
        className="w-full h-[50vh] absolute inset-0 -top-26 object-cover"
      />

      {/* content */}
      <div className="relative p-6">

      {/* Back button */}
        <button
          onClick={() => {
            router.push('/');
          }}
          className="absolute left-6 top-6 flex items-center gap-1 font-extrabold text-white bg-[#215701] rounded px-4 py-2
          hover:bg-[#00361C] transition-all duration-200 hover:cursor-pointer hover:shadow-md"
        >
          <ChevronLeftIcon className="w-5 h-5" />
          Back
        </button>

      {/* Update Profile */}
        <Link href="/profile/edit" className="absolute right-6 top-6 flex items-center gap-1 font-extrabold text-white bg-[#215701] rounded px-4 py-2 hover:bg-[#00361C] transition-all duration-200 hover:cursor-pointer hover:shadow-md">
            Edit
        </Link>
        
        {/* profile card */}
        <div className="flex flex-col sm:flex-row items-center sm:items-start p-8 mt-12
            space-y-4 sm:space-y-0 sm:space-x-8 
            ml-0 sm:ml-4 md:ml-8 lg:ml-16 
            transition-all duration-300">
  
        {/* profile image */}
        <div className="flex-shrink-0">
          <div className="w-[120px] h-[120px] rounded-full p-[4px] bg-gradient-to-t from-[#ACE9A9] to-[#CCDDCA]">
            <Image
              src={imageError ? '/avatar.jpg' : apiService.getProfileImageUrl(user?.profile_image)}
              alt="profile"
              width={120}
              height={120}
              className="w-full h-full rounded-full object-cover"
              unoptimized
              onError={() => {
                console.error('Failed to load profile image');
                setImageError(true);
              }}
            />
          </div>
        </div>
        
        {/* name, Info container*/}
        <div className="flex flex-col w-full items-center sm:items-start">
          <div className="mb-6 text-center sm:text-left">
            <h2 className="font-extrabold text-2xl bg-white rounded-lg px-6 py-1 ring-[2px] ring-[#B4DDB6] inline-block">
              {displayName}
            </h2>
          </div>
          
          {/* user info*/}
          <div className="w-full max-w-2xl p-4 sm:p-6 bg-white rounded-3xl ring-[2px] ring-[#B4DDB6]">
            {user?.role === 'student' && user.profile && (
              <div className="font-extrabold grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                {/* Row 1 - Student ID */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-4">
                  <span className="min-w-[100px]">Student ID</span>
                  <b className="w-full sm:w-48 bg-white px-4 py-1 ring-1 ring-[#B4DDB6] rounded-xl text-center sm:text-left truncate">
                    {user.profile.student_id_external || 'N/A'}
                  </b>
                </div>
                
                {/* Row 2 - Year */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-4">
                  <span className="min-w-[100px]">Year</span>
                  <b className="w-full sm:w-48 bg-white px-4 py-1 ring-1 ring-[#B4DDB6] rounded-xl text-center sm:text-left truncate">
                    {user.profile.year || 'N/A'}
                  </b>
                </div>
                
                {/* Row 3 - Faculty */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-4">
                  <span className="min-w-[100px]">Faculty</span>
                  <b className="w-full sm:w-48 bg-white px-4 py-1 ring-1 ring-[#B4DDB6] rounded-xl text-center sm:text-left truncate">
                    {user.profile.faculty || 'N/A'}
                  </b>
                </div>
                
                {/* Row 4 - Major */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-4">
                  <span className="min-w-[100px]">Major</span>
                  <b className="w-full sm:w-48 bg-white px-4 py-1 ring-1 ring-[#B4DDB6] rounded-xl text-center sm:text-left truncate">
                    {user.profile.major || 'N/A'}
                  </b>
                </div>
              </div>
            )}

            {user?.role === 'organizer' && user.organizer_profile && (
              <div className="font-extrabold grid grid-cols-1 gap-4 text-sm">
                {/* Row 1 */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-4">
                  <span className="min-w-[140px]">Organization Type</span>
                  <b className="w-full bg-white px-4 py-1 ring-1 ring-[#B4DDB6] rounded-xl text-center sm:text-left break-words">
                    {user.organizer_profile.organization_type === 'internal' ? 'Kasetsart University' : 
                    user.organizer_profile.organization_type === 'external' ? 'External Organization' : 'N/A'}
                  </b>
                </div>
                {/* Row 2 */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-4">
                  <span className="min-w-[140px]">Organization Name</span>
                  <b className="w-full bg-white px-4 py-1 ring-1 ring-[#B4DDB6] rounded-xl text-center sm:text-left break-words">
                    {user.organizer_profile.organization_name || 'N/A'}
                  </b>
                </div>
              </div>
            )}

            {user?.role === 'admin' && (
              <div className="font-extrabold grid grid-cols-1 gap-4 text-sm">
                {/* Row 1 */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-4">
                  <span className="min-w-[100px]">Email</span>
                  <b className="w-full bg-white px-4 py-1 ring-1 ring-[#B4DDB6] rounded-xl text-center sm:text-left break-words">
                    {user.email}
                  </b>
                </div>
                {/* Row 2 */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-4">
                  <span className="min-w-[100px]">Role</span>
                  <b className="w-full sm:w-48 bg-white px-4 py-1 ring-1 ring-[#B4DDB6] rounded-xl text-center sm:text-left">
                    Admin
                  </b>
                </div>
                {/* Row 3 */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-4">
                  <span className="min-w-[100px]">First Name</span>
                  <b className="w-full sm:w-48 bg-white px-4 py-1 ring-1 ring-[#B4DDB6] rounded-xl text-center sm:text-left break-words">
                    {user.first_name || 'N/A'}
                  </b>
                </div>
                {/* Row 4 */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-4">
                  <span className="min-w-[100px]">Last Name</span>
                  <b className="w-full sm:w-48 bg-white px-4 py-1 ring-1 ring-[#B4DDB6] rounded-xl text-center sm:text-left break-words">
                    {user.last_name || 'N/A'}
                  </b>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

        {/* My Event */}
        <section className="mb-6 px-6">
          <h3 className="font-extrabold text-2xl mb-4">My Event</h3>
          <div className="flex items-center">
            <div className="flex gap-4 overflow-x-auto pb-2">
              {events.length > 0 ? (
                events.map((activity, i) => (
                  <EventCardSquare key={activity.id || i} event={transformActivityToEvent(activity)} />
                ))
              ) : (
                <p className="text-gray-600">No events found</p>
              )}
            </div>
            {events.length > 4 && (
              <button className="ml-2 p-2 rounded-full bg-gray-200 hover:bg-gray-300 flex-shrink-0">
                <ChevronRightIcon className="w-5 h-5" />
              </button>
            )}
          </div>
        </section>

      </div>
    </div>
  );
}
