// src/pages/ShortLinkRedirect.tsx
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

const ShortLinkRedirect = () => {
  const { shortCode } = useParams<{ shortCode: string }>();
  const navigate = useNavigate();
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      if (!shortCode) {
        setErr("Invalid short link");
        return;
      }
      // fetch original via RLS-safe RPC
      const { data, error } = await supabase.rpc("resolve_short_code", { p_code: shortCode });

      if (error || !data) {
        console.error("Short code resolution failed or not found:", error);
        setErr("Invalid or expired short link");
        setTimeout(() => navigate("/"), 2000);
        return;
      }

      // optional: increment click counter
      try {
        await supabase.rpc("increment_link_clicks", { p_code: shortCode });
      } catch (error) {
        // Silently ignore RPC errors to avoid breaking the redirect flow
        console.warn("Failed to increment click counter:", error);
      }

      navigate(`/ad/1?target=${encodeURIComponent(data)}`);
    })();
  }, [shortCode, navigate]);

  if (err) return <div className="p-8 text-center">{err}</div>;
  return <div className="p-8 text-center">Loading…</div>;
};

export default ShortLinkRedirect;
