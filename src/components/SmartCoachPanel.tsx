import { useGame } from "@/context/GameContext";
import { useMemo, useState, useEffect } from "react";
import { buildCoachInsights, type CoachInsight } from "@/lib/smartCoach";
import { Brain, ChevronDown, ChevronUp, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";

const severityClass: Record<CoachInsight["severity"], string> = {
  hot: "border-l-orange-500 bg-orange-500/10 text-orange-100",
  cold: "border-l-blue-500 bg-blue-500/10 text-blue-100",
  trend: "border-l-purple-500 bg-purple-500/10 text-purple-100",
  info: "border-l-primary bg-primary/10 text-primary-foreground",
};

const SmartCoachPanel = () => {
  const { shots, players, teams, gameMode } = useGame();
  const [expanded, setExpanded] = useState(true);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  const insights = useMemo(
    () => buildCoachInsights({ shots, players, teams, gameMode }),
    [shots, players, teams, gameMode],
  );

  const visible = insights.filter((i) => !dismissed.has(i.id));

  // Reset dismissed list if all insights change (new game etc.)
  useEffect(() => {
    if (shots.length === 0) setDismissed(new Set());
  }, [shots.length]);

  if (shots.length < 3) {
    return (
      <div className="glass-card rounded-lg p-3 border-l-4 border-l-primary/40">
        <div className="flex items-center gap-2 text-sm font-display font-bold text-foreground">
          <Brain className="w-4 h-4 text-primary" />
          Smart Coach
          <span className="text-xs font-normal text-muted-foreground ml-auto">
            warming up… ({shots.length}/3 shots)
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card rounded-lg p-3 space-y-2 border-l-4 border-l-primary">
      <button
        onClick={() => setExpanded((v) => !v)}
        className="flex items-center justify-between w-full text-left"
      >
        <div className="flex items-center gap-2 text-sm font-display font-bold text-foreground">
          <Brain className="w-4 h-4 text-primary animate-pulse" />
          Smart Coach
          <span className="text-xs font-normal bg-primary/20 text-primary rounded-full px-2 py-0.5">
            {visible.length} {visible.length === 1 ? "tip" : "tips"}
          </span>
        </div>
        {expanded ? (
          <ChevronUp className="w-4 h-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="w-4 h-4 text-muted-foreground" />
        )}
      </button>

      {expanded && (
        <div className="space-y-1.5">
          {visible.length === 0 ? (
            <p className="text-xs text-muted-foreground italic px-1">
              No tactical alerts right now. Keep shooting!
            </p>
          ) : (
            visible.map((insight) => (
              <div
                key={insight.id}
                className={`flex items-start gap-2 text-xs rounded-md border-l-2 px-2 py-1.5 ${severityClass[insight.severity]}`}
              >
                <span className="text-base leading-none mt-0.5" aria-hidden="true">
                  {insight.icon}
                </span>
                <span className="flex-1 text-foreground/90">{insight.message}</span>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-5 w-5 p-0 shrink-0 opacity-50 hover:opacity-100"
                  onClick={() => setDismissed((s) => new Set(s).add(insight.id))}
                  aria-label="Dismiss"
                >
                  <X className="w-3 h-3" />
                </Button>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default SmartCoachPanel;
