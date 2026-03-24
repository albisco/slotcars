"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Trophy } from "lucide-react";
import { formatTime } from "@/lib/format";

interface LeaderboardEntry {
  rank: number;
  playerName: string;
  bestLapMs: number;
  sessionCount: number;
}

export function Leaderboard() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  async function fetchLeaderboard() {
    try {
      const res = await fetch("/api/leaderboard");
      if (res.ok) {
        const data = await res.json();
        setEntries(data);
      }
    } catch {
      // silently retry on next poll
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchLeaderboard();
    const interval = setInterval(fetchLeaderboard, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-6 w-6" />
          Leaderboard
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-muted-foreground text-sm">Loading...</p>
        ) : entries.length === 0 ? (
          <p className="text-muted-foreground text-sm">No races yet. Start a race to see the leaderboard!</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">#</TableHead>
                <TableHead>Player</TableHead>
                <TableHead className="text-right">Best Lap</TableHead>
                <TableHead className="text-right">Races</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {entries.map((entry) => (
                <TableRow key={entry.playerName}>
                  <TableCell>
                    {entry.rank <= 3 ? (
                      <Badge variant={entry.rank === 1 ? "default" : "secondary"}>
                        {entry.rank}
                      </Badge>
                    ) : (
                      entry.rank
                    )}
                  </TableCell>
                  <TableCell className="font-medium">{entry.playerName}</TableCell>
                  <TableCell className="text-right font-mono">{formatTime(entry.bestLapMs)}</TableCell>
                  <TableCell className="text-right">{entry.sessionCount}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
