// src/pages/ShortLinkRedirect.tsx
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

const ShortLinkRedirect = () => {
  const { shortCode } = useParams<{ shortCode: string }>();
  const navigate = useNavigate();
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    const handleRedirect = async () => {
      if (!shortCode) {
        setErr("Invalid short link");
        return;
      }

      // Resolve the original target URL via your Supabase RPC
      const { data: targetUrl, error } = await supabase.rpc("resolve_short_code", {
        p_code: shortCode,
      });

      if (error || !targetUrl) {
        console.warn("Short code resolution failed or not found:", error);
        setErr("Short link not found");
        setTimeout(() => navigate("/"), 1500);
        return;
      }

      // Increment click counter (best-effort)
      try {
        await supabase.rpc("increment_link_clicks", { p_code: shortCode });
      } catch (err) {
        console.warn("Failed to increment click count:", err);
      }

      // Redirect to the first ad page in funnel
      navigate(`/ad/1?target=${encodeURIComponent(targetUrl)}`);
    };

    handleRedirect();
  }, [shortCode, navigate]);

  if (err) return <div className="p-8 text-center">{err}</div>;
  return <div className="p-8 text-center">Loading…</div>;
};

export default ShortLinkRedirect;
