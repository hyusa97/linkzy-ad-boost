import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { z } from "zod";

const urlSchema = z.object({
  url: z.string().url("Please enter a valid URL").max(2048, "URL too long"),
});

interface CreateLinkFormProps {
  userId: string;
}

const CreateLinkForm = ({ userId }: CreateLinkFormProps) => {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const generateShortCode = () => Math.random().toString(36).substring(2, 8);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate URL
    try {
      urlSchema.parse({ url });
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast({
          title: "Invalid URL",
          description: error.errors[0].message,
          variant: "destructive",
        });
      }
      return;
    }

    setLoading(true);

    try {
      const shortCode = generateShortCode();

      // ✅ Normalize URL (auto-add https:// if missing)
      const normalizedUrl = url.startsWith("http") ? url : `https://${url}`;

      // ✅ Insert short link record
      const { error } = await supabase.from("links").insert({
        owner_id: userId,
        original_url: normalizedUrl,
        short_code: shortCode,
      });

      if (error) throw error;

      toast({
        title: "Link Created!",
        description: `Your short link: ${window.location.origin}/s/${shortCode}`,
      });

      // Reset input
      setUrl("");
      window.location.reload(); // Optional: refresh dashboard to show new link
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create link",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="url">Original URL</Label>
        <Input
          id="url"
          type="url"
          placeholder="https://example.com/your-long-url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          required
          maxLength={2048}
        />
      </div>
      <Button type="submit" disabled={loading}>
        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Create Short Link
      </Button>
    </form>
  );
};

export default CreateLinkForm;
