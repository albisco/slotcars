"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Flag, Play } from "lucide-react";
import { toast } from "sonner";
import { formatTime } from "@/lib/format";
import { SessionSummary } from "@/components/session-summary";

interface ActiveSession {
  id: string;
  playerName: string;
  lapsAllowed: number;
  laps: { lapNumber: number; timeMs: number }[];
}

export function RaceControl() {
  const [playerName, setPlayerName] = useState("");
  const [lapsAllowed, setLapsAllowed] = useState(3);
  const [defaultLaps, setDefaultLaps] = useState(3);
  const [activeSession, setActiveSession] = useState<ActiveSession | null>(null);
  const [currentTimeSecs, setCurrentTimeSecs] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [completedSession, setCompletedSession] = useState<ActiveSession | null>(null);

  useEffect(() => {
    fetch("/api/settings")
      .then((res) => res.json())
      .then((data) => {
        setDefaultLaps(data.defaultLaps);
        setLapsAllowed(data.defaultLaps);
      })
      .catch(() => {});
  }, []);

  async function startRace() {
    if (!playerName.trim()) {
      toast.error("Enter a player name");
      return;
    }

    try {
      // Create or find player
      const playerRes = await fetch("/api/players", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: playerName.trim() }),
      });
      const player = await playerRes.json();

      // Create session
      const sessionRes = await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerId: player.id, lapsAllowed }),
      });
      const session = await sessionRes.json();

      setActiveSession({
        id: session.id,
        playerName: playerName.trim(),
        lapsAllowed,
        laps: [],
      });
      setCompletedSession(null);
      toast.success(`Race started for ${playerName.trim()}`);
    } catch {
      toast.error("Failed to start race");
    }
  }

  async function recordLap() {
    if (!activeSession) return;
    const timeSecs = parseFloat(currentTimeSecs);
    if (isNaN(timeSecs) || timeSecs <= 0) {
      toast.error("Enter a valid time in seconds (e.g. 5.423)");
      return;
    }
    const timeMs = Math.round(timeSecs * 1000);

    setSubmitting(true);
    try {
      const lapNumber = activeSession.laps.length + 1;
      const res = await fetch(`/api/sessions/${activeSession.id}/laps`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lapNumber, timeMs }),
      });

      if (!res.ok) {
        const err = await res.json();
        toast.error(err.error || "Failed to record lap");
        return;
      }

      const updatedLaps = [...activeSession.laps, { lapNumber, timeMs }];
      const updated = { ...activeSession, laps: updatedLaps };

      if (updatedLaps.length >= activeSession.lapsAllowed) {
        // Mark session completed
        await fetch(`/api/sessions/${activeSession.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ completed: true }),
        });
        setCompletedSession(updated);
        setActiveSession(null);
        toast.success("Race complete!");
      } else {
        setActiveSession(updated);
        toast.success(`Lap ${lapNumber}: ${formatTime(timeMs)}`);
      }
      setCurrentTimeSecs("");
    } catch {
      toast.error("Failed to record lap");
    } finally {
      setSubmitting(false);
    }
  }

  async function cancelRace() {
    if (activeSession) {
      try {
        await fetch(`/api/sessions/${activeSession.id}`, { method: "DELETE" });
      } catch {
        // best-effort cleanup
      }
    }
    setActiveSession(null);
    setCompletedSession(null);
    setPlayerName("");
    setCurrentTimeSecs("");
    setLapsAllowed(defaultLaps);
  }

  function newRace() {
    setActiveSession(null);
    setCompletedSession(null);
    setPlayerName("");
    setCurrentTimeSecs("");
    setLapsAllowed(defaultLaps);
  }

  // Show completed summary
  if (completedSession) {
    return <SessionSummary session={completedSession} onNewRace={newRace} />;
  }

  // Show active session (lap entry)
  if (activeSession) {
    const nextLap = activeSession.laps.length + 1;
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Flag className="h-6 w-6" />
            Racing: {activeSession.playerName}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-sm text-muted-foreground">
            Lap {nextLap} of {activeSession.lapsAllowed}
          </div>

          {activeSession.laps.length > 0 && (
            <div className="space-y-1">
              {activeSession.laps.map((lap) => (
                <div key={lap.lapNumber} className="flex justify-between text-sm">
                  <span>Lap {lap.lapNumber}</span>
                  <span className="font-mono">{formatTime(lap.timeMs)}</span>
                </div>
              ))}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="lapTime">Lap {nextLap} Time (seconds)</Label>
            <div className="flex gap-2">
              <Input
                id="lapTime"
                type="number"
                step="0.001"
                placeholder="e.g. 5.423"
                value={currentTimeSecs}
                onChange={(e) => setCurrentTimeSecs(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && recordLap()}
              />
              <Button onClick={recordLap} disabled={submitting}>
                Record
              </Button>
            </div>
          </div>

          <Button variant="destructive" onClick={cancelRace} className="w-full">
            Cancel Race
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Show new race form
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Play className="h-6 w-6" />
          New Race
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="playerName">Player Name</Label>
          <Input
            id="playerName"
            placeholder="Enter player name"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && startRace()}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="laps">Number of Laps</Label>
          <div className="flex gap-2">
            <Button
              variant={lapsAllowed === 3 ? "default" : "outline"}
              onClick={() => setLapsAllowed(3)}
              className="flex-1"
            >
              3 Laps
            </Button>
            <Button
              variant={lapsAllowed === 5 ? "default" : "outline"}
              onClick={() => setLapsAllowed(5)}
              className="flex-1"
            >
              5 Laps
            </Button>
          </div>
        </div>

        <Button onClick={startRace} className="w-full" size="lg">
          Start Race
        </Button>
      </CardContent>
    </Card>
  );
}
