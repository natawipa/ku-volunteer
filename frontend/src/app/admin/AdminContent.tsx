"use client";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { apiService, User } from "@/lib/api";

export default function AdminContent() {
  const [students, setStudents] = useState<User[]>([]);
  const [organizations, setOrganizations] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  return (
    <>
      {/* Status Navigation */}
      <h2 className="font-bold mb-6 text-2xl pt-2">Status Events</h2>
      <Link href="/admin/events/pending">
        <h3 className="font-semibold mb-4 text-xl bg-gradient-to-r from-green-300/25 to-yellow-300/25 p-5 w-full rounded-lg shadow-md hover:scale-102 transition-transform duration-200">Pending Events</h3>
      </Link>
      <Link href="/admin/events/approved">
        <h3 className="font-semibold mb-4 text-xl bg-gradient-to-r from-blue-300/25 to-purple-300/25 p-5 w-full rounded-lg shadow-md hover:scale-102 transition-transform duration-200">Approved Events</h3>
      </Link>
      <Link href="/admin/events/rejected">
        <h3 className="font-semibold mb-4 text-xl bg-gradient-to-r from-red-300/25 to-pink-300/25 p-5 w-full rounded-lg shadow-md hover:scale-102 transition-transform duration-200">Rejected Events</h3>
      </Link>
      <Link href="/admin/events/request-delete">
        <h3 className="font-semibold mb-4 text-xl bg-gradient-to-r from-orange-300/25 to-amber-300/25 p-5 w-full rounded-lg shadow-md hover:scale-102 transition-transform duration-200">Deletion Request</h3>
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
            
            students.slice().reverse().map((s, index) => (
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