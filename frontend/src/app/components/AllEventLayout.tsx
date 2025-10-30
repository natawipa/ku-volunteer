"use client";
import { ReactNode } from 'react';
import Header from './Header';
import Navbar from './Navbar';
import HeroImage from './HeroImage';

interface AdminLayoutProps {
  title?: string;
  children: ReactNode;
  hideTitle?: boolean;
  
}
/**
 * AdminLayout centralizes the shared visual chrome (background gradient, mountain image,
 * header nav, sticky shrinking search bar) used across admin pages to avoid duplication.
 */
export default function AdminLayout({
  title,
  children,
  hideTitle,
}: AdminLayoutProps) {

  return (
    <div className="relative">
        {/* Background */}
      {/* Header */}
      <HeroImage />
      <Navbar />
      <div className="relative -mt-8">
        <Header showBigLogo={true} showSearch={true} />
      </div>
        <div className="relative p-6 pt-0">
          {!hideTitle && title && <h1 className="font-bold mb-6 text-2xl pt-4">{title}</h1>}
          {children}
        </div>
      </div>

  );
}
