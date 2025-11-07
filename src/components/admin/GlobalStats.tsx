import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Users, Link2, DollarSign, TrendingUp } from "lucide-react";

const GlobalStats = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalLinks: 0,
    totalEarnings: 0,
    totalClicks: 0,
  });

  useEffect(() => {
    loadGlobalStats();
  }, []);

  const loadGlobalStats = async () => {
    try {
      // Get total users
      const { count: userCount } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true });

      // Get total links and aggregated stats
      const { data: links } = await supabase
        .from("links")
        .select("clicks, earnings");

      const linkStats = links?.reduce(
        (acc, link) => ({
          totalClicks: acc.totalClicks + link.clicks,
          totalEarnings: acc.totalEarnings + parseFloat(link.earnings.toString()),
        }),
        { totalClicks: 0, totalEarnings: 0 }
      ) || { totalClicks: 0, totalEarnings: 0 };

      setStats({
        totalUsers: userCount || 0,
        totalLinks: links?.length || 0,
        totalEarnings: linkStats.totalEarnings,
        totalClicks: linkStats.totalClicks,
      });
    } catch (error) {
      console.error("Error loading global stats:", error);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Total Users</p>
            <p className="text-2xl font-bold">{stats.totalUsers}</p>
          </div>
          <div className="bg-primary/10 p-3 rounded-lg">
            <Users className="h-6 w-6 text-primary" />
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Total Links</p>
            <p className="text-2xl font-bold">{stats.totalLinks}</p>
          </div>
          <div className="bg-secondary/10 p-3 rounded-lg">
            <Link2 className="h-6 w-6 text-secondary" />
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Total Clicks</p>
            <p className="text-2xl font-bold">{stats.totalClicks}</p>
          </div>
          <div className="bg-accent/10 p-3 rounded-lg">
            <TrendingUp className="h-6 w-6 text-accent" />
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Platform Earnings</p>
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

export default GlobalStats;
