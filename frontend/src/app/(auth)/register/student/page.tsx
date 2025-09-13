'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useForm, FieldValues } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { validationSchema } from '../../../validation/schema';
import Card from '../../../(auth)/components/Card';

interface FormErrors {
  [key: string]: string;
}

const StudentRegisterPage: React.FC = () => {

  interface FormData {
    firstName: string;
    lastName: string;
    faculty: string;
    major: string;
    year: string;
    email: string;
    password: string;
    confirmPassword: string;
  }

  const {
    register,
    handleSubmit,
    formState: { errors }, // check error
  } = useForm({
        resolver: zodResolver(validationSchema) // ผูก useform กับ react hook form
    });

    const onSubmit = (data: FieldValues) => { // when submit reak funtiton
        console.log('Submitted:', data);
    }

  return (
    <div className="min-h-screen  bg-gradient-to-br from-mutegreen to-white flex items-center justify-center p-4 relative overflow-hidden">
      
      {/* logo top left */}
      <div className="absolute top-2 left-2 w-15 h-15 bg-[url('/images/logokaset.png')] bg-contain bg-no-repeat z-10"></div>
      {/* wave */}
      <div className="absolute bottom-0 left-0 w-full h-150 bg-[url('/images/wavewave.png')] bg-bottom bg-no-repeat bg-cover z-0"></div>
      {/* card */}
      <Card title="Student Register">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* <form className="space-y-6"> */}

        <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-2">
                ชื่อ
              </label>
              <input
                id="firstName"
                name="firstName"
                type="text"
                placeholder="First Name"
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all duration-200 placeholder-gray-400"
                required
              />
            </div>
            <div>
              <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-2">
                นามสกุล
              </label>
              <input
                id="lastName"
                name="lastName"
                type="text"
                placeholder="Last Name"
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all duration-200 placeholder-gray-400"
                required
              />
            </div>
          </div>

          {/* Faculty and Major Row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="faculty" className="block text-sm font-medium text-gray-700 mb-2">
                คณะ
              </label>
              <input
                id="faculty"
                name="faculty"
                type="text"
                placeholder="Faculty"
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all duration-200 placeholder-gray-400"
                required
              />
            </div>
            <div>
              <label htmlFor="major" className="block text-sm font-medium text-gray-700 mb-2">
                สาขา
              </label>
              <input
                id="major"
                name="major"
                type="text"
                placeholder="Major"
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all duration-200 placeholder-gray-400"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Year */}
            <div>
              <label
                htmlFor="year"
                className="block text-sm font-medium text-gray-700 mb-2 "
              >
                ชั้นปี
              </label>
              <input
                id="year"
                type="number"
                placeholder="Year"
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all duration-200 placeholder-gray-400"
                required
                {...register ('year')} />
                { errors.year && <p className="text-red-400 text-sm">{errors.year.message as string} </p>}
            </div>
          </div>

          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              อีเมล
            </label>
            <input
              id="email"
              type="email"
              placeholder="username@gmail.com"
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all duration-200 placeholder-gray-400"
              required
              {...register ('email')} />
              { errors.email && <p className="text-red-400 text-sm">{errors.email.message as string} </p>}
          </div>

          {/* Password */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              รหัสผ่าน
            </label>
            <input
              id="password"
              type="password"
              placeholder="Password"
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all duration-200 placeholder-gray-400"
              required
              {...register ('password')} />
              { errors.password && <p className="text-red-400 text-sm">{errors.password.message as string} </p>}
          </div>

          {/* Confirm Password */}
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
              ยืนยันรหัสผ่าน
            </label>
            <input
              id="confirmPassword"
              type="password"
              placeholder="Confirm Password"
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all duration-200 placeholder-gray-400"
              required
              {...register ('confirm')} />
              { errors.confirm && <p className="text-red-400 text-sm">{errors.confirm.message as string} </p>}
          </div>

          <div className="flex justify-between">
            <Link href="/role" passHref>
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
                Submit
              </button>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default StudentRegisterPage;

