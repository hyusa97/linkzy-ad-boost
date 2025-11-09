import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { Plus, Edit, Trash2, ArrowUp, ArrowDown } from "lucide-react";
import { loadConfig, saveConfig, type FullConfig, type Ad } from "@/lib/adFunnelConfig";

const AdManagement = () => {
  const [config, setConfig] = useState<FullConfig | null>(null);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAd, setEditingAd] = useState<Ad | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    img: "",
    link: "",
    assignedPage: 1,
    order: 0,
  });
  const { toast } = useToast();

  useEffect(() => {
    loadAdConfig();
  }, []);

  const loadAdConfig = async () => {
    try {
      const cfg = await loadConfig();
      setConfig(cfg);
    } catch (error) {
      console.error("Failed to load config:", error);
      toast({
        title: "Error",
        description: "Failed to load ad configuration",
        variant: "destructive",
      });
    }
  };

  const handleSave = async () => {
    if (!config) return;

    setLoading(true);
    try {
      await saveConfig(config);
      toast({
        title: "Success",
        description: "Ad configuration saved",
      });
    } catch (error) {
      console.error("Failed to save config:", error);
      toast({
        title: "Error",
        description: "Failed to save ad configuration",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddAd = () => {
    setEditingAd(null);
    setFormData({
      title: "",
      img: "",
      link: "",
      assignedPage: 1,
      order: 0,
    });
    setDialogOpen(true);
  };

  const handleEditAd = (ad: Ad, pageId: number) => {
    setEditingAd(ad);
    setFormData({
      title: ad.title,
      img: ad.img,
      link: ad.link,
      assignedPage: pageId,
      order: ad.order,
    });
    setDialogOpen(true);
  };

  const handleDeleteAd = async (adId: string) => {
    if (!config) return;

    const newConfig = { ...config };
    for (const page of newConfig.pages) {
      page.ads = page.ads.filter(ad => ad.id !== adId);
    }
    setConfig(newConfig);
    await handleSave();
  };

  const handleReorderAd = (pageId: number, adId: string, direction: 'up' | 'down') => {
    if (!config) return;

    const newConfig = { ...config };
    const page = newConfig.pages.find(p => p.id === pageId);
    if (!page) return;

    const adIndex = page.ads.findIndex(ad => ad.id === adId);
    if (adIndex === -1) return;

    if (direction === 'up' && adIndex > 0) {
      [page.ads[adIndex - 1], page.ads[adIndex]] = [page.ads[adIndex], page.ads[adIndex - 1]];
    } else if (direction === 'down' && adIndex < page.ads.length - 1) {
      [page.ads[adIndex], page.ads[adIndex + 1]] = [page.ads[adIndex + 1], page.ads[adIndex]];
    }

    setConfig(newConfig);
  };

  const handleSubmitAd = () => {
    if (!config) return;

    // Validate URLs
    try {
      new URL(formData.link);
      new URL(formData.img);
    } catch (e) {
      toast({
        title: "Error",
        description: "Invalid URL format",
        variant: "destructive",
      });
      return;
    }

    const newConfig = { ...config };
    const page = newConfig.pages.find(p => p.id === formData.assignedPage);
    if (!page) return;

    if (editingAd) {
      // Update existing
      const adIndex = page.ads.findIndex(ad => ad.id === editingAd.id);
      if (adIndex !== -1) {
        page.ads[adIndex] = {
          ...editingAd,
          title: formData.title,
          img: formData.img,
          link: formData.link,
          order: formData.order,
        };
      }
    } else {
      // Add new
      const newAd: Ad = {
        id: `ad_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        title: formData.title,
        img: formData.img,
        link: formData.link,
        order: formData.order,
      };
      page.ads.push(newAd);
    }

    setConfig(newConfig);
    setDialogOpen(false);
    handleSave();
  };

  if (!config) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Ad Management</h2>
        <div className="flex gap-2">
          <Button onClick={handleAddAd}>
            <Plus className="w-4 h-4 mr-2" />
            Add Ad
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            {loading ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>

      <Tabs defaultValue="page1">
        <TabsList>
          {[1, 2, 3, 4].map(pageId => (
            <TabsTrigger key={pageId} value={`page${pageId}`}>
              Page {pageId}
            </TabsTrigger>
          ))}
        </TabsList>

        {[1, 2, 3, 4].map(pageId => {
          const page = config.pages.find(p => p.id === pageId);
          if (!page) return null;

          return (
            <TabsContent key={pageId} value={`page${pageId}`}>
              <Card className="p-6">
                <h3 className="text-lg font-medium mb-4">Page {pageId} Ads</h3>
                {page.ads.length === 0 ? (
                  <p className="text-muted-foreground">No ads for this page</p>
                ) : (
                  <div className="space-y-4">
                    {page.ads.map((ad, index) => (
                      <div key={ad.id} className="flex items-center gap-4 p-4 border rounded">
                        <img src={ad.img} alt={ad.title} className="w-16 h-16 object-cover rounded" />
                        <div className="flex-1">
                          <h4 className="font-medium">{ad.title}</h4>
                          <p className="text-sm text-muted-foreground">{ad.link}</p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleReorderAd(pageId, ad.id, 'up')}
                            disabled={index === 0}
                          >
                            <ArrowUp className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleReorderAd(pageId, ad.id, 'down')}
                            disabled={index === page.ads.length - 1}
                          >
                            <ArrowDown className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditAd(ad, pageId)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="outline" size="sm">
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Ad</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete this ad? This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDeleteAd(ad.id)}>
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </TabsContent>
          );
        })}
      </Tabs>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingAd ? "Edit Ad" : "Add New Ad"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Ad title"
              />
            </div>
            <div>
              <Label htmlFor="img">Image URL</Label>
              <Input
                id="img"
                value={formData.img}
                onChange={(e) => setFormData({ ...formData, img: e.target.value })}
                placeholder="https://example.com/image.jpg"
              />
            </div>
            <div>
              <Label htmlFor="link">Link URL</Label>
              <Input
                id="link"
                value={formData.link}
                onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                placeholder="https://example.com"
              />
            </div>
            <div>
              <Label htmlFor="assignedPage">Assigned Page</Label>
              <select
                id="assignedPage"
                value={formData.assignedPage}
                onChange={(e) => setFormData({ ...formData, assignedPage: parseInt(e.target.value) })}
                className="w-full p-2 border rounded"
              >
                {[1, 2, 3, 4].map(id => (
                  <option key={id} value={id}>Page {id}</option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="order">Order</Label>
              <Input
                id="order"
                type="number"
                value={formData.order}
                onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 0 })}
                placeholder="0"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSubmitAd}>
                {editingAd ? "Update" : "Add"} Ad
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdManagement;
