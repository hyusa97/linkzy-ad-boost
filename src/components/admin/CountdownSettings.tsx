import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { loadConfig, saveConfig, type FullConfig } from "@/lib/adFunnelConfig";

const CountdownSettings = () => {
  const [config, setConfig] = useState<FullConfig | null>(null);
  const [loading, setLoading] = useState(false);
  const [countdowns, setCountdowns] = useState<Record<number, number>>({});
  const { toast } = useToast();

  useEffect(() => {
    loadAdConfig();
  }, []);

  const loadAdConfig = async () => {
    try {
      const cfg = await loadConfig();
      setConfig(cfg);
      const cd: Record<number, number> = {};
      cfg.pages.forEach(page => {
        cd[page.id] = page.countdown;
      });
      setCountdowns(cd);
    } catch (error) {
      console.error("Failed to load config:", error);
      toast({
        title: "Error",
        description: "Failed to load countdown settings",
        variant: "destructive",
      });
    }
  };

  const handleSave = async () => {
    if (!config) return;

    setLoading(true);
    try {
      const newConfig = { ...config };
      newConfig.pages.forEach(page => {
        page.countdown = countdowns[page.id] || 5;
      });
      await saveConfig(newConfig);
      // Reload config to ensure we have the latest from DB
      await loadAdConfig();
      toast({
        title: "Success",
        description: "Countdown settings saved",
      });
    } catch (error) {
      console.error("Failed to save config:", error);
      toast({
        title: "Error",
        description: "Failed to save countdown settings",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCountdownChange = (pageId: number, value: number) => {
    setCountdowns(prev => ({
      ...prev,
      [pageId]: Math.max(1, Math.min(60, value)) // Min 1s, max 60s
    }));
  };

  if (!config) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Countdown Settings</h2>
        <Button onClick={handleSave} disabled={loading}>
          {loading ? "Saving..." : "Save Changes"}
        </Button>
      </div>

      <Card className="p-6">
        <div className="space-y-4">
          {[1, 2, 3, 4].map(pageId => (
            <div key={pageId} className="flex items-center gap-4">
              <Label htmlFor={`countdown-${pageId}`} className="w-32">
                Page {pageId} Countdown:
              </Label>
              <Input
                id={`countdown-${pageId}`}
                type="number"
                min="1"
                max="60"
                value={countdowns[pageId] || 5}
                onChange={(e) => handleCountdownChange(pageId, parseInt(e.target.value) || 5)}
                className="w-20"
              />
              <span className="text-sm text-muted-foreground">seconds</span>
            </div>
          ))}
        </div>
        <p className="text-sm text-muted-foreground mt-4">
          Set the countdown duration for each ad page. Users must wait this long before proceeding to the next step.
        </p>
      </Card>
    </div>
  );
};

export default CountdownSettings;
