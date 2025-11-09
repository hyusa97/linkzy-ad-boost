import express from "express";
import { supabase } from "../supabaseClient.js";

const router = express.Router();

// GET /api/admin/config - Get full config
router.get("/api/admin/config", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("config")
      .select("value")
      .eq("key", "ad_funnel_config")
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
      return res.status(500).json({ error: "Database error" });
    }

    if (data) {
      return res.json(JSON.parse(data.value));
    }

    // Return default if not found
    const defaultConfig = {
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
    return res.json(defaultConfig);
  } catch (err) {
    console.error("Error fetching config:", err);
    return res.status(500).json({ error: "Server error" });
  }
});

// POST /api/admin/config - Replace/update config
router.post("/api/admin/config", async (req, res) => {
  const config = req.body;

  // Basic validation
  if (!config.pages || !Array.isArray(config.pages) || config.pages.length !== 4) {
    return res.status(400).json({ error: "Invalid config: pages must be array of length 4" });
  }

  try {
    await supabase
      .from("config")
      .upsert({ key: "ad_funnel_config", value: JSON.stringify(config) });

    return res.json({ success: true });
  } catch (err) {
    console.error("Error saving config:", err);
    return res.status(500).json({ error: "Server error" });
  }
});

// POST /api/admin/analytics - Record analytics event
router.post("/api/admin/analytics", async (req, res) => {
  const { type, pageId, adId } = req.body;

  try {
    if (type === 'visit' && pageId) {
      await supabase.from("ad_visits").insert({ page: pageId, ts: new Date().toISOString() });
    } else if (type === 'click' && adId) {
      await supabase.from("ad_clicks").insert({ ad_id: adId, ts: new Date().toISOString() });
    } else if (type === 'download') {
      await supabase.from("downloads").insert({ ts: new Date().toISOString() });
    } else {
      return res.status(400).json({ error: "Invalid analytics type or missing data" });
    }

    return res.json({ success: true });
  } catch (err) {
    console.error("Error recording analytics:", err);
    return res.status(500).json({ error: "Server error" });
  }
});

// POST /api/admin/ad - Create ad
router.post("/api/admin/ad", async (req, res) => {
  const { title, img, link, assignedPage, order } = req.body;

  // Validate
  if (!title || !img || !link || !assignedPage) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    new URL(link);
    new URL(img);
  } catch (e) {
    return res.status(400).json({ error: "Invalid URL format" });
  }

  if (assignedPage < 1 || assignedPage > 4) {
    return res.status(400).json({ error: "assignedPage must be 1-4" });
  }

  try {
    // Load current config
    const { data: configData } = await supabase
      .from("config")
      .select("value")
      .eq("key", "ad_funnel_config")
      .single();

    let config = configData ? JSON.parse(configData.value) : {
      pages: [
        { id: 1, countdown: 5, ads: [] },
        { id: 2, countdown: 5, ads: [] },
        { id: 3, countdown: 5, ads: [] },
        { id: 4, countdown: 5, ads: [] },
      ],
      analytics: { pageVisits: {1:0,2:0,3:0,4:0}, adClicks: {}, totalDownloads: 0 }
    };

    const adId = `ad_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const newAd = { id: adId, title, img, link, order: order || 0 };

    const page = config.pages.find(p => p.id === assignedPage);
    if (page) {
      page.ads.push(newAd);
    }

    await supabase
      .from("config")
      .upsert({ key: "ad_funnel_config", value: JSON.stringify(config) });

    return res.json({ success: true, ad: newAd });
  } catch (err) {
    console.error("Error creating ad:", err);
    return res.status(500).json({ error: "Server error" });
  }
});

// PUT /api/admin/ad/:id - Update ad
router.put("/api/admin/ad/:id", async (req, res) => {
  const { id } = req.params;
  const { title, img, link, assignedPage, order } = req.body;

  // Validate
  if (!title || !img || !link || !assignedPage) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    new URL(link);
    new URL(img);
  } catch (e) {
    return res.status(400).json({ error: "Invalid URL format" });
  }

  try {
    // Load and update config
    const { data: configData } = await supabase
      .from("config")
      .select("value")
      .eq("key", "ad_funnel_config")
      .single();

    if (!configData) {
      return res.status(404).json({ error: "Config not found" });
    }

    let config = JSON.parse(configData.value);

    // Find and update ad
    let updated = false;
    for (const page of config.pages) {
      const adIndex = page.ads.findIndex(ad => ad.id === id);
      if (adIndex !== -1) {
        page.ads[adIndex] = { id, title, img, link, order: order || 0 };
        updated = true;
        break;
      }
    }

    if (!updated) {
      return res.status(404).json({ error: "Ad not found" });
    }

    await supabase
      .from("config")
      .upsert({ key: "ad_funnel_config", value: JSON.stringify(config) });

    return res.json({ success: true });
  } catch (err) {
    console.error("Error updating ad:", err);
    return res.status(500).json({ error: "Server error" });
  }
});

// DELETE /api/admin/ad/:id - Delete ad
router.delete("/api/admin/ad/:id", async (req, res) => {
  const { id } = req.params;

  try {
    // Load and update config
    const { data: configData } = await supabase
      .from("config")
      .select("value")
      .eq("key", "ad_funnel_config")
      .single();

    if (!configData) {
      return res.status(404).json({ error: "Config not found" });
    }

    let config = JSON.parse(configData.value);

    // Find and remove ad
    let deleted = false;
    for (const page of config.pages) {
      const adIndex = page.ads.findIndex(ad => ad.id === id);
      if (adIndex !== -1) {
        page.ads.splice(adIndex, 1);
        deleted = true;
        break;
      }
    }

    if (!deleted) {
      return res.status(404).json({ error: "Ad not found" });
    }

    await supabase
      .from("config")
      .upsert({ key: "ad_funnel_config", value: JSON.stringify(config) });

    return res.json({ success: true });
  } catch (err) {
    console.error("Error deleting ad:", err);
    return res.status(500).json({ error: "Server error" });
  }
});

export default router;
