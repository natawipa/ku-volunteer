"use client";
import { useRef, useState, useEffect, ReactNode, ChangeEvent } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import SearchCard from '@/app/components/SearchCard';
import { MagnifyingGlassIcon, ChevronDownIcon } from '@heroicons/react/24/outline';
import { PlusIcon } from '@heroicons/react/24/solid';
import { USER_ROLES } from '@/lib/constants';
import ProfileCard from './ProfileCard';

interface AdminLayoutProps {
  title?: string;
  children: ReactNode;
  hideTitle?: boolean;
  containerClassName?: string;
  /** Show or hide the search bar entirely */
  hideSearch?: boolean;
  /** Visual style of the search: compact sticky (default) or future panel */
  searchVariant?: 'compact' | 'panel';
  /** Placeholder for search input */
  searchPlaceholder?: string;
  /** Callback whenever search text changes */
  onSearchChange?: (value: string) => void;
  /** Initial search value (for controlled external hydration) */
  initialSearchValue?: string;
  searchStatusOptions?: string[];
  searchSelectedStatus?: string[];
  /** Category options to surface inside the dropdown search card */
  searchCategoryOptions?: string[];
  /** Currently selected categories (controlled) */
  searchSelectedCategories?: string[];
  onSearchStatusChange?: (values: string[]) => void;
  /** Callback when categories change */
  onSearchCategoriesChange?: (values: string[]) => void;
  /** Whether to show a date picker in the dropdown (default false for admin) */
  searchShowDate?: boolean;
  /** Callback when date start changes */
  onDateStartChange?: (date: string) => void;
  /** Callback when date end changes */
  onDateEndChange?: (date: string) => void;
  /** Callback when search is applied with all current filters */
  endAfterChecked: boolean;
  setEndAfterChecked: (val: boolean) => void;

  onSearchApply?: (filters: {
    searchValue: string;
    selectedStatus?: string[];
    selectedCategories: string[];
    dateStart: string;
    dateEnd: string;
  }) => void;
}

/**
 * AdminLayout centralizes the shared visual chrome (background gradient, mountain image,
 * header nav, sticky shrinking search bar) used across admin pages to avoid duplication.
 */
export default function AdminLayout({
  title,
  children,
  hideTitle,
  containerClassName,
  hideSearch,
  searchVariant = 'compact',
  searchPlaceholder = 'Search events name, description',
  onSearchChange,
  initialSearchValue = '',
  searchSelectedStatus,
  onSearchStatusChange,
  searchSelectedCategories,
  onSearchCategoriesChange,
  onDateStartChange,
  onDateEndChange,
  endAfterChecked,
  setEndAfterChecked,
  onSearchApply,
}: AdminLayoutProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [isScrolled, setIsScrolled] = useState(false);
  const [searchValue, setSearchValue] = useState(initialSearchValue);
  const [selectedCategories, setSelectedCategories] = useState<string[]>(Array.isArray(searchSelectedCategories) && searchSelectedCategories.filter(Boolean).length > 0 ? searchSelectedCategories.filter(Boolean) : []);
  const [dateStart, setDateStart] = useState('');
  const [dateEnd, setDateEnd] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string[]>(Array.isArray(searchSelectedStatus) && searchSelectedStatus.filter(Boolean).length > 0 ? searchSelectedStatus.filter(Boolean) : []);
  const [searchHistory, setSearchHistory] = useState<string[]>(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("searchHistory");
      return stored ? JSON.parse(stored) : [];
    }
    return [];
  });
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Scroll effect for shrinking search bar (only needed for compact)
  useEffect(() => {
    if (searchVariant !== 'compact' || hideSearch) return;
    const onScroll = () => setIsScrolled(window.scrollY > 100);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, [searchVariant, hideSearch]);

  // Close dropdown on outside click
  useEffect(() => {
    if (hideSearch) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) setIsOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [hideSearch]);

  useEffect(() => {
    onSearchApply?.({
      searchValue,
      selectedStatus,
      selectedCategories,
      dateStart,
      dateEnd,
    });
  }, [endAfterChecked, searchValue, selectedStatus, selectedCategories, dateStart, dateEnd, onSearchApply]);

  const handleCategoriesChange = (categories: string[]) => {
    setSelectedCategories(categories);
    onSearchCategoriesChange?.(categories);

    // Instantly apply search filters when category changes
    onSearchApply?.({
      searchValue,
      selectedStatus,
      selectedCategories: categories,
      dateStart,
      dateEnd,
    });
  };

  const handleStatusChange = (status: string[]) => {
    setSelectedStatus(status);
    onSearchStatusChange?.(status);

    // Instantly apply search filters when status changes
    onSearchApply?.({
      searchValue,
      selectedStatus: status,
      selectedCategories,
      dateStart,
      dateEnd,
    });
  };

  ////// TODOOOOOOOOOO //////


  const handleSearchChange = (val: string) => {
    setSearchValue(val);
    onSearchChange?.(val);

    // Instantly apply search too
    onSearchApply?.({
      searchValue: val,
      selectedStatus,
      selectedCategories,
      dateStart,
      dateEnd,
    });
  };

  const handleDateStartChange = (date: string) => {
    setDateStart(date);
    onDateStartChange?.(date);

    // Instantly apply filters when start date changes
    onSearchApply?.({
      searchValue,
      selectedStatus,
      selectedCategories,
      dateStart: date,
      dateEnd,
    });
  };

// When changing end date
const handleDateEndChange = (date: string) => {
    setDateEnd(date);
    onDateEndChange?.(date);

    // Instantly apply filters when end date changes
    onSearchApply?.({
      searchValue,
      selectedStatus,
      selectedCategories,
      dateStart,
      dateEnd: date,
    });
  };

  const handleApply = (value?: string) => {
    setIsOpen(false);
    const appliedValue = value !== undefined ? value : searchValue;
    // Add to history
    const trimmed = appliedValue.trim();
    if (trimmed && !searchHistory.includes(trimmed)) {
      setSearchHistory([trimmed, ...searchHistory].slice(0, 10));
      localStorage.setItem("searchHistory", JSON.stringify([trimmed, ...searchHistory].slice(0, 10)));
    }
    // Trigger individual callbacks
    onSearchChange?.(appliedValue);
    onSearchStatusChange?.(selectedStatus);
    onSearchCategoriesChange?.(selectedCategories);
    onDateStartChange?.(dateStart);
    onDateEndChange?.(dateEnd);
    // Trigger combined search apply callback
    onSearchApply?.({
      searchValue: appliedValue,
      selectedStatus,
      selectedCategories,
      dateStart,
      dateEnd,
    });
  };

  return (
    <div className="relative">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#DAE9DC] to-white h-[350px]" />
      {/* Mountain backdrop */}
      <Image src="/mountain.svg" alt="mountain" width={1920} height={510} className="w-full h-[510px] absolute inset-0 top-0 object-cover pt-11" />

      {/* Foreground content */}
      <div className={`relative p-6 ${containerClassName || ''}`}> 
        <header className="flex justify-between items-center sticky top-0 z-10 mb-6 bg-[#DAE9DC]/10">
          <Image src="/Logo_Kasetsart.svg" alt="Small Logo" width={64} height={64} className="object-cover" />
          <nav className="flex items-center space-x-8">
            <Link href="/document" className="relative border-b-1 border-transparent hover:border-black transition-all duration-200">Document</Link>
            <Link href="/all-events" 
              className="relative border-b-1 border-transparent hover:border-black transition-all duration-200">
              {(userRole === USER_ROLES.ORGANIZER || userRole === USER_ROLES.STUDENT) ? "My Event" : "All Event"}
            </Link>        
              {userRole === USER_ROLES.ORGANIZER || userRole === USER_ROLES.ADMIN && (
              <Link href="/new-event" className="btn bg-[#215701] text-white px-2 py-2 rounded 
                        hover:bg-[#00361C]
                        transition-all duration-200">
                <div className="flex items-center">
                <PlusIcon className="w-4 h-4 mr-2" />
                <span className="mr-1">New</span>
                </div>
              </Link>
        )}
        <ProfileCard/>
      </nav>
        </header>

        {/* Center Logo */}
        <div className="flex justify-center">
          <Image src="/Logo_Kasetsart.svg" alt="Big Logo" width={180} height={180} className="object-cover" />
        </div>

        {/* Search Area */}
        {!hideSearch && searchVariant === 'compact' && (
          <section className={`transition-all duration-300 z-40 ${isScrolled ? 'sticky top-14 w-full px-4' : 'relative flex justify-center'} mb-6`}>
            <div
              ref={wrapperRef}
              className={`transition-all duration-300 ${isScrolled ? 'max-w-md mx-auto scale-90' : 'relative w-full max-w-xl'}`}
            >
              <div
                className="flex bg-white items-center rounded-md px-4 py-3 shadow-md cursor-text"
                onClick={() => setIsOpen(true)}
              >
                <MagnifyingGlassIcon className="text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  value={searchValue}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => handleSearchChange(e.target.value)}
                  placeholder={searchPlaceholder}
                  className="font-mitr ml-2 flex-1 border-0 bg-transparent outline-none text-sm"
                  onFocus={() => setIsOpen(true)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      handleApply();
                    }
                  }}
                />
                {searchValue && (
                  <button
                    type="button"
                    aria-label="Clear search"
                    className="ml-2 text-gray-400 hover:text-gray-600 focus:outline-none"
                    onClick={() => {
                      handleSearchChange("");
                      handleApply();
                    }}
                  >
                    &#10005;
                  </button>
                )}
                <div className="h-6 w-[1px] bg-gray-200 mx-2" />
                <ChevronDownIcon className="text-gray-400 w-5 h-5 ml-2 opacity-60" />
              </div>
              {isOpen && (
                <div className="absolute top-full mt-1 w-full z-50">
                  <SearchCard
                    query={searchValue}
                    setQuery={setSearchValue}
                    categoriesSelected={selectedCategories}
                    setCategoriesSelected={handleCategoriesChange}
                    statusSelected={selectedStatus}
                    setStatusSelected={handleStatusChange}
                    dateStart={dateStart}
                    setStartDate={handleDateStartChange}
                    dateEnd={dateEnd}
                    setEndDate={handleDateEndChange}
                    endAfterChecked={endAfterChecked}
                    setEndAfterChecked={setEndAfterChecked}
                    history={searchHistory.map(q => ({ query: q, category: "All Categories", date: "" }))}
                    setHistory={h => setSearchHistory(h.map(item => item.query))}
                    onSelectHistory={item => {
                      setSearchValue(item.query);
                      handleApply(item.query);
                      setIsOpen(false);
                    }}
                    
                    onApply={() => {
                      setIsOpen(false);
                      handleApply();
                    }}
                  />
                </div>
              )}
            </div>
          </section>
        )}

        {!hideTitle && title && <h1 className="font-bold mb-6 text-2xl pt-4">{title}</h1>}

        {children}
      </div>
    </div>
  );
}
