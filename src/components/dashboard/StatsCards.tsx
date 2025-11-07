import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Link2, MousePointerClick, Eye, DollarSign } from "lucide-react";

interface StatsCardsProps {
  userId: string;
}

const StatsCards = ({ userId }: StatsCardsProps) => {
  const [stats, setStats] = useState({
    totalLinks: 0,
    totalClicks: 0,
    totalImpressions: 0,
    totalEarnings: 0,
  });

  useEffect(() => {
    loadStats();
  }, [userId]);

  const loadStats = async () => {
    try {
      const { data: links } = await supabase
        .from("links")
        .select("clicks, impressions, earnings")
        .eq("owner_id", userId);

      if (links) {
        const stats = links.reduce(
          (acc, link) => ({
            totalLinks: acc.totalLinks + 1,
            totalClicks: acc.totalClicks + link.clicks,
            totalImpressions: acc.totalImpressions + link.impressions,
            totalEarnings: acc.totalEarnings + parseFloat(link.earnings.toString()),
          }),
          { totalLinks: 0, totalClicks: 0, totalImpressions: 0, totalEarnings: 0 }
        );

        setStats(stats);
      }
    } catch (error) {
      console.error("Error loading stats:", error);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Total Links</p>
            <p className="text-2xl font-bold">{stats.totalLinks}</p>
          </div>
          <div className="bg-primary/10 p-3 rounded-lg">
            <Link2 className="h-6 w-6 text-primary" />
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Total Clicks</p>
            <p className="text-2xl font-bold">{stats.totalClicks}</p>
          </div>
          <div className="bg-secondary/10 p-3 rounded-lg">
            <MousePointerClick className="h-6 w-6 text-secondary" />
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Total Impressions</p>
            <p className="text-2xl font-bold">{stats.totalImpressions}</p>
          </div>
          <div className="bg-accent/10 p-3 rounded-lg">
            <Eye className="h-6 w-6 text-accent" />
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Total Earnings</p>
            <p className="text-2xl font-bold">${stats.totalEarnings.toFixed(2)}</p>
          </div>
          <div className="bg-primary/10 p-3 rounded-lg">
            <DollarSign className="h-6 w-6 text-primary" />
          </div>
        </div>
      </Card>
    </div>
  );
};

export default StatsCards;
