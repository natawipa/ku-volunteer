"use client";
import { useEffect, useState } from "react";
import { EyeIcon, PlusIcon, UserCircleIcon } from "@heroicons/react/24/solid";
import Image from "next/image";
import Link from "next/link";
import { apiService, User } from "@/lib/api";

export default function OrganizationList() {
  const [organizations, setOrganizations] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [orgType, setOrgType] = useState("all"); // all, internal, external
  const [deleteConfirm, setDeleteConfirm] = useState<{show: boolean, org: User | null}>({ show: false, org: null });
  const [deleting, setDeleting] = useState<number | null>(null);
  const handleDeleteClick = (org: User) => {
    setDeleteConfirm({ show: true, org });
  };

  const handleDeleteCancel = () => {
    setDeleteConfirm({ show: false, org: null });
  };

  const handleDeleteConfirm = async () => {
    if (!deleteConfirm.org) return;
    setDeleting(deleteConfirm.org.id);
    try {
      const result = await apiService.deleteUser(deleteConfirm.org.id);
      if (result.success) {
        setOrganizations(organizations.filter(o => o.id !== deleteConfirm.org!.id));
        setDeleteConfirm({ show: false, org: null });
      } else {
        setError(result.error || 'Failed to delete organization');
      }
    } catch (err) {
      setError('Failed to delete organization');
      console.error('Delete error:', err);
    } finally {
      setDeleting(null);
    }
  };

  useEffect(() => {
    let mounted = true;

    async function loadOrganizations() {
      setLoading(true);
      setError(null);

      try {
        // Use apiService.getUserList to fetch users
        const result = await apiService.getUserList();
        if (!mounted) return;
        if (result.success && result.data) {
          const orgs = result.data.filter((u: User) => u.role === "organizer" && u.organizer_profile?.organization_name);
          setOrganizations(orgs);
        } else {
          setError(result.error || "Failed to load organizations");
        }
      } catch (err: unknown) {
        if (!mounted) return;
        if (err instanceof Error) setError(err.message);
        else setError("Failed to load organizations");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadOrganizations();
    return () => { mounted = false; };
  }, []);

  if (loading) return <p>Loading organizations...</p>;
  if (error) return <p className="text-red-600">{error}</p>;
  if (organizations.length === 0) return <p>No organizations found.</p>;

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
    
          <h2 className="font-semibold mb-6 text-2xl pt-11 lg:pt-20 md:pt-16">Organization Name</h2>
          {/* Search and Filter Bar */}
          <div className="flex flex-col md:flex-row gap-4 mb-6 items-center">
            <input
              type="text"
              placeholder="Search organization name..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="border rounded px-3 py-2 w-full md:w-1/2"
            />
            <select
              value={orgType}
              onChange={e => setOrgType(e.target.value)}
              className="border rounded px-3 py-2 w-full md:w-1/4"
            >
              <option value="all">All</option>
              <option value="internal">Kasetsart University</option>
              <option value="external">External</option>
            </select>
          </div>
        <div className="flex flex-col gap-4">
          {organizations
            .filter(org => {
              // Filter by search
              const name = org.organizer_profile?.organization_name?.toLowerCase() || "";
              if (search && !name.includes(search.toLowerCase())) return false;

              const type = org.organizer_profile?.organization_type?.toLowerCase();
                if (orgType === "internal") {
                  return type === "internal";
                }

                if (orgType === "external") {
                  return type === "external";
                }
                return true;
            })
            .slice().reverse()
            .map((org) => (
              <div key={org.id} className="flex justify-between items-center border-b pb-2">
                <p>{org.organizer_profile?.organization_name}</p>
                <div className="flex gap-4">
                  <button className="bg-gray-200 px-4 py-1 rounded-full hover:bg-gray-300 flex items-center gap-1">
                    <EyeIcon className="w-4 h-4" /> View Events
                  </button>
                  <button 
                    onClick={() => handleDeleteClick(org)}
                    disabled={deleting === org.id}
                    className="bg-red-100 px-4 py-1 rounded-full hover:bg-red-200 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {deleting === org.id ? 'Deleting...' : 'Delete'}
                  </button>
      {/* Delete Confirmation Dialog */}
      {deleteConfirm.show && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Confirm Delete</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete organization "
              <span className="font-medium">
                {deleteConfirm.org?.organizer_profile?.organization_name}
              </span>
              "? This action cannot be undone.
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
                {deleting === deleteConfirm.org?.id ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}
