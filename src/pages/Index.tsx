import { useState, useMemo, useCallback } from "react";
import SEO from "@/components/SEO";
import { Map, Loader2, AlertCircle, Inbox, Navigation, X, Sparkles } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import Header from "@/components/Header";
import LocalReportCard from "@/components/LocalReportCard";
import OnlineReportCard from "@/components/OnlineReportCard";
import PharmacyMap from "@/components/PharmacyMap";
import ReportModal from "@/components/ReportModal";
import MapLegend from "@/components/MapLegend";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchReports, voteOnReport, type PlaceDetails } from "@/lib/api";
import { useGeolocation, distanceMiles } from "@/hooks/use-geolocation";
import { useRealtimeReports } from "@/hooks/use-realtime-reports";

const CardSkeleton = () => (
  <div className="rounded-2xl border border-border/50 bg-card p-5 space-y-3">
    <div className="flex items-center gap-2.5">
      <Skeleton className="h-5 w-40" />
      <Skeleton className="h-5 w-16 rounded-full" />
    </div>
    <Skeleton className="h-4 w-56" />
    <Skeleton className="h-4 w-32" />
    <div className="border-t border-border/50 pt-3 mt-4 flex justify-between">
      <Skeleton className="h-4 w-20" />
      <div className="flex gap-2">
        <Skeleton className="h-8 w-20 rounded-full" />
        <Skeleton className="h-8 w-20 rounded-full" />
      </div>
    </div>
  </div>
);

const Index = () => {
  useRealtimeReports();
  const queryClient = useQueryClient();
  const [reportOpen, setReportOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLocationSearch, setIsLocationSearch] = useState(false);
  const [doseFilter, setDoseFilter] = useState("all");
  const [highlightedId, setHighlightedId] = useState<string | null>(null);
  const [showMobileMap, setShowMobileMap] = useState(false);
  const { userLocation, isLocating, requestLocation, clearLocation, setManualLocation } = useGeolocation();

  const {
    data: reports = [],
    refetch,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["pharmacy_reports"],
    queryFn: fetchReports,
    refetchInterval: 60_000,
  });

  const handleVote = useCallback(
    async (reportId: string, type: "up" | "down") => {
      try {
        await voteOnReport(reportId, type);
        refetch();
      } catch {
        // silently fail
      }
    },
    [refetch],
  );

  const normalizedQuery = isLocationSearch ? "" : searchQuery.trim().toLowerCase();

  const localReports = useMemo(() => {
    const filtered = reports
      .filter((r) => r.type === "local")
      .filter(
        (r) =>
          !normalizedQuery ||
          r.pharmacy_name?.toLowerCase().includes(normalizedQuery) ||
          r.address?.toLowerCase().includes(normalizedQuery) ||
          r.medication?.toLowerCase().includes(normalizedQuery) ||
          r.dose?.toLowerCase().includes(normalizedQuery),
      )
      .filter((r) => doseFilter === "all" || r.dose === doseFilter);

    if (userLocation) {
      return filtered
        .map((r) => ({
          ...r,
          _distance:
            r.lat != null && r.lng != null
              ? distanceMiles(userLocation.lat, userLocation.lng, r.lat, r.lng)
              : Infinity,
        }))
        .sort((a, b) => a._distance - b._distance);
    }
    return filtered;
  }, [reports, normalizedQuery, userLocation, doseFilter, isLocationSearch]);

  const onlineReports = useMemo(
    () =>
      reports
        .filter((r) => r.type === "online")
        .filter(
          (r) =>
            !normalizedQuery ||
            r.pharmacy_name?.toLowerCase().includes(normalizedQuery) ||
            r.medication?.toLowerCase().includes(normalizedQuery) ||
            r.dose?.toLowerCase().includes(normalizedQuery),
        )
        .filter((r) => doseFilter === "all" || r.dose === doseFilter),
    [reports, normalizedQuery, doseFilter, isLocationSearch],
  );

  const EmptyState = ({ message }: { message: string }) => (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center gap-4 py-16 text-center text-muted-foreground"
    >
      <div className="rounded-2xl bg-muted/50 p-5">
        <Inbox className="h-10 w-10 text-muted-foreground/60" />
      </div>
      <p className="text-sm font-medium">{message}</p>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setReportOpen(true)}
        className="gap-2 rounded-full hover:bg-primary/10 hover:text-primary hover:border-primary/40 transition-all duration-200"
      >
        <Sparkles className="h-3.5 w-3.5" />
        Be the first to report
      </Button>
    </motion.div>
  );

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SEO />
      <Header
        onOpenReport={() => setReportOpen(true)}
        searchQuery={searchQuery}
        onSearchChange={(val) => {
          setSearchQuery(val);
          if (isLocationSearch) {
            setIsLocationSearch(false);
            clearLocation();
          }
        }}
        doseFilter={doseFilter}
        onDoseFilterChange={setDoseFilter}
        onPlaceSelected={(details: PlaceDetails) => {
          setIsLocationSearch(true);
          setManualLocation({ lat: details.lat, lng: details.lng });
        }}
      />

      <main className="container mx-auto flex-1 px-4 py-6">
        <AnimatePresence>
          {isError && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="mb-4 flex items-center gap-2 rounded-2xl border border-destructive/30 bg-destructive/5 p-4 text-destructive shadow-premium"
            >
              <AlertCircle className="h-5 w-5 shrink-0" />
              <p className="text-sm">
                Failed to load reports{error instanceof Error ? `: ${error.message}` : ""}. Please try again later.
              </p>
              <Button variant="outline" size="sm" className="ml-auto shrink-0 rounded-full" onClick={() => refetch()}>
                Retry
              </Button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Mobile map toggle */}
        <div className="mb-4 md:hidden">
          <Button
            variant="outline"
            className="w-full gap-2 rounded-xl h-11 border-border/50 hover:bg-primary/10 hover:text-primary hover:border-primary/40 transition-all"
            onClick={() => setShowMobileMap(!showMobileMap)}
          >
            <Map className="h-4 w-4" />
            {showMobileMap ? "Show Feed" : "Show Map"}
          </Button>
        </div>

        {/* Mobile full-screen map */}
        <AnimatePresence>
          {showMobileMap && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "60vh" }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-4 overflow-hidden rounded-2xl border border-border/50 shadow-premium md:hidden"
            >
              <PharmacyMap
                reports={localReports}
                highlightedId={highlightedId}
                onHover={setHighlightedId}
                userLocation={userLocation}
              />
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex gap-6">
          {!showMobileMap && (
            <div className="w-full md:w-[45%] lg:w-[40%]">
              <Tabs defaultValue="local" className="w-full">
                <TabsList className="mb-4 w-full rounded-xl h-12 bg-muted/60 p-1.5 gap-1">
                  <TabsTrigger
                    value="local"
                    className="flex-1 rounded-lg data-[state=active]:bg-card data-[state=active]:shadow-premium data-[state=active]:text-foreground font-medium transition-all duration-200"
                  >
                    Local Pharmacies
                  </TabsTrigger>
                  <TabsTrigger
                    value="online"
                    className="flex-1 rounded-lg data-[state=active]:bg-card data-[state=active]:shadow-premium data-[state=active]:text-foreground font-medium transition-all duration-200"
                  >
                    Online / Mail-Order
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="local">
                  {/* Near me button */}
                  <div className="mb-3 flex items-center gap-2">
                    {userLocation ? (
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-1.5 rounded-full border-primary/30 text-primary hover:bg-primary/10"
                        onClick={clearLocation}
                      >
                        <X className="h-3.5 w-3.5" />
                        Clear location
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-1.5 rounded-full hover:bg-primary/10 hover:text-primary hover:border-primary/40 transition-all duration-200"
                        disabled={isLocating}
                        onClick={requestLocation}
                      >
                        {isLocating ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Navigation className="h-3.5 w-3.5" />
                        )}
                        Near me
                      </Button>
                    )}
                    {userLocation && (
                      <span className="text-xs text-muted-foreground font-medium">Sorted by distance</span>
                    )}
                  </div>

                  {isLoading ? (
                    <div className="space-y-3">
                      {[...Array(4)].map((_, i) => <CardSkeleton key={i} />)}
                    </div>
                  ) : localReports.length === 0 ? (
                    <EmptyState
                      message={normalizedQuery ? "No local pharmacies match your search." : "No local pharmacy reports yet."}
                    />
                  ) : (
                    <div className="space-y-3">
                      {localReports.map((report, i) => (
                        <LocalReportCard
                          key={report.id}
                          report={report}
                          isHighlighted={highlightedId === report.id}
                          onHover={setHighlightedId}
                          onVote={handleVote}
                          distance={"_distance" in report ? (report as any)._distance : undefined}
                          index={i}
                        />
                      ))}
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="online">
                  {isLoading ? (
                    <div className="space-y-3">
                      {[...Array(4)].map((_, i) => <CardSkeleton key={i} />)}
                    </div>
                  ) : onlineReports.length === 0 ? (
                    <EmptyState
                      message={normalizedQuery ? "No online pharmacies match your search." : "No online pharmacy reports yet."}
                    />
                  ) : (
                    <div className="space-y-3">
                      {onlineReports.map((report, i) => (
                        <OnlineReportCard key={report.id} report={report} onVote={handleVote} index={i} />
                      ))}
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </div>
          )}

          {/* Map */}
          <div className="hidden flex-1 md:block">
            <div className="sticky top-20 h-[calc(100vh-8rem)] overflow-hidden rounded-2xl border border-border/50 shadow-premium-lg">
              <PharmacyMap
                reports={localReports}
                highlightedId={highlightedId}
                onHover={setHighlightedId}
                userLocation={userLocation}
              />
              <MapLegend />
            </div>
          </div>
        </div>
      </main>

      <footer className="border-t border-border/50 bg-card/50 backdrop-blur-sm py-6 text-center">
        <p className="text-sm text-muted-foreground">
          <span className="gradient-text font-semibold">ESTRAMAP</span> is a community-powered tool. Always verify stock with your pharmacy before visiting.
        </p>
      </footer>

      <ReportModal
        open={reportOpen}
        onOpenChange={setReportOpen}
        onReportSubmitted={(optimistic) => {
          queryClient.setQueryData<typeof reports>(["pharmacy_reports"], (old = []) => [
            {
              id: `optimistic-${Date.now()}`,
              created_at: new Date().toISOString(),
              upvotes: 0,
              downvotes: 0,
              ...optimistic,
            } as (typeof reports)[number],
            ...old,
          ]);
          refetch();
        }}
      />
    </div>
  );
};

export default Index;
