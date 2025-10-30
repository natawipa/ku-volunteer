"use client";
import { useRef, useState, useEffect, ReactNode, ChangeEvent } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import SearchCard from '@/app/components/SearchCard';
import { MagnifyingGlassIcon, ChevronDownIcon } from '@heroicons/react/24/outline';
import { PlusIcon } from '@heroicons/react/24/solid';
import { USER_ROLES } from '@/lib/constants';
import ProfileCard from './ProfileCard';
import NotificationBell from './NotificationBell';
import Header from './Header';
import Navbar from './Navbar';
import HeroImage from './HeroImage';

interface AdminLayoutProps {
  title?: string;
  children: ReactNode;
  hideTitle?: boolean;
  containerClassName?: string;

}
/**
 * AdminLayout centralizes the shared visual chrome (background gradient, mountain image,
 * header nav, sticky shrinking search bar) used across admin pages to avoid duplication.
 */
export default function AdminLayout({
  title,
  children,
  hideTitle,
  containerClassName,
}: AdminLayoutProps) {
    const [userRole, ] = useState<string | null>(null);

  return (
    <div className="relative">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#DAE9DC] to-white h-[350px]" />
      {/* Mountain backdrop */}
      <Image src="/mountain.svg" alt="mountain" width={1920} height={510} className="w-full h-[510px] absolute inset-0 top-0 object-cover pt-11" />

      {/* Foreground content */}
      <div className={`relative p-6 ${containerClassName || ''}`}> 
        <header className="flex justify-between items-center sticky top-0 z-10 mb-6 bg-[#DAE9DC]/10">
          <Image src="/logo-kasetsart.svg" alt="Small Logo" width={64} height={64} className="object-cover" />
          <nav className="flex items-center space-x-8">
            <Link href="/document" className="relative border-b-1 border-transparent hover:border-black transition-all duration-200">Document</Link>
            <Link href="/all-events" 
              className="relative border-b-1 border-transparent hover:border-black transition-all duration-200">
              {(userRole === USER_ROLES.ORGANIZER || userRole === USER_ROLES.STUDENT) ? "My Event" : "All Event"}
            </Link>        
              {userRole === USER_ROLES.ORGANIZER || userRole === USER_ROLES.ADMIN && (
              <Link href="/new-event" className="btn bg-[#215701] text-white px-2 py-2 rounded 
                        hover:bg-[#00361C]
                        transition-all duration-200">
                <div className="flex items-center">
                <PlusIcon className="w-4 h-4 mr-2" />
                <span className="mr-1">New</span>
                </div>
              </Link>
        )}
        <NotificationBell />
        <ProfileCard/>
      </nav>
        </header>
{/* 
              {/* Header 
      <HeroImage />
      <Navbar />
      <div className="relative -mt-8">
        <Header showBigLogo={true} showSearch={true} /> */}

        {/* Center Logo */}
        <div className="flex justify-center">
          <Image src="/logo-kasetsart.svg" alt="Big Logo" width={180} height={180} className="object-cover" />
        </div>
      </div>
      </div>
  );
}
