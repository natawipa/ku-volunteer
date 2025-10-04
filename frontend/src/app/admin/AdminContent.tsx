"use client";
import Image from "next/image";
import Link from "next/link";
import students from "../studentExample.json";
import organizations from "../organizerExample.json";

interface StudentExample { id: number; title?: string; first_name?: string; last_name?: string }
interface OrganizationExample { id: number; organization_name: string }

const typedStudents = students as StudentExample[];
const typedOrganizations = organizations as OrganizationExample[];

export default function AdminContent() {
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

      <h2 className="font-bold mb-6 text-2xl pt-6">User List</h2>
      <Link href="admin/student-list">
        <div className="shadow-lg p-4 mb-10 rounded-lg relative overflow-hidden bg-gradient-to-r from-green-300/25 to-purple-500/25 hover:scale-102 transition-transform duration-200">
          <Image src="/student.svg" alt="Student illustration" width={200} height={200} className="absolute right-0 bottom-0 opacity-50 pointer-events-none" />
          <h2 className="font-medium mb-2 relative z-10 text-xl">Student List <span className="text-gray-600">&gt;</span></h2>
          <div className="space-y-3 px-4">
            {typedStudents.slice().reverse().slice(0, 2).map((s, index) => (
              <p key={s.id} className={`border-b border-gray-300 pb-2 ${index === 1 ? 'text-gray-400' : 'text-gray-700'}`}>{s.title} {s.first_name} {s.last_name}</p>
            ))}
          </div>
        </div>
      </Link>

      <Link href="admin/organization-list">
        <div className="shadow-lg p-4 mb-10 rounded-lg relative overflow-hidden bg-gradient-to-r from-green-300/25 to-orange-400/25 hover:scale-102 transition-transform duration-200">
          <Image src="/organization.svg" alt="Organization illustration" width={200} height={200} className="absolute right-0 bottom-0 opacity-60 pointer-events-none" />
          <h2 className="font-medium mb-2 relative z-10 text-xl">Organization List <span className="text-gray-600">&gt;</span></h2>
          <div className="space-y-3 px-4">
            {typedOrganizations.slice().reverse().slice(0, 2).map((s, index) => (
              <p key={s.id} className={`border-b border-gray-300 pb-2 ${index === 1 ? 'text-gray-400' : 'text-gray-700'}`}>{s.organization_name}</p>
            ))}
          </div>
        </div>
      </Link>
    </>
  );
}
