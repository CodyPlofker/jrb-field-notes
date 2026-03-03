"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Feedback, TeamMember, Store, CATEGORIES } from "@/lib/types";

export default function FeedPage() {
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [filterCategory, setFilterCategory] = useState("");
  const [filterMember, setFilterMember] = useState("");
  const [filterStore, setFilterStore] = useState("");

  useEffect(() => {
    async function load() {
      const [fbRes, tmRes, stRes] = await Promise.all([
        supabase
          .from("feedback")
          .select("*, team_members(name, role, store_id, stores(name))")
          .order("created_at", { ascending: false })
          .limit(200),
        supabase.from("team_members").select("*").order("name"),
        supabase.from("stores").select("*").order("name"),
      ]);
      if (fbRes.data) setFeedback(fbRes.data);
      if (tmRes.data) setTeamMembers(tmRes.data);
      if (stRes.data) setStores(stRes.data);
      setLoading(false);
    }
    load();
  }, []);

  const filtered = feedback.filter((f) => {
    if (filterCategory && f.category !== filterCategory) return false;
    if (filterMember && f.team_member_id !== filterMember) return false;
    if (filterStore) {
      const member = f.team_members;
      if (!member || (member.stores as unknown as Store)?.id !== filterStore) return false;
    }
    return true;
  });

  const exportCSV = () => {
    const headers = ["Date", "Name", "Store", "Role", "Category", "Feedback"];
    const rows = filtered.map((f) => {
      const m = f.team_members;
      const store = m?.stores as unknown as Store;
      return [
        new Date(f.created_at).toLocaleString(),
        m?.name || "",
        store?.name || "",
        m?.role || "",
        f.category,
        `"${f.content.replace(/"/g, '""')}"`,
      ].join(",");
    });

    const csv = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `field-notes-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const categoryColors: Record<string, string> = {
    "Customer Feedback": "bg-blue-100 text-blue-800",
    "Product Issue": "bg-red-100 text-red-800",
    "What's Selling": "bg-green-100 text-green-800",
    "Store Operations": "bg-yellow-100 text-yellow-800",
    "Competitor Intel": "bg-purple-100 text-purple-800",
    "General Insight": "bg-gray-100 text-gray-800",
  };

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-black" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Feed</h1>
          <p className="mt-1 text-sm text-gray-500">
            {filtered.length} {filtered.length === 1 ? "entry" : "entries"}
          </p>
        </div>
        <button
          onClick={exportCSV}
          className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium transition-colors hover:bg-gray-50"
        >
          Export CSV
        </button>
      </div>

      {/* Filters */}
      <div className="mt-4 flex gap-2 overflow-x-auto">
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none"
        >
          <option value="">All Categories</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        <select
          value={filterMember}
          onChange={(e) => setFilterMember(e.target.value)}
          className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none"
        >
          <option value="">All People</option>
          {teamMembers.map((m) => (
            <option key={m.id} value={m.id}>{m.name}</option>
          ))}
        </select>
        <select
          value={filterStore}
          onChange={(e) => setFilterStore(e.target.value)}
          className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none"
        >
          <option value="">All Stores</option>
          {stores.map((s) => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>
      </div>

      {/* Feedback List */}
      <div className="mt-5 space-y-3">
        {filtered.length === 0 ? (
          <p className="py-12 text-center text-sm text-gray-400">
            No feedback yet. Be the first to submit!
          </p>
        ) : (
          filtered.map((f) => {
            const m = f.team_members;
            const store = m?.stores as unknown as Store;
            return (
              <div
                key={f.id}
                className="rounded-lg border border-gray-200 bg-white p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-sm font-medium text-gray-600">
                      {m?.name?.charAt(0) || "?"}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{m?.name || "Unknown"}</p>
                      <p className="text-xs text-gray-400">
                        {store?.name || ""}{" "}
                        {new Date(f.created_at).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          hour: "numeric",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      categoryColors[f.category] || "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {f.category}
                  </span>
                </div>
                <p className="mt-3 text-sm leading-relaxed text-gray-700">
                  {f.content}
                </p>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
