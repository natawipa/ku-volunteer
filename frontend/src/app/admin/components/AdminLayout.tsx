"use client";
import { ReactNode } from 'react';
import Header from '@/app/components/Header';
import Navbar from '@/app/components/Navbar';
import HeroImage from '@/app/components/HeroImage';

interface AdminLayoutProps {
  title?: string;
  children: ReactNode;
  hideTitle?: boolean;
}

export default function AdminLayout({
  title,
  children,
  hideTitle,
}: AdminLayoutProps) {

  return (
    <div className="relative">
      {/* Background */}
      <HeroImage />
      <div className="relative p-6">
      {/* Header */}
      <Navbar />
      <div className="relative">
        <Header showBigLogo={true} showSearch={true} />
      </div>

        {!hideTitle && title && <h1 className="font-bold mb-6 text-2xl pt-4">{title}</h1>}

        {children}
      </div>
    </div>
  );
}