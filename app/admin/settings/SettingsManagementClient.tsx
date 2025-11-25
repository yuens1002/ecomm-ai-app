"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Save, Trash2, Mail } from "lucide-react";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldTitle,
} from "@/components/ui/field";
import SocialLinksSettings from "./SocialLinksSettings";

interface FooterSettings {
  showHours: boolean;
  hoursText: string;
  showEmail: boolean;
  email: string;
}

interface EmailSettings {
  contactEmail: string;
}

type FieldName =
  | "showHours"
  | "hoursText"
  | "showEmail"
  | "email"
  | "contactEmail";

export default function SettingsManagementClient() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [savingFields, setSavingFields] = useState<Record<FieldName, boolean>>({
    showHours: false,
    hoursText: false,
    showEmail: false,
    email: false,
    contactEmail: false,
  });
  const [settings, setSettings] = useState<FooterSettings>({
    showHours: true,
    hoursText: "Mon-Fri 7am-7pm",
    showEmail: true,
    email: "hello@artisan-roast.com",
  });
  const [originalSettings, setOriginalSettings] = useState<FooterSettings>({
    showHours: true,
    hoursText: "Mon-Fri 7am-7pm",
    showEmail: true,
    email: "hello@artisan-roast.com",
  });
  const [emailSettings, setEmailSettings] = useState<EmailSettings>({
    contactEmail: "onboarding@resend.dev",
  });
  const [originalEmailSettings, setOriginalEmailSettings] =
    useState<EmailSettings>({
      contactEmail: "onboarding@resend.dev",
    });

  const fetchSettings = useCallback(async () => {
    try {
      const [footerResponse, emailResponse] = await Promise.all([
        fetch("/api/admin/settings/footer-contact"),
        fetch("/api/admin/settings/email"),
      ]);

      if (!footerResponse.ok || !emailResponse.ok) {
        throw new Error("Failed to fetch settings");
      }

      const footerData = await footerResponse.json();
      const emailData = await emailResponse.json();

      setSettings(footerData);
      setOriginalSettings(footerData);
      setEmailSettings(emailData);
      setOriginalEmailSettings(emailData);
    } catch {
      toast({
        title: "Error",
        description: "Failed to load settings",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const handleSaveField = async (field: FieldName) => {
    setSavingFields({ ...savingFields, [field]: true });
    try {
      if (field === "contactEmail") {
        const response = await fetch("/api/admin/settings/email", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(emailSettings),
        });

        if (!response.ok) throw new Error("Failed to save email settings");

        toast({
          title: "Success",
          description: "Email settings saved successfully",
        });

        setOriginalEmailSettings(emailSettings);
      } else {
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

        setOriginalSettings(settings);
      }
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to save settings",
        variant: "destructive",
      });
    } finally {
      setSavingFields({ ...savingFields, [field]: false });
    }
  };

  const isFieldDirty = (field: FieldName) => {
    if (field === "contactEmail") {
      return emailSettings[field] !== originalEmailSettings[field];
    }
    return settings[field] !== originalSettings[field];
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
      {/* Social Links */}
      <SocialLinksSettings />

      {/* Email Configuration */}
      <Card>
        <CardHeader className="pb-8">
          <Field orientation="vertical">
            <FieldContent>
              <FieldTitle className="text-base font-semibold flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Email Configuration
              </FieldTitle>
              <FieldDescription>
                Configure the email address used for all system communications
                (newsletter, orders, contact form)
              </FieldDescription>
            </FieldContent>
          </Field>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="contact-email">Contact Email</Label>
            <div className="flex items-center gap-2">
              <Input
                id="contact-email"
                type="email"
                value={emailSettings.contactEmail}
                onChange={(e) =>
                  setEmailSettings({
                    ...emailSettings,
                    contactEmail: e.target.value,
                  })
                }
                placeholder="e.g., onboarding@resend.dev"
                className={
                  isFieldDirty("contactEmail") ? "border-amber-500" : ""
                }
              />
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleSaveField("contactEmail")}
                disabled={
                  !isFieldDirty("contactEmail") || savingFields["contactEmail"]
                }
                className="shrink-0"
              >
                {savingFields["contactEmail"] ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="ml-2">Saving</span>
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    <span className="ml-2">Save</span>
                  </>
                )}
              </Button>
            </div>
            {isFieldDirty("contactEmail") && (
              <p className="text-sm text-amber-600 dark:text-amber-500 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                Unsaved changes
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              This email will be used as the sender address for welcome emails,
              order confirmations, and contact form submissions.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Footer Contact Info */}
      <Card>
        <CardHeader className="pb-8">
          <Field orientation="vertical">
            <FieldContent>
              <FieldTitle className="text-base font-semibold">
                Footer Contact Information
              </FieldTitle>
              <FieldDescription>
                Manage the shop hours and email address displayed in the footer
              </FieldDescription>
            </FieldContent>
          </Field>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Shop Hours */}
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-12">
              <div className="flex items-center gap-12">
                <div className="space-y-0.5">
                  <Label htmlFor="show-hours">Display Shop Hours</Label>
                  <p className="text-sm text-muted-foreground">
                    Show business hours in the footer
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Label
                    htmlFor="show-hours"
                    className="text-xs text-muted-foreground w-14"
                  >
                    {settings.showHours ? "Active" : "Inactive"}
                  </Label>
                  <Switch
                    id="show-hours"
                    checked={settings.showHours}
                    onCheckedChange={(checked) =>
                      setSettings({ ...settings, showHours: checked })
                    }
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={() => {
                      setSettings({
                        ...settings,
                        showHours: false,
                        hoursText: "",
                      });
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              {isFieldDirty("showHours") && (
                <span className="text-sm text-amber-600 dark:text-amber-500 flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                  Unsaved changes
                </span>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="hours-text">Hours Text</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="hours-text"
                  value={settings.hoursText}
                  onChange={(e) =>
                    setSettings({ ...settings, hoursText: e.target.value })
                  }
                  placeholder="e.g., Mon-Fri 7am-7pm"
                  className={
                    isFieldDirty("hoursText") ? "border-amber-500" : ""
                  }
                />
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleSaveField("hoursText")}
                  disabled={
                    !isFieldDirty("hoursText") || savingFields["hoursText"]
                  }
                  className="shrink-0"
                >
                  {savingFields["hoursText"] ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="ml-2">Saving</span>
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      <span className="ml-2">Save</span>
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>

          <div className="border-t pt-6 mt-12" />

          {/* Email Address */}
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-12">
              <div className="flex items-center gap-12">
                <div className="space-y-0.5">
                  <Label htmlFor="show-email">Display Email Address</Label>
                  <p className="text-sm text-muted-foreground">
                    Show contact email in the footer
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Label
                    htmlFor="show-email"
                    className="text-xs text-muted-foreground w-14"
                  >
                    {settings.showEmail ? "Active" : "Inactive"}
                  </Label>
                  <Switch
                    id="show-email"
                    checked={settings.showEmail}
                    onCheckedChange={(checked) =>
                      setSettings({ ...settings, showEmail: checked })
                    }
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={() => {
                      setSettings({ ...settings, showEmail: false, email: "" });
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              {isFieldDirty("showEmail") && (
                <span className="text-sm text-amber-600 dark:text-amber-500 flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                  Unsaved changes
                </span>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="email"
                  type="email"
                  value={settings.email}
                  onChange={(e) =>
                    setSettings({ ...settings, email: e.target.value })
                  }
                  placeholder="e.g., hello@artisan-roast.com"
                  className={isFieldDirty("email") ? "border-amber-500" : ""}
                />
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleSaveField("email")}
                  disabled={!isFieldDirty("email") || savingFields["email"]}
                  className="shrink-0"
                >
                  {savingFields["email"] ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="ml-2">Saving</span>
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      <span className="ml-2">Save</span>
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
