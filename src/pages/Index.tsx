import { useState, useMemo, useCallback } from "react";
import { Map, Loader2, AlertCircle, Inbox } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import Header from "@/components/Header";
import LocalReportCard from "@/components/LocalReportCard";
import OnlineReportCard from "@/components/OnlineReportCard";
import PharmacyMap from "@/components/PharmacyMap";
import ReportModal from "@/components/ReportModal";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

type PharmacyReport = Tables<"pharmacy_reports">;

const Index = () => {
  const [reportOpen, setReportOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [highlightedId, setHighlightedId] = useState<string | null>(null);
  const [showMobileMap, setShowMobileMap] = useState(false);

  const {
    data: reports = [],
    refetch,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["pharmacy_reports"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pharmacy_reports")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as PharmacyReport[];
    },
  });

  const handleVote = useCallback(
    async (reportId: string, type: "up" | "down") => {
      const report = reports.find((r) => r.id === reportId);
      if (!report) return;

      const field = type === "up" ? "upvotes" : "downvotes";
      const { error } = await supabase
        .from("pharmacy_reports")
        .update({ [field]: (report[field] ?? 0) + 1 })
        .eq("id", reportId);

      if (!error) {
        refetch();
      }
    },
    [reports, refetch],
  );

  const normalizedQuery = searchQuery.trim().toLowerCase();

  const localReports = useMemo(
    () =>
      reports
        .filter((r) => r.type === "local")
        .filter(
          (r) =>
            !normalizedQuery ||
            r.pharmacy_name?.toLowerCase().includes(normalizedQuery) ||
            r.address?.toLowerCase().includes(normalizedQuery) ||
            r.medication?.toLowerCase().includes(normalizedQuery) ||
            r.dose?.toLowerCase().includes(normalizedQuery),
        ),
    [reports, normalizedQuery],
  );

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
        ),
    [reports, normalizedQuery],
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
      <Header
        onOpenReport={() => setReportOpen(true)}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
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
                        <OnlineReportCard key={report.id} report={report} />
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
              />
            </div>
          </div>
        </div>
      </main>

      <footer className="border-t bg-card py-4 text-center text-sm text-muted-foreground">
        <p>
          EstraMap is a community-powered tool. Always verify stock with your
          pharmacy before visiting.
        </p>
      </footer>

      <ReportModal open={reportOpen} onOpenChange={setReportOpen} onReportSubmitted={refetch} />
    </div>
  );
};

export default Index;
