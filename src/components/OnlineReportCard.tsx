import { ExternalLink, Calendar, Pill } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { OnlineReport } from "@/data/mockData";

interface OnlineReportCardProps {
  report: OnlineReport;
}

const OnlineReportCard = ({ report }: OnlineReportCardProps) => {
  return (
    <Card className="transition-shadow hover:shadow-md" role="article" aria-label={`${report.pharmacyName} - ${report.medication} ${report.dose}`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h3 className="font-semibold text-card-foreground">{report.pharmacyName}</h3>

            <div className="mt-1.5 flex items-center gap-1.5 text-sm text-accent-foreground">
              <Pill className="h-3.5 w-3.5 shrink-0" />
              <span>{report.medication} — {report.dose}</span>
            </div>

            <div className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
              <Calendar className="h-3 w-3 shrink-0" />
              <span>Found on {report.dateReported}</span>
            </div>
          </div>

          <Button asChild variant="outline" size="sm" className="shrink-0 gap-1.5">
            <a href={report.url} target="_blank" rel="noopener noreferrer">
              Visit
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default OnlineReportCard;
