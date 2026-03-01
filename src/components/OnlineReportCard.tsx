import { ExternalLink, Clock, Pill, AlertTriangle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { Tables } from "@/integrations/supabase/types";
import { getFreshness, getTimeLabel } from "@/lib/freshness";

type PharmacyReport = Tables<"pharmacy_reports">;

interface OnlineReportCardProps {
  report: PharmacyReport;
}

const OnlineReportCard = ({ report }: OnlineReportCardProps) => {
  const freshness = getFreshness(report.created_at);
  const timeLabel = getTimeLabel(report.created_at);
  const isStale = freshness === "stale";

  return (
    <Card className={`transition-shadow hover:shadow-md ${isStale ? "opacity-60" : ""}`} role="article" aria-label={`${report.pharmacy_name} - ${report.medication} ${report.dose}`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h3 className="font-semibold text-card-foreground">{report.pharmacy_name}</h3>

            <div className="mt-1.5 flex items-center gap-1.5 text-sm text-accent-foreground">
              <Pill className="h-3.5 w-3.5 shrink-0" />
              <span>{report.medication} — {report.dose}</span>
            </div>

            <div className={`mt-1 flex items-center gap-1.5 text-xs ${isStale ? "text-destructive" : "text-muted-foreground"}`}>
              {isStale ? <AlertTriangle className="h-3 w-3 shrink-0" /> : <Clock className="h-3 w-3 shrink-0" />}
              <span>Reported {timeLabel}</span>
            </div>
          </div>

          {report.website_url && (
            <Button asChild variant="outline" size="sm" className="shrink-0 gap-1.5">
              <a href={report.website_url} target="_blank" rel="noopener noreferrer">
                Visit
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default OnlineReportCard;
