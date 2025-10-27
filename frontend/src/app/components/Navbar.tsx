"use client";

import Link from "next/link";
import { Plus } from "lucide-react";
import ProfileCard from "./ProfileCard";
import { USER_ROLES } from "../../lib/constants";

interface NavbarProps {
  isAuthenticated: boolean;
  userRole: string | null;
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

export default function Navbar({ isAuthenticated, userRole }: NavbarProps) {
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
          <ProfileCard />
        </nav>
      );

    if (userRole === USER_ROLES.ADMIN || userRole === USER_ROLES.ORGANIZER)
      return (
        <nav className="flex items-center space-x-8">
          {commonLinks}
          <CreateButton />
          <ProfileCard />
        </nav>
      );
  };

  return <>{getNavigation()}</>;
}