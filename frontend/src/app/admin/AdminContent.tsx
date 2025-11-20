"use client";
import Image from "next/image";
import Link from "next/link";
import { apiService, User } from "@/lib/api";
import { useEffect, useState } from 'react';
import { activitiesApi } from '../../lib/activities';

export default function AdminContent() {
  const [students, setStudents] = useState<User[]>([]);
  const [organizations, setOrganizations] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pendingCount, setPendingCount] = useState(0);
  const [approvedCount, setApprovedCount] = useState(0);
  const [rejectedCount, setRejectedCount] = useState(0);
  const [deletionRequestCount, setDeletionRequestCount] = useState(0);

  useEffect(() => {
    let mounted = true;

    async function loadUsers() {
      setLoading(true);
      setError(null);

      try {
        // Use apiService.getUserList to fetch all users
        const result = await apiService.getUserList();
        if (!mounted) return;

        if (result.success && result.data) {
          const users = result.data;
          const studentList = users.filter((u: User) => u.role === "student");
          const organizationList = users.filter((u: User) => u.role === "organizer");
          setStudents(studentList);
          setOrganizations(organizationList);
        } else {
          setError(result.error || "Failed to load users");
        }
      } catch (err: unknown) {
        if (!mounted) return;
        if (err instanceof Error) setError(err.message);
        else setError("Failed to load users");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadUsers();
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const res = await activitiesApi.getActivities();
      if (res.success && Array.isArray(res.data)) {
        setPendingCount(res.data.filter(a => a.status === 'pending').length);
        setApprovedCount(res.data.filter(a => a.status !== 'pending' && a.status !== 'rejected').length);
        setRejectedCount(res.data.filter(a => a.status === 'rejected').length);
      } else {
        setError(res.error || 'Failed to load activities');
      }
      setLoading(false);
    };
    load();
  }, []);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const res = await activitiesApi.getDeletionRequests({ status: 'pending' });
      if (res.success && Array.isArray(res.data)) {
        setDeletionRequestCount(res.data.length);
      } else {
        setError(res.error || 'Failed to load deletion requests');
      }
      setLoading(false);
    };
    load();
  }, []);

  return (
    <>
      {/* Status Navigation */}
      <h2 className="font-bold mb-6 text-2xl pt-2 mt-10 lg:mt-16 md:mt-12">Status Events</h2>
      <Link href="/admin/events/pending">
        <div className="flex items-center justify-between mb-4 bg-gradient-to-r from-green-300/25 to-yellow-300/25 p-5 rounded-lg shadow-md hover:scale-102 transition-transform duration-200 flex-1">
          <h3 className="font-semibold text-xl">
            Pending Events
          </h3>
          {pendingCount >= 0 && (
            <span className="text-gray-600 bg-green-200 px-2.5 py-1 rounded-full text-xs font-medium shadow-sm">{pendingCount} events</span>
          )}
        </div>
      </Link>
      <Link href="/admin/events/approved">
      <div className="flex items-center justify-between mb-4 bg-gradient-to-r from-blue-300/25 to-purple-300/25 p-5 rounded-lg shadow-md hover:scale-102 transition-transform duration-200 flex-1">
        <h3 className="font-semibold text-xl ">
          Approved Events</h3>
          {approvedCount >= 0 && (
            <span className="text-gray-600 bg-blue-200 px-2.5 py-1 rounded-full text-xs font-medium shadow-sm">{approvedCount} events</span>
          )}
        
      </div>
      </Link>
      <Link href="/admin/events/rejected">
      <div className="flex items-center justify-between mb-4 bg-gradient-to-r from-red-300/25 to-pink-300/25 p-5 rounded-lg shadow-md hover:scale-102 transition-transform duration-200 flex-1">
        <h3 className="font-semibold text-xl ">
          Rejected Events</h3>
          {rejectedCount >= 0 && (
            <span className="text-gray-600 bg-red-200 px-2.5 py-1 rounded-full text-xs font-medium ml-4 shadow-sm">{rejectedCount} events</span>
          )}
      </div>
      </Link>
      <Link href="/admin/events/request-delete">
      <div className="flex items-center justify-between mb-4 bg-gradient-to-r from-orange-300/25 to-amber-300/25 p-5 rounded-lg shadow-md hover:scale-102 transition-transform duration-200 flex-1">
        <h3 className="font-semibold text-xl ">
          Deletion Request</h3>
          {deletionRequestCount >= 0 && (
            <span className="text-gray-600 bg-orange-200 px-2.5 py-1 rounded-full text-xs font-medium ml-4 shadow-sm">{deletionRequestCount} events</span>
          )}
      </div>
      </Link>

      {/* User Lists */}
      <h2 className="font-bold mb-6 text-2xl pt-6">User List</h2>

      {/* Students */}
      <Link href="admin/student-list">
        <div className="shadow-lg p-4 mb-10 rounded-lg relative overflow-hidden bg-gradient-to-r from-green-300/25 to-purple-500/25 hover:scale-102 transition-transform duration-200">
          <Image src="/student.svg" alt="Student illustration" width={200} height={200} className="absolute right-0 bottom-0 opacity-50 pointer-events-none" />
          <h2 className="font-medium mb-2 relative z-10 text-xl">Student List <span className="text-gray-600">&gt;</span></h2>
          <div className="space-y-3 px-4">
            {loading && <p>Loading students...</p>}
            {error && <p className="text-red-600">{error}</p>}
            {!loading && !error && 
            students.slice().reverse().slice(0, 2).map((s, index) => (
               <div
                  key={s.id}
                  className={`flex justify-between items-center border-b pb-2 ${
                    index === 1 ? 'border-gray-300 text-gray-400' : 'border-gray-400 text-gray-700'
                  }`}
                >
                  <p className="flex-1">
                    {s.title} {s.first_name} {s.last_name}
                  </p>
                </div>
              ))}
            {!loading && !error && students.length === 0 && <p className="text-gray-400">No students found.</p>}
          </div>
        </div>
      </Link>

      {/* Organizations */}
      <Link href="admin/organization-list">
        <div className="shadow-lg p-4 mb-10 rounded-lg relative overflow-hidden bg-gradient-to-r from-green-300/25 to-orange-400/25 hover:scale-102 transition-transform duration-200">
          <Image src="/organization.svg" alt="Organization illustration" width={200} height={200} className="absolute right-0 bottom-0 opacity-60 pointer-events-none" />
          <h2 className="font-medium mb-2 relative z-10 text-xl">Organization List <span className="text-gray-600">&gt;</span></h2>
          <div className="space-y-3 px-4">
            {loading && <p>Loading organizations...</p>}
            {error && <p className="text-red-600">{error}</p>}
            {!loading && !error && 
            organizations.slice().reverse().slice(0, 2).map((org, index) => (
               <div
                key={org.id}
                className={`flex justify-between items-center border-b pb-2 ${
                  index === 1 ? 'border-gray-300 text-gray-400' : 'border-gray-400 text-gray-700'
                }`}
              >
                <p className="flex-1">
                  {org.organizer_profile?.organization_name}
                </p>
              </div>
            ))}
            {!loading && !error && organizations.length === 0 && <p className="text-gray-400">No organizations found.</p>}
          </div>
        </div>
      </Link>
    </>
  );
}