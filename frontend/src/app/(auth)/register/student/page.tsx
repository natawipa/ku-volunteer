'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { z } from "zod";
import { ChevronDown } from "lucide-react";
import { useForm, FieldValues } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Card from '../../../(auth)/components/Card';

const validationSchema = z
    .object({
        email: z.string().email({ message: "Invalid email address" }),
        password: z.string()
            .min(8, { message: "Password must be at least 8 characters" })
            .regex(/[A-Z]/, { message: "Password must contain at least 1 uppercase letter" })
            .regex(/[!#$%^&*()+=\-[\]{};':"\\|,.<>/?]/, { message: "Password must contain at least 1 special character" }),
        confirm: z.string().min(8, { message: "Please enter confirmation password" }),   
        title: z.string().min(1, { message: "Please select a title" }),
        firstName: z.string().min(1, { message: "First name is required" }),
        lastName: z.string().min(1, { message: "Last name is required" }),
        studentID: z.string().min(10, { message: "Student ID must be 10 digits" }).max(10, { message: "Student ID must be 10 digits" }),
        year: z.number().min(1, { message: "Year must be between 1-6" }).max(6, { message: "Year must be between 1-6" }),
})

.refine((data) => data.password === data.confirm, {
    message: "Passwords do not match",
    path: ["confirm"],
});

const StudentRegisterPage: React.FC = () => {

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm({
        resolver: zodResolver(validationSchema)
    });

    const onSubmit = async (data: FieldValues) => {
        console.log('Submitted:', data);
        
        try {
            const response = await fetch('http://localhost:8000/api/users/register/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email: data.email,
                    password: data.password,
                    title: data.title,
                    first_name: data.firstName,
                    last_name: data.lastName,
                    role: 'student',
                    student_id_external: data.studentID,
                    year: parseInt(data.year)
                }),
            });

            if (response.ok) {
                const result = await response.json();
                console.log('Registration successful:', result);
                alert('Registration successful!');
                // Redirect or handle success
            } else {
                const error = await response.json();
                console.error('Registration failed:', error);
                alert('Registration failed: ' + JSON.stringify(error));
            }
        } catch (error) {
            console.error('Network error:', error);
            alert('Network error occurred');
        }
    }

    const [isTitleDropdownOpen, setIsTitleDropdownOpen] = useState(false);
    const [selectedTitle, setSelectedTitle] = useState('');
    const TitleOptions = ["Mr.", "Mrs.", "Ms."];

    const handleTitleSelect = (roleOption: string) => {
      setSelectedTitle(roleOption);
      setValue('title', roleOption, { shouldValidate: true });
      setIsTitleDropdownOpen(false);
    };

  return (
    <div className="min-h-screen  bg-gradient-to-br from-mutegreen to-white flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-2 left-2 w-15 h-15 bg-[url('/images/logokaset.png')] bg-contain bg-no-repeat z-10"></div>
      <div className="absolute bottom-0 left-0 w-full h-150 bg-[url('/images/wavewave.png')] bg-bottom bg-no-repeat bg-cover z-0"></div>
      <Card title="Student Register">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div>
          <label htmlFor="studentID" className="block text-sm font-medium text-gray-700 mb-2">
            Student ID
          </label>
          <input
            id="studentID"
            type="text"
            placeholder="e.x. 6610xxxxxx"
            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all duration-200 placeholder-gray-400"
            {...register("studentID")}
          />
            { errors.studentID && <p className="text-red-400 text-sm">{errors.studentID.message as string} </p>}
        </div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
            Title
          </label>
          <div className="relative">
          <button
            type="button"
            onClick={() => setIsTitleDropdownOpen(!isTitleDropdownOpen)}
            className="w-full px-4 py-2 border border-gray-200 rounded-lg bg-white flex items-center justify-between text-sm text-gray-700"
          >
            <span className={selectedTitle ? "text-gray-900" : "text-gray-400"}>
              {selectedTitle || "Select Title"}
            </span>
            <ChevronDown className="w-5 h-5 text-gray-400" />
          </button>
          <input type="hidden" {...register('title')} />

          {isTitleDropdownOpen && (
            <div className="absolute mt-2 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto z-20">
              {TitleOptions.map((roleOption) => (
                <button
                  key={roleOption}
                  type="button"
                  onClick={() => handleTitleSelect(roleOption)}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  {roleOption}
                </button>
              ))}
            </div>
          )}
        </div>
        {errors.title && (
          <p className="mt-1 text-sm text-red-400">{errors.title.message as string}</p>
        )}

        <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-2">
                First Name
              </label>
              <input
                id="firstName"
                type="text"
                placeholder="First Name"
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all duration-200 placeholder-gray-400"
                {...register("firstName")}
              />
              {errors.firstName && <p className="text-red-400 text-sm">{errors.firstName.message as string}</p>}
            </div>
            <div>
              <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-2">
                Last Name
              </label>
              <input
                id="lastName"
                type="text"
                placeholder="Last Name"
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all duration-200 placeholder-gray-400"
                {...register("lastName")}
              />
              {errors.lastName && <p className="text-red-400 text-sm">{errors.lastName.message as string}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="year"
                className="block text-sm font-medium text-gray-700 mb-2 "
              >
                Year
              </label>
              <input
                id="year"
                type="number"
                placeholder="Year"
                min="1"
                max="6"
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all duration-200 placeholder-gray-400"
                {...register("year", { valueAsNumber: true })}
              />
              {errors.year && <p className="text-red-400 text-sm">{errors.year.message as string}</p>}
            </div>
          </div>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              Email
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
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              Password
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
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
              Confirm Password
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

