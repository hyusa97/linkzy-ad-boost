import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

const ConfigSettings = () => {
  const [cpmRate, setCpmRate] = useState("");
  const [cpcRate, setCpcRate] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      const { data: cpmData } = await supabase
        .from("config")
        .select("value")
        .eq("key", "cpm_rate")
        .single();

      const { data: cpcData } = await supabase
        .from("config")
        .select("value")
        .eq("key", "cpc_rate")
        .single();

      if (cpmData) setCpmRate(cpmData.value.toString());
      if (cpcData) setCpcRate(cpcData.value.toString());
    } catch (error) {
      console.error("Error loading config:", error);
    }
  };

  const handleSave = async () => {
    setLoading(true);

    try {
      await supabase
        .from("config")
        .update({ value: parseFloat(cpmRate) })
        .eq("key", "cpm_rate");

      await supabase
        .from("config")
        .update({ value: parseFloat(cpcRate) })
        .eq("key", "cpc_rate");

      toast({
        title: "Settings Saved",
        description: "CPM and CPC rates have been updated",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4 max-w-md">
      <div className="space-y-2">
        <Label htmlFor="cpm">CPM Rate ($)</Label>
        <Input
          id="cpm"
          type="number"
          step="0.01"
          value={cpmRate}
          onChange={(e) => setCpmRate(e.target.value)}
          placeholder="2.00"
        />
        <p className="text-sm text-muted-foreground">
          Cost per thousand impressions
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="cpc">CPC Rate ($)</Label>
        <Input
          id="cpc"
          type="number"
          step="0.01"
          value={cpcRate}
          onChange={(e) => setCpcRate(e.target.value)}
          placeholder="0.50"
        />
        <p className="text-sm text-muted-foreground">Cost per click</p>
      </div>

      <Button onClick={handleSave} disabled={loading}>
        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Save Settings
      </Button>
    </div>
  );
};

export default ConfigSettings;
