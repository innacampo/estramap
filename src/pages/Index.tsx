import { useState, useMemo, useCallback } from "react";
import SEO from "@/components/SEO";
import { Map, Loader2, AlertCircle, Inbox, Navigation, X } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import Header from "@/components/Header";
import LocalReportCard from "@/components/LocalReportCard";
import OnlineReportCard from "@/components/OnlineReportCard";
import PharmacyMap from "@/components/PharmacyMap";
import ReportModal from "@/components/ReportModal";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { fetchReports, voteOnReport, type PlaceDetails } from "@/lib/api";
import { useGeolocation, distanceMiles } from "@/hooks/use-geolocation";
import { useRealtimeReports } from "@/hooks/use-realtime-reports";

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
        // silently fail — user can retry
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
    <div className="flex flex-col items-center gap-3 py-12 text-center text-muted-foreground">
      <Inbox className="h-10 w-10" />
      <p className="text-sm">{message}</p>
      <Button variant="outline" size="sm" onClick={() => setReportOpen(true)}>
        Be the first to report
      </Button>
    </div>
  );

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SEO />
      <Header
        onOpenReport={() => setReportOpen(true)}
        searchQuery={searchQuery}
        onSearchChange={(val) => {
          setSearchQuery(val);
          // User is typing manually — switch back to text filtering
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
        {isError && (
          <div className="mb-4 flex items-center gap-2 rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-destructive">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <p className="text-sm">
              Failed to load reports{error instanceof Error ? `: ${error.message}` : ""}. Please try
              again later.
            </p>
            <Button variant="outline" size="sm" className="ml-auto shrink-0" onClick={() => refetch()}>
              Retry
            </Button>
          </div>
        )}

        {/* Mobile map toggle */}
        <div className="mb-4 md:hidden">
          <Button
            variant="outline"
            className="w-full gap-2"
            onClick={() => setShowMobileMap(!showMobileMap)}
          >
            <Map className="h-4 w-4" />
            {showMobileMap ? "Show Feed" : "Show Map"}
          </Button>
        </div>

        {/* Mobile full-screen map */}
        {showMobileMap && (
          <div className="mb-4 h-[60vh] overflow-hidden rounded-lg border md:hidden">
            <PharmacyMap
              reports={localReports}
              highlightedId={highlightedId}
              onHover={setHighlightedId}
              userLocation={userLocation}
            />
          </div>
        )}

        <div className="flex gap-6">
          {/* Left Column — Feed */}
          {!showMobileMap && (
            <div className="w-full md:w-[45%] lg:w-[40%]">
              <Tabs defaultValue="local" className="w-full">
                <TabsList className="mb-4 w-full">
                  <TabsTrigger value="local" className="flex-1">
                    Local Pharmacies
                  </TabsTrigger>
                  <TabsTrigger value="online" className="flex-1">
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
                        className="gap-1.5"
                        onClick={clearLocation}
                      >
                        <X className="h-3.5 w-3.5" />
                        Clear location
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-1.5"
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
                      <span className="text-xs text-muted-foreground">Sorted by distance</span>
                    )}
                  </div>

                  {isLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                  ) : localReports.length === 0 ? (
                    <EmptyState
                      message={
                        normalizedQuery
                          ? "No local pharmacies match your search."
                          : "No local pharmacy reports yet."
                      }
                    />
                  ) : (
                    <div className="space-y-3">
                      {localReports.map((report) => (
                        <LocalReportCard
                          key={report.id}
                          report={report}
                          isHighlighted={highlightedId === report.id}
                          onHover={setHighlightedId}
                          onVote={handleVote}
                          distance={"_distance" in report ? (report as any)._distance : undefined}
                        />
                      ))}
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="online">
                  {isLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                  ) : onlineReports.length === 0 ? (
                    <EmptyState
                      message={
                        normalizedQuery
                          ? "No online pharmacies match your search."
                          : "No online pharmacy reports yet."
                      }
                    />
                  ) : (
                    <div className="space-y-3">
                      {onlineReports.map((report) => (
                        <OnlineReportCard key={report.id} report={report} onVote={handleVote} />
                      ))}
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </div>
          )}

          {/* Right Column — Map (desktop) */}
          <div className="hidden flex-1 md:block">
            <div className="sticky top-6 h-[calc(100vh-8rem)] overflow-hidden rounded-lg border">
              <PharmacyMap
                reports={localReports}
                highlightedId={highlightedId}
                onHover={setHighlightedId}
                userLocation={userLocation}
              />
            </div>
          </div>
        </div>
      </main>

      <footer className="border-t bg-card py-4 text-center text-sm text-muted-foreground">
        <p>
          ESTRAMAP is a community-powered tool. Always verify stock with your
          pharmacy before visiting.
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
          // Background refetch to reconcile with real server data
          refetch();
        }}
      />
    </div>
  );
};

export default Index;
