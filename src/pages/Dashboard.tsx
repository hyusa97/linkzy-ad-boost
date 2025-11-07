import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Link2, LogOut, BarChart3, DollarSign, MousePointerClick } from "lucide-react";
import CreateLinkForm from "@/components/dashboard/CreateLinkForm";
import LinksTable from "@/components/dashboard/LinksTable";
import StatsCards from "@/components/dashboard/StatsCards";

const Dashboard = () => {
  const [user, setUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate("/auth");
        return;
      }

      setUser(session.user);

      // Check if user is admin
      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", session.user.id);

      if (roles && roles.some(r => r.role === "admin")) {
        setIsAdmin(true);
      }
    } catch (error) {
      console.error("Error checking user:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast({
      title: "Signed Out",
      description: "You have been successfully signed out.",
    });
    navigate("/");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Link2 className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Linkzy
            </span>
          </div>
          <div className="flex gap-3 items-center">
            {isAdmin && (
              <Button variant="outline" onClick={() => navigate("/admin")}>
                Admin Panel
              </Button>
            )}
            <Button variant="ghost" onClick={handleSignOut}>
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* Welcome Section */}
        <div>
          <h1 className="text-3xl font-bold mb-2">Welcome back!</h1>
          <p className="text-muted-foreground">
            Manage your links and track your earnings
          </p>
        </div>

        {/* Stats Cards */}
        <StatsCards userId={user?.id} />

        {/* Create Link Form */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Create New Short Link</h2>
          <CreateLinkForm userId={user?.id} />
        </Card>

        {/* Links Table */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Your Links</h2>
          <LinksTable userId={user?.id} />
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
