"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Save } from "lucide-react";

interface FooterSettings {
  showHours: boolean;
  hoursText: string;
  showEmail: boolean;
  email: string;
}

export default function SettingsManagementClient() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [settings, setSettings] = useState<FooterSettings>({
    showHours: true,
    hoursText: "Mon-Fri 7am-7pm",
    showEmail: true,
    email: "hello@artisan-roast.com",
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await fetch("/api/admin/settings/footer-contact");
      if (!response.ok) throw new Error("Failed to fetch settings");
      
      const data = await response.json();
      setSettings(data);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load settings",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const response = await fetch("/api/admin/settings/footer-contact", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });

      if (!response.ok) throw new Error("Failed to save settings");

      toast({
        title: "Success",
        description: "Settings saved successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save settings",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Footer Contact Information</CardTitle>
          <CardDescription>
            Manage the shop hours and email address displayed in the footer
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Shop Hours */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="show-hours">Display Shop Hours</Label>
                <p className="text-sm text-muted-foreground">
                  Show business hours in the footer
                </p>
              </div>
              <Switch
                id="show-hours"
                checked={settings.showHours}
                onCheckedChange={(checked) =>
                  setSettings({ ...settings, showHours: checked })
                }
              />
            </div>

            {settings.showHours && (
              <div className="space-y-2">
                <Label htmlFor="hours-text">Hours Text</Label>
                <Input
                  id="hours-text"
                  value={settings.hoursText}
                  onChange={(e) =>
                    setSettings({ ...settings, hoursText: e.target.value })
                  }
                  placeholder="e.g., Mon-Fri 7am-7pm"
                />
              </div>
            )}
          </div>

          <div className="border-t pt-6" />

          {/* Email Address */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="show-email">Display Email Address</Label>
                <p className="text-sm text-muted-foreground">
                  Show contact email in the footer
                </p>
              </div>
              <Switch
                id="show-email"
                checked={settings.showEmail}
                onCheckedChange={(checked) =>
                  setSettings({ ...settings, showEmail: checked })
                }
              />
            </div>

            {settings.showEmail && (
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={settings.email}
                  onChange={(e) =>
                    setSettings({ ...settings, email: e.target.value })
                  }
                  placeholder="e.g., hello@artisan-roast.com"
                />
              </div>
            )}
          </div>

          <div className="flex justify-end pt-4">
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
