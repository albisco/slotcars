"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Trophy } from "lucide-react";
import { formatTime } from "@/lib/format";
import { useLeaderboard } from "@/lib/use-leaderboard";
import { PlayerDetail } from "@/components/player-detail";

export function Leaderboard() {
  const entries = useLeaderboard();
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);

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
          {entries.length === 0 ? (
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
                  <TableRow key={entry.playerId}>
                    <TableCell>
                      {entry.rank <= 3 ? (
                        <Badge variant={entry.rank === 1 ? "default" : "secondary"}>
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
