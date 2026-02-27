import { useState } from "react";
import { Map } from "lucide-react";
import Header from "@/components/Header";
import LocalReportCard from "@/components/LocalReportCard";
import OnlineReportCard from "@/components/OnlineReportCard";
import PharmacyMap from "@/components/PharmacyMap";
import ReportModal from "@/components/ReportModal";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { localReports, onlineReports } from "@/data/mockData";

const Index = () => {
  const [reportOpen, setReportOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [highlightedId, setHighlightedId] = useState<string | null>(null);
  const [showMobileMap, setShowMobileMap] = useState(false);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header
        onOpenReport={() => setReportOpen(true)}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />

      <main className="container mx-auto flex-1 px-4 py-6">
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
                  <div className="space-y-3">
                    {localReports.map((report) => (
                      <LocalReportCard
                        key={report.id}
                        report={report}
                        isHighlighted={highlightedId === report.id}
                        onHover={setHighlightedId}
                      />
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="online">
                  <div className="space-y-3">
                    {onlineReports.map((report) => (
                      <OnlineReportCard key={report.id} report={report} />
                    ))}
                  </div>
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

      <ReportModal open={reportOpen} onOpenChange={setReportOpen} />
    </div>
  );
};

export default Index;
