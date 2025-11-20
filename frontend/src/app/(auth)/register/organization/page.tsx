'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import Card from '../../../(auth)/components/Card';
import { FormField } from '../../../(auth)/components/FormField';
import { Dropdown } from '../../../(auth)/components/Dropdown';
import { TITLE_OPTIONS, TitleOption, ORGANIZATION_OPTIONS, OrganizationOption } from './types';
import { useOrganizationRegistration } from './useOrganizationRegistration';

const OrganizationRegisterContent: React.FC = () => {
  const {
    register,
    setValue,
    onSubmit,
    isSubmitting,
    submitError,
    submitSuccess,
    formState: { errors },
  } = useOrganizationRegistration();

  const [selectedTitle, setSelectedTitle] = useState<TitleOption | ''>('');
  const [selectedOrganize, setSelectedOrganize] = useState<OrganizationOption | ''>('');

  const handleTitleSelect = (title: TitleOption) => {
    setSelectedTitle(title);
    setValue('title', title, { shouldValidate: true });
  };

  const handleOrganizeSelect = (organize: OrganizationOption) => {
    setSelectedOrganize(organize);
    setValue('organize', organize, { shouldValidate: true });
  };

  return (
    <div className="min-h-screen  bg-gradient-to-br from-mutegreen to-white flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-2 left-2 w-15 h-15 bg-[url('/images/logokaset.png')] bg-contain bg-no-repeat z-10"></div>
      <div className="absolute bottom-0 left-0 w-full h-150 bg-[url('/images/wavewave.png')] bg-bottom bg-no-repeat bg-cover z-0"></div>
      <Card title="Organization Register">
        {submitError && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600 text-sm">{submitError}</p>
          </div>
        )}
        {submitSuccess && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg" data-testid="success-message">
            <p className="text-green-600 text-sm">Registration successful! Redirecting to login page...</p>
          </div>
        )}
        <form onSubmit={onSubmit} className="space-y-6">
          <div>
            <Dropdown
              value={selectedTitle}
              onChange={handleTitleSelect}
              options={TITLE_OPTIONS}
              placeholder="Select Title"
              label="Select Title"
              data-testid="select-title"
              error={errors.title?.message}
            />
            <input type="hidden" {...register('title')} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FormField
              id="firstName"
              label="First Name"
              type="text"
              placeholder="e.g. Somying"
              data-testid="first-name-input"
              register={register("firstName")}
              error={errors.firstName?.message}
            />
            <FormField
              id="lastName"
              label="Last Name"
              type="text"
              placeholder="e.g. Munjai"
              data-testid="last-name-input"
              register={register("lastName")}
              error={errors.lastName?.message}
            />
          </div>

          <div className="grid grid-cols-1 gap-4">
            <div>
              <Dropdown
                value={selectedOrganize}
                onChange={handleOrganizeSelect}
                options={ORGANIZATION_OPTIONS}
                placeholder="Select Organization Type"
                label="Select Organization Type"
                data-testid="organization-type"
                error={errors.organize?.message}
              />
              <input type="hidden" {...register('organize')} />
            </div>
          </div>

          <FormField
            id="organizationName"
            label="Organization Name"
            type="text"
            placeholder="e.g. Faculty of Engineering"
            data-testid="organization-name-input"
            register={register("organizationName")}
            error={errors.organizationName?.message}
          />

          <FormField
            id="email"
            label="Email"
            type="email"
            placeholder="username@gmail.com"
            required
            data-testid="email-input"
            register={register("email")}
            error={errors.email?.message}
          />

          <FormField
            id="password"
            label="Password"
            type="password"
            placeholder="Password"
            required
            data-testid="password-input"
            register={register("password")}
            error={errors.password?.message}
          />

          <FormField
            id="confirm"
            label="Confirm Password"
            type="password"
            placeholder="Confirm Password"
            required
            data-testid="confirm-password-input"
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
              data-testid="register-button"
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

const OrganizationRegisterPage: React.FC = () => {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-mutegreen to-white flex items-center justify-center p-4 relative overflow-hidden">
        <div className="absolute top-2 left-2 w-15 h-15 bg-[url('/images/logokaset.png')] bg-contain bg-no-repeat z-10"></div>
        <div className="absolute bottom-0 left-0 w-full h-150 bg-[url('/images/wavewave.png')] bg-bottom bg-no-repeat bg-cover z-0"></div>
        <Card title="Organization Register">
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
          </div>
        </Card>
      </div>
    }>
      <OrganizationRegisterContent />
    </Suspense>
  );
};

export default OrganizationRegisterPage;

