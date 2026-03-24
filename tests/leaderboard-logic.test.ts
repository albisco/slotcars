import { describe, it, expect } from "vitest";

// Extract and test the leaderboard assembly logic used in /api/leaderboard
// This mirrors the row-to-leaderboard transform from the route handler

interface RawRow {
  player_id: string;
  player_name: string;
  session_id: string;
  laps_allowed: number;
  completed: boolean;
  session_created: Date;
  lap_id: string;
  lap_number: number;
  time_ms: number;
}

function assembleLeaderboard(rows: RawRow[]) {
  const playersMap = new Map<string, {
    playerId: string;
    playerName: string;
    bestLapMs: number;
    sessions: Map<string, {
      id: string;
      lapsAllowed: number;
      completed: boolean;
      createdAt: string;
      laps: { id: string; lapNumber: number; timeMs: number }[];
    }>;
  }>();

  for (const row of rows) {
    if (!playersMap.has(row.player_id)) {
      playersMap.set(row.player_id, {
        playerId: row.player_id,
        playerName: row.player_name,
        bestLapMs: Infinity,
        sessions: new Map(),
      });
    }
    const player = playersMap.get(row.player_id)!;

    if (!player.sessions.has(row.session_id)) {
      player.sessions.set(row.session_id, {
        id: row.session_id,
        lapsAllowed: row.laps_allowed,
        completed: row.completed,
        createdAt: row.session_created.toISOString(),
        laps: [],
      });
    }

    player.sessions.get(row.session_id)!.laps.push({
      id: row.lap_id,
      lapNumber: row.lap_number,
      timeMs: row.time_ms,
    });

    if (row.time_ms < player.bestLapMs) {
      player.bestLapMs = row.time_ms;
    }
  }

  return Array.from(playersMap.values())
    .map((player) => {
      const sessions = Array.from(player.sessions.values());
      const completedSessions = sessions.filter((s) => s.completed && s.laps.length > 0);

      let bestAvgMs = 0;
      if (completedSessions.length > 0) {
        bestAvgMs = Math.round(
          Math.min(
            ...completedSessions.map(
              (s) => s.laps.reduce((sum, l) => sum + l.timeMs, 0) / s.laps.length
            )
          )
        );
      }

      return {
        playerId: player.playerId,
        playerName: player.playerName,
        bestLapMs: player.bestLapMs,
        bestAvgMs,
        sessionCount: sessions.length,
      };
    })
    .sort((a, b) => a.bestLapMs - b.bestLapMs)
    .map((entry, index) => ({ ...entry, rank: index + 1 }));
}

const now = new Date();

function row(overrides: Partial<RawRow>): RawRow {
  return {
    player_id: "p1",
    player_name: "Alice",
    session_id: "s1",
    laps_allowed: 3,
    completed: true,
    session_created: now,
    lap_id: "l1",
    lap_number: 1,
    time_ms: 5000,
    ...overrides,
  };
}

describe("leaderboard assembly", () => {
  it("returns empty array for no rows", () => {
    expect(assembleLeaderboard([])).toEqual([]);
  });

  it("ranks single player with one lap", () => {
    const result = assembleLeaderboard([row({})]);
    expect(result).toHaveLength(1);
    expect(result[0].rank).toBe(1);
    expect(result[0].playerName).toBe("Alice");
    expect(result[0].bestLapMs).toBe(5000);
  });

  it("picks fastest lap across sessions", () => {
    const rows = [
      row({ session_id: "s1", lap_id: "l1", lap_number: 1, time_ms: 5000 }),
      row({ session_id: "s1", lap_id: "l2", lap_number: 2, time_ms: 4500 }),
      row({ session_id: "s1", lap_id: "l3", lap_number: 3, time_ms: 5200 }),
      row({ session_id: "s2", lap_id: "l4", lap_number: 1, time_ms: 4200, session_created: new Date(now.getTime() + 1000) }),
    ];
    const result = assembleLeaderboard(rows);
    expect(result[0].bestLapMs).toBe(4200);
  });

  it("calculates best average from completed sessions only", () => {
    const rows = [
      // Completed session: laps 5000, 6000, 4000 → avg 5000
      row({ session_id: "s1", lap_id: "l1", lap_number: 1, time_ms: 5000 }),
      row({ session_id: "s1", lap_id: "l2", lap_number: 2, time_ms: 6000 }),
      row({ session_id: "s1", lap_id: "l3", lap_number: 3, time_ms: 4000 }),
      // Incomplete session: lap 3000 → should NOT count for avg
      row({ session_id: "s2", lap_id: "l4", lap_number: 1, time_ms: 3000, completed: false }),
    ];
    const result = assembleLeaderboard(rows);
    expect(result[0].bestAvgMs).toBe(5000);
  });

  it("ranks multiple players by best lap", () => {
    const rows = [
      row({ player_id: "p1", player_name: "Alice", lap_id: "l1", time_ms: 5000 }),
      row({ player_id: "p2", player_name: "Bob", session_id: "s2", lap_id: "l2", time_ms: 4000 }),
    ];
    const result = assembleLeaderboard(rows);
    expect(result[0].playerName).toBe("Bob");
    expect(result[0].rank).toBe(1);
    expect(result[1].playerName).toBe("Alice");
    expect(result[1].rank).toBe(2);
  });

  it("counts sessions correctly", () => {
    const rows = [
      row({ session_id: "s1", lap_id: "l1", time_ms: 5000 }),
      row({ session_id: "s2", lap_id: "l2", time_ms: 4500, session_created: new Date(now.getTime() + 1000) }),
    ];
    const result = assembleLeaderboard(rows);
    expect(result[0].sessionCount).toBe(2);
  });

  it("bestAvgMs is 0 when no completed sessions", () => {
    const rows = [
      row({ completed: false }),
    ];
    const result = assembleLeaderboard(rows);
    expect(result[0].bestAvgMs).toBe(0);
  });
});
