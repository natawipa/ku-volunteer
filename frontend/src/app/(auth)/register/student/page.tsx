'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import Card from '../../../(auth)/components/Card';
import { FormField } from '../../../(auth)/components/FormField';
import { Dropdown } from '../../../(auth)/components/Dropdown';
import { TITLE_OPTIONS, TitleOption } from './types';
import { useStudentRegistration } from './useStudentRegistration';

const StudentRegisterContent: React.FC = () => {
  const {
    register,
    setValue,
    onSubmit,
    isSubmitting,
    submitError,
    submitSuccess,
    formState: { errors },
  } = useStudentRegistration();

  const [selectedTitle, setSelectedTitle] = useState<TitleOption | ''>('');

  const handleTitleSelect = (title: TitleOption) => {
    setSelectedTitle(title);
    setValue('title', title, { shouldValidate: true });
  };

  return (
    <div className="min-h-screen  bg-gradient-to-br from-mutegreen to-white flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-2 left-2 w-15 h-15 bg-[url('/images/logokaset.png')] bg-contain bg-no-repeat z-10"></div>
      <div className="absolute bottom-0 left-0 w-full h-150 bg-[url('/images/wavewave.png')] bg-bottom bg-no-repeat bg-cover z-0"></div>
      <Card title="Student Register">
        {submitError && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600 text-sm">{submitError}</p>
          </div>
        )}
        {submitSuccess && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-600 text-sm">Registration successful! Redirecting to login page...</p>
          </div>
        )}
        <form onSubmit={onSubmit} className="space-y-6">
          <FormField
            id="studentID"
            label="Student ID"
            type="text"
            placeholder="e.x. 6610xxxxxx"
            register={register("studentID")}
            error={errors.studentID?.message}
          />

          <div>
            <Dropdown
              value={selectedTitle}
              onChange={handleTitleSelect}
              options={TITLE_OPTIONS}
              placeholder="Select Title"
              label="Select Title"
              error={errors.title?.message}
            />
            <input type="hidden" {...register('title')} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FormField
              id="firstName"
              label="First Name"
              type="text"
              placeholder="First Name"
              register={register("firstName")}
              error={errors.firstName?.message}
            />
            <FormField
              id="lastName"
              label="Last Name"
              type="text"
              placeholder="Last Name"
              register={register("lastName")}
              error={errors.lastName?.message}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FormField
              id="faculty"
              label="Faculty"
              type="text"
              placeholder="e.g. Engineering"
              register={register("faculty")}
              error={errors.faculty?.message}
            />
            <FormField
              id="major"
              label="Major"
              type="text"
              placeholder="e.g. Computer Engineering"
              register={register("major")}
              error={errors.major?.message}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FormField
              id="year"
              label="Year"
              type="number"
              placeholder="Year"
              min="1"
              max="6"
              register={register("year", { valueAsNumber: true })}
              error={errors.year?.message}
            />
          </div>

          <FormField
            id="email"
            label="Email"
            type="email"
            placeholder="username@gmail.com"
            required
            register={register("email")}
            error={errors.email?.message}
          />

          <FormField
            id="password"
            label="Password"
            type="password"
            placeholder="Password"
            required
            register={register("password")}
            error={errors.password?.message}
          />

          <FormField
            id="confirmPassword"
            label="Confirm Password"
            type="password"
            placeholder="Confirm Password"
            required
            register={register("confirm")}
            error={errors.confirm?.message}
          />

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
              disabled={isSubmitting}
              className="w-30 justify-end bg-green-700 text-white py-3 rounded-lg font-medium hover:bg-green-800 transition-colors duration-200 focus:ring-4 focus:ring-green-200 focus:outline-none disabled:opacity-50"
            >
              {isSubmitting ? 'Submitting...' : 'Submit'}
            </button>
          </div>
        </form>
      </Card>
    </div>
  );
};

const StudentRegisterPage: React.FC = () => {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-mutegreen to-white flex items-center justify-center p-4 relative overflow-hidden">
        <div className="absolute top-2 left-2 w-15 h-15 bg-[url('/images/logokaset.png')] bg-contain bg-no-repeat z-10"></div>
        <div className="absolute bottom-0 left-0 w-full h-150 bg-[url('/images/wavewave.png')] bg-bottom bg-no-repeat bg-cover z-0"></div>
        <Card title="Student Register">
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
          </div>
        </Card>
      </div>
    }>
      <StudentRegisterContent />
    </Suspense>
  );
};

export default StudentRegisterPage;

