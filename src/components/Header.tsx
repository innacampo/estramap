import { MapPin, Search, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface HeaderProps {
  onOpenReport: () => void;
  searchQuery: string;
  onSearchChange: (value: string) => void;
}

const Header = ({ onOpenReport, searchQuery, onSearchChange }: HeaderProps) => {
  return (
    <header className="border-b bg-card shadow-sm">
      <div className="container mx-auto flex flex-col gap-4 px-4 py-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-2">
          <MapPin className="h-7 w-7 text-primary" strokeWidth={2.5} />
          <h1 className="text-2xl font-bold tracking-tight text-primary">EstraMap - [this is a work in progress]</h1>
        </div>

        <div className="flex flex-1 items-center gap-3 md:max-w-xl">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Enter your address or zip code to find patches near you"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-10"
              aria-label="Search for patches near your location" />

          </div>
          <Button onClick={onOpenReport} className="shrink-0 gap-1.5">
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Report Found Stock</span>
            <span className="sm:hidden">Report</span>
          </Button>
        </div>
      </div>
    </header>);

};

export default Header;