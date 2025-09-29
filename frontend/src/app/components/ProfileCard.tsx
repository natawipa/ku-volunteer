"use client";
import { useRef, useState, useEffect } from "react";
import { LogOut } from "lucide-react";
import { UserCircleIcon, EyeIcon } from "@heroicons/react/24/solid";
import Link from "next/link";

export default function ProfileCard() {
    const [isOpen, setIsOpen] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);

    // Close dropdown if clicking outside
    useEffect(() => {
      function handleClickOutside(event: MouseEvent) {
        if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
          setIsOpen(false);
        }
      }
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

     return (
    <div className="relative" ref={wrapperRef}>
      {/* Profile Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex text-[#215701] hover:text-[#00361C] transition-all duration-200 hover:cursor-pointer rounded-full justify-center focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#215701]/50"
      >
        <UserCircleIcon className="h-10 w-10" />
      </button>

      {/* Dropdown Card */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 rounded-2xl bg-white shadow-lg ring-1 ring-black/5 p-3">
          <p className="text-sm text-gray-500 mb-2">Signed in as</p>
          <p className="font-semibold mb-3">username@email.com</p>
          <hr className="my-2" />

        {/* View Profile */}
          <Link
            href="/student-profile"
            onClick={() => setIsOpen(false)}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-gray-700 hover:bg-gray-50"
          >
            <EyeIcon className="h-4 w-4" />
            <span>View Profile</span>
          </Link>

        {/* Log Out */}
          <button
            onClick={() => {
              setIsOpen(false);
              alert("Logging out...");
            }}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-red-600 hover:bg-red-50 hover:cursor-pointer"
          >
            <LogOut className="h-4 w-4" />
            <span>Log out</span>
          </button>
        </div>
      )}
    </div>
  );
}

