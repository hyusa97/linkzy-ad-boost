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

      // Enhanced DEV mock: Mock for any shortCode in development
      if (import.meta.env.DEV) {
        console.log('DEV MODE: Mocking short code validation for:', shortCode);
        sessionStorage.setItem("linkzy_short_code", shortCode);
        navigate("/ad/1");
        return;
      }

      // Production: Validate that the short code exists using RPC (anon-friendly)
      console.log("Attempting RPC validation for shortCode:", shortCode);
      try {
        const { data: targetUrl, error } = await supabase.rpc("resolve_short_code", {
          p_code: shortCode,
        });

        if (error || !targetUrl) {
          console.warn("Short code not found:", { shortCode, error });
          setErr("Short link not found");
          setTimeout(() => navigate("/"), 1500);
          return;
        }

        // Link exists, store shortCode in sessionStorage (ignore targetUrl)
        console.log("RPC validation successful for shortCode:", shortCode);
        sessionStorage.setItem("linkzy_short_code", shortCode);

        // Navigate to the first ad page without target param
        navigate("/ad/1");
      } catch (rpcError) {
        console.error("RPC validation failed:", { shortCode, rpcError });
        setErr("Short link not found");
        setTimeout(() => navigate("/"), 1500);
      }
    };

    handleRedirect();
  }, [shortCode, navigate]);

  if (err) return <div className="p-8 text-center">{err}</div>;
  return <div className="p-8 text-center">Loading…</div>;
};

export default ShortLinkRedirect;
