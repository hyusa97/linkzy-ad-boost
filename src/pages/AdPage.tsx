// src/pages/AdPage.tsx
import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { loadConfig, updatePageVisit, updateAdClick, updateDownload } from "@/lib/adFunnelConfig";
import CountdownTimer from "@/components/CountdownTimer";
import AdCard from "@/components/AdCard";
import { Button } from "@/components/ui/button";
import { ArrowRight, Download } from "lucide-react";

type PageCfg = {
  id: number | string;
  countdown?: number;
  ads?: Array<{ id: string; title?: string; description?: string; url?: string; image?: string }>;
};

const AdPage = () => {
  const { pageId } = useParams();
  const navigate = useNavigate();

  const [showNext, setShowNext] = useState(false);
  const [pageConfig, setPageConfig] = useState<PageCfg | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const currentPage = parseInt((pageId as string) || "1", 10);
  const currentPageRef = useRef(currentPage);

  useEffect(() => {
    currentPageRef.current = currentPage;
  }, [currentPage]);

  useEffect(() => {
    setShowNext(false);
    setErr(null);
    loadConfig().then((cfg) => {
      if (!cfg || !Array.isArray(cfg.pages)) {
        setErr("Configuration error");
        setTimeout(() => navigate("/"), 1500);
        return;
      }

      const page = cfg.pages.find((p: any) => Number(p.id) === currentPage);
      if (!page) {
        setErr("Invalid page");
        setTimeout(() => navigate("/"), 1500);
        return;
      }

      setPageConfig(page);

      try {
        updatePageVisit(currentPage);
      } catch (e) {
        console.warn("updatePageVisit failed:", e);
      }
    }).catch((e) => {
      console.warn("loadConfig failed:", e);
      setErr("Configuration error");
      setTimeout(() => navigate("/"), 1500);
    });
  }, [currentPage, navigate]);

  const handleCountdownComplete = useCallback(() => {
    if (currentPageRef.current !== currentPage) return;
    setShowNext(true);
  }, [currentPage]);

  const handleNext = async () => {
    if (currentPage < 4) {
      // Navigate to next ad page
      navigate(`/ad/${currentPage + 1}`);
    } else {
      // Final page: resolve short code from sessionStorage
      const shortCode = sessionStorage.getItem("linkzy_short_code");
      if (!shortCode) {
        console.warn("No short code found in sessionStorage");
        setErr("Session expired. Please try the link again.");
        setTimeout(() => navigate("/"), 1500);
        return;
      }

      // Enhanced DEV mock: Mock for any shortCode in development
      if (import.meta.env.DEV) {
        console.log('DEV MODE: Mocking final redirect for shortCode:', shortCode);
        sessionStorage.removeItem("linkzy_short_code");
        window.location.href = 'https://www.google.com';
        return;
      }

      // Production: Resolve the original URL
      console.log("Attempting final RPC resolution for shortCode:", shortCode);
      try {
        const { data: targetUrl, error: resolveError } = await supabase.rpc("resolve_short_code", {
          p_code: shortCode,
        });

        if (resolveError || !targetUrl) {
          console.warn("URL resolution failed:", { shortCode, resolveError });
          setErr("Link not found");
          setTimeout(() => navigate("/"), 1500);
          return;
        }

        // Increment click counter
        try {
          console.log("Incrementing clicks for shortCode:", shortCode);
          await supabase.rpc("increment_link_clicks", { p_code: shortCode });
        } catch (incError) {
          console.warn("Failed to increment clicks:", { shortCode, incError });
        }

        // Record download
        try {
          await updateDownload();
        } catch (dlError) {
          console.warn("Failed to record download:", dlError);
        }

        // Clear sessionStorage
        sessionStorage.removeItem("linkzy_short_code");

        // Hard redirect to target
        console.log("Redirecting to target:", targetUrl);
        window.location.href = targetUrl;
      } catch (error) {
        console.error("Final redirect error:", { shortCode, error });
        setErr("Redirect failed. Please try again.");
        setTimeout(() => navigate("/"), 1500);
      }
    }
  };

  const handleAdClick = (adId: string) => {
    try {
      updateAdClick(adId);
    } catch (err) {
      console.warn("updateAdClick failed:", err);
    }
  };

  if (err) {
    return <div className="p-8 text-center">{err}</div>;
  }

  if (!pageConfig) return <div className="p-8 text-center">Loading…</div>;

  const countdownSeconds =
    typeof pageConfig.countdown === "number" && pageConfig.countdown >= 0
      ? pageConfig.countdown
      : 10;
  const ads = Array.isArray(pageConfig.ads) ? pageConfig.ads : [];

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card shadow-soft">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Download className="w-6 h-6 text-primary" />
              <h1 className="text-xl font-bold text-foreground">Software Download</h1>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Step {currentPage} of 4</span>
                <div className="flex gap-1">
                  {[1, 2, 3, 4].map((step) => (
                    <div
                      key={step}
                      className={`w-2 h-2 rounded-full transition-smooth ${
                        step <= currentPage ? "bg-primary" : "bg-muted"
                      }`}
                    />
                  ))}
                </div>
              </div>
              <Link to="/user/dashboard">
                <Button variant="outline" size="sm">
                  User Dashboard
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12">
        <div className="max-w-6xl mx-auto space-y-12">
          <div className="text-center space-y-4">
            <h2 className="text-3xl font-bold text-foreground">Preparing Your Download</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Your download will be ready in a moment. While you wait, check out these premium
              offers from our partners.
            </p>

            <div className="pt-6">
              <CountdownTimer
                key={`countdown-page-${currentPage}-${countdownSeconds}`}
                seconds={countdownSeconds}
                onComplete={handleCountdownComplete}
              />
            </div>
          </div>

          {ads.length > 0 && (
            <div>
              <h3 className="text-xl font-semibold text-foreground mb-6 text-center">
                Featured Offers
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {ads.map((ad) => (
                  <AdCard key={ad.id} ad={ad} onAdClick={() => handleAdClick(ad.id)} />
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-center">
            {showNext ? (
              <Button
                onClick={handleNext}
                size="lg"
                className="gradient-primary text-white shadow-large hover:shadow-medium transition-smooth group"
              >
                {currentPage < 4 ? (
                  <>
                    Continue to Next Step
                    <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-smooth" />
                  </>
                ) : (
                  <>
                    Get Your Download
                    <Download className="ml-2 w-5 h-5" />
                  </>
                )}
              </Button>
            ) : (
              <div className="text-center text-muted-foreground">
                <p className="text-sm">Next button will appear when countdown completes</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdPage;
