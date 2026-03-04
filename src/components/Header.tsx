import { MapPin, Search, Loader2, Sparkles } from "lucide-react";
import ThemeToggle from "@/components/ThemeToggle";
import { useState, useEffect, useRef, useCallback } from "react";
import { motion } from "framer-motion";
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
    <header className="sticky top-0 z-50 glass-strong shadow-premium">
      <div className="container mx-auto flex flex-col gap-4 px-4 py-3 md:flex-row md:items-center md:justify-between">
        {/* Logo */}
        <motion.div
          className="flex items-center gap-3"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="relative">
            <div className="bg-primary rounded-xl p-2.5 shadow-premium glow-primary">
              <MapPin className="h-5 w-5 text-primary-foreground" strokeWidth={2.5} />
            </div>
            <div className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-in-stock animate-pulse-glow" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight gradient-text">
              ESTRAMAP
            </h1>
            <p className="text-[10px] font-medium text-muted-foreground tracking-widest uppercase">
              Community Stock Tracker
            </p>
          </div>
        </motion.div>

        {/* Controls */}
        <motion.div
          className="flex flex-col flex-1 gap-3 w-full md:flex-row md:items-center md:max-w-2xl"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <div ref={wrapperRef} className="relative w-full min-w-0">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground z-10" />
            <Input
              placeholder="Search address, zip, or pharmacy..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              onFocus={() => predictions.length > 0 && setIsOpen(true)}
              className="pl-10 pr-9 h-11 rounded-xl bg-muted/50 border-border/50 focus:bg-card focus:shadow-premium transition-all duration-300"
              aria-label="Search for patches near your location"
            />
            {loading && (
              <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-primary" />
            )}
            {isOpen && (
              <motion.ul
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="absolute z-50 mt-2 max-h-60 w-full overflow-auto rounded-xl border bg-popover/95 backdrop-blur-xl p-1.5 shadow-premium-lg"
              >
                {predictions.map((p, i) => (
                  <motion.li
                    key={p.place_id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className="cursor-pointer rounded-lg px-3 py-2.5 text-sm hover:bg-accent/80 transition-colors duration-150"
                    onClick={() => handleSelect(p)}
                  >
                    <span className="flex items-center gap-2">
                      <MapPin className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      {p.description}
                    </span>
                  </motion.li>
                ))}
              </motion.ul>
            )}
          </div>

          <Select value={doseFilter} onValueChange={onDoseFilterChange}>
            <SelectTrigger className="w-full sm:w-[130px] shrink-0 h-11 rounded-xl bg-muted/50 border-border/50" aria-label="Filter by dose">
              <SelectValue placeholder="All doses" />
            </SelectTrigger>
            <SelectContent className="rounded-xl shadow-premium-lg border-border/50 backdrop-blur-xl">
              <SelectItem value="all">All doses</SelectItem>
              {DOSE_OPTIONS.map((d) => (
                <SelectItem key={d} value={d}>{d}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            onClick={onOpenReport}
            className="w-full sm:w-auto shrink-0 gap-2 h-11 rounded-xl shadow-premium glow-primary font-semibold transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
          >
            <Sparkles className="h-4 w-4" />
            <span className="hidden sm:inline">Report Stock</span>
            <span className="sm:hidden">Report</span>
          </Button>

          <ThemeToggle />
        </motion.div>
      </div>
    </header>
  );
};

export default Header;
