import { supabase } from "./supabase";

/**
 * fetchRecentStories — En son 6 story entry
 */
export async function fetchRecentStories(limit = 6) {
  const { data, error } = await supabase
    .from("program_story_entries")
    .select("*, programs(program_name)")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) {
    console.error("fetchRecentStories error:", error);
    return [];
  }
  return data || [];
}

/**
 * fetchDueActions — Önümüzdeki N gün içinde due olan açık aksiyonlar
 */
export async function fetchDueActions(daysAhead = 14, limit = 5) {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() + daysAhead);
  const { data, error } = await supabase
    .from("program_actions")
    .select("*, programs(program_name)")
    .eq("status", "open")
    .lte("due_date", cutoff.toISOString().split("T")[0])
    .order("due_date", { ascending: true })
    .limit(limit);
  if (error) {
    console.error("fetchDueActions error:", error);
    return [];
  }
  return data || [];
}
