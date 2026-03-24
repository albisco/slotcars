"use client";

import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { formatTime } from "@/lib/format";

interface Lap {
  lapNumber: number;
  timeMs: number;
}

interface Session {
  id: string;
  lapsAllowed: number;
  completed: boolean;
  createdAt: string;
  laps: Lap[];
}

interface PlayerData {
  id: string;
  name: string;
  sessions: Session[];
}

interface PlayerDetailProps {
  playerId: string | null;
  onClose: () => void;
}

export function PlayerDetail({ playerId, onClose }: PlayerDetailProps) {
  const [player, setPlayer] = useState<PlayerData | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!playerId) {
      setPlayer(null);
      return;
    }
    setLoading(true);
    fetch(`/api/players/${playerId}`)
      .then((res) => res.json())
      .then((data) => setPlayer(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [playerId]);

  function getBestLap(laps: Lap[]): Lap | null {
    if (laps.length === 0) return null;
    return laps.reduce((best, lap) => (lap.timeMs < best.timeMs ? lap : best));
  }

  function getAvgTime(laps: Lap[]): number {
    if (laps.length === 0) return 0;
    return Math.round(laps.reduce((sum, l) => sum + l.timeMs, 0) / laps.length);
  }

  return (
    <Dialog open={!!playerId} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{player?.name ?? "Player"} — Race History</DialogTitle>
        </DialogHeader>
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading...</p>
        ) : player && player.sessions.length === 0 ? (
          <p className="text-sm text-muted-foreground">No races yet.</p>
        ) : (
          <div className="space-y-4 max-h-[60vh] overflow-y-auto">
            {player?.sessions.map((session, idx) => {
              const bestLap = getBestLap(session.laps);
              const avgTime = getAvgTime(session.laps);
              return (
                <div key={session.id} className="rounded-lg border p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">
                      Race {player.sessions.length - idx}
                    </span>
                    <div className="flex items-center gap-2">
                      {session.completed ? (
                        <Badge variant="default" className="text-xs">Complete</Badge>
                      ) : (
                        <Badge variant="outline" className="text-xs">In Progress</Badge>
                      )}
                    </div>
                  </div>
                  <div className="space-y-1">
                    {session.laps.map((lap) => (
                      <div key={lap.lapNumber} className="flex justify-between text-sm">
                        <span className="flex items-center gap-2">
                          Lap {lap.lapNumber}
                          {bestLap && lap.lapNumber === bestLap.lapNumber && (
                            <Badge variant="default" className="text-xs py-0">Best</Badge>
                          )}
                        </span>
                        <span className="font-mono">{formatTime(lap.timeMs)}</span>
                      </div>
                    ))}
                  </div>
                  {session.laps.length > 1 && (
                    <div className="flex justify-between text-xs text-muted-foreground border-t pt-1">
                      <span>Avg</span>
                      <span className="font-mono">{formatTime(avgTime)}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
