"use client";
import { ArrowLeftIcon } from "@heroicons/react/24/solid";
import Link from "next/link";
import Header from "@/app/components/Header";
import { useEffect, useState } from "react";
import { apiService, User } from "@/lib/api";
import HeroImage from "@/app/components/HeroImage";
import Navbar from "@/app/components/Navbar";

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
      {/* Background */}
      <HeroImage />
      <div className="relative p-6">
      {/* Header */}
      <Navbar />
      <div className="relative -mt-8">
        <Header showBigLogo={true} />
      </div>
      {/* -------------------------- */} 
      <Link 
            href="/admin" 
            className="inline-flex items-center text-[#215701] hover:text-[#00361C] mb-4 transition-colors"
          >
            <ArrowLeftIcon className="w-5 h-5 mr-2" />
            Back to List
        </Link>

      <h2 className="font-semibold mb-6 text-2xl pt-11 md:pt-16">Student Name</h2>
      
      {/* Search Bar */}
      <div className="mb-6">
        <input
          type="text"
          placeholder="Search student name..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="border border-gray-500 rounded px-3 py-2 w-full md:w-1/2 focus:outline-none focus:ring-1 focus:ring-green-700 focus:border-green-700 transition-all"
        />
      </div>
      <div className="flex flex-col gap-4 mb-10 ">
        {loading && <p>Loading students...</p>}
        {error && <p className="text-red-600">{error}</p>}
        {!loading && !error && students.length === 0 && (
          <p className="text-gray-500">No students found.</p>
        )}
        {students
          .filter((s) => {
            // Filter by search term
            if (!search) return true;
            const fullName = `${s.title || ""} ${s.first_name || ""} ${s.last_name || ""}`.toLowerCase();
            return fullName.includes(search.toLowerCase());
          })
          .slice().reverse().map((s) => (
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
