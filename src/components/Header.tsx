import { MapPin, Search, Plus, Loader2 } from "lucide-react";
import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { searchPlaces, getPlaceDetails, type PlacePrediction, type PlaceDetails } from "@/lib/api";

export const DOSE_OPTIONS = ["0.025mg", "0.05mg", "0.075mg", "0.1mg"] as const;

interface HeaderProps {
  onOpenReport: () => void;
  searchQuery: string;
  onSearchChange: (value: string) => void;
  doseFilter: string;
  onDoseFilterChange: (value: string) => void;
  onPlaceSelected?: (details: PlaceDetails) => void;
}

const Header = ({ onOpenReport, searchQuery, onSearchChange, doseFilter, onDoseFilterChange, onPlaceSelected }: HeaderProps) => {
  const [predictions, setPredictions] = useState<PlacePrediction[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  // Debounced address search
  useEffect(() => {
    if (!searchQuery.trim()) {
      setPredictions([]);
      setIsOpen(false);
      return;
    }
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      const results = await searchPlaces(searchQuery);
      setPredictions(results);
      setIsOpen(results.length > 0);
      setLoading(false);
    }, 400);
    return () => clearTimeout(debounceRef.current);
  }, [searchQuery]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = useCallback(
    async (prediction: PlacePrediction) => {
      onSearchChange(prediction.description);
      setIsOpen(false);
      setPredictions([]);
      const details = await getPlaceDetails(prediction.place_id);
      if (details && onPlaceSelected) {
        onPlaceSelected(details);
      }
    },
    [onSearchChange, onPlaceSelected],
  );

  return (
    <header className="border-b bg-card shadow-sm">
      <div className="container mx-auto flex flex-col gap-4 px-4 py-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-2">
<div className="bg-primary p-2 rounded-lg">
  <MapPin className="h-6 w-6 text-white" strokeWidth={3} />
        </div>
          <h1 className="text-2xl font-black italic tracking-tighter text-primary">ESTRAMAP</h1>
        </div>

        <div className="flex flex-col flex-1 gap-3 w-full md:flex-row md:items-center md:max-w-2xl">
          {/* search input should take full width on mobile and be allowed to shrink */}
          <div ref={wrapperRef} className="relative w-full min-w-0">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground z-10" />
            <Input
              placeholder="Enter your address or zip code"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              onFocus={() => predictions.length > 0 && setIsOpen(true)}
              className="pl-10 pr-9"
              aria-label="Search for patches near your location"
            />
            {loading && (
              <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
            )}
            {isOpen && (
              <ul className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md border bg-popover p-1 shadow-md">
                {predictions.map((p) => (
                  <li
                    key={p.place_id}
                    className="cursor-pointer rounded-sm px-3 py-2 text-sm hover:bg-accent"
                    onClick={() => handleSelect(p)}
                  >
                    {p.description}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <Select
            value={doseFilter}
            onValueChange={onDoseFilterChange}
          >
            <SelectTrigger className="w-full sm:w-[130px] shrink-0" aria-label="Filter by dose">
              <SelectValue placeholder="All doses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All doses</SelectItem>
              {DOSE_OPTIONS.map((dose) => (
                <SelectItem key={dose} value={dose}>{dose}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            onClick={onOpenReport}
            className="w-full sm:w-auto shrink-0 gap-1.5"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Report Found Stock</span>
            <span className="sm:hidden">Report</span>
          </Button>
        </div>
      </div>
    </header>);

};

export default Header;