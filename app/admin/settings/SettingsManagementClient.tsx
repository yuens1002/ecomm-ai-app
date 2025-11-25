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
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldTitle,
} from "@/components/ui/field";
import SocialLinksSettings from "./SocialLinksSettings";
import { Textarea } from "@/components/ui/textarea";
import { FormHeading } from "@/components/ui/app/FormHeading";

interface FooterSettings {
  showHours: boolean;
  hoursText: string;
  showEmail: boolean;
  email: string;
}

interface EmailSettings {
  contactEmail: string;
  notifyAdminOnNewsletterSignup: boolean;
}

interface NewsletterSettings {
  enabled: boolean;
  heading: string;
  description: string;
}

type FieldName =
  | "showHours"
  | "hoursText"
  | "showEmail"
  | "email"
  | "contactEmail"
  | "notifyAdminOnNewsletterSignup";

export default function SettingsManagementClient() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [savingFields, setSavingFields] = useState<Record<FieldName, boolean>>({
    showHours: false,
    hoursText: false,
    showEmail: false,
    email: false,
    contactEmail: false,
    notifyAdminOnNewsletterSignup: false,
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
    notifyAdminOnNewsletterSignup: false,
  });
  const [originalEmailSettings, setOriginalEmailSettings] =
    useState<EmailSettings>({
      contactEmail: "onboarding@resend.dev",
      notifyAdminOnNewsletterSignup: false,
    });
  const [newsletterSettings, setNewsletterSettings] =
    useState<NewsletterSettings>({
      enabled: true,
      heading: "Stay Connected",
      description:
        "Subscribe to our newsletter for exclusive offers and coffee tips.",
    });
  const [originalNewsletterSettings, setOriginalNewsletterSettings] =
    useState<NewsletterSettings>({
      enabled: true,
      heading: "Stay Connected",
      description:
        "Subscribe to our newsletter for exclusive offers and coffee tips.",
    });
  const [savingNewsletter, setSavingNewsletter] = useState(false);

  const fetchSettings = useCallback(async () => {
    try {
      const [footerResponse, emailResponse, newsletterResponse] =
        await Promise.all([
          fetch("/api/admin/settings/footer-contact"),
          fetch("/api/admin/settings/email"),
          fetch("/api/admin/settings/newsletter"),
        ]);

      if (!footerResponse.ok || !emailResponse.ok || !newsletterResponse.ok) {
        throw new Error("Failed to fetch settings");
      }

      const footerData = await footerResponse.json();
      const emailData = await emailResponse.json();
      const newsletterData = await newsletterResponse.json();

      setSettings(footerData);
      setOriginalSettings(footerData);
      setEmailSettings(emailData);
      setOriginalEmailSettings(emailData);
      setNewsletterSettings(newsletterData);
      setOriginalNewsletterSettings(newsletterData);
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
      if (
        field === "contactEmail" ||
        field === "notifyAdminOnNewsletterSignup"
      ) {
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
    if (field === "contactEmail" || field === "notifyAdminOnNewsletterSignup") {
      return emailSettings[field] !== originalEmailSettings[field];
    }
    return settings[field] !== originalSettings[field];
  };

  const isNewsletterEnabledDirty =
    newsletterSettings.enabled !== originalNewsletterSettings.enabled;
  const isNewsletterHeadingDirty =
    newsletterSettings.heading !== originalNewsletterSettings.heading;
  const isNewsletterDescriptionDirty =
    newsletterSettings.description !== originalNewsletterSettings.description;
  const isNewsletterDirty =
    isNewsletterEnabledDirty ||
    isNewsletterHeadingDirty ||
    isNewsletterDescriptionDirty;

  const handleNewsletterAutoSave = async (
    updates: Partial<NewsletterSettings>
  ) => {
    const newSettings = { ...newsletterSettings, ...updates };
    setNewsletterSettings(newSettings);
    setSavingNewsletter(true);

    try {
      const response = await fetch("/api/admin/settings/newsletter", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newSettings),
      });

      if (!response.ok) throw new Error("Failed to save newsletter settings");

      setOriginalNewsletterSettings(newSettings);
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to save settings",
        variant: "destructive",
      });
      // Revert on error
      setNewsletterSettings(newsletterSettings);
    } finally {
      setSavingNewsletter(false);
    }
  };

  const handleSaveNewsletterSettings = async () => {
    setSavingNewsletter(true);
    try {
      const response = await fetch("/api/admin/settings/newsletter", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newsletterSettings),
      });

      if (!response.ok) throw new Error("Failed to save newsletter settings");

      toast({
        title: "Success",
        description: "Newsletter settings saved",
      });

      setOriginalNewsletterSettings(newsletterSettings);
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to save settings",
        variant: "destructive",
      });
    } finally {
      setSavingNewsletter(false);
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
          <FieldGroup>
            <Field>
              <FormHeading
                htmlFor="contact-email"
                label="Contact Email"
                isDirty={isFieldDirty("contactEmail")}
              />
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
                  placeholder={originalEmailSettings.contactEmail}
                  className={
                    isFieldDirty("contactEmail") ? "border-amber-500" : ""
                  }
                />
                <Button
                  size="sm"
                  onClick={() => handleSaveField("contactEmail")}
                  disabled={savingFields["contactEmail"]}
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
              <FieldDescription>
                This email will be used as the sender address for welcome
                emails, order confirmations, and contact form submissions.
              </FieldDescription>
            </Field>
          </FieldGroup>

          <div className="border-t pt-6 mt-6" />

          {/* Newsletter Admin Notifications */}
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-4">
              <div className="space-y-0.5">
                <Label htmlFor="notify-admin">Newsletter Notifications</Label>
                <p className="text-sm text-muted-foreground">
                  Send email notification to admin when someone subscribes to
                  the newsletter
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Label
                  htmlFor="notify-admin"
                  className="text-xs text-muted-foreground w-14 text-right"
                >
                  {emailSettings.notifyAdminOnNewsletterSignup
                    ? "Active"
                    : "Inactive"}
                </Label>
                <Switch
                  id="notify-admin"
                  checked={emailSettings.notifyAdminOnNewsletterSignup}
                  onCheckedChange={(checked) => {
                    const newSettings = {
                      ...emailSettings,
                      notifyAdminOnNewsletterSignup: checked,
                    };
                    setEmailSettings(newSettings);
                    handleSaveField("notifyAdminOnNewsletterSignup");
                  }}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Newsletter Signup Settings */}
      <Card>
        <CardHeader className="pb-8">
          <div className="flex items-start justify-between gap-4">
            <Field orientation="vertical">
              <FieldContent>
                <FieldTitle className="text-base font-semibold flex items-center gap-2">
                  <Mail className="h-5 w-5" />
                  Newsletter Signup
                </FieldTitle>
                <FieldDescription>
                  Control the public newsletter signup module in the footer
                </FieldDescription>
              </FieldContent>
            </Field>
            <div className="flex items-center gap-2 shrink-0 pt-1">
              <Label
                htmlFor="newsletter-enabled"
                className="text-xs text-muted-foreground w-14 text-right"
              >
                {newsletterSettings.enabled ? "Active" : "Inactive"}
              </Label>
              <Switch
                id="newsletter-enabled"
                checked={newsletterSettings.enabled}
                onCheckedChange={async (checked) => {
                  const newSettings = {
                    ...newsletterSettings,
                    enabled: checked,
                  };
                  setNewsletterSettings(newSettings);
                  setSavingNewsletter(true);

                  try {
                    const response = await fetch(
                      "/api/admin/settings/newsletter",
                      {
                        method: "PUT",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify(newSettings),
                      }
                    );

                    if (!response.ok)
                      throw new Error("Failed to save newsletter settings");

                    setOriginalNewsletterSettings(newSettings);
                  } catch (error) {
                    toast({
                      title: "Error",
                      description:
                        error instanceof Error
                          ? error.message
                          : "Failed to save settings",
                      variant: "destructive",
                    });
                    // Revert on error
                    setNewsletterSettings(newsletterSettings);
                  } finally {
                    setSavingNewsletter(false);
                  }
                }}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <FieldGroup>
            <Field>
              <FormHeading
                htmlFor="newsletter-heading"
                label="Heading"
                isDirty={isNewsletterHeadingDirty}
              />
              <Input
                id="newsletter-heading"
                value={newsletterSettings.heading}
                onChange={(e) =>
                  setNewsletterSettings({
                    ...newsletterSettings,
                    heading: e.target.value,
                  })
                }
                placeholder={originalNewsletterSettings.heading}
                className={isNewsletterHeadingDirty ? "border-amber-500" : ""}
              />
            </Field>
            <Field>
              <FormHeading
                htmlFor="newsletter-description"
                label="Description"
                isDirty={isNewsletterDescriptionDirty}
              />
              <Textarea
                id="newsletter-description"
                value={newsletterSettings.description}
                onChange={(e) =>
                  setNewsletterSettings({
                    ...newsletterSettings,
                    description: e.target.value,
                  })
                }
                rows={3}
                placeholder={originalNewsletterSettings.description}
                className={
                  isNewsletterDescriptionDirty ? "border-amber-500" : ""
                }
              />
            </Field>

            <div className="flex items-center justify-end pt-2">
              <Button
                size="sm"
                onClick={handleSaveNewsletterSettings}
                disabled={savingNewsletter}
                className="shrink-0"
              >
                {savingNewsletter ? (
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
          </FieldGroup>
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
            <div className="flex items-center justify-between gap-4">
              <div className="space-y-0.5">
                <Label htmlFor="show-hours">Display Shop Hours</Label>
                <p className="text-sm text-muted-foreground leading-tight">
                  Show business hours in the footer
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Label
                  htmlFor="show-hours"
                  className="text-xs text-muted-foreground w-14 text-right"
                >
                  {settings.showHours ? "Active" : "Inactive"}
                </Label>
                <Switch
                  id="show-hours"
                  checked={settings.showHours}
                  onCheckedChange={(checked) => {
                    setSettings({ ...settings, showHours: checked });
                    handleSaveField("showHours");
                  }}
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

            <FieldGroup>
              <Field>
                <FormHeading
                  htmlFor="hours-text"
                  label="Hours Text"
                  isDirty={isFieldDirty("hoursText")}
                />
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
                    onClick={() => handleSaveField("hoursText")}
                    disabled={savingFields["hoursText"]}
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
              </Field>
            </FieldGroup>
          </div>

          <div className="border-t pt-6 mt-12" />

          {/* Email Address */}
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-4">
              <div className="space-y-0.5">
                <Label htmlFor="show-email">Display Email Address</Label>
                <p className="text-sm text-muted-foreground leading-tight">
                  Show contact email in the footer
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Label
                  htmlFor="show-email"
                  className="text-xs text-muted-foreground w-14 text-right"
                >
                  {settings.showEmail ? "Active" : "Inactive"}
                </Label>
                <Switch
                  id="show-email"
                  checked={settings.showEmail}
                  onCheckedChange={(checked) => {
                    setSettings({ ...settings, showEmail: checked });
                    handleSaveField("showEmail");
                  }}
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

            <FieldGroup>
              <Field>
                <FormHeading
                  htmlFor="email"
                  label="Email Address"
                  isDirty={isFieldDirty("email")}
                />
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
                    onClick={() => handleSaveField("email")}
                    disabled={savingFields["email"]}
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
              </Field>
            </FieldGroup>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
