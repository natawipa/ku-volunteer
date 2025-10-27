"use client";

import { useState, useEffect } from "react";
import Image from "next/image";

import { auth } from "../../lib/utils";
import { USER_ROLES } from "../../lib/constants";
import type { Activity } from "../../lib/types";

import Navbar from "./Navbar";
import SearchLayout from "./SearchLayout";

interface HeaderProps {
  activities: Activity[];
  loading: boolean;
  error: string | null;
  setIsSearchActive: (active: boolean) => void;
  searchInputRef: React.RefObject<HTMLInputElement | null>;
  isScrolled: boolean;
}

export default function Header({
  activities,
  loading,
  error,
  setIsSearchActive,
  searchInputRef,
  isScrolled,
}: HeaderProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);

  // Check Authentication on Mount
  useEffect(() => {
    setIsAuthenticated(auth.isAuthenticated());
    setUserRole(auth.getUserRole());
  }, []);

  const getLogoSrc = () => {
    if (!isAuthenticated) return "/logo-kasetsart.svg";
    switch (userRole) {
      case USER_ROLES.ORGANIZER:
        return "/logo-organizer.svg";
      case USER_ROLES.STUDENT:
        return "/logo-student.svg";
      default:
        return "/logo-kasetsart.svg";
    }
  };

  return (
    <>
      {/* Header */}
      <header
        className={`flex justify-between items-center ${
          isAuthenticated ? "sticky top-0 z-10 mb-6 bg-[#DAE9DC]/10" : ""
        }`}
      >
        <Image src={getLogoSrc()} alt="Small Logo" width={64} height={64} />
        <Navbar isAuthenticated={isAuthenticated} userRole={userRole} />
      </header>

      {/* Logo Center */}
      <div className="flex justify-center">
        <Image src={getLogoSrc()} alt="Big Logo" width={180} height={180} />
      </div>

      {/* Search Layout */}
      {!loading && !error && (
        <section className="sticky top-10 z-[101]">
          <SearchLayout
            activities={activities}
            setIsSearchActive={setIsSearchActive}
            searchInputRef={searchInputRef}
            isScrolled={isScrolled}
          />
        </section>
      )}
    </>
  );
}