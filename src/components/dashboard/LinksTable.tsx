import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Copy, ExternalLink, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Link {
  id: string;
  original_url: string;
  short_code: string;
  created_at: string;
  impressions: number;
  clicks: number;
  earnings: number;
}

interface LinksTableProps {
  userId: string;
}

const LinksTable = ({ userId }: LinksTableProps) => {
  const [links, setLinks] = useState<Link[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadLinks();
  }, [userId]);

  const loadLinks = async () => {
    try {
      const { data, error } = await supabase
        .from("links")
        .select("*")
        .eq("owner_id", userId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setLinks(data || []);
    } catch (error) {
      console.error("Error loading links:", error);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (shortCode: string) => {
    const shortUrl = `${window.location.origin}/s/${shortCode}`;
    navigator.clipboard.writeText(shortUrl);
    toast({
      title: "Copied!",
      description: "Short link copied to clipboard",
    });
  };

  const deleteLink = async (id: string) => {
    try {
      const { error } = await supabase
        .from("links")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Link Deleted",
        description: "Link has been removed successfully",
      });

      loadLinks();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return <div>Loading links...</div>;
  }

  if (links.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No links yet. Create your first short link above!
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Short Link</TableHead>
            <TableHead>Original URL</TableHead>
            <TableHead className="text-right">Clicks</TableHead>
            <TableHead className="text-right">Impressions</TableHead>
            <TableHead className="text-right">Earnings</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {links.map((link) => (
            <TableRow key={link.id}>
              <TableCell className="font-mono text-sm">
                /s/{link.short_code}
              </TableCell>
              <TableCell className="max-w-xs truncate">
                <a
                  href={link.original_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline flex items-center gap-1"
                >
                  {link.original_url}
                  <ExternalLink className="h-3 w-3" />
                </a>
              </TableCell>
              <TableCell className="text-right">{link.clicks}</TableCell>
              <TableCell className="text-right">{link.impressions}</TableCell>
              <TableCell className="text-right font-semibold">
                ${link.earnings.toFixed(2)}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex gap-2 justify-end">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => copyToClipboard(link.short_code)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => deleteLink(link.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default LinksTable;
