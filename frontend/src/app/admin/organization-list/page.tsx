"use client";
import { useEffect, useState } from "react";
import { ArrowLeftIcon, EyeIcon } from "@heroicons/react/24/solid";
import Header from "@/app/components/Header";
import Link from "next/link";
import { apiService, User } from "@/lib/api";
import HeroImage from "@/app/components/HeroImage";
import Navbar from "@/app/components/Navbar";

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

  // Create a distinct list of organizations by organization_name
  const uniqueOrganizations = Array.from(
    new Map(
      organizations.map(org => [org.organizer_profile?.organization_name, org])
    ).values()
  );

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
      {/* Background */}
      <HeroImage />
      <div className="relative p-6">
      {/* Header */}
      <Navbar />
      <div className="relative">
        <Header showBigLogo={true} />
      </div>
          
          {/* -------------------------- */} 

          <Link 
            href="/admin" 
            className="inline-flex items-center text-[#215701] hover:text-[#00361C] mt-4 transition-colors"
          >
            <ArrowLeftIcon className="w-5 h-5 mr-2" />
            Back to Admin
          </Link>
    
          <h2 className="font-semibold mb-6 text-2xl lg:pt-10 md:pt-16">Organization Name</h2>
          {/* Search and Filter Bar */}
          <div className="flex flex-col md:flex-row gap-4 mb-6 items-center ">
            <input
              type="text"
              placeholder="Search organization name..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="border border-gray-500 rounded px-3 py-2 w-full md:w-1/2 focus:outline-none focus:ring-1 focus:ring-green-700 focus:border-green-700 transition-all"
            />
            <select
              value={orgType}
              onChange={e => setOrgType(e.target.value)}
              className="border border-gray-500 rounded px-3 py-2 w-full md:w-1/4 focus:outline-none focus:ring-1 focus:ring-green-700 focus:border-green-700 transition-all"
            >
              <option value="all">All</option>
              <option value="internal">Kasetsart University</option>
              <option value="external">External</option>
            </select>
          </div>
        <div className="flex flex-col gap-4">
          {uniqueOrganizations
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
            .map((org) => {
              const organizerId = org.organizer_profile?.id || org.id;
              console.log(`🔗 Organization "${org.organizer_profile?.organization_name}" - User ID: ${org.id}, Profile ID: ${org.organizer_profile?.id}, Using: ${organizerId}`);
              
              return (
              <div key={org.id} className="flex justify-between items-center border-b pb-2">
                <p>{org.organizer_profile?.organization_name}</p>
                <div className="flex gap-4">
                  <Link
                    href={`/admin/organization-event/${organizerId}`}
                    className="bg-gray-200 px-4 py-1 rounded-full hover:bg-gray-300 flex items-center gap-1"
                  >
                    <EyeIcon className="w-4 h-4" /> View Events
                  </Link>
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
                          Are you sure you want to delete organization ?
                          <span className="font-medium">
                            {deleteConfirm.org?.organizer_profile?.organization_name}
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
                            {deleting === deleteConfirm.org?.id ? 'Deleting...' : 'Delete'}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              );
            })}
        </div>
      </div>
    </div>
  );
}

