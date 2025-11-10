import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Link2, ArrowLeft } from "lucide-react";
import UsersTable from "@/components/admin/UsersTable";
import GlobalStats from "@/components/admin/GlobalStats";
import ConfigSettings from "@/components/admin/ConfigSettings";
import AdManagement from "@/components/admin/AdManagement";

const Admin = () => {
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    checkAdmin();
  }, []);

  const checkAdmin = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate("/auth");
        return;
      }

      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", session.user.id);

      if (!roles || !roles.some(r => r.role === "admin")) {
        navigate("/dashboard");
        return;
      }

      setIsAdmin(true);
    } catch (error) {
      console.error("Error checking admin:", error);
      navigate("/dashboard");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => navigate("/dashboard")}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
            <div className="flex items-center gap-2">
              <Link2 className="h-6 w-6 text-primary" />
              <span className="text-xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                Admin Panel
              </span>
            </div>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* Global Stats */}
        <GlobalStats />

        {/* Config Settings */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Platform Settings</h2>
          <ConfigSettings />
        </Card>

        {/* Ad Management */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Ad Management</h2>
          <AdManagement />
        </Card>

        {/* Users Management */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">User Management</h2>
          <UsersTable />
        </Card>
      </div>
    </div>
  );
};

export default Admin;
