"use client";
import { PlusIcon, UserCircleIcon } from "@heroicons/react/24/solid";
import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { apiService, User } from "@/lib/api";

export default function StudentList() {
  const [students, setStudents] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState<{show: boolean, student: User | null}>({
    show: false,
    student: null
  });
  const [deleting, setDeleting] = useState<number | null>(null);

  useEffect(() => {
      let mounted = true;
  
      async function loadStudents() {
        setLoading(true);
        setError(null);
  
        try {
          // Use apiService.getUserList to fetch users
          const result = await apiService.getUserList();
          if (!mounted) return;
          if (result.success && result.data) {
            const students = result.data.filter((u: User) => u.role === "student" && u.id);
            setStudents(students);
          } else {
            setError(result.error || "Failed to load students");
          }
        } catch (err: unknown) {
          if (!mounted) return;
          if (err instanceof Error) setError(err.message);
          else setError("Failed to load students");
        } finally {
          if (mounted) setLoading(false);
        }
      }

    loadStudents();
    return () => {
      mounted = false;
    };
  }, []);

  const handleDeleteClick = (student: User) => {
    setDeleteConfirm({ show: true, student });
  };

  const handleDeleteCancel = () => {
    setDeleteConfirm({ show: false, student: null });
  };

  const handleDeleteConfirm = async () => {
    if (!deleteConfirm.student) return;
    
    setDeleting(deleteConfirm.student.id);
    
    try {
      const result = await apiService.deleteUser(deleteConfirm.student.id);
      
      if (result.success) {
        // Remove the deleted student from the list
        setStudents(students.filter(s => s.id !== deleteConfirm.student!.id));
        setDeleteConfirm({ show: false, student: null });
      } else {
        setError(result.error || 'Failed to delete student');
      }
    } catch (err) {
      setError('Failed to delete student');
      console.error('Delete error:', err);
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div className="relative">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#DAE9DC] to-white h-[220px]"></div>

      {/* Mountain background */}
      <Image
        src="/mountain.svg"
        alt="mountain"
        width={920}
        height={410}
        className="w-full h-[200px] absolute inset-0 top-0 object-cover"
      />

      {/* Foreground content */}
      <div className="relative p-6"> 
        <header className="flex justify-between items-center sticky top-0 z-10 mb-6 bg-[#DAE9DC]/10">
          <Image
            src="/Logo_Kasetsart.svg"
            alt="Small Logo"
            width={64}
            height={64}
            className="object-cover"
          />
          <nav className="flex items-center space-x-8">
            <Link href="/document" className="relative border-b-1 border-transparent hover:border-black transition-all duration-200">Document</Link>
            <Link href="/all-events" className="relative border-b-1 border-transparent hover:border-black transition-all duration-200">All Event</Link>
            <Link href="/new" className="btn bg-[#215701] text-white px-2 py-2 rounded 
                    hover:bg-[#00361C]
                    transition-all duration-200">
            <div className="flex items-center">
            <PlusIcon className="w-4 h-4 mr-2" />
            <span className="mr-1">New</span>
            </div>
          </Link>
            <Link href="/profile">
            { <UserCircleIcon className="w-10 h-10 text-[#215701] hover:text-[#00361C] transition-all duration-200" /> }
            </Link>
          </nav>
        </header>
      {/* -------------------------- */} 

      <h2 className="font-semibold mb-6 text-2xl pt-11 lg:pt-20 md:pt-16">Student Name</h2>
      <div className="flex flex-col gap-4 mb-10 ">
        {loading && <p>Loading students...</p>}
        {error && <p className="text-red-600">{error}</p>}
        {!loading && !error && students.length === 0 && (
          <p className="text-gray-500">No students found.</p>
        )}
        <input
          type="text"
          placeholder="Search students..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border rounded p-2 mb-4"
        />
        {students.slice().reverse().filter((student) =>
            `${student.title} ${student.first_name} ${student.last_name}`.toLowerCase().includes(search.toLowerCase())
          ).map((s) => (
          <div key={s.id} className="flex justify-between items-center border-b pb-2">
            <p className="flex-1">
              {s.title} {s.first_name} {s.last_name}
            </p>
            <div className="flex gap-4">
              <button 
                onClick={() => handleDeleteClick(s)}
                disabled={deleting === s.id}
                className="bg-red-100 px-4 py-1 rounded-full hover:bg-red-200 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {deleting === s.id ? 'Deleting...' : 'delete'}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Delete Confirmation Dialog */}
      {deleteConfirm.show && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Confirm Delete</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete student ?
              <span className="font-medium">
                {deleteConfirm.student?.title} {deleteConfirm.student?.first_name} {deleteConfirm.student?.last_name}
              </span>
              This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={handleDeleteCancel}
                disabled={deleting !== null}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                disabled={deleting !== null}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
              >
                {deleting === deleteConfirm.student?.id ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
    </div>
  );
}
