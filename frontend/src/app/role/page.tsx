'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ChevronDown } from "lucide-react";
import { useRouter } from 'next/navigation';

interface FormErrors {
  [key: string]: string;
}

const RegisterPage: React.FC = () => {
  const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState(false);
  const [role, setRole] = useState('');
  const router = useRouter();

  const [errors, setErrors] = useState<FormErrors>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // register page by role
    setErrors({});
    if (role === '') {
      setErrors({ role: 'โปรดเลือกตำแหน่ง' });
    } else if (role === 'หน่วยงาน') {
      router.push('/register/organization');
    } else if (role === 'นิสิต') {
      router.push('/register/student');
    }

  };

  const roles = [
    'นิสิต',
    'หน่วยงาน'
  ];

  return (
    <div className="min-h-screen  bg-gradient-to-br from-mutegreen to-white flex items-center justify-center p-4 relative overflow-hidden">
      
      {/* logo top left */}
      <div className="absolute top-2 left-2 w-15 h-15 bg-[url('/images/logokaset.png')] bg-contain bg-no-repeat z-10"></div>
      {/* wave */}
      <div className="absolute bottom-0 left-0 w-full h-150 bg-[url('/images/wavewave.png')] bg-bottom bg-no-repeat bg-cover z-0"></div>
      {/* card */}
      <div className="bg-white rounded-2xl shadow-xl p-10 w-full max-w-md relative z-10">
        {/* Logo */}
        <div className="flex flex-col items-center  mb-8">
          <div className="w-16 h-16 bg-white rounded-lg flex items-center justify-center mb-4 relative">
            <div className="absolute mt-11 w-35 h-35 bg-[url('/images/logokaset.png')] bg-contain bg-no-repeat bg-center z-10"></div>
          </div>
        </div>

        <h1 className="text-2xl font-semibold text-gray-900 text-center mb-8">Register</h1>
        {/* <h2 className="text-xl font-semibpld text-gray-900 text-center mb-10"></h2> */}

        <form onSubmit={handleSubmit}>
            
            {/* Role */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                หน้าที่
              </label>
              <label className="block text-sm font-small font-extralight text-gray-500 mb-2">
                โปรดเลือกหน้าที่ของคุณ
              </label>
              <div className="relative mb-4.5">
                <button
                  type="button"
                  onClick={() => setIsRoleDropdownOpen(!isRoleDropdownOpen)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg bg-white flex items-center justify-between text-sm text-gray-700"
                >
                  <span className={role ? "text-gray-900" : "text-gray-400"}>
                    {role || "Select role"}
                  </span>
                  <ChevronDown className="w-5 h-5 text-gray-400" />
                </button>

                {isRoleDropdownOpen && (
                  <div className="absolute mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto z-20">
                    {roles.map((roleOption) => (
                      <button
                        key={roleOption}
                        type="button"
                        onClick={() => {
                          setRole(roleOption);
                          setIsRoleDropdownOpen(false);
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        {roleOption}
                      </button>
                    ))}
                  </div>
                )}
            </div>
            {errors.role && <p className="mt-1 text-sm text-red-600">{errors.role}</p>}
          </div>

          <div className="flex justify-between">
            <Link href="/login" passHref>
                <button
                  type="button"
                  className="w-30 bg-white text-green-700 py-3 rounded-lg font-medium hover:bg-green-800 hover:text-white transition-colors duration-200 focus:ring-4 focus:ring-green-200 focus:outline-none"
                >
                  Back
                </button>
              </Link>

              <button
                type="submit"
                className="w-30 justify-end bg-green-700 text-white py-3 rounded-lg font-medium hover:bg-green-800 transition-colors duration-200 focus:ring-4 focus:ring-green-200 focus:outline-none">
                Next
              </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RegisterPage;



  