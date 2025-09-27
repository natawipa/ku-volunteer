'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { ChevronDown } from "lucide-react";
import { useRouter, useSearchParams } from 'next/navigation';
import Card from '../../(auth)/components/Card';

interface FormErrors {
  [key: string]: string;
}

const RolePageContent: React.FC = () => {
  const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState(false);
  const [role, setRole] = useState('');
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');

  const [errors, setErrors] = useState<FormErrors>({});

  useEffect(() => {
    // Get email from URL parameters if coming from OAuth
    const emailParam = searchParams.get('email');
    if (emailParam) {
      setEmail(emailParam);
    }
  }, [searchParams]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    setErrors({});
    if (role === '') {
      setErrors({ role: 'โปรดเลือกตำแหน่ง' });
    } else if (role === 'หน่วยงาน') {
      const url = email ? `/register/organization?email=${encodeURIComponent(email)}` : '/register/organization';
      router.push(url);
    } else if (role === 'นิสิต') {
      const url = email ? `/register/student?email=${encodeURIComponent(email)}` : '/register/student';
      router.push(url);
    }

  };

  const roles = [
    'นิสิต',
    'หน่วยงาน'
  ];

  return (
    <div className="min-h-screen  bg-gradient-to-br from-mutegreen to-white flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-2 left-2 w-15 h-15 bg-[url('/images/logokaset.png')] bg-contain bg-no-repeat z-10"></div>
      <div className="absolute bottom-0 left-0 w-full h-150 bg-[url('/images/wavewave.png')] bg-bottom bg-no-repeat bg-cover z-0"></div>
      <Card title="Role">
        {email && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-700">
              <strong>Email:</strong> {email}
            </p>
            <p className="text-xs text-blue-600 mt-1">
              Please select your role to complete registration
            </p>
          </div>
        )}
        <form onSubmit={handleSubmit}>
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
      </Card>
    </div>
  );
};

const RolePage: React.FC = () => {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-mutegreen to-white flex items-center justify-center p-4 relative overflow-hidden">
        <div className="absolute top-2 left-2 w-15 h-15 bg-[url('/images/logokaset.png')] bg-contain bg-no-repeat z-10"></div>
        <div className="absolute bottom-0 left-0 w-full h-150 bg-[url('/images/wavewave.png')] bg-bottom bg-no-repeat bg-cover z-0"></div>
        <Card title="Role">
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
          </div>
        </Card>
      </div>
    }>
      <RolePageContent />
    </Suspense>
  );
};

export default RolePage;



  