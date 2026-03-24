import { Leaderboard } from "@/components/leaderboard";
import { RaceControl } from "@/components/race-control";
import { StatsBar } from "@/components/stats-bar";
import { Settings } from "lucide-react";
import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b bg-card px-6 py-4">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <h1 className="text-2xl font-bold">St Patricks Slot Cars</h1>
          <Link
            href="/settings"
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            <Settings className="h-4 w-4" />
            Settings
          </Link>
        </div>
      </header>
      <main className="flex-1 p-6 max-w-7xl mx-auto w-full">
        <StatsBar />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full">
          <Leaderboard />
          <RaceControl />
        </div>
      </main>
    </div>
  );
}
