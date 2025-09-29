'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Card from '../../../(auth)/components/Card';
import { FormField } from '../../../(auth)/components/FormField';
import { Dropdown } from '../../../(auth)/components/Dropdown';
import { TITLE_OPTIONS, ORGANIZATION_OPTIONS, TitleOption, OrganizationOption } from './types';
import { useOrganizationRegistration } from './useOrganizationRegistration';



const OrganizeRegisterPage: React.FC = () => {
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
          <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-600 text-sm">Registration successful!</p>
          </div>
        )}
        <form onSubmit={onSubmit} className="space-y-6">
          <div>
            <Dropdown
              value={selectedTitle}
              onChange={handleTitleSelect}
              options={TITLE_OPTIONS}
              placeholder="Select Title"
              label="คำนำหน้า"
              error={errors.title?.message}
            />
            <input type="hidden" {...register('title')} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FormField
              id="firstName"
              label="ชื่อ"
              type="text"
              placeholder="e.g. Somying"
              register={register("firstName")}
              error={errors.firstName?.message}
            />
            <FormField
              id="lastName"
              label="นามสกุล"
              type="text"
              placeholder="e.g. Munjai"
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
                label="ประเภทหน่วยงาน"
                error={errors.organize?.message}
              />
              <input type="hidden" {...register('organize')} />
            </div>
          </div>

          <FormField
            id="organizationName"
            label="ชื่อหน่วยงาน"
            type="text"
            placeholder="e.g. Faculty of Engineering"
            register={register("organizationName")}
            error={errors.organizationName?.message}
          />

          <FormField
            id="email"
            label="อีเมล"
            type="email"
            placeholder="username@gmail.com"
            required
            register={register("email")}
            error={errors.email?.message}
          />

          <FormField
            id="password"
            label="รหัสผ่าน"
            type="password"
            placeholder="Password"
            required
            register={register("password")}
            error={errors.password?.message}
          />

          <FormField
            id="confirm"
            label="ยืนยันรหัสผ่าน"
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

export default OrganizeRegisterPage;

