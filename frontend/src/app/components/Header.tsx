"use client";

import { useState, useEffect } from "react";
import Image from "next/image";

import { auth } from "../../lib/utils";
import { USER_ROLES } from "../../lib/constants";
import type { Activity } from "../../lib/types";

import SearchLayout from "./SearchLayout";

interface HeaderProps {
  activities?: Activity[];
  loading?: boolean;
  error?: string | null;
  setIsSearchActive?: (active: boolean) => void;
  searchInputRef?: React.RefObject<HTMLInputElement | null>;
  isScrolled?: boolean;
  showSearch?: boolean;
  showBigLogo?: boolean;
}

export default function Header(props: HeaderProps){
  const {
    activities = [],
    loading = false,
    error = null,
    setIsSearchActive = () => {},
    searchInputRef = { current: null },
    isScrolled = false,
    showSearch = false,
    showBigLogo = false,
  } = props;
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);

  // Check Authentication on Mount
  useEffect(() => {
    setIsAuthenticated(auth.isAuthenticated());
    setUserRole(auth.getUserRole());
  }, []);

  const getLogoSrc = (isAuthenticated: boolean, userRole: string | null) => {
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

  // Determine if Search Bar Should be Shown
  const shouldShowSearch = showSearch && !loading && !error;
  const shouldShowBigLogo = showBigLogo && !loading && !error;

  return (
    <>
    <div className="relative">

      {shouldShowBigLogo && (
        <div className="flex items-center justify-center py-8 -mt-10 relative z-10">
          <Image
            src={getLogoSrc(isAuthenticated, userRole)} 
            alt="Big Logo" 
            width={180} 
            height={180} 
          />
        </div>
      )}
      
      {/* Search Layout */}
      {shouldShowSearch && (
        <div className="px-6 -mt-3 relative z-20">
          <SearchLayout
            activities={activities}
            setIsSearchActive={setIsSearchActive}
            searchInputRef={searchInputRef}
            isScrolled={isScrolled}
          />
        </div>
      )}
      </div>
    </>
  );
}