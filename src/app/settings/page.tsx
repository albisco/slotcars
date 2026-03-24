"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Settings as SettingsIcon, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

export default function SettingsPage() {
  const [defaultLaps, setDefaultLaps] = useState(3);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/settings")
      .then((res) => res.json())
      .then((data) => setDefaultLaps(data.defaultLaps))
      .catch(() => {});
  }, []);

  async function save() {
    setSaving(true);
    try {
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ defaultLaps }),
      });
      if (res.ok) {
        toast.success("Settings saved");
      } else {
        toast.error("Failed to save settings");
      }
    } catch {
      toast.error("Failed to save settings");
    } finally {
      setSaving(false);
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
            Back
          </Link>
          <h1 className="text-2xl font-bold">Settings</h1>
        </div>
      </header>
      <main className="flex-1 p-6 max-w-xl mx-auto w-full">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <SettingsIcon className="h-6 w-6" />
              Race Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Default Laps Per Race</Label>
              <div className="flex gap-2">
                <Button
                  variant={defaultLaps === 3 ? "default" : "outline"}
                  onClick={() => setDefaultLaps(3)}
                  className="flex-1"
                >
                  3 Laps
                </Button>
                <Button
                  variant={defaultLaps === 5 ? "default" : "outline"}
                  onClick={() => setDefaultLaps(5)}
                  className="flex-1"
                >
                  5 Laps
                </Button>
              </div>
            </div>
            <Button onClick={save} disabled={saving} className="w-full">
              {saving ? "Saving..." : "Save Settings"}
            </Button>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
