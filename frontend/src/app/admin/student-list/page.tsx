"use client";
import { PlusIcon, UserCircleIcon } from "@heroicons/react/24/solid";
import Link from "next/link";
import Image from "next/image";

// Fetch Data from example.json
import students from "@/app/studentExample.json";


export default function Home() {

    return (
      <div className="relative">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#DAE9DC] to-white h-[220px]"></div>
  
        {/* Mountain background */}
        <Image
          src="/mountain.svg"
          alt="mountain"
          width={920}
          height={410}
          className="w-full h-[200px] absolute inset-0 top-0 object-cover"
        />
  
        {/* Foreground content */}
        <div className="relative p-6"> 
          <header className="flex justify-between items-center sticky top-0 z-10 mb-6 bg-[#DAE9DC]/10">
            <Image
              src="/Logo_Kasetsart.svg"
              alt="Small Logo"
              width={64}
              height={64}
              className="object-cover"
            />
            <nav className="flex items-center space-x-8">
              <Link href="/document" className="relative border-b-1 border-transparent hover:border-black transition-all duration-200">Document</Link>
              <Link href="/all-events" className="relative border-b-1 border-transparent hover:border-black transition-all duration-200">All Event</Link>
              <Link href="/new" className="btn bg-[#215701] text-white px-2 py-2 rounded 
                      hover:bg-[#00361C]
                      transition-all duration-200">
              <div className="flex items-center">
              <PlusIcon className="w-4 h-4 mr-2" />
              <span className="mr-1">New</span>
              </div>
            </Link>
              <Link href="/profile">
              { <UserCircleIcon className="w-10 h-10 text-[#215701] hover:text-[#00361C] transition-all duration-200" /> }
              </Link>
            </nav>
          </header>
        {/* -------------------------- */} 

        <h2 className="font-semibold mb-6 text-2xl pt-11 lg:pt-20 md:pt-16">Student Name</h2>
        <div className="flex flex-col gap-4 mb-10 ">
          {students.slice().reverse().slice().map((s) => (
            <div key={s.id} className="flex justify-between items-center  border-b pb-2">
              <p className="flex-1">
                {s.title} {s.first_name} {s.last_name}
              </p>
              <div className="flex gap-4">
                <button className="bg-yellow-50 px-4 py-1 rounded-full hover:bg-yellow-100 transition-colors cursor-pointer">
                  edit
                </button>
                <button className="bg-red-100 px-4 py-1 rounded-full hover:bg-red-200 transition-colors cursor-pointer">
                  delete
                </button>
              </div>
            </div>
          ))}
        </div>
    </div>
    </div>
    );
}