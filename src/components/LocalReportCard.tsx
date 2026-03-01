import { ThumbsUp, ThumbsDown, MapPin, Clock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Tables } from "@/integrations/supabase/types";
import { formatDistanceToNow } from "date-fns";

type PharmacyReport = Tables<"pharmacy_reports">;

interface LocalReportCardProps {
  report: PharmacyReport;
  isHighlighted: boolean;
  onHover: (id: string | null) => void;
  onVote: (reportId: string, type: "up" | "down") => void;
}

const LocalReportCard = ({ report, isHighlighted, onHover, onVote }: LocalReportCardProps) => {
  const timeAgo = formatDistanceToNow(new Date(report.created_at), { addSuffix: true });

  return (
    <Card
      className={`transition-all duration-200 cursor-pointer ${
        isHighlighted
          ? "ring-2 ring-primary shadow-md scale-[1.01]"
          : "hover:shadow-md"
      }`}
      onMouseEnter={() => onHover(report.id)}
      onMouseLeave={() => onHover(null)}
      role="article"
      aria-label={`${report.pharmacy_name} - ${report.medication} ${report.dose} - ${report.status === "in-stock" ? "In Stock" : "Low Stock"}`}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-card-foreground truncate">
                {report.pharmacy_name}
              </h3>
              <Badge
                className={
                  report.status === "in-stock"
                    ? "bg-in-stock text-white border-transparent"
                    : "bg-low-stock text-white border-transparent"
                }
              >
                {report.status === "in-stock" ? "In Stock" : "Low Stock"}
              </Badge>
            </div>

            {report.address && (
              <div className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
                <MapPin className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">{report.address}</span>
              </div>
            )}

            <p className="mt-2 text-sm font-medium text-accent-foreground">
              {report.medication} {report.dose}
            </p>

            {report.notes && (
              <p className="mt-2 text-sm text-muted-foreground italic">
                &ldquo;{report.notes}&rdquo;
              </p>
            )}

            <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              <span>Reported {timeAgo} by a community member</span>
            </div>
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between border-t pt-3">
          <span className="text-xs text-muted-foreground">Still accurate?</span>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 gap-1 text-xs text-in-stock hover:text-in-stock"
              onClick={(e) => {
                e.stopPropagation();
                onVote(report.id, "up");
              }}
            >
              <ThumbsUp className="h-3.5 w-3.5" />
              Yes ({report.upvotes})
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 gap-1 text-xs text-destructive hover:text-destructive"
              onClick={(e) => {
                e.stopPropagation();
                onVote(report.id, "down");
              }}
            >
              <ThumbsDown className="h-3.5 w-3.5" />
              No ({report.downvotes})
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default LocalReportCard;
