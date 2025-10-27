"use client";
import { useRef, useState, useEffect, ReactNode, ChangeEvent } from 'react';
import Image from 'next/image';
import SearchCard from '@/app/components/SearchCard';
import { MagnifyingGlassIcon, ChevronDownIcon } from '@heroicons/react/24/outline';
import Header from './Header';

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
  const [userRole, ] = useState<string | null>(null);
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
        {/* Background */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#DAE9DC] to-white h-[350px]" />
        <div className="absolute inset-0 top-0 h-[510px] bg-[url('/mountain.svg')] bg-cover bg-center pt-11 mt-5" />
      <div className="relative p-6">
        <Header showBigLogo={true} showSearch={true} />
        {!hideTitle && title && <h1 className="font-bold mb-6 text-2xl pt-4">{title}</h1>}
        {children}
      </div>
    </div>
  );
}
