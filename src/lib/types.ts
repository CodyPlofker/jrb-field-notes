export interface Store {
  id: string;
  name: string;
  created_at: string;
}

export interface TeamMember {
  id: string;
  name: string;
  store_id: string;
  role: "manager" | "associate";
  created_at: string;
  stores?: Store;
}

export interface Feedback {
  id: string;
  team_member_id: string;
  category: string;
  content: string;
  created_at: string;
  team_members?: TeamMember & { stores?: Store };
}

export const CATEGORIES = [
  "Customer Feedback",
  "Product Issue",
  "What's Selling",
  "Store Operations",
  "Competitor Intel",
  "General Insight",
] as const;

export type Category = (typeof CATEGORIES)[number];
