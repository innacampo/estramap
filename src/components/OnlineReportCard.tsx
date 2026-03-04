import { useState } from "react";
import { ExternalLink, Clock, Pill, AlertTriangle, ThumbsUp, ThumbsDown } from "lucide-react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Tables } from "@/integrations/supabase/types";
import { getFreshness, getTimeLabel } from "@/lib/freshness";

type PharmacyReport = Tables<"pharmacy_reports">;

interface OnlineReportCardProps {
  report: PharmacyReport;
  onVote: (reportId: string, type: "up" | "down") => void;
  index?: number;
}

const statusConfig = {
  "in-stock": { label: "In Stock", badgeClass: "bg-in-stock text-primary-foreground border-transparent status-glow-green" },
  "out-of-stock": { label: "Out of Stock", badgeClass: "bg-out-of-stock text-primary-foreground border-transparent status-glow-red" },
  "low-stock": { label: "Low Stock", badgeClass: "bg-low-stock text-primary-foreground border-transparent status-glow-amber" },
} as const;

const OnlineReportCard = ({ report, onVote, index = 0 }: OnlineReportCardProps) => {
  const [hasVoted, setHasVoted] = useState(false);
  const [optimisticUpvotes, setOptimisticUpvotes] = useState(report.upvotes);
  const [optimisticDownvotes, setOptimisticDownvotes] = useState(report.downvotes);
  const freshness = getFreshness(report.created_at);
  const timeLabel = getTimeLabel(report.created_at);
  const isStale = freshness === "stale";
  const config = statusConfig[report.status as keyof typeof statusConfig] ?? statusConfig["low-stock"];

  const handleVote = (type: "up" | "down") => {
    if (hasVoted) return;
    setHasVoted(true);
    if (type === "up") setOptimisticUpvotes((v) => v + 1);
    else setOptimisticDownvotes((v) => v + 1);
    onVote(report.id, type);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.05, ease: "easeOut" }}
    >
      <Card
        className={`group relative overflow-hidden card-hover rounded-2xl border-border/50 ${isStale ? "opacity-50" : ""} hover:border-primary/20`}
        role="article"
        aria-label={`${report.pharmacy_name} - ${report.medication} ${report.dose}`}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

        <CardContent className="relative p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2.5">
                <h3 className="font-semibold text-card-foreground text-base">{report.pharmacy_name}</h3>
                <Badge className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${config.badgeClass}`}>
                  {config.label}
                </Badge>
              </div>

              <div className="mt-2 flex items-center gap-1.5 text-sm text-accent-foreground/80">
                <Pill className="h-3.5 w-3.5 shrink-0 text-primary/60" />
                <span>{report.medication} — <span className="text-primary font-semibold">{report.dose}</span></span>
              </div>

              {report.website_url && (
                <div className="mt-2 flex items-center gap-1.5 text-sm">
                  <ExternalLink className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                  <a
                    href={report.website_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="truncate text-primary underline-offset-2 hover:underline transition-colors"
                  >
                    {report.website_url.replace(/^https?:\/\//, "").replace(/\/$/, "")}
                  </a>
                </div>
              )}

              {report.notes && (
                <p className="mt-2.5 text-sm text-muted-foreground italic leading-relaxed bg-muted/50 rounded-lg px-3 py-2">
                  &ldquo;{report.notes}&rdquo;
                </p>
              )}

              <div className={`mt-2.5 flex items-center gap-1.5 text-xs ${isStale ? "text-destructive" : "text-muted-foreground"}`}>
                {isStale ? <AlertTriangle className="h-3 w-3 shrink-0" /> : <Clock className="h-3 w-3 shrink-0" />}
                <span>Reported {timeLabel}</span>
              </div>
            </div>

            {report.website_url && (
              <Button
                asChild
                variant="outline"
                size="sm"
                className="shrink-0 gap-1.5 rounded-full border-primary/20 hover:bg-primary/10 hover:text-primary hover:border-primary/40 transition-all duration-200"
              >
                <a href={report.website_url} target="_blank" rel="noopener noreferrer">
                  Visit
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </Button>
            )}
          </div>

          <div className="mt-4 flex items-center justify-between border-t border-border/50 pt-3">
            <span className="text-xs text-muted-foreground font-medium">Still accurate?</span>
            <div className="flex items-center gap-1.5">
              <Button
                variant="ghost"
                size="sm"
                disabled={hasVoted}
                className="h-8 gap-1.5 text-xs rounded-full text-in-stock hover:text-in-stock hover:bg-in-stock/10 disabled:opacity-40 transition-all duration-200"
                onClick={() => handleVote("up")}
              >
                <ThumbsUp className="h-3.5 w-3.5" />
                Yes ({optimisticUpvotes})
              </Button>
              <Button
                variant="ghost"
                size="sm"
                disabled={hasVoted}
                className="h-8 gap-1.5 text-xs rounded-full text-destructive hover:text-destructive hover:bg-destructive/10 disabled:opacity-40 transition-all duration-200"
                onClick={() => handleVote("down")}
              >
                <ThumbsDown className="h-3.5 w-3.5" />
                No ({optimisticDownvotes})
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default OnlineReportCard;
