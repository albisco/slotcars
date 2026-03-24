"use client";

import { useEffect, useState, useCallback } from "react";

export interface LapEntry {
  id: string;
  lapNumber: number;
  timeMs: number;
}

export interface SessionEntry {
  id: string;
  lapsAllowed: number;
  completed: boolean;
  createdAt: string;
  laps: LapEntry[];
}

export interface LeaderboardEntry {
  rank: number;
  playerId: string;
  playerName: string;
  bestLapMs: number;
  bestAvgMs: number;
  sessionCount: number;
  sessions: SessionEntry[];
}

// Shared cache so multiple components don't duplicate fetches
let cachedData: LeaderboardEntry[] = [];
let listeners: Set<() => void> = new Set();
let polling = false;

function notifyListeners() {
  listeners.forEach((fn) => fn());
}

async function fetchLeaderboard() {
  try {
    const res = await fetch("/api/leaderboard");
    if (res.ok) {
      cachedData = await res.json();
      notifyListeners();
    }
  } catch {
    // retry on next poll
  }
}

function startPolling() {
  if (polling) return;
  polling = true;
  fetchLeaderboard();
  const interval = setInterval(fetchLeaderboard, 10000);
  // Store cleanup in case we need it
  const originalSize = listeners.size;
  const checkStop = setInterval(() => {
    if (listeners.size === 0 && originalSize > 0) {
      clearInterval(interval);
      clearInterval(checkStop);
      polling = false;
    }
  }, 1000);
}

/** Force an immediate refresh of the leaderboard data */
export function refreshLeaderboard() {
  return fetchLeaderboard();
}

export function useLeaderboard() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>(cachedData);

  const sync = useCallback(() => {
    setEntries([...cachedData]);
  }, []);

  useEffect(() => {
    listeners.add(sync);
    startPolling();
    // Sync immediately in case cache already has data
    if (cachedData.length > 0) sync();

    return () => {
      listeners.delete(sync);
    };
  }, [sync]);

  return entries;
}
