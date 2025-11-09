import { supabase } from "@/integrations/supabase/client";

export type Ad = {
  id: string;
  title: string;
  img: string;
  link: string;
  order: number;
};

export type PageConfig = {
  id: number;
  countdown: number;
  ads: Ad[];
};

export type Analytics = {
  pageVisits: Record<number, number>;
  adClicks: Record<string, number>;
  totalDownloads: number;
};

export type FullConfig = {
  pages: PageConfig[];
  analytics: Analytics;
};

/** In-memory fallback (if DB empty) */
const FALLBACK: FullConfig = {
  pages: [
    { id: 1, countdown: 5, ads: [] },
    { id: 2, countdown: 5, ads: [] },
    { id: 3, countdown: 5, ads: [] },
    { id: 4, countdown: 5, ads: [] },
  ],
  analytics: {
    pageVisits: { 1: 0, 2: 0, 3: 0, 4: 0 },
    adClicks: {},
    totalDownloads: 0,
  },
};

const CONFIG_KEY = "adFunnelConfig";

export async function loadConfig(): Promise<FullConfig> {
  try {
    // Try DB first
    const { data, error } = await supabase
      .from("config")
      .select("value")
      .eq("key", "ad_funnel_config")
      .single();

    if (data && !error) {
      const parsed = JSON.parse(data.value as string);
      // Validate structure
      if (parsed.pages && Array.isArray(parsed.pages) && parsed.analytics) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn("DB load failed, falling back to localStorage:", e);
  }

  // Fallback to localStorage
  const stored = localStorage.getItem(CONFIG_KEY);
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      if (parsed.pages && Array.isArray(parsed.pages) && parsed.analytics) {
        return parsed;
      }
    } catch (e) {
      console.warn("localStorage parse failed:", e);
    }
  }

  return FALLBACK;
}

export async function saveConfig(config: FullConfig): Promise<void> {
  try {
    // Save to DB
    await supabase
      .from("config")
      .upsert({ key: "ad_funnel_config", value: JSON.stringify(config) });
  } catch (e) {
    console.warn("DB save failed, using localStorage:", e);
    // Fallback to localStorage
    localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
  }
}

export async function updatePageVisit(page: number): Promise<void> {
  try {
    await supabase.from("ad_visits").insert({ page, ts: new Date().toISOString() });
    // Also update in-memory analytics if needed, but for now rely on DB
  } catch (e) {
    console.warn("updatePageVisit failed:", e);
  }
}

export async function updateAdClick(adId: string): Promise<void> {
  try {
    await supabase.from("ad_clicks").insert({ ad_id: adId, ts: new Date().toISOString() });
  } catch (e) {
    console.warn("updateAdClick failed:", e);
  }
}

export async function updateDownload(): Promise<void> {
  try {
    await supabase.from("downloads").insert({ ts: new Date().toISOString() });
  } catch (e) {
    console.warn("updateDownload failed:", e);
  }
}
