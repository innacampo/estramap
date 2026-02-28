import { ExternalLink, Calendar, Pill } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { Tables } from "@/integrations/supabase/types";
import { format } from "date-fns";

type PharmacyReport = Tables<"pharmacy_reports">;

interface OnlineReportCardProps {
  report: PharmacyReport;
}

const OnlineReportCard = ({ report }: OnlineReportCardProps) => {
  const dateFormatted = format(new Date(report.created_at), "MMM d, yyyy");

  return (
    <Card className="transition-shadow hover:shadow-md" role="article" aria-label={`${report.pharmacy_name} - ${report.medication} ${report.dose}`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h3 className="font-semibold text-card-foreground">{report.pharmacy_name}</h3>

            <div className="mt-1.5 flex items-center gap-1.5 text-sm text-accent-foreground">
              <Pill className="h-3.5 w-3.5 shrink-0" />
              <span>{report.medication} — {report.dose}</span>
            </div>

            <div className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
              <Calendar className="h-3 w-3 shrink-0" />
              <span>Found on {dateFormatted}</span>
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
