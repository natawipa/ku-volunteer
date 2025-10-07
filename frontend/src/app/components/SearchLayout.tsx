import { useRef, useState, useEffect } from "react";
import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import { ChevronDownIcon } from "@heroicons/react/20/solid";
import SearchCard from "./SearchCard";
import SearchResults from "./SearchResults";
import type { Activity } from "../../lib/types";
// Define Event type for transformed activities
type Event = {
	id: number;
	title: string;
	post: string;
	dateStart: string;
	dateEnd: string;
	location: string;
	category: string[];
	imgSrc: string;
	capacity: number;
	status: string;
};

// Transform Activity to EventCard format
const transformActivityToEvent = (activity: Activity) => {
	if (!activity) return null;
	return {
		id: activity.id || 0,
		title: activity.title || "Untitled Activity",
		post: new Date(activity.created_at || new Date()).toLocaleDateString("en-GB"),
		dateStart: new Date(activity.start_at || new Date()).toLocaleDateString("en-GB"),
		dateEnd: new Date(activity.end_at || new Date()).toLocaleDateString("en-GB"),
		location: activity.location || "Unknown Location",
		category: activity.categories || [],
		imgSrc: "/titleExample.jpg",
		capacity: activity.max_participants || 0,
		status: activity.status === "open" ? "upcoming" : activity.status || "unknown",
	};
};

interface SearchLayoutProps {
	activities: Activity[];
	isSearchActive: boolean;
	setIsSearchActive: (active: boolean) => void;
	searchInputRef: React.RefObject<HTMLInputElement | null>;
}

export default function SearchLayout({ activities, isSearchActive, setIsSearchActive, searchInputRef }: SearchLayoutProps) {
	const [isOpen, setIsOpen] = useState(false);
	const [searchQuery, setSearchQuery] = useState("");
	const [searchSelectedCategory, setSearchSelectedCategory] = useState<string[]>([]);
	const [searchStartDate, setSearchStartDate] = useState("");
	const [searchEndDate, setSearchEndDate] = useState("");
	const [endAfterChecked, setEndAfterChecked] = useState(false);
	const [isSearchApplied, setIsSearchApplied] = useState(false);
	const [searchHistory, setSearchHistory] = useState<string[]>(() => {
		if (typeof window !== "undefined") {
			const stored = localStorage.getItem("searchHistory");
			return stored ? JSON.parse(stored) : [];
		}
		return [];
	});
	const wrapperRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		if (typeof window !== "undefined") {
			localStorage.setItem("searchHistory", JSON.stringify(searchHistory));
		}
	}, [searchHistory]);

	useEffect(() => {
		function handleClickOutside(event: MouseEvent) {
			if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
				setIsOpen(false);
			}
		}
		document.addEventListener("mousedown", handleClickOutside);
		return () => document.removeEventListener("mousedown", handleClickOutside);
	}, []);

	// Sync local search state with parent isSearchActive
	useEffect(() => {
		setIsSearchActive(isSearchApplied);
	}, [isSearchApplied, setIsSearchActive]);

	// Transform activities to events format
		const events: Event[] = Array.isArray(activities)
			? activities.map(transformActivityToEvent).filter((e): e is Event => e !== null)
			: [];

	// Filter events based on searchQuery and searchCategory
		const getFilteredEvents = () => {
			const q = searchQuery.toLowerCase().trim();
			return events.filter(ev => {
				if (!ev) return false;
				const matchesSearch = !q ||
					ev.title.toLowerCase().includes(q) ||
					ev.location.toLowerCase().includes(q);
				const matchesCategory =
					searchSelectedCategory.length === 0 ||
					searchSelectedCategory.includes("All Categories") ||
					(Array.isArray(ev.category) && ev.category.some(c => {
						if (searchSelectedCategory.includes("Social Impact")) {
							return c.includes("Social Engagement Activities");
						}
						return searchSelectedCategory.some(sel => c.includes(sel));
					}));
				const matchesDate = !searchStartDate || (() => {
					if (!ev.dateStart) return true;
					const [day, month, year] = ev.dateStart.split("/");
					const eventStart = new Date(`${year}-${month}-${day}`);
					const search = new Date(searchStartDate);
					return eventStart >= search;
				})();
				const matchesEndDate = !searchEndDate || (() => {
					if (!ev.dateEnd) return true;
					const [day, month, year] = ev.dateEnd.split("/");
					const eventEnd = new Date(`${year}-${month}-${day}`);
					const searchEnd = new Date(searchEndDate);
					if (endAfterChecked) {
						return eventEnd >= searchEnd;
					} else {
						return eventEnd <= searchEnd;
					}
				})();
				return matchesSearch && matchesCategory && matchesDate && matchesEndDate;
			});
		};

	// Render events in search results layout (filtered)
	const renderSearchResults = () => {
		const filteredEvents = getFilteredEvents();
		return (
			<SearchResults
				events={filteredEvents}
				onBack={() => setIsSearchApplied(false)}
			/>
		);
	};

	return (
		<section className="mb-6">
			<div
				ref={wrapperRef}
				className="relative w-150 justify-center mx-auto"
			>
				<div className="flex bg-white items-center rounded-md px-4 py-3 shadow-md"
					onClick={() => { setIsOpen(true); setIsSearchApplied(true); }}
				>
					<MagnifyingGlassIcon className="text-black-400 w-5 h-5" />
					<input
						type="text"
						placeholder="Search activities"
						value={searchQuery}
						onChange={(e) => {
							setSearchQuery(e.target.value);
							const trimmed = e.target.value.trim();
							if (trimmed === '') {
								setIsSearchApplied(false);
							} else {
								setIsSearchApplied(true);
							}
						}}
						className="font-mitr ml-2 flex-1 border-0 bg-transparent outline-none"
						onFocus={() => { setIsOpen(true); setIsSearchApplied(true); }}
						onKeyDown={(e) => {
							if (e.key === 'Enter') {
								setIsOpen(false);
								setIsSearchApplied(true);
								const trimmed = searchQuery.trim();
								if (trimmed && !searchHistory.includes(trimmed)) {
									setSearchHistory([trimmed, ...searchHistory].slice(0, 10));
								}
							}
						}}
					/>
					{isOpen && searchHistory.length > 0 && (
						<div className="absolute left-0 right-0 top-full mt-1 bg-white border border-gray-200 rounded shadow z-50 max-h-48 overflow-y-auto">
							{searchHistory.map((item, idx) => (
								<div key={idx} className="flex items-center justify-between px-4 py-2 hover:bg-gray-100 cursor-pointer">
									<span
										onClick={() => {
											setSearchQuery(item);
											setIsSearchApplied(true);
											setIsOpen(false);
										}}
										className="flex-1 text-left"
									>
										{item}
									</span>
									<button
										onClick={(e) => {
											e.stopPropagation();
											setSearchHistory(searchHistory.filter((h) => h !== item));
										}}
										className="ml-2 text-xs text-red-500 hover:text-red-700"
										title="Remove"
									>
										✕
									</button>
								</div>
							))}
						</div>
					)}
					{isSearchApplied && searchQuery && (
						<button
							onClick={(e) => {
								e.stopPropagation();
								setSearchQuery('');
								setSearchSelectedCategory([]);
								setSearchStartDate('');
								setSearchEndDate('');
								setIsSearchApplied(false);
							}}
							className="text-sm text-gray-500 hover:text-gray-700 px-2"
						>
							Clear
						</button>
					)}
					<div className="h-6 w-[1px] bg-gray-200 mx-2"></div>
					<ChevronDownIcon className="text-black-400 w-5 h-5 ml-2 opacity-50" />
				</div>

				{isOpen && (
					<div className="absolute top-full mt-1 w-full z-50">
						<SearchCard
							query={searchQuery}
							setQuery={setSearchQuery}
							categoriesSelected={searchSelectedCategory}
							setCategoriesSelected={setSearchSelectedCategory}
							dateStart={searchStartDate}
							setStartDate={setSearchStartDate}
							dateEnd={searchEndDate}
							setEndDate={setSearchEndDate}
							endAfterChecked={endAfterChecked}
							setEndAfterChecked={setEndAfterChecked}
							history={searchHistory.map(q => ({ query: q, category: "All Categories", date: "" }))}
							setHistory={(h) => setSearchHistory(h.map(item => item.query))}
							onSelectHistory={(item) => {
								setSearchQuery(item.query);
								setIsSearchApplied(true);
								setIsOpen(false);
							}}
							onKeyDown={(e) => {
								if (e.key === 'Enter') {
									setIsOpen(false);
									setIsSearchApplied(true);
									const trimmed = searchQuery.trim();
									if (trimmed && !searchHistory.includes(trimmed)) {
										setSearchHistory([trimmed, ...searchHistory].slice(0, 10));
									}
								}
							}}
							onApply={() => {
								setIsOpen(true);
								setIsSearchApplied(true);
								const trimmed = searchQuery.trim();
								if (trimmed && !searchHistory.includes(trimmed)) {
									setSearchHistory([trimmed, ...searchHistory].slice(0, 10));
								}
							}}
						/>
					</div>
				)}
			</div>

			{/* Search Results Section */}
			{isSearchApplied && renderSearchResults()}
		</section>
	);
}
