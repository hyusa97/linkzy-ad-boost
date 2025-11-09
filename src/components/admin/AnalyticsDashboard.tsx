import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

const AnalyticsDashboard = () => {
  const [analytics, setAnalytics] = useState({
    pageVisits: {} as Record<number, number>,
    adClicks: {} as Record<string, number>,
    totalDownloads: 0,
  });
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      setLoading(true);

      // Get page visits
      const { data: visitsData, error: visitsError } = await supabase.rpc("get_page_visits");
      if (visitsError) throw visitsError;

      // Get ad clicks
      const { data: clicksData, error: clicksError } = await supabase.rpc("get_ad_clicks");
      if (clicksError) throw clicksError;

      // Get total downloads
      const { data: downloadsData, error: downloadsError } = await supabase.rpc("get_total_downloads");
      if (downloadsError) throw downloadsError;

      setAnalytics({
        pageVisits: visitsData || {},
        adClicks: clicksData || {},
        totalDownloads: downloadsData || 0,
      });
    } catch (error) {
      console.error("Failed to load analytics:", error);
      toast({
        title: "Error",
        description: "Failed to load analytics data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div>Loading analytics...</div>;
  }

  const pageVisitsData = Object.entries(analytics.pageVisits).map(([page, count]) => ({
    page: `Page ${page}`,
    visits: count,
  }));

  const adClicksData = Object.entries(analytics.adClicks).map(([adId, count]) => ({
    name: adId,
    value: count,
  }));

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Analytics Dashboard</h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6">
          <h3 className="text-lg font-medium mb-2">Total Downloads</h3>
          <div className="text-3xl font-bold text-primary">{analytics.totalDownloads}</div>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-medium mb-2">Total Page Visits</h3>
          <div className="text-3xl font-bold text-primary">
            {Object.values(analytics.pageVisits).reduce((sum, count) => sum + count, 0)}
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-medium mb-2">Total Ad Clicks</h3>
          <div className="text-3xl font-bold text-primary">
            {Object.values(analytics.adClicks).reduce((sum, count) => sum + count, 0)}
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="text-lg font-medium mb-4">Page Visits</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={pageVisitsData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="page" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="visits" fill="#8884d8" />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-medium mb-4">Ad Clicks</h3>
          {adClicksData.length === 0 ? (
            <div className="flex items-center justify-center h-[300px] text-muted-foreground">
              No ad clicks recorded yet
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={adClicksData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {adClicksData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          )}
        </Card>
      </div>

      <Card className="p-6">
        <h3 className="text-lg font-medium mb-4">Detailed Ad Clicks</h3>
        {Object.keys(analytics.adClicks).length === 0 ? (
          <p className="text-muted-foreground">No ad clicks recorded yet</p>
        ) : (
          <div className="space-y-2">
            {Object.entries(analytics.adClicks).map(([adId, count]) => (
              <div key={adId} className="flex justify-between">
                <span>{adId}</span>
                <span className="font-medium">{count} clicks</span>
              </div>
            ))}
          </div>
        )}
      </Card>

      <div className="flex justify-end">
        <button
          onClick={loadAnalytics}
          className="px-4 py-2 bg-primary text-white rounded hover:bg-primary/90"
        >
          Refresh Data
        </button>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
