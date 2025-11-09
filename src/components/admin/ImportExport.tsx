import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { loadConfig, saveConfig, type FullConfig } from "@/lib/adFunnelConfig";

const ImportExport = () => {
  const [exportData, setExportData] = useState("");
  const [importData, setImportData] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleExport = async () => {
    try {
      const config = await loadConfig();
      const dataStr = JSON.stringify(config, null, 2);
      setExportData(dataStr);

      // Copy to clipboard
      navigator.clipboard.writeText(dataStr);
      toast({
        title: "Success",
        description: "Configuration exported and copied to clipboard",
      });
    } catch (error) {
      console.error("Export failed:", error);
      toast({
        title: "Error",
        description: "Failed to export configuration",
        variant: "destructive",
      });
    }
  };

  const handleImport = async () => {
    if (!importData.trim()) {
      toast({
        title: "Error",
        description: "Please enter configuration data to import",
        variant: "destructive",
      });
      return;
    }

    try {
      const parsed = JSON.parse(importData);

      // Basic validation
      if (!parsed.pages || !Array.isArray(parsed.pages) || parsed.pages.length !== 4) {
        throw new Error("Invalid configuration: pages must be array of length 4");
      }

      if (!parsed.analytics) {
        throw new Error("Invalid configuration: analytics section missing");
      }

      setLoading(true);
      await saveConfig(parsed as FullConfig);

      toast({
        title: "Success",
        description: "Configuration imported successfully",
      });

      setImportData("");
    } catch (error) {
      console.error("Import failed:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to import configuration",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Import/Export Configuration</h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="text-lg font-medium mb-4">Export Configuration</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Export the current ad funnel configuration as JSON. This will copy it to your clipboard.
          </p>
          <Button onClick={handleExport} className="w-full">
            Export & Copy to Clipboard
          </Button>
          {exportData && (
            <div className="mt-4">
              <Textarea
                value={exportData}
                readOnly
                rows={10}
                className="font-mono text-xs"
              />
            </div>
          )}
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-medium mb-4">Import Configuration</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Paste a valid JSON configuration to import. This will replace the current configuration.
          </p>
          <Textarea
            value={importData}
            onChange={(e) => setImportData(e.target.value)}
            placeholder="Paste JSON configuration here..."
            rows={8}
            className="mb-4 font-mono text-xs"
          />
          <Button onClick={handleImport} disabled={loading} className="w-full">
            {loading ? "Importing..." : "Import Configuration"}
          </Button>
        </Card>
      </div>

      <Card className="p-6">
        <h3 className="text-lg font-medium mb-4">Configuration Format</h3>
        <p className="text-sm text-muted-foreground mb-4">
          The configuration JSON should have the following structure:
        </p>
        <pre className="bg-muted p-4 rounded text-xs overflow-x-auto">
{`{
  "pages": [
    {
      "id": 1,
      "countdown": 5,
      "ads": [
        {
          "id": "ad_123",
          "title": "Ad Title",
          "img": "https://example.com/image.jpg",
          "link": "https://example.com",
          "order": 0
        }
      ]
    },
    // ... pages 2-4
  ],
  "analytics": {
    "pageVisits": { "1": 0, "2": 0, "3": 0, "4": 0 },
    "adClicks": {},
    "totalDownloads": 0
  }
}`}
        </pre>
      </Card>
    </div>
  );
};

export default ImportExport;
