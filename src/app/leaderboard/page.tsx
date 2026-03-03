"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

interface LeaderboardEntry {
  team_member_id: string;
  name: string;
  store_name: string;
  count: number;
  streak: number;
}

type TimeFilter = "week" | "month" | "all";

export default function LeaderboardPage() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [timeFilter, setTimeFilter] = useState<TimeFilter>("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);

      // Get date range based on filter
      let dateFilter: string | null = null;
      const now = new Date();
      if (timeFilter === "week") {
        const weekAgo = new Date(now);
        weekAgo.setDate(weekAgo.getDate() - 7);
        dateFilter = weekAgo.toISOString();
      } else if (timeFilter === "month") {
        const monthAgo = new Date(now);
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        dateFilter = monthAgo.toISOString();
      }

      // Fetch all feedback with member info
      let query = supabase
        .from("feedback")
        .select("team_member_id, created_at, team_members(name, stores(name))");

      if (dateFilter) {
        query = query.gte("created_at", dateFilter);
      }

      const { data } = await query;

      if (!data) {
        setLoading(false);
        return;
      }

      // Aggregate by member
      const memberMap = new Map<
        string,
        { name: string; store_name: string; dates: Set<string>; count: number }
      >();

      for (const row of data) {
        const id = row.team_member_id;
        const member = row.team_members as unknown as {
          name: string;
          stores: { name: string } | null;
        };
        if (!memberMap.has(id)) {
          memberMap.set(id, {
            name: member?.name || "Unknown",
            store_name: member?.stores?.name || "",
            dates: new Set(),
            count: 0,
          });
        }
        const entry = memberMap.get(id)!;
        entry.count++;
        entry.dates.add(new Date(row.created_at).toISOString().split("T")[0]);
      }

      // Calculate streaks (consecutive days ending today or yesterday)
      const calculateStreak = (dates: Set<string>): number => {
        if (dates.size === 0) return 0;
        const sorted = Array.from(dates).sort().reverse();
        const today = new Date().toISOString().split("T")[0];
        const yesterday = new Date(Date.now() - 86400000)
          .toISOString()
          .split("T")[0];

        // Streak must include today or yesterday
        if (sorted[0] !== today && sorted[0] !== yesterday) return 0;

        let streak = 1;
        for (let i = 1; i < sorted.length; i++) {
          const prev = new Date(sorted[i - 1]);
          const curr = new Date(sorted[i]);
          const diff = (prev.getTime() - curr.getTime()) / 86400000;
          if (diff === 1) {
            streak++;
          } else {
            break;
          }
        }
        return streak;
      };

      const leaderboard: LeaderboardEntry[] = Array.from(memberMap.entries())
        .map(([id, data]) => ({
          team_member_id: id,
          name: data.name,
          store_name: data.store_name,
          count: data.count,
          streak: calculateStreak(data.dates),
        }))
        .sort((a, b) => b.count - a.count);

      setEntries(leaderboard);
      setLoading(false);
    }
    load();
  }, [timeFilter]);

  const medalColors = ["text-yellow-500", "text-gray-400", "text-amber-700"];

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-black" />
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">Leaderboard</h1>
      <p className="mt-1 text-sm text-gray-500">
        Who&apos;s sharing the most insights?
      </p>

      {/* Time Filter */}
      <div className="mt-4 flex gap-1 rounded-lg bg-gray-100 p-1">
        {([
          ["week", "This Week"],
          ["month", "This Month"],
          ["all", "All Time"],
        ] as const).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTimeFilter(key)}
            className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
              timeFilter === key
                ? "bg-white text-black shadow-sm"
                : "text-gray-500"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Leaderboard */}
      <div className="mt-5 space-y-2">
        {entries.length === 0 ? (
          <p className="py-12 text-center text-sm text-gray-400">
            No submissions yet. Start sharing insights!
          </p>
        ) : (
          entries.map((entry, index) => (
            <div
              key={entry.team_member_id}
              className={`flex items-center gap-4 rounded-lg border p-4 ${
                index < 3
                  ? "border-gray-300 bg-white"
                  : "border-gray-200 bg-white"
              }`}
            >
              {/* Rank */}
              <div className="flex h-8 w-8 shrink-0 items-center justify-center">
                {index < 3 ? (
                  <span className={`text-xl ${medalColors[index]}`}>
                    {index === 0 ? "🥇" : index === 1 ? "🥈" : "🥉"}
                  </span>
                ) : (
                  <span className="text-sm font-medium text-gray-400">
                    {index + 1}
                  </span>
                )}
              </div>

              {/* Avatar + Name */}
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-sm font-semibold text-gray-600">
                  {entry.name.charAt(0)}
                </div>
                <div>
                  <p className="text-sm font-medium">{entry.name}</p>
                  <p className="text-xs text-gray-400">{entry.store_name}</p>
                </div>
              </div>

              {/* Stats */}
              <div className="ml-auto flex items-center gap-4 text-right">
                {entry.streak > 0 && (
                  <div className="text-xs text-orange-500">
                    🔥 {entry.streak}d
                  </div>
                )}
                <div>
                  <p className="text-lg font-semibold">{entry.count}</p>
                  <p className="text-xs text-gray-400">notes</p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
