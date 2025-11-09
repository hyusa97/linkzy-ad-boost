// src/lib/adFunnelConfig.ts
import { supabase } from "@/integrations/supabase/client";

/** In-memory fallback (if DB empty) */
const FALLBACK = {
  pages: [
    { id: 1, countdown: 5, ads: [] },
    { id: 2, countdown: 5, ads: [] },
    { id: 3, countdown: 5, ads: [] },
    { id: 4, countdown: 5, ads: [] },
  ],
};

export function loadConfig() {
  // Minimal: read a JSON blob from config table key "ad_pages"
  // If not present, return FALLBACK
  // For now we’ll just synchronously return fallback; you can expand this to async DB load in Admin.
  return FALLBACK;
}

export async function updatePageVisit(page: number) {
  // Optional: store visit tracking - tables not yet created
  // await supabase.from("ad_visits").insert({ page, ts: new Date().toISOString() });
  console.log(`Ad page ${page} visited`);
}

export async function updateAdClick(adId: string) {
  // Optional: store ad click tracking - tables not yet created
  // await supabase.from("ad_clicks").insert({ ad_id: adId, ts: new Date().toISOString() });
  console.log(`Ad ${adId} clicked`);
}
