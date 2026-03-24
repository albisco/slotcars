"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle } from "lucide-react";
import { formatTime } from "@/lib/format";

interface SessionSummaryProps {
  session: {
    playerName: string;
    lapsAllowed: number;
    laps: { lapNumber: number; timeMs: number }[];
  };
  onNewRace: () => void;
}

export function SessionSummary({ session, onNewRace }: SessionSummaryProps) {
  const bestLap = session.laps.reduce(
    (best, lap) => (lap.timeMs < best.timeMs ? lap : best),
    session.laps[0]
  );

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CheckCircle className="h-6 w-6 text-green-500" />
          Race Complete: {session.playerName}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-1">
          {session.laps.map((lap) => (
            <div key={lap.lapNumber} className="flex justify-between text-sm">
              <span className="flex items-center gap-2">
                Lap {lap.lapNumber}
                {lap.lapNumber === bestLap.lapNumber && (
                  <Badge variant="default" className="text-xs">Best</Badge>
                )}
              </span>
              <span className="font-mono">{formatTime(lap.timeMs)}</span>
            </div>
          ))}
        </div>

        <div className="rounded-lg bg-muted p-4 text-center">
          <div className="text-sm text-muted-foreground">Best Lap</div>
          <div className="text-3xl font-mono font-bold">{formatTime(bestLap.timeMs)}</div>
        </div>

        <Button onClick={onNewRace} className="w-full" size="lg">
          Next Player
        </Button>
      </CardContent>
    </Card>
  );
}
