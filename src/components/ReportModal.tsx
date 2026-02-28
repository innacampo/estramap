import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Store, Globe, CheckCircle } from "lucide-react";
import Autocomplete from "react-google-autocomplete";

interface ReportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type PharmacyType = "local" | "online";
type StockStatus = "in-stock" | "low-stock";

const ReportModal = ({ open, onOpenChange }: ReportModalProps) => {
  const [pharmacyType, setPharmacyType] = useState<PharmacyType>("local");
  const [pharmacyName, setPharmacyName] = useState("");
  const [address, setAddress] = useState("");
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [websiteName, setWebsiteName] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [dose, setDose] = useState("");
  const [status, setStatus] = useState<StockStatus | "">("");
  const [notes, setNotes] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = () => {
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setPharmacyName("");
      setAddress("");
      setLat(null);
      setLng(null);
      setWebsiteUrl("");
      setDose("");
      setStatus("");
      setNotes("");
      onOpenChange(false);
    }, 2000);
  };

  const isValid =
    dose &&
    status &&
    (pharmacyType === "local"
      ? pharmacyName && address
      : websiteName && websiteUrl);

  if (submitted) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <div className="flex flex-col items-center gap-4 py-8 text-center">
            <CheckCircle className="h-12 w-12 text-in-stock" />
            <h3 className="text-xl font-semibold text-card-foreground">
              Thank you!
            </h3>
            <p className="text-muted-foreground">
              Your report has been shared with the community.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-xl">Report Found Stock</DialogTitle>
          <DialogDescription>
            Help others find estradiol patches by sharing what you found.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 pt-2">
          {/* Step 1 */}
          <div className="space-y-2">
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">
              Step 1 — Where did you find it?
            </Label>
            <div className="flex gap-2">
              <Button
                type="button"
                variant={pharmacyType === "local" ? "default" : "outline"}
                className="flex-1 gap-2"
                onClick={() => setPharmacyType("local")}
              >
                <Store className="h-4 w-4" />
                Local Pharmacy
              </Button>
              <Button
                type="button"
                variant={pharmacyType === "online" ? "default" : "outline"}
                className="flex-1 gap-2"
                onClick={() => setPharmacyType("online")}
              >
                <Globe className="h-4 w-4" />
                Online Pharmacy
              </Button>
            </div>
          </div>

          {/* Step 2 */}
          <div className="space-y-2">
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">
              Step 2 — Pharmacy details
            </Label>
            {pharmacyType === "local" ? (
              <div className="space-y-3">
                <Input
                  placeholder="Pharmacy name (e.g., CVS, Walgreens)"
                  value={pharmacyName}
                  onChange={(e) => setPharmacyName(e.target.value)}
                />
                <Autocomplete
                  apiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY}
                  onPlaceSelected={(place) => {
                    setAddress(place.formatted_address || "");
                    const location = place.geometry?.location;
                    if (location) {
                      setLat(location.lat());
                      setLng(location.lng());
                    }
                  }}
                  options={{ types: ["address"] }}
                  placeholder="Address or zip code"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 md:text-sm"
                />
              </div>
            ) : (
              <div className="space-y-3">
                <Input
                  placeholder="Website name (e.g., Amazon Pharmacy)"
                  value={websiteName}
                  onChange={(e) => setWebsiteName(e.target.value)}
                />
                <Input
                  placeholder="Website URL (e.g., https://pharmacy.com)"
                  value={websiteUrl}
                  onChange={(e) => setWebsiteUrl(e.target.value)}
                  type="url"
                />
              </div>
            )}
          </div>

          {/* Step 3 */}
          <div className="space-y-2">
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">
              Step 3 — Medication details
            </Label>
            <div className="flex gap-3">
              <div className="flex-1">
                <Input value="Estradiol Patch" disabled className="bg-muted" />
              </div>
              <div className="w-32">
                <Select value={dose} onValueChange={setDose}>
                  <SelectTrigger>
                    <SelectValue placeholder="Dose" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0.025mg">0.025mg</SelectItem>
                    <SelectItem value="0.05mg">0.05mg</SelectItem>
                    <SelectItem value="0.075mg">0.075mg</SelectItem>
                    <SelectItem value="0.1mg">0.1mg</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>


          {/* Step 4 */}
          <div className="space-y-2">
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">
              Step 4 — Stock status
            </Label>
            <div className="flex gap-2">
              <Button
                type="button"
                variant={status === "in-stock" ? "default" : "outline"}
                className={`flex-1 ${status === "in-stock" ? "bg-in-stock hover:bg-in-stock/90 text-white" : ""}`}
                onClick={() => setStatus("in-stock")}
              >
                ✅ In Stock
              </Button>
              <Button
                type="button"
                variant={status === "low-stock" ? "default" : "outline"}
                className={`flex-1 ${status === "low-stock" ? "bg-low-stock hover:bg-low-stock/90 text-white" : ""}`}
                onClick={() => setStatus("low-stock")}
              >
                ⚠️ Low Stock / Few Left
              </Button>
            </div>
          </div>

          {/* Step 5 */}
          <div className="space-y-2">
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">
              Step 5 — Notes (optional)
            </Label>
            <textarea
              className="w-full min-h-[60px] rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              placeholder="Add any extra details, e.g. hours, restrictions, or tips."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              maxLength={500}
            />
          </div>

          <Button
            onClick={handleSubmit}
            disabled={!isValid}
            className="w-full"
            size="lg"
          >
            Share with the Community
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ReportModal;
