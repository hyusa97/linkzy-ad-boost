import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { Pencil, Trash2, Plus, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

type Ad = {
  id: string;
  title: string;
  description: string | null;
  url: string;
  image_url: string;
  page_number: number;
  created_at: string;
};

export default function AdManagement() {
  const [ads, setAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAd, setEditingAd] = useState<Ad | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    url: "",
    page_number: 1,
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchAds();
  }, []);

  const fetchAds = async () => {
    try {
      const { data, error } = await supabase
        .from("ads")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setAds(data || []);
    } catch (error) {
      console.error("Error fetching ads:", error);
      toast({ title: "Error loading ads", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        toast({ title: "Please select an image file", variant: "destructive" });
        return;
      }
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const uploadImage = async (file: File): Promise<string> => {
    const fileExt = file.name.split(".").pop();
    const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = `${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from("ad-images")
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from("ad-images")
      .getPublicUrl(filePath);

    return publicUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploading(true);

    try {
      let imageUrl = editingAd?.image_url || "";

      if (imageFile) {
        imageUrl = await uploadImage(imageFile);
      } else if (!editingAd) {
        toast({ title: "Please select an image", variant: "destructive" });
        setUploading(false);
        return;
      }

      const adData = {
        title: formData.title,
        description: formData.description || null,
        url: formData.url,
        image_url: imageUrl,
        page_number: formData.page_number,
      };

      if (editingAd) {
        const { error } = await supabase
          .from("ads")
          .update(adData)
          .eq("id", editingAd.id);

        if (error) throw error;
        toast({ title: "Ad updated successfully" });
      } else {
        const { error } = await supabase.from("ads").insert([adData]);

        if (error) throw error;
        toast({ title: "Ad created successfully" });
      }

      resetForm();
      fetchAds();
      setDialogOpen(false);
    } catch (error) {
      console.error("Error saving ad:", error);
      toast({ title: "Error saving ad", variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const handleEdit = (ad: Ad) => {
    setEditingAd(ad);
    setFormData({
      title: ad.title,
      description: ad.description || "",
      url: ad.url,
      page_number: ad.page_number,
    });
    setImagePreview(ad.image_url);
    setDialogOpen(true);
  };

  const handleDelete = async (ad: Ad) => {
    if (!confirm("Are you sure you want to delete this ad?")) return;

    try {
      const { error } = await supabase.from("ads").delete().eq("id", ad.id);

      if (error) throw error;

      // Try to delete the image from storage
      if (ad.image_url) {
        const fileName = ad.image_url.split("/").pop();
        if (fileName) {
          await supabase.storage.from("ad-images").remove([fileName]);
        }
      }

      toast({ title: "Ad deleted successfully" });
      fetchAds();
    } catch (error) {
      console.error("Error deleting ad:", error);
      toast({ title: "Error deleting ad", variant: "destructive" });
    }
  };

  const resetForm = () => {
    setFormData({ title: "", description: "", url: "", page_number: 1 });
    setImageFile(null);
    setImagePreview("");
    setEditingAd(null);
  };

  const handleDialogClose = (open: boolean) => {
    if (!open) {
      resetForm();
    }
    setDialogOpen(open);
  };

  if (loading) {
    return <div className="text-center py-4">Loading ads...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Manage Ads</h3>
        <Dialog open={dialogOpen} onOpenChange={handleDialogClose}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add New Ad
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingAd ? "Edit Ad" : "Create New Ad"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="title">Ad Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  required
                  placeholder="Enter ad title"
                />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="Enter ad description (optional)"
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="url">Target URL *</Label>
                <Input
                  id="url"
                  type="url"
                  value={formData.url}
                  onChange={(e) =>
                    setFormData({ ...formData, url: e.target.value })
                  }
                  required
                  placeholder="https://example.com"
                />
              </div>

              <div>
                <Label htmlFor="page_number">Display on Funnel Page *</Label>
                <select
                  id="page_number"
                  value={formData.page_number}
                  onChange={(e) =>
                    setFormData({ ...formData, page_number: parseInt(e.target.value) })
                  }
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  required
                >
                  <option value={1}>Page 1</option>
                  <option value={2}>Page 2</option>
                  <option value={3}>Page 3</option>
                  <option value={4}>Page 4</option>
                </select>
                <p className="text-xs text-muted-foreground mt-1">
                  Select which funnel page (1-4) this ad should appear on
                </p>
              </div>

              <div>
                <Label htmlFor="image">
                  Ad Image * (JPG or PNG)
                </Label>
                <Input
                  id="image"
                  type="file"
                  accept="image/jpeg,image/png,image/jpg"
                  onChange={handleImageChange}
                  required={!editingAd}
                />
                {imagePreview && (
                  <div className="mt-2 relative">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="w-full h-48 object-cover rounded"
                    />
                    {imageFile && (
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute top-2 right-2"
                        onClick={() => {
                          setImageFile(null);
                          setImagePreview(editingAd?.image_url || "");
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleDialogClose(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={uploading}>
                  {uploading
                    ? "Saving..."
                    : editingAd
                    ? "Update Ad"
                    : "Create Ad"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {ads.length === 0 ? (
        <Card className="p-8 text-center text-muted-foreground">
          No ads yet. Click "Add New Ad" to create your first ad.
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {ads.map((ad) => (
            <Card key={ad.id} className="overflow-hidden">
              <img
                src={ad.image_url}
                alt={ad.title}
                className="w-full h-48 object-cover"
              />
              <div className="p-4 space-y-2">
                <h4 className="font-semibold truncate">{ad.title}</h4>
                {ad.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {ad.description}
                  </p>
                )}
                <p className="text-xs text-muted-foreground truncate">
                  URL: {ad.url}
                </p>
                <p className="text-xs text-muted-foreground">
                  Displays on: <span className="font-semibold">Page {ad.page_number}</span>
                </p>
                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(ad)}
                    className="flex-1"
                  >
                    <Pencil className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDelete(ad)}
                    className="flex-1"
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Delete
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
