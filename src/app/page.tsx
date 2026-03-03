"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { TeamMember, CATEGORIES } from "@/lib/types";
import VoiceInput from "@/components/VoiceInput";

export default function SubmitPage() {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [selectedMember, setSelectedMember] = useState("");
  const [category, setCategory] = useState("");
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from("team_members")
        .select("*, stores(name)")
        .order("name");
      if (data) setTeamMembers(data);

      // Restore last-used member from localStorage
      const saved = localStorage.getItem("fieldnotes_member");
      if (saved) setSelectedMember(saved);

      setLoading(false);
    }
    load();
  }, []);

  const handleMemberChange = (id: string) => {
    setSelectedMember(id);
    localStorage.setItem("fieldnotes_member", id);
  };

  const handleVoiceTranscript = useCallback((text: string) => {
    setContent(text);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMember || !category || !content.trim()) return;

    setSubmitting(true);
    const { error } = await supabase.from("feedback").insert({
      team_member_id: selectedMember,
      category,
      content: content.trim(),
    });

    setSubmitting(false);

    if (!error) {
      setContent("");
      setCategory("");
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    }
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
      <h1 className="text-2xl font-semibold tracking-tight">Field Notes</h1>
      <p className="mt-1 text-sm text-gray-500">
        Submit feedback & insights from the floor
      </p>

      {success && (
        <div className="mt-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
          Feedback submitted successfully!
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-6 space-y-5">
        {/* Name Picker */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">
            Your Name
          </label>
          <select
            value={selectedMember}
            onChange={(e) => handleMemberChange(e.target.value)}
            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-base outline-none focus:border-black focus:ring-1 focus:ring-black"
            required
          >
            <option value="">Select your name...</option>
            {teamMembers.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
                {m.stores ? ` — ${(m.stores as unknown as { name: string }).name}` : ""}
              </option>
            ))}
          </select>
        </div>

        {/* Category */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">
            Category
          </label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-base outline-none focus:border-black focus:ring-1 focus:ring-black"
            required
          >
            <option value="">Select a category...</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        {/* Feedback Text + Voice */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">
            What&apos;s on your mind?
          </label>
          <div className="relative">
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Type or tap the mic to speak..."
              rows={6}
              className="w-full resize-none rounded-lg border border-gray-300 bg-white px-4 py-3 pr-16 text-base outline-none focus:border-black focus:ring-1 focus:ring-black"
              required
            />
            <div className="absolute bottom-3 right-3">
              <VoiceInput onTranscript={handleVoiceTranscript} />
            </div>
          </div>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={submitting || !selectedMember || !category || !content.trim()}
          className="w-full rounded-lg bg-black py-3.5 text-base font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-40"
        >
          {submitting ? "Submitting..." : "Submit Feedback"}
        </button>
      </form>
    </div>
  );
}
