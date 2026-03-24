"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Trophy, ArrowUpDown } from "lucide-react";
import { formatTime } from "@/lib/format";
import { useLeaderboard } from "@/lib/use-leaderboard";
import { PlayerDetail } from "@/components/player-detail";

type SortBy = "bestLap" | "bestAvg";

export function Leaderboard() {
  const entries = useLeaderboard();
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortBy>("bestLap");

  const sorted = useMemo(() => {
    const copy = [...entries];
    if (sortBy === "bestAvg") {
      copy.sort((a, b) => {
        // Players with no avg go to bottom
        if (a.bestAvgMs === 0 && b.bestAvgMs === 0) return a.bestLapMs - b.bestLapMs;
        if (a.bestAvgMs === 0) return 1;
        if (b.bestAvgMs === 0) return -1;
        return a.bestAvgMs - b.bestAvgMs;
      });
    } else {
      copy.sort((a, b) => a.bestLapMs - b.bestLapMs);
    }
    return copy.map((entry, i) => ({ ...entry, rank: i + 1 }));
  }, [entries, sortBy]);

  function toggleSort(col: SortBy) {
    setSortBy(col);
  }

  return (
    <>
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-6 w-6" />
            Leaderboard
          </CardTitle>
        </CardHeader>
        <CardContent>
          {sorted.length === 0 ? (
            <p className="text-muted-foreground text-sm">No races yet. Start a race to see the leaderboard!</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">#</TableHead>
                  <TableHead>Player</TableHead>
                  <TableHead className="text-right">
                    <button
                      className="inline-flex items-center gap-1 hover:text-foreground"
                      onClick={() => toggleSort("bestLap")}
                    >
                      Best Lap
                      {sortBy === "bestLap" && <ArrowUpDown className="h-3 w-3" />}
                    </button>
                  </TableHead>
                  <TableHead className="text-right">
                    <button
                      className="inline-flex items-center gap-1 hover:text-foreground"
                      onClick={() => toggleSort("bestAvg")}
                    >
                      Best Avg
                      {sortBy === "bestAvg" && <ArrowUpDown className="h-3 w-3" />}
                    </button>
                  </TableHead>
                  <TableHead className="text-right">Races</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sorted.map((entry) => (
                  <TableRow key={entry.playerId}>
                    <TableCell>
                      {entry.rank <= 3 ? (
                        <Badge
                          className={
                            entry.rank === 1
                              ? "bg-yellow-500 text-white border-yellow-500 hover:bg-yellow-600"
                              : entry.rank === 2
                              ? "bg-gray-400 text-white border-gray-400 hover:bg-gray-500"
                              : "bg-amber-700 text-white border-amber-700 hover:bg-amber-800"
                          }
                        >
                          {entry.rank}
                        </Badge>
                      ) : (
                        entry.rank
                      )}
                    </TableCell>
                    <TableCell>
                      <button
                        className="font-medium text-left hover:underline hover:text-primary"
                        onClick={() => setSelectedPlayerId(entry.playerId)}
                      >
                        {entry.playerName}
                      </button>
                    </TableCell>
                    <TableCell className="text-right font-mono">{formatTime(entry.bestLapMs)}</TableCell>
                    <TableCell className="text-right font-mono">
                      {entry.bestAvgMs > 0 ? formatTime(entry.bestAvgMs) : "—"}
                    </TableCell>
                    <TableCell className="text-right">{entry.sessionCount}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
      <PlayerDetail
        playerId={selectedPlayerId}
        onClose={() => setSelectedPlayerId(null)}
      />
    </>
  );
}
