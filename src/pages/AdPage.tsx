// src/pages/AdPage.tsx
import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useParams, Link, useSearchParams } from "react-router-dom";
import { loadConfig, updatePageVisit, updateAdClick } from "@/lib/adFunnelConfig";
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
  const [searchParams] = useSearchParams();
  const target = searchParams.get("target") || "";

  const [showNext, setShowNext] = useState(false);
  const [pageConfig, setPageConfig] = useState<PageCfg | null>(null);

  const currentPage = parseInt((pageId as string) || "1", 10);
  const currentPageRef = useRef(currentPage);
  useEffect(() => {
    currentPageRef.current = currentPage;
  }, [currentPage]);

  useEffect(() => {
    setShowNext(false);
    const cfg = loadConfig();
    if (!cfg || !Array.isArray(cfg.pages)) {
      console.warn("ad funnel config missing or invalid", cfg);
      navigate("/");
      return;
    }
    const page = cfg.pages.find((p: any) => Number(p.id) === currentPage);
    if (!page) {
      navigate("/");
      return;
    }
    setPageConfig(page);
    try {
      updatePageVisit(currentPage);
    } catch (e) {
      console.warn("updatePageVisit failed:", e);
    }
  }, [currentPage, navigate]);

  const handleCountdownComplete = useCallback(() => {
    if (currentPageRef.current !== currentPage) return;
    setShowNext(true);
  }, [currentPage]);

  const handleNext = () => {
    if (currentPage < 4) {
      navigate(`/ad/${currentPage + 1}?target=${encodeURIComponent(target)}`);
    } else {
      // final step → go to the actual target
      if (target && target !== '/' && (target.startsWith('http://') || target.startsWith('https://'))) {
        window.location.href = target;
      } else {
        console.error('Invalid or missing target URL:', target);
        navigate("/"); // fallback
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

  if (!pageConfig) return null;

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
                <Button variant="outline" size="sm">User Dashboard</Button>
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
              <h3 className="text-xl font-semibold text-foreground mb-6 text-center">Featured Offers</h3>
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