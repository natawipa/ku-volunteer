"use client";
import React, { useState, useRef, KeyboardEvent, useEffect } from 'react';
import Image from 'next/image';
import { USER_ROLES } from '../../../lib/constants';
import { activitiesApi } from '../../../lib/activities';

interface CheckInProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (code: string) => void;
  isLoading?: boolean;
  role: string | null;
  description?: string;
  activityId?: number | null;
  isMultiDay?: boolean;
  hasCheckedInToday?: boolean;
}

export default function CheckIn({ 
  isOpen, 
  onClose, 
  onSubmit, 
  isLoading = false, 
  role, 
  description, 
  activityId,
  isMultiDay = false,
  hasCheckedInToday = false
}: CheckInProps) {
  const [code, setCode] = useState<string[]>(['', '', '', '', '', '']);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [isMounted, setIsMounted] = useState(false);
  const [validationError, setValidationError] = useState<string>('');
  const [fetchedCode, setFetchedCode] = useState<string>('');
  const [loadingCode, setLoadingCode] = useState(false);
  const [alreadyCheckedInToday, setAlreadyCheckedInToday] = useState(false);

  // Check if current student already checked in today
  const checkStudentCheckInStatus = async () => {
    if (role !== USER_ROLES.STUDENT || !activityId) {
      console.log('⏭️ Skipping check-in status - not a student or no activity');
      return;
    }

    try {
      console.log('Fetch current student check-in status for activity:', activityId);
      const result = await activitiesApi.getCheckInStatus(activityId);
      
      console.log('Check-in status response:', result);
      
      if (result.success && result.data) {
        // if got data back, student has checked in
        const checkInRecord = result.data;
        const isPresent = checkInRecord.attendance_status === 'present';
        
        // if checked in today (in case of multi-day activities)
        if (isPresent && checkInRecord.checked_in_at) {
          const today = new Date();
          const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0, 0);
          const todayEnd = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999);
          
          const checkedInTime = new Date(checkInRecord.checked_in_at);
          const isCheckInToday = checkedInTime >= todayStart && checkedInTime <= todayEnd;
          
          console.log('Check-in record details:', {
            student: checkInRecord.student_name,
            status: checkInRecord.attendance_status,
            checkedInAt: checkInRecord.checked_in_at,
            checkedInTime: checkedInTime.toLocaleString('th-TH'),
            isCheckInToday
          });
          
          setAlreadyCheckedInToday(isCheckInToday);
        } else {
          setAlreadyCheckedInToday(false);
        }
      } else {
        // No check-in record found
        console.log('No check-in record found - student can check in');
        setAlreadyCheckedInToday(false);
      }
    } catch (error) {
      console.error('Error checking student check-in status:', error);
      setAlreadyCheckedInToday(false);
    }
  };

  // Fetch check-in code when modal opens for ORGANIZER
  useEffect(() => {
    console.log('CHECK-IN EFFECT:', { isOpen, activityId, role });
    
    if (!isOpen) return;

    // For ORGANIZER: fetch check-in code
    if (role === USER_ROLES.ORGANIZER) {
      console.log('📡 Fetching check-in code for organizer, activity:', activityId);
      setLoadingCode(true);
      activitiesApi.getCheckInCode(activityId || 0).then(result => {
        console.log('API Response:', result);
        
        if (result.success && result.data) {
          console.log('Code fetched successfully:', result.data.code);
          setFetchedCode(result.data.code);
        } else {
          console.error('API Error:', result.error);
          setValidationError(result.error || 'Failed to fetch check-in code');
        }
        setLoadingCode(false);
      }).catch(err => {
        console.error('Fetch Exception:', err);
        setValidationError('Failed to fetch check-in code');
        setLoadingCode(false);
      });
    }

    // For STUDENT: check if already checked in today
    if (role === USER_ROLES.STUDENT) {
      checkStudentCheckInStatus();
    }
  }, [isOpen, activityId, role]); 

  useEffect(() => {
    if (isOpen) {
      setIsMounted(true);
      setValidationError('');
      if (role === USER_ROLES.STUDENT && !alreadyCheckedInToday) {
        setTimeout(() => {
          inputRefs.current[0]?.focus();
        }, 100);
      }
    } else {
      setCode(['', '', '', '', '', '']);
      setValidationError('');
      setFetchedCode('');
    }
  }, [isOpen, role, alreadyCheckedInToday]);

  // Handle backdrop click
  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // random char validation
  const validateInput = (value: string): boolean => {
    if (value === '') return true;
    return /^[A-Za-z0-9]$/.test(value);
  };

  const handleChange = (index: number, value: string) => {
    const sanitizedValue = value.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
    
    if (sanitizedValue && !validateInput(sanitizedValue)) {
      return; 
    }
    
    if (sanitizedValue.length > 1) {
      const chars = sanitizedValue.split('').slice(0, 6);
      const newCode = [...code];
      
      // Validate each character in the pasted content
      for (let i = 0; i < chars.length; i++) {
        const charIndex = index + i;
        if (charIndex < 6 && validateInput(chars[i])) {
          newCode[charIndex] = chars[i];
        }
      }
      
      setCode(newCode);
      setValidationError('');
      
      // Focus on the last filled input or next empty one
      const lastFilledIndex = Math.min(index + chars.length - 1, 5);
      const nextEmptyIndex = newCode.findIndex((char, i) => i > lastFilledIndex && char === '');
      const indexToFocus = nextEmptyIndex === -1 ? lastFilledIndex : nextEmptyIndex;
      inputRefs.current[indexToFocus]?.focus();
    } else if (sanitizedValue.length === 1) {
      // Single character typed
      const newCode = [...code];
      newCode[index] = sanitizedValue;
      setCode(newCode);
      setValidationError('');
      
      // Focus on next empty box
      if (index < 5) {
        const nextEmptyIndex = newCode.findIndex((char, i) => i > index && char === '');
        if (nextEmptyIndex !== -1) {
          inputRefs.current[nextEmptyIndex]?.focus();
        } else {
          inputRefs.current[5]?.focus();
        }
      }
    } else {
      // Clear current box
      const newCode = [...code];
      newCode[index] = '';
      setCode(newCode);
      setValidationError('');
    }
  };

  const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (code[index] === '' && index > 0) {
        e.preventDefault();
        inputRefs.current[index - 1]?.focus();
      } else if (code[index] !== '') {
        const newCode = [...code];
        newCode[index] = '';
        setCode(newCode);
        setValidationError('');
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < 5) {
      inputRefs.current[index + 1]?.focus();
    } else if (e.key === 'Enter') {
      if (isCodeComplete) {
        handleSubmit();
      }
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text');
    const sanitizedValue = pastedData.replace(/[^A-Za-z0-9]/g, '').toUpperCase().slice(0, 6);
    
    if (sanitizedValue.length > 0) {
      const chars = sanitizedValue.split('');
      const newCode = [...code];
      
      for (let i = 0; i < chars.length; i++) {
        if (i < 6 && validateInput(chars[i])) {
          newCode[i] = chars[i];
        }
      }
      
      setCode(newCode);
      setValidationError('');
      
      const lastFilledIndex = Math.min(chars.length - 1, 5);
      inputRefs.current[lastFilledIndex]?.focus();
    }
  };

  const handleSubmit = () => {
    const fullCode = code.join('');
    
    console.log('SUBMIT DEBUG:', {
      role,
      fullCode,
      isStudent: role === USER_ROLES.STUDENT,
    });
    
    setValidationError('');
    
    if (!fullCode) {
      setValidationError('Please enter a code');
      return;
    }

    console.log('Submitting code:', fullCode);
    onSubmit(fullCode); // Send to backend for validation
  };

  const isCodeComplete = code.every(char => char !== '');

  // Get description based on role
  const getDescription = () => {
    if (description) return description;
    
    if (role === USER_ROLES.STUDENT) {
      return "Please enter activities' check-in code to check your attendance.";
    } else if (role === USER_ROLES.ORGANIZER) {
      return "Please inform the students participating in this activity to use this code to check in and record their attendance.";
    } else {
      return "Please enter the check-in code provided at the event.";
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={handleBackdropClick}
    >
      <div 
        className="max-w-md w-full"
        onClick={(e) => e.stopPropagation()}
      >
        {/* close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-white hover:text-gray-300 z-10 text-2xl font-bold bg-black/30 rounded-full w-8 h-8 flex items-center justify-center transition-all hover:bg-black/50"
          aria-label="Close check-in modal"
        >
          ×
        </button>
        <div className="bg-white rounded-3xl shadow-xl p-6 border-2 border-pink-100">
          <section className="mb-4 p-4">
            {/* brain hero*/}
            <div className={`flex justify-center transition-all -mt-5 duration-1000 ease-out ${
              isMounted ? '-translate-y-4 opacity-100' : '-translate-y-7 opacity-0'
            }`}>
              <div className="relative">
                <Image
                  src="/brain-hero.svg"
                  alt="Brain Hero"
                  width={160}
                  height={160}
                  className="drop-shadow-lg"
                />
              </div>
            </div>
            {/* student check-in Status Display */}
            {role === USER_ROLES.STUDENT && (
              <div className="flex justify-center mb-6">
                {alreadyCheckedInToday ? (
                  <div className="text-center w-full">
                    <div className="text-2xl font-bold bg-gray-100 border-2 border-[#FFBADA] rounded-xl py-4 px-6">
                      <span className="text-black">Already Checked In Today</span>
                    </div>
                    {isMultiDay && (
                      <p className="text-sm text-gray-600 mt-3">
                        Come back tomorrow to check in again.
                      </p>
                    )}
                    {!isMultiDay && (
                      <p className="text-sm text-gray-600 mt-3">
                        You have already checked in to this activity.
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="w-full">
                    {/* Input Boxes */}
                    <div className="flex justify-center gap-2 w-full mb-6">
                      {code.map((char, index) => (
                        <input
                          key={index}
                          ref={(el) => { inputRefs.current[index] = el; }}
                          type="text"
                          maxLength={1}
                          value={char}
                          onChange={(e) => handleChange(index, e.target.value)}
                          onKeyDown={(e) => handleKeyDown(index, e)}
                          onPaste={handlePaste}
                          disabled={isLoading}
                          className="w-12 h-14 sm:w-14 sm:h-16 text-center text-2xl font-bold bg-gray-100 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#f9b1d2] focus:border-[#f9b1d2] transition-all uppercase disabled:opacity-50 disabled:cursor-not-allowed"
                          placeholder="0"
                          title="Enter a letter or number (A-Z, 0-9)"
                        />
                      ))}
                    </div>

                    {/* ✅ Description - ONLY SHOWS WHEN NOT CHECKED IN */}
                    <div className="text-center mb-6">
                      <h2 className="text-2xl font-bold text-gray-800 mb-2">Check-in Code</h2>
                      <p className="text-gray-600 text-sm">
                        {getDescription()}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ORGANIZER: Display Check-in Code */}
            {role === USER_ROLES.ORGANIZER && (
              <>
                <div className="flex justify-center mb-6">
                  <div className="text-center text-2xl font-bold bg-gray-100 border-2 border-gray-300 rounded-xl transition-all uppercase w-full">
                    <div className="px-6 py-3 select-all tracking-widest">
                      {loadingCode ? '⏳ Loading...' : (fetchedCode || "No code available")}
                    </div>
                  </div>
                </div>

                {/* check in description for ORGANIZER */}
                <div className="text-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-800 mb-2">Check-in Code</h2>
                  <p className="text-gray-600 text-sm">
                    {getDescription()}
                  </p>
                </div>
              </>
            )}

            {/* Validation Error */}
            {validationError && (
              <div className="text-center mb-4">
                <p className="text-red-500 text-sm font-medium bg-red-50 py-2 px-3 rounded-lg border border-red-200">
                  {validationError}
                </p>
              </div>
            )}
          </section>

          {/* submit button for student, only show if not already checked in */}
          {role === USER_ROLES.STUDENT && !alreadyCheckedInToday && (
            <button
              onClick={handleSubmit}
              disabled={!isCodeComplete || isLoading}
              className="w-full -mt-5 bg-[#FFE1EF] border-b-2 border-[#FFBADA] hover:to-[#FFBADA] text-black font-semibold py-3 px-6 rounded-xl transition-all duration-200 disabled:opacity-50 
              disabled:cursor-not-allowed disabled:hover:from-[#FFE1EF] disabled:hover:to-[#FFBADA] shadow-md transform hover:scale-105 active:scale-95"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                  </svg>
                  Checking...
                </span>
              ) : 'Submit'}
            </button>
          )}

          {/* Close button when already checked in */}
          {role === USER_ROLES.STUDENT && alreadyCheckedInToday && (
            <button
              onClick={onClose}
              className="w-full -mt-10 bg-gray-300 text-gray-700 font-semibold py-3 px-6 rounded-xl transition-all duration-200 shadow-md hover:bg-gray-400"
            >
              Close
            </button>
          )}
        </div>

        {/* helper message */}
        <p className="text-center text-gray-500 text-sm mt-4">
          {role === USER_ROLES.ORGANIZER 
            ? "Share this code with students for check-in" 
            : alreadyCheckedInToday
            ? isMultiDay
              ? "You can check in again tomorrow"
              : "Thank you for checking in!"
            : "Enter the 6-character code shown at the event venue"
          }
        </p>
      </div>
    </div>
  );
}