'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { ChevronDown } from "lucide-react";
import { useRouter, useSearchParams } from 'next/navigation';
import Card from '../../(auth)/components/Card';
import { ROUTES, USER_ROLES } from '../../../lib/constants';
import { auth } from '../../../lib/utils';

interface FormErrors {
  [key: string]: string;
}

const RolePageContent: React.FC = () => {
  const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState(false);
  const [role, setRole] = useState('');
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [oauthSession, setOAuthSession] = useState('');

  const [errors, setErrors] = useState<FormErrors>({});

  // If an authenticated admin lands here, redirect them away
  useEffect(() => {
    const role = auth.getUserRole();
    if (auth.isAuthenticated() && role === USER_ROLES.ADMIN) {
      router.replace(ROUTES.ADMIN_HOME);
    }
  }, [router]);

  useEffect(() => {
    // Get email and oauth session from URL parameters if coming from OAuth
    const emailParam = searchParams.get('email');
    const oauthSessionParam = searchParams.get('oauth_session');
    if (emailParam) {
      setEmail(emailParam);
    }
    if (oauthSessionParam) {
      setOAuthSession(oauthSessionParam);
    }
  }, [searchParams]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    setErrors({});
    if (role === '') {
      setErrors({ role: 'Select role' });
    } else if (role === 'organization') {
      let url = '/register/organization';
      const params = new URLSearchParams();
      if (email) params.append('email', email);
      if (oauthSession) params.append('oauth_session', oauthSession);
      if (params.toString()) url += `?${params.toString()}`;
      router.push(url);
    } else if (role === 'student') {
      let url = '/register/student';
      const params = new URLSearchParams();
      if (email) params.append('email', email);
      if (oauthSession) params.append('oauth_session', oauthSession);
      if (params.toString()) url += `?${params.toString()}`;
      router.push(url);
    }

  };

  const roles = [
    'student',
    'organization',
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
                Role
              </label>
              <label className="block text-sm font-small font-extralight text-gray-500 mb-2">
                Select your Role
              </label>
              <div className="relative mb-4.5">
                <button
                  type="button"
                  data-testid="role-selector"
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
                        data-testid={roleOption === 'student' ? 'role-student' : 'role-organization'}
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
                data-testid="next-button"
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
