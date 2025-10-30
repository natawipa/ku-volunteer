"use client";

import Link from "next/link";
import { Plus } from "lucide-react";
import ProfileCard from "./ProfileCard";
import { USER_ROLES } from "../../lib/constants";
import Image from "next/image";
import { useEffect, useState } from "react";
import { auth } from "@/lib/utils";
import NotificationBell from "./NotificationBell";

interface NavbarProps {
  isAuthenticated?: boolean;
  userRole?: string | null;
}

// Navigation Link Component
const NavLink = ({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) => (
  <Link
    href={href}
    className="relative border-b border-transparent hover:border-black transition-all duration-200"
  >
    {children}
  </Link>
);

// Create Button
const CreateButton = () => (
  <Link
    href="/new-event"
    className="btn bg-[#215701] text-white px-2 py-2 rounded hover:bg-[#00361C] transition-all duration-200"
  >
    <div className="flex items-center">
      <Plus className="w-4 h-4 mr-1" />
      <span>New</span>
    </div>
  </Link>
);

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

export default function Navbar({ isAuthenticated: propIsAuthenticated, userRole: propUserRole }: NavbarProps) {
  const [localIsAuthenticated, setLocalIsAuthenticated] = useState(false);
  const [localUserRole, setLocalUserRole] = useState<string | null>(null);
  const [isScrolled, setIsScrolled] = useState(false);

    useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Check Authentication on Mount (if its not provided via props)
  useEffect(() => {
    if (propIsAuthenticated === undefined || propUserRole === undefined) {
      setLocalIsAuthenticated(auth.isAuthenticated());
      setLocalUserRole(auth.getUserRole());
    }
  }, [propIsAuthenticated, propUserRole]);

  // use the props if provided
  const isAuthenticated = propIsAuthenticated !== undefined ? propIsAuthenticated : localIsAuthenticated;
  const userRole = propUserRole !== undefined ? propUserRole : localUserRole;

  const getNavigation = () => {
    const commonLinks = (
      <>
        <NavLink href="/document">Document</NavLink>
        <NavLink href="/all-events">My Event</NavLink>
      </>
    );

    if (!isAuthenticated)
      return (
        <nav className="flex items-center space-x-8">
          <NavLink href="/document">Document</NavLink>
          <NavLink href="/all-events">All Event</NavLink>
          <Link
            href="/login"
            className="btn bg-[#215701] text-white px-4 py-2 rounded hover:bg-[#00361C] transition-all duration-200"
          >
            Sign In
          </Link>
        </nav>
      );

    if (userRole === USER_ROLES.STUDENT)
      return (
        <nav className="flex items-center space-x-8">
          {commonLinks}
          <NotificationBell />
          <ProfileCard />
        </nav>
      );

    if (userRole === USER_ROLES.ADMIN || userRole === USER_ROLES.ORGANIZER)
      return (
        <nav className="flex items-center space-x-8">
          {commonLinks}
          <NotificationBell />
          <CreateButton />
          <ProfileCard />
        </nav>
      );
  };

  return (
    <div className="sticky top-0 z-50 w-full">
      <div className={`absolute inset-0 w-full duration-300 ${
          isScrolled 
            ? 'bg-white/80 backdrop-blur-md shadow-sm' 
            : 'bg-transparent'
        }`}
        style={{ width: '100vw', left: '50%', height: '80px', transform: 'translateX(-50%)', 
                 borderBottomLeftRadius: '20px',borderBottomRightRadius: '20px' }}></div>

    <div className="relative flex justify-between items-center w-full z-10 px-6 py-2">
      {/* Small Logo on the left */}
      <Image 
        src={getLogoSrc(isAuthenticated, userRole)} 
        alt="Small Logo" 
        width={64}
        height={64} 
      />
       <div className="flex items-center space-x-8">
        {getNavigation()}
      </div>
  </div>
    
    </div>
  );
}