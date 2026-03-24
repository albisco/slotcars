"use client";

import { useState, useEffect, useRef } from "react";
import { useLeaderboard } from "@/lib/use-leaderboard";
import { formatTime } from "@/lib/format";
import { Trophy, Zap } from "lucide-react";

/**
 * Race Screen — designed for a big screen / projector.
 * Shows a throttle gauge (mock data for now), live lap info,
 * and the current best lap. When hardware is connected,
 * the throttle gauge would receive real voltage readings.
 */

function ThrottleGauge({ value }: { value: number }) {
  // value: 0-100 representing throttle position
  // Arc goes from -135deg to +135deg (270 degree sweep)
  const angle = -135 + (value / 100) * 270;
  const radius = 120;
  const cx = 150;
  const cy = 150;

  // SVG arc for the background track
  function describeArc(startAngle: number, endAngle: number) {
    const start = polarToCartesian(cx, cy, radius, endAngle);
    const end = polarToCartesian(cx, cy, radius, startAngle);
    const largeArc = endAngle - startAngle > 180 ? 1 : 0;
    return `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArc} 0 ${end.x} ${end.y}`;
  }

  function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
    const rad = ((angleDeg - 90) * Math.PI) / 180;
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
  }

  // Needle endpoint
  const needleTip = polarToCartesian(cx, cy, radius - 15, angle);

  // Color based on throttle position
  const color =
    value < 30
      ? "hsl(142, 71%, 45%)"  // green
      : value < 70
        ? "hsl(45, 93%, 47%)"   // yellow/amber
        : "hsl(0, 84%, 60%)";   // red

  // Arc segments for colored track
  const filledAngle = -135 + (value / 100) * 270;

  return (
    <svg viewBox="0 0 300 230" className="w-full max-w-md mx-auto">
      {/* Background arc */}
      <path
        d={describeArc(-135, 135)}
        fill="none"
        stroke="hsl(215, 20%, 20%)"
        strokeWidth="20"
        strokeLinecap="round"
      />
      {/* Filled arc */}
      {value > 0 && (
        <path
          d={describeArc(-135, filledAngle)}
          fill="none"
          stroke={color}
          strokeWidth="20"
          strokeLinecap="round"
          className="transition-all duration-100"
          style={{ filter: `drop-shadow(0 0 8px ${color})` }}
        />
      )}
      {/* Tick marks */}
      {[0, 25, 50, 75, 100].map((tick) => {
        const tickAngle = -135 + (tick / 100) * 270;
        const outer = polarToCartesian(cx, cy, radius + 15, tickAngle);
        const inner = polarToCartesian(cx, cy, radius + 5, tickAngle);
        return (
          <g key={tick}>
            <line
              x1={inner.x} y1={inner.y}
              x2={outer.x} y2={outer.y}
              stroke="hsl(215, 20%, 40%)"
              strokeWidth="2"
            />
            <text
              x={polarToCartesian(cx, cy, radius + 28, tickAngle).x}
              y={polarToCartesian(cx, cy, radius + 28, tickAngle).y}
              textAnchor="middle"
              dominantBaseline="middle"
              fill="hsl(215, 20%, 50%)"
              fontSize="12"
              fontFamily="monospace"
            >
              {tick}
            </text>
          </g>
        );
      })}
      {/* Needle */}
      <line
        x1={cx} y1={cy}
        x2={needleTip.x} y2={needleTip.y}
        stroke={color}
        strokeWidth="3"
        strokeLinecap="round"
        className="transition-all duration-100"
      />
      {/* Center dot */}
      <circle cx={cx} cy={cy} r="8" fill={color} className="transition-all duration-100" />
      <circle cx={cx} cy={cy} r="4" fill="hsl(215, 20%, 10%)" />
      {/* Value text */}
      <text
        x={cx} y={cy + 45}
        textAnchor="middle"
        fill={color}
        fontSize="36"
        fontWeight="bold"
        fontFamily="monospace"
        className="transition-all duration-100"
      >
        {value}%
      </text>
      <text
        x={cx} y={cy + 65}
        textAnchor="middle"
        fill="hsl(215, 20%, 50%)"
        fontSize="12"
        fontFamily="monospace"
      >
        THROTTLE
      </text>
    </svg>
  );
}

function useMockThrottle() {
  const [value, setValue] = useState(0);
  const ref = useRef<number>(0);

  useEffect(() => {
    // Simulate throttle bursts: ramp up, hold, ease off
    let target = 0;
    let nextChangeAt = Date.now() + 1000;

    const interval = setInterval(() => {
      const now = Date.now();
      if (now > nextChangeAt) {
        // Pick new target
        target = Math.random() > 0.3
          ? Math.floor(40 + Math.random() * 60) // 40-100% throttle burst
          : Math.floor(Math.random() * 15);      // 0-15% coast/brake
        nextChangeAt = now + 800 + Math.random() * 2000;
      }

      // Ease toward target
      ref.current += (target - ref.current) * 0.15;
      setValue(Math.round(ref.current));
    }, 50);

    return () => clearInterval(interval);
  }, []);

  return value;
}

export default function RacePage() {
  const throttle = useMockThrottle();
  const entries = useLeaderboard();
  const [elapsed, setElapsed] = useState(0);

  const fastestLap = entries.length > 0 ? entries[0] : null;

  // Simulated elapsed timer
  useEffect(() => {
    const start = Date.now();
    const interval = setInterval(() => {
      setElapsed(Date.now() - start);
    }, 50);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-[hsl(222,84%,4.9%)] text-white flex flex-col">
      {/* Header */}
      <header className="border-b border-white/10 px-6 py-3 flex items-center justify-between">
        <h1 className="text-xl font-bold tracking-wide">
          ST PATS SLOT CARS
        </h1>
        <span className="text-xs text-white/40 font-mono">LIVE</span>
      </header>

      <main className="flex-1 flex flex-col lg:flex-row items-center justify-center gap-8 p-6">
        {/* Left: Throttle Gauge */}
        <div className="flex-1 flex flex-col items-center justify-center max-w-lg w-full">
          <ThrottleGauge value={throttle} />

          {/* Elapsed timer */}
          <div className="mt-4 text-center">
            <p className="text-xs text-white/40 uppercase tracking-wider">Elapsed</p>
            <p className="text-5xl font-bold font-mono tabular-nums" style={{
              color: throttle > 70 ? "hsl(0, 84%, 60%)" : "hsl(142, 71%, 45%)",
              transition: "color 0.3s",
            }}>
              {formatTime(elapsed)}
            </p>
          </div>
        </div>

        {/* Right: Stats */}
        <div className="flex-1 flex flex-col gap-6 max-w-sm w-full">
          {/* Best Lap */}
          <div className="rounded-xl border border-white/10 bg-white/5 p-6">
            <div className="flex items-center gap-3 mb-3">
              <Zap className="h-6 w-6 text-yellow-500" />
              <span className="text-sm text-white/50 uppercase tracking-wider">Track Record</span>
            </div>
            <p className="text-4xl font-bold font-mono">
              {fastestLap ? formatTime(fastestLap.bestLapMs) : "—"}
            </p>
            <p className="text-lg text-white/60 mt-1">
              {fastestLap?.playerName ?? "No races yet"}
            </p>
          </div>

          {/* Top 3 */}
          <div className="rounded-xl border border-white/10 bg-white/5 p-6">
            <div className="flex items-center gap-3 mb-4">
              <Trophy className="h-6 w-6 text-green-500" />
              <span className="text-sm text-white/50 uppercase tracking-wider">Top 3</span>
            </div>
            <div className="space-y-3">
              {entries.slice(0, 3).map((entry, i) => (
                <div key={entry.playerId} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className={`text-lg font-bold ${
                      i === 0 ? "text-yellow-400" : i === 1 ? "text-gray-300" : "text-amber-600"
                    }`}>
                      {i + 1}
                    </span>
                    <span className="text-white/90">{entry.playerName}</span>
                  </div>
                  <span className="font-mono text-white/70">{formatTime(entry.bestLapMs)}</span>
                </div>
              ))}
              {entries.length === 0 && (
                <p className="text-white/30 text-sm">Waiting for first race...</p>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
