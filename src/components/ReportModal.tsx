import { useState, useRef } from "react";
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
import { Store, Globe, CheckCircle, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import AddressAutocomplete from "@/components/AddressAutocomplete";
import { createReport, geocodeAddress, type PlaceDetails } from "@/lib/api";
import { toast } from "sonner";

interface ReportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onReportSubmitted?: (optimistic: Record<string, unknown>) => void;
}

type PharmacyType = "local" | "online";
type StockStatus = "in-stock" | "low-stock" | "out-of-stock";

const SUBMIT_COOLDOWN_MS = 30_000;

const ReportModal = ({ open, onOpenChange, onReportSubmitted }: ReportModalProps) => {
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
  const [submitting, setSubmitting] = useState(false);
  const lastSubmitRef = useRef<number>(0);

  const resetForm = () => {
    setPharmacyName("");
    setAddress("");
    setLat(null);
    setLng(null);
    setWebsiteName("");
    setWebsiteUrl("");
    setDose("");
    setStatus("");
    setNotes("");
  };

  const handleSubmit = async () => {
    if (!status) return;
    const now = Date.now();
    const elapsed = now - lastSubmitRef.current;
    if (elapsed < SUBMIT_COOLDOWN_MS) {
      const remaining = Math.ceil((SUBMIT_COOLDOWN_MS - elapsed) / 1000);
      toast.error(`Please wait ${remaining}s before submitting another report.`);
      return;
    }
    setSubmitting(true);
    try {
      let reportLat = pharmacyType === "local" ? lat : null;
      let reportLng = pharmacyType === "local" ? lng : null;
      if (pharmacyType === "local" && address && (reportLat == null || reportLng == null)) {
        const coords = await geocodeAddress(address);
        if (coords) { reportLat = coords.lat; reportLng = coords.lng; }
      }
      const reportPayload = {
        type: pharmacyType,
        pharmacy_name: pharmacyType === "local" ? pharmacyName : websiteName,
        address: pharmacyType === "local" ? address : null,
        website_url: pharmacyType === "online" ? websiteUrl : null,
        medication: "Estradiol Patch",
        dose,
        status,
        notes: notes || null,
        lat: reportLat,
        lng: reportLng,
      };
      onReportSubmitted?.(reportPayload);
      await createReport(reportPayload);
      setSubmitted(true);
      lastSubmitRef.current = Date.now();
      setTimeout(() => { setSubmitted(false); resetForm(); onOpenChange(false); }, 2000);
    } catch {
      toast.error("Failed to submit report. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const isValid = dose && status && (pharmacyType === "local" ? pharmacyName && address : websiteName && websiteUrl);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100%-2rem)] sm:max-w-lg rounded-2xl max-h-[90dvh] overflow-y-auto border-border/50 shadow-premium-lg">
        <AnimatePresence mode="wait">
          {submitted ? (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="flex flex-col items-center gap-4 py-10 text-center"
            >
              <div className="rounded-full bg-in-stock/10 p-4">
                <CheckCircle className="h-12 w-12 text-in-stock" />
              </div>
              <h3 className="text-xl font-semibold text-card-foreground">Thank you!</h3>
              <p className="text-muted-foreground">Your report has been shared with the community.</p>
            </motion.div>
          ) : (
            <motion.div
              key="form"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <DialogHeader>
                <DialogTitle className="text-lg sm:text-xl font-bold">Report Found Stock</DialogTitle>
                <DialogDescription className="text-sm">
                  Help others find estradiol patches by sharing what you found.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-5 pt-2">
                {/* Step 1 */}
                <div className="space-y-2">
                  <Label className="text-[11px] uppercase tracking-widest text-muted-foreground font-semibold">
                    Step 1 — Where did you find it?
                  </Label>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant={pharmacyType === "local" ? "default" : "outline"}
                      className={`flex-1 gap-1.5 text-sm rounded-xl h-11 transition-all duration-200 ${pharmacyType === "local" ? "shadow-premium glow-primary" : "border-border/50"}`}
                      onClick={() => setPharmacyType("local")}
                    >
                      <Store className="h-4 w-4 shrink-0" />
                      Local
                    </Button>
                    <Button
                      type="button"
                      variant={pharmacyType === "online" ? "default" : "outline"}
                      className={`flex-1 gap-1.5 text-sm rounded-xl h-11 transition-all duration-200 ${pharmacyType === "online" ? "shadow-premium glow-primary" : "border-border/50"}`}
                      onClick={() => setPharmacyType("online")}
                    >
                      <Globe className="h-4 w-4 shrink-0" />
                      Online
                    </Button>
                  </div>
                </div>

                {/* Step 2 */}
                <div className="space-y-2">
                  <Label className="text-[11px] uppercase tracking-widest text-muted-foreground font-semibold">
                    Step 2 — Pharmacy details
                  </Label>
                  <AnimatePresence mode="wait">
                    {pharmacyType === "local" ? (
                      <motion.div key="local" initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 8 }} className="space-y-2">
                        <Input placeholder="Pharmacy name (e.g., CVS, Walgreens)" value={pharmacyName} onChange={(e) => setPharmacyName(e.target.value)} className="rounded-xl h-11 border-border/50" />
                        <AddressAutocomplete
                          value={address}
                          onChange={(val) => { setAddress(val); setLat(null); setLng(null); }}
                          onPlaceSelected={(details: PlaceDetails) => { setAddress(details.formatted_address); setLat(details.lat); setLng(details.lng); }}
                          placeholder="Address or zip code"
                        />
                      </motion.div>
                    ) : (
                      <motion.div key="online" initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -8 }} className="space-y-2">
                        <Input placeholder="Website name (e.g., Amazon Pharmacy)" value={websiteName} onChange={(e) => setWebsiteName(e.target.value)} className="rounded-xl h-11 border-border/50" />
                        <Input placeholder="Website URL (e.g., https://pharmacy.com)" value={websiteUrl} onChange={(e) => setWebsiteUrl(e.target.value)} type="url" className="rounded-xl h-11 border-border/50" />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Step 3 */}
                <div className="space-y-2">
                  <Label className="text-[11px] uppercase tracking-widest text-muted-foreground font-semibold">
                    Step 3 — Medication details
                  </Label>
                  <div className="flex gap-2">
                    <div className="flex-1 min-w-0">
                      <Input value="Estradiol Patch" disabled className="bg-muted/50 truncate rounded-xl h-11 border-border/50" />
                    </div>
                    <div className="w-28 shrink-0">
                      <select
                        value={dose}
                        onChange={(e) => setDose(e.target.value)}
                        className="flex h-11 w-full items-center rounded-xl border border-border/50 bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                      >
                        <option value="" disabled>Dose</option>
                        <option value="0.025mg">0.025mg</option>
                        <option value="0.05mg">0.05mg</option>
                        <option value="0.075mg">0.075mg</option>
                        <option value="0.1mg">0.1mg</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Step 4 */}
                <div className="space-y-2">
                  <Label className="text-[11px] uppercase tracking-widest text-muted-foreground font-semibold">
                    Step 4 — Stock status
                  </Label>
                  <div className="flex flex-col xs:flex-row gap-2">
                    {([
                      { val: "in-stock", label: "✅ In Stock", activeClass: "bg-in-stock hover:bg-in-stock/90 text-primary-foreground status-glow-green" },
                      { val: "low-stock", label: "⚠️ Low Stock", activeClass: "bg-low-stock hover:bg-low-stock/90 text-primary-foreground status-glow-amber" },
                      { val: "out-of-stock", label: "❌ Out of Stock", activeClass: "bg-out-of-stock hover:bg-out-of-stock/90 text-primary-foreground status-glow-red" },
                    ] as const).map(({ val, label, activeClass }) => (
                      <Button
                        key={val}
                        type="button"
                        variant={status === val ? "default" : "outline"}
                        className={`flex-1 text-sm rounded-xl h-11 transition-all duration-200 ${status === val ? activeClass : "border-border/50"}`}
                        onClick={() => setStatus(val)}
                      >
                        {label}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Step 5 */}
                <div className="space-y-2">
                  <Label className="text-[11px] uppercase tracking-widest text-muted-foreground font-semibold">
                    Step 5 — Notes (optional)
                  </Label>
                  <textarea
                    className="w-full min-h-[56px] rounded-xl border border-border/50 bg-background px-3 py-2.5 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-none transition-all duration-200"
                    placeholder="Add any extra details, e.g. hours, restrictions, or tips."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    maxLength={500}
                  />
                </div>

                <Button
                  onClick={handleSubmit}
                  disabled={!isValid || submitting}
                  className="w-full h-12 rounded-xl font-semibold text-base shadow-premium glow-primary transition-all duration-300 hover:scale-[1.01] active:scale-[0.99]"
                  size="lg"
                >
                  <Sparkles className="h-4 w-4 mr-2" />
                  {submitting ? "Submitting..." : "Share with the Community"}
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
};

export default ReportModal;
