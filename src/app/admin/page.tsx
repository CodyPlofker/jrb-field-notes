"use client";

import { useState, useEffect } from "react";
import { getSupabase } from "@/lib/supabase";
import { Store, TeamMember } from "@/lib/types";

export default function AdminPage() {
  const [stores, setStores] = useState<Store[]>([]);
  const [teamMembers, setTeamMembers] = useState<(TeamMember & { stores?: Store })[]>([]);
  const [loading, setLoading] = useState(true);

  // New store form
  const [newStoreName, setNewStoreName] = useState("");

  // New member form
  const [newMemberName, setNewMemberName] = useState("");
  const [newMemberStore, setNewMemberStore] = useState("");
  const [newMemberRole, setNewMemberRole] = useState<"manager" | "associate">("associate");

  const loadData = async () => {
    const [stRes, tmRes] = await Promise.all([
      getSupabase().from("stores").select("*").order("name"),
      getSupabase().from("team_members").select("*, stores(name)").order("name"),
    ]);
    if (stRes.data) setStores(stRes.data);
    if (tmRes.data) setTeamMembers(tmRes.data);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const addStore = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStoreName.trim()) return;
    await getSupabase().from("stores").insert({ name: newStoreName.trim() });
    setNewStoreName("");
    loadData();
  };

  const deleteStore = async (id: string) => {
    if (!confirm("Delete this store? All associated team members will also be removed.")) return;
    await getSupabase().from("stores").delete().eq("id", id);
    loadData();
  };

  const addMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemberName.trim() || !newMemberStore) return;
    await getSupabase().from("team_members").insert({
      name: newMemberName.trim(),
      store_id: newMemberStore,
      role: newMemberRole,
    });
    setNewMemberName("");
    setNewMemberStore("");
    setNewMemberRole("associate");
    loadData();
  };

  const deleteMember = async (id: string) => {
    if (!confirm("Remove this team member?")) return;
    await getSupabase().from("team_members").delete().eq("id", id);
    loadData();
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
      <h1 className="text-2xl font-semibold tracking-tight">Admin</h1>
      <p className="mt-1 text-sm text-gray-500">
        Manage stores & team members
      </p>

      {/* Stores Section */}
      <section className="mt-6">
        <h2 className="text-lg font-semibold">Stores</h2>
        <form onSubmit={addStore} className="mt-3 flex gap-2">
          <input
            type="text"
            value={newStoreName}
            onChange={(e) => setNewStoreName(e.target.value)}
            placeholder="Store name..."
            className="flex-1 rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none focus:border-black focus:ring-1 focus:ring-black"
          />
          <button
            type="submit"
            className="rounded-lg bg-black px-5 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90"
          >
            Add
          </button>
        </form>
        <div className="mt-3 space-y-2">
          {stores.map((s) => (
            <div
              key={s.id}
              className="flex items-center justify-between rounded-lg border border-gray-200 bg-white px-4 py-3"
            >
              <span className="text-sm font-medium">{s.name}</span>
              <button
                onClick={() => deleteStore(s.id)}
                className="text-xs text-red-500 hover:text-red-700"
              >
                Remove
              </button>
            </div>
          ))}
          {stores.length === 0 && (
            <p className="py-4 text-center text-sm text-gray-400">
              No stores yet. Add one above.
            </p>
          )}
        </div>
      </section>

      {/* Team Members Section */}
      <section className="mt-8">
        <h2 className="text-lg font-semibold">Team Members</h2>
        <form onSubmit={addMember} className="mt-3 space-y-2">
          <input
            type="text"
            value={newMemberName}
            onChange={(e) => setNewMemberName(e.target.value)}
            placeholder="Name..."
            className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none focus:border-black focus:ring-1 focus:ring-black"
          />
          <div className="flex gap-2">
            <select
              value={newMemberStore}
              onChange={(e) => setNewMemberStore(e.target.value)}
              className="flex-1 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm outline-none"
              required
            >
              <option value="">Select store...</option>
              {stores.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
            <select
              value={newMemberRole}
              onChange={(e) => setNewMemberRole(e.target.value as "manager" | "associate")}
              className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm outline-none"
            >
              <option value="associate">Associate</option>
              <option value="manager">Manager</option>
            </select>
          </div>
          <button
            type="submit"
            className="w-full rounded-lg bg-black py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90"
          >
            Add Team Member
          </button>
        </form>

        <div className="mt-4 space-y-2">
          {teamMembers.map((m) => (
            <div
              key={m.id}
              className="flex items-center justify-between rounded-lg border border-gray-200 bg-white px-4 py-3"
            >
              <div>
                <span className="text-sm font-medium">{m.name}</span>
                <span className="ml-2 text-xs text-gray-400">
                  {(m.stores as unknown as Store)?.name || ""} · {m.role}
                </span>
              </div>
              <button
                onClick={() => deleteMember(m.id)}
                className="text-xs text-red-500 hover:text-red-700"
              >
                Remove
              </button>
            </div>
          ))}
          {teamMembers.length === 0 && (
            <p className="py-4 text-center text-sm text-gray-400">
              No team members yet. Add stores first, then add members.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
