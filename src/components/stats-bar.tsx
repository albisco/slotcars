"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Trophy, Timer, Zap } from "lucide-react";
import { formatTime } from "@/lib/format";
import type { LeaderboardEntry } from "@/components/leaderboard";

export function StatsBar() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);

  useEffect(() => {
    async function fetch_data() {
      try {
        const res = await fetch("/api/leaderboard");
        if (res.ok) setEntries(await res.json());
      } catch {}
    }
    fetch_data();
    const interval = setInterval(fetch_data, 5000);
    return () => clearInterval(interval);
  }, []);

  const fastestLap = entries.length > 0 ? entries[0] : null;

  // Best average: player with lowest bestAvgMs (excluding 0 = no completed sessions)
  const withAvg = entries.filter((e) => e.bestAvgMs > 0);
  const bestAvg = withAvg.length > 0
    ? withAvg.reduce((best, e) => (e.bestAvgMs < best.bestAvgMs ? e : best))
    : null;

  const totalRaces = entries.reduce((sum, e) => sum + e.sessionCount, 0);

  if (entries.length === 0) return null;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
      <Card>
        <CardContent className="flex items-center gap-3 p-4">
          <Zap className="h-8 w-8 text-yellow-500 shrink-0" />
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground">Fastest Lap</p>
            <p className="text-lg font-bold font-mono truncate">
              {fastestLap ? formatTime(fastestLap.bestLapMs) : "—"}
            </p>
            <p className="text-sm text-muted-foreground truncate">
              {fastestLap?.playerName ?? "—"}
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="flex items-center gap-3 p-4">
          <Timer className="h-8 w-8 text-blue-500 shrink-0" />
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground">Best Average</p>
            <p className="text-lg font-bold font-mono truncate">
              {bestAvg ? formatTime(bestAvg.bestAvgMs) : "—"}
            </p>
            <p className="text-sm text-muted-foreground truncate">
              {bestAvg?.playerName ?? "—"}
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="flex items-center gap-3 p-4">
          <Trophy className="h-8 w-8 text-green-500 shrink-0" />
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground">Total Races</p>
            <p className="text-lg font-bold">{totalRaces}</p>
            <p className="text-sm text-muted-foreground">
              {entries.length} player{entries.length !== 1 ? "s" : ""}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
