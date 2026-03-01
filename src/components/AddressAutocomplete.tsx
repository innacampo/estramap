import { useState, useEffect, useRef, useCallback } from "react";
import {
  searchPlaces,
  getPlaceDetails,
  type PlacePrediction,
  type PlaceDetails,
} from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";

interface AddressAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onPlaceSelected: (details: PlaceDetails) => void;
  placeholder?: string;
  className?: string;
}

export default function AddressAutocomplete({
  value,
  onChange,
  onPlaceSelected,
  placeholder = "Address or zip code",
  className,
}: AddressAutocompleteProps) {
  const [predictions, setPredictions] = useState<PlacePrediction[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  // Debounced search
  useEffect(() => {
    if (!value.trim()) {
      setPredictions([]);
      setIsOpen(false);
      return;
    }

    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      const results = await searchPlaces(value);
      setPredictions(results);
      setIsOpen(results.length > 0);
      setLoading(false);
    }, 300);

    return () => clearTimeout(debounceRef.current);
  }, [value]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = useCallback(
    async (prediction: PlacePrediction) => {
      onChange(prediction.description);
      setIsOpen(false);
      setPredictions([]);
      const details = await getPlaceDetails(prediction.place_id);
      if (details) {
        onPlaceSelected(details);
      }
    },
    [onChange, onPlaceSelected],
  );

  return (
    <div ref={wrapperRef} className="relative">
      <div className="relative">
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={className}
          onFocus={() => predictions.length > 0 && setIsOpen(true)}
        />
        {loading && (
          <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
        )}
      </div>
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
  );
}
