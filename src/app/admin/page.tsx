"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Pencil, Trash2, X, Check, ArrowLeft, ChevronDown, ChevronRight } from "lucide-react";
import { formatTime } from "@/lib/format";
import { useLeaderboard, refreshLeaderboard } from "@/lib/use-leaderboard";
import type { LapEntry } from "@/lib/use-leaderboard";
import { toast } from "sonner";
import Link from "next/link";

export default function AdminPage() {
  const entries = useLeaderboard();
  const [expandedPlayer, setExpandedPlayer] = useState<string | null>(null);
  const [editingLapId, setEditingLapId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");

  function startEdit(lap: LapEntry) {
    setEditingLapId(lap.id);
    setEditValue((lap.timeMs / 1000).toFixed(3));
  }

  function cancelEdit() {
    setEditingLapId(null);
    setEditValue("");
  }

  async function saveEdit(lapId: string) {
    const timeSecs = parseFloat(editValue);
    if (isNaN(timeSecs) || timeSecs <= 0) {
      toast.error("Enter a valid time in seconds");
      return;
    }
    try {
      const res = await fetch(`/api/laps/${lapId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ timeSecs }),
      });
      if (!res.ok) {
        toast.error("Failed to update lap");
        return;
      }
      toast.success("Lap time updated");
      cancelEdit();
      await refreshLeaderboard();
    } catch {
      toast.error("Failed to update lap");
    }
  }

  async function deleteLap(lapId: string) {
    try {
      const res = await fetch(`/api/laps/${lapId}`, { method: "DELETE" });
      if (!res.ok) {
        toast.error("Failed to delete lap");
        return;
      }
      toast.success("Lap deleted");
      await refreshLeaderboard();
    } catch {
      toast.error("Failed to delete lap");
    }
  }

  async function deleteSession(sessionId: string) {
    try {
      const res = await fetch(`/api/sessions/${sessionId}`, { method: "DELETE" });
      if (!res.ok) {
        toast.error("Failed to delete session");
        return;
      }
      toast.success("Race deleted");
      await refreshLeaderboard();
    } catch {
      toast.error("Failed to delete race");
    }
  }

  async function cleanupOrphans() {
    try {
      const res = await fetch("/api/sessions/cleanup", { method: "DELETE" });
      if (res.ok) {
        const data = await res.json();
        toast.success(`Cleaned up ${data.deleted} empty session(s)`);
        await refreshLeaderboard();
      }
    } catch {
      toast.error("Failed to cleanup");
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b bg-card px-6 py-4">
        <div className="flex items-center gap-4 max-w-7xl mx-auto">
          <Link
            href="/"
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Dashboard
          </Link>
          <h1 className="text-2xl font-bold">Race Admin</h1>
        </div>
      </header>
      <main className="flex-1 p-6 max-w-5xl mx-auto w-full space-y-6">
        <div className="flex justify-end">
          <Button variant="outline" onClick={cleanupOrphans}>
            Cleanup Empty Sessions
          </Button>
        </div>

        {entries.length === 0 ? (
          <p className="text-muted-foreground">No race data yet.</p>
        ) : (
          entries.map((player) => {
            const isExpanded = expandedPlayer === player.playerId;
            const sessions = player.sessions.filter((s) => s.laps.length > 0);

            return (
              <Card key={player.playerId}>
                <CardHeader
                  className="cursor-pointer"
                  onClick={() => setExpandedPlayer(isExpanded ? null : player.playerId)}
                >
                  <CardTitle className="flex items-center justify-between text-lg">
                    <span className="flex items-center gap-3">
                      {isExpanded ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
                      {player.playerName}
                      <Badge variant="secondary" className="text-xs font-normal">
                        {sessions.length} race{sessions.length !== 1 ? "s" : ""}
                      </Badge>
                    </span>
                    <span className="text-sm font-mono font-normal text-muted-foreground">
                      Best: {formatTime(player.bestLapMs)}
                    </span>
                  </CardTitle>
                </CardHeader>
                {isExpanded && (
                  <CardContent className="space-y-4">
                    {sessions.map((session, idx) => (
                      <div key={session.id} className="rounded-lg border p-3 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">
                            Race {sessions.length - idx}
                          </span>
                          <div className="flex items-center gap-2">
                            {session.completed ? (
                              <Badge variant="default" className="text-xs">Complete</Badge>
                            ) : (
                              <Badge variant="outline" className="text-xs">In Progress</Badge>
                            )}
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-destructive hover:text-destructive"
                              onClick={() => deleteSession(session.id)}
                              title="Delete entire race"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="w-20">Lap</TableHead>
                              <TableHead>Time</TableHead>
                              <TableHead className="w-24 text-right">Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {session.laps.map((lap) => (
                              <TableRow key={lap.id}>
                                <TableCell>Lap {lap.lapNumber}</TableCell>
                                <TableCell>
                                  {editingLapId === lap.id ? (
                                    <div className="flex items-center gap-2">
                                      <Input
                                        type="number"
                                        step="0.001"
                                        value={editValue}
                                        onChange={(e) => setEditValue(e.target.value)}
                                        onKeyDown={(e) => {
                                          if (e.key === "Enter") saveEdit(lap.id);
                                          if (e.key === "Escape") cancelEdit();
                                        }}
                                        className="h-8 w-28 text-sm font-mono"
                                        autoFocus
                                      />
                                      <span className="text-xs text-muted-foreground">sec</span>
                                    </div>
                                  ) : (
                                    <span className="font-mono">{formatTime(lap.timeMs)}</span>
                                  )}
                                </TableCell>
                                <TableCell className="text-right">
                                  {editingLapId === lap.id ? (
                                    <div className="flex justify-end gap-1">
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-7 w-7 text-green-600"
                                        onClick={() => saveEdit(lap.id)}
                                      >
                                        <Check className="h-4 w-4" />
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-7 w-7"
                                        onClick={cancelEdit}
                                      >
                                        <X className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  ) : (
                                    <div className="flex justify-end gap-1">
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-7 w-7"
                                        onClick={() => startEdit(lap)}
                                        title="Edit time"
                                      >
                                        <Pencil className="h-4 w-4" />
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-7 w-7 text-destructive hover:text-destructive"
                                        onClick={() => deleteLap(lap.id)}
                                        title="Delete lap"
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  )}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    ))}
                  </CardContent>
                )}
              </Card>
            );
          })
        )}
      </main>
    </div>
  );
}
