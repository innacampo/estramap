import { useState } from "react";
import { ThumbsUp, ThumbsDown, MapPin, Clock, AlertTriangle } from "lucide-react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Tables } from "@/integrations/supabase/types";
import { getFreshness, getTimeLabel } from "@/lib/freshness";

type PharmacyReport = Tables<"pharmacy_reports">;

interface LocalReportCardProps {
  report: PharmacyReport;
  isHighlighted: boolean;
  onHover: (id: string | null) => void;
  onVote: (reportId: string, type: "up" | "down") => void;
  distance?: number;
  index?: number;
}

const statusConfig = {
  "in-stock": {
    label: "In Stock",
    emoji: "✅",
    badgeClass: "bg-in-stock text-primary-foreground border-transparent status-glow-green",
  },
  "out-of-stock": {
    label: "Out of Stock",
    emoji: "❌",
    badgeClass: "bg-out-of-stock text-primary-foreground border-transparent status-glow-red",
  },
  "low-stock": {
    label: "Low Stock",
    emoji: "⚠️",
    badgeClass: "bg-low-stock text-primary-foreground border-transparent status-glow-amber",
  },
} as const;

const LocalReportCard = ({ report, isHighlighted, onHover, onVote, distance, index = 0 }: LocalReportCardProps) => {
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
        className={`group relative overflow-hidden card-hover cursor-pointer rounded-2xl border-border/50 ${
          isStale ? "opacity-50" : ""
        } ${
          isHighlighted
            ? "ring-2 ring-primary/60 shadow-premium-lg scale-[1.01] border-primary/30"
            : "hover:border-primary/20"
        }`}
        onMouseEnter={() => onHover(report.id)}
        onMouseLeave={() => onHover(null)}
        role="article"
        aria-label={`${report.pharmacy_name} - ${report.medication} ${report.dose} - ${config.label}`}
      >
        {/* Subtle gradient overlay on hover */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

        <CardContent className="relative p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2.5">
                <h3 className="font-semibold text-card-foreground truncate text-base">
                  {report.pharmacy_name}
                </h3>
                <Badge className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${config.badgeClass}`}>
                  {config.label}
                </Badge>
              </div>

              {report.address && (
                <div className="mt-2 flex items-center gap-1.5 text-sm text-muted-foreground">
                  <MapPin className="h-3.5 w-3.5 shrink-0 text-primary/60" />
                  <span className="truncate">{report.address}</span>
                  {distance != null && distance !== Infinity && (
                    <span className="ml-1 shrink-0 font-semibold text-primary text-xs bg-primary/10 px-2 py-0.5 rounded-full">
                      {distance < 0.1 ? "< 0.1" : distance.toFixed(1)} mi
                    </span>
                  )}
                </div>
              )}

              <p className="mt-2.5 text-sm font-medium text-accent-foreground/80">
                {report.medication} <span className="text-primary font-semibold">{report.dose}</span>
              </p>

              {report.notes && (
                <p className="mt-2.5 text-sm text-muted-foreground italic leading-relaxed bg-muted/50 rounded-lg px-3 py-2">
                  &ldquo;{report.notes}&rdquo;
                </p>
              )}

              <div className={`mt-2.5 flex items-center gap-1.5 text-xs ${isStale ? "text-destructive" : "text-muted-foreground"}`}>
                {isStale ? <AlertTriangle className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
                <span>Reported {timeLabel}</span>
              </div>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between border-t border-border/50 pt-3">
            <span className="text-xs text-muted-foreground font-medium">Still accurate?</span>
            <div className="flex items-center gap-1.5">
              <Button
                variant="ghost"
                size="sm"
                disabled={hasVoted}
                className="h-8 gap-1.5 text-xs rounded-full text-in-stock hover:text-in-stock hover:bg-in-stock/10 disabled:opacity-40 transition-all duration-200"
                onClick={(e) => { e.stopPropagation(); handleVote("up"); }}
              >
                <ThumbsUp className="h-3.5 w-3.5" />
                Yes ({optimisticUpvotes})
              </Button>
              <Button
                variant="ghost"
                size="sm"
                disabled={hasVoted}
                className="h-8 gap-1.5 text-xs rounded-full text-destructive hover:text-destructive hover:bg-destructive/10 disabled:opacity-40 transition-all duration-200"
                onClick={(e) => { e.stopPropagation(); handleVote("down"); }}
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

export default LocalReportCard;
