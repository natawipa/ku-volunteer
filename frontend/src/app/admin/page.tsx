"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import AdminLayout from "./components/AdminLayout";
import AdminContent from "./AdminContent";

// Default export used when visiting /admin directly. It wraps the content with
// AdminLayout and will redirect to '/' if the user navigated to /admin in the browser.
export default function Home() {
  const router = useRouter();

  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.pathname === '/admin') {
      router.replace('/');
    }
  }, [router]);

  return (
    <AdminLayout>
      <AdminContent />
    </AdminLayout>
  );
}
