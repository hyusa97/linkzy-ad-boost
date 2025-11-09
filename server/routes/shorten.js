import express from "express";
import { supabase } from "../supabaseClient.js";

const router = express.Router();

// GET /api/s/:shortCode → used for resolving short code to original URL
router.get("/api/s/:shortCode", async (req, res) => {
  const { shortCode } = req.params;

  try {
    const { data, error } = await supabase
      .from("links")
      .select("*")
      .eq("short_code", shortCode)
      .single();

    if (error || !data) {
      return res.status(404).json({ error: "Short link not found" });
    }

    // Return the link data as JSON
    return res.json({
      shortCode,
      originalURL: data.original_url,
      stats: {
        clicks: data.clicks,
        impressions: data.impressions,
        earnings: data.earnings
      },
      ownerId: data.owner_id,
    });
  } catch (err) {
    console.error("Error fetching link:", err);
    return res.status(500).json({ error: "Server error" });
  }
});

// POST /api/track → for tracking final clicks
router.post("/api/track", async (req, res) => {
  const { shortCode, event } = req.body;

  if (!shortCode || !event) {
    return res.status(400).json({ error: "Missing shortCode or event" });
  }

  try {
    // You can add tracking logic here if needed
    console.log(`Tracking event: ${event} for shortCode: ${shortCode}`);
    return res.json({ success: true });
  } catch (err) {
    console.error("Error tracking event:", err);
    return res.status(500).json({ error: "Server error" });
  }
});

export default router;
