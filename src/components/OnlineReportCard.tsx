import { useState } from "react";
import { ExternalLink, Clock, Pill, AlertTriangle, ThumbsUp, ThumbsDown } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { Tables } from "@/integrations/supabase/types";
import { getFreshness, getTimeLabel } from "@/lib/freshness";

type PharmacyReport = Tables<"pharmacy_reports">;

interface OnlineReportCardProps {
  report: PharmacyReport;
  onVote: (reportId: string, type: "up" | "down") => void;
}

const OnlineReportCard = ({ report, onVote }: OnlineReportCardProps) => {
  const [hasVoted, setHasVoted] = useState(false);
  const [optimisticUpvotes, setOptimisticUpvotes] = useState(report.upvotes);
  const [optimisticDownvotes, setOptimisticDownvotes] = useState(report.downvotes);
  const freshness = getFreshness(report.created_at);
  const timeLabel = getTimeLabel(report.created_at);
  const isStale = freshness === "stale";

  const handleVote = (type: "up" | "down") => {
    if (hasVoted) return;
    setHasVoted(true);
    if (type === "up") setOptimisticUpvotes((v) => v + 1);
    else setOptimisticDownvotes((v) => v + 1);
    onVote(report.id, type);
  };

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

            {report.website_url && (
              <div className="mt-1.5 flex items-center gap-1.5 text-sm">
                <ExternalLink className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                <a
                  href={report.website_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="truncate text-primary underline-offset-2 hover:underline"
                >
                  {report.website_url.replace(/^https?:\/\//, "").replace(/\/$/, "")}
                </a>
              </div>
            )}

            {report.notes && (
              <p className="mt-2 text-sm text-muted-foreground italic">
                &ldquo;{report.notes}&rdquo;
              </p>
            )}

            <div className={`mt-2 flex items-center gap-1.5 text-xs ${isStale ? "text-destructive" : "text-muted-foreground"}`}>
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

        <div className="mt-3 flex items-center justify-between border-t pt-3">
          <span className="text-xs text-muted-foreground">Still accurate?</span>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              disabled={hasVoted}
              className="h-7 gap-1 text-xs text-in-stock hover:text-in-stock disabled:opacity-50"
              onClick={() => handleVote("up")}
            >
              <ThumbsUp className="h-3.5 w-3.5" />
              Yes ({optimisticUpvotes})
            </Button>
            <Button
              variant="ghost"
              size="sm"
              disabled={hasVoted}
              className="h-7 gap-1 text-xs text-destructive hover:text-destructive disabled:opacity-50"
              onClick={() => handleVote("down")}
            >
              <ThumbsDown className="h-3.5 w-3.5" />
              No ({optimisticDownvotes})
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default OnlineReportCard;
