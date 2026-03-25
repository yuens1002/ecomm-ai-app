"use client";

import { useState } from "react";
import { SettingsField } from "@/app/admin/_components/forms/SettingsField";
import { SettingsSection } from "@/app/admin/_components/forms/SettingsSection";
import { PageTitle } from "@/app/admin/_components/forms/PageTitle";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { InputGroupInput, InputGroupAddon, InputGroupButton } from "@/components/ui/forms/InputGroup";
import { FormTextArea } from "@/components/ui/forms/FormTextArea";
import { Eye, EyeOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function ContactSettingsPage() {
  const { toast } = useToast();
  const [showApiKey, setShowApiKey] = useState(false);
  const [isSendingTest, setIsSendingTest] = useState(false);

  async function handleTestSend() {
    setIsSendingTest(true);
    try {
      const res = await fetch("/api/admin/settings/email", { method: "POST" });
      const data = (await res.json()) as { message?: string; error?: string };
      if (!res.ok) throw new Error(data.error ?? "Failed to send test email");
      toast({ title: "Test email sent", description: data.message });
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setIsSendingTest(false);
    }
  }

  return (
    <div className="space-y-8">
      <PageTitle
        title="Contact Settings"
        subtitle="Configure contact information and email settings"
      />

      <SettingsSection
        title="Email Configuration"
        description="Configure your contact email address and outgoing mail credentials (Resend)"
      >
        <SettingsField
          endpoint="/api/admin/settings/email"
          field="apiKey"
          label="API Key"
          description="Your Resend API key. Masked on load — enter a new value to replace it."
          input={(value, onChange, isDirty) => (
            <>
              <InputGroupInput
                type={showApiKey ? "text" : "password"}
                value={value as string}
                onChange={(e) => onChange(e.target.value)}
                placeholder="re_••••••••••••••••"
                autoComplete="off"
                className={isDirty ? "border-amber-500" : ""}
              />
              <InputGroupAddon align="inline-end">
                <InputGroupButton
                  onClick={() => setShowApiKey((v) => !v)}
                  aria-label={showApiKey ? "Hide API key" : "Show API key"}
                >
                  {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </InputGroupButton>
              </InputGroupAddon>
            </>
          )}
        />

        <SettingsField
          endpoint="/api/admin/settings/email"
          field="contactEmail"
          label="Contact Email"
          description="Primary email address for customer inquiries and notifications"
          input={(value, onChange, isDirty) => (
            <InputGroupInput
              type="email"
              value={value as string}
              onChange={(e) => onChange(e.target.value)}
              className={isDirty ? "border-amber-500" : ""}
            />
          )}
        />

        <SettingsField
          endpoint="/api/admin/settings/email"
          field="fromEmail"
          label="From Email"
          description="The address emails are sent from (e.g. hello@yourdomain.com)"
          input={(value, onChange, isDirty) => (
            <InputGroupInput
              type="email"
              value={value as string}
              onChange={(e) => onChange(e.target.value)}
              placeholder="hello@yourstore.com"
              className={isDirty ? "border-amber-500" : ""}
            />
          )}
        />

        <SettingsField
          endpoint="/api/admin/settings/email"
          field="fromName"
          label="From Name"
          description="The sender name shown in email clients (e.g. Morning Roast)"
          input={(value, onChange, isDirty) => (
            <InputGroupInput
              type="text"
              value={value as string}
              onChange={(e) => onChange(e.target.value)}
              placeholder="Your Store Name"
              className={isDirty ? "border-amber-500" : ""}
            />
          )}
        />

        <div className="flex flex-col gap-1 pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleTestSend}
            disabled={isSendingTest}
            className="w-fit"
          >
            {isSendingTest ? "Sending…" : "Send Test Email"}
          </Button>
          <p className="text-xs text-muted-foreground">
            Sends a test email to your configured contact email address.
          </p>
        </div>
      </SettingsSection>

      <SettingsSection
        title="Footer Contact Information"
        description="Configure what contact information appears in your site footer"
      >
        <SettingsField<boolean>
          endpoint="/api/admin/settings/footer-contact"
          field="showEmail"
          label="Show Email in Footer"
          description="Display your contact email in the site footer"
          autoSave
          defaultValue={false}
          input={(value, onChange, _isDirty) => (
            <div className="flex items-center space-x-2">
              <Switch
                checked={Boolean(value)}
                onCheckedChange={(checked) => onChange(checked)}
              />
              <Label className="text-sm text-muted-foreground">
                {value
                  ? "Email is shown in footer"
                  : "Email is hidden from footer"}
              </Label>
            </div>
          )}
        />

        <SettingsField
          endpoint="/api/admin/settings/footer-contact"
          field="email"
          label="Footer Email Address"
          description="Email address displayed in the site footer"
          input={(value, onChange, isDirty) => (
            <InputGroupInput
              type="email"
              value={value as string}
              onChange={(e) => onChange(e.target.value)}
              placeholder="hello@artisan-roast.com"
              className={isDirty ? "border-amber-500" : ""}
            />
          )}
        />

        <SettingsField<boolean>
          endpoint="/api/admin/settings/footer-contact"
          field="showHours"
          label="Show Hours in Footer"
          description="Display your business hours in the site footer"
          autoSave
          defaultValue={false}
          input={(value, onChange, _isDirty) => (
            <div className="flex items-center space-x-2">
              <Switch
                checked={Boolean(value)}
                onCheckedChange={(checked) => onChange(checked)}
              />
              <Label className="text-sm text-muted-foreground">
                {value
                  ? "Hours are shown in footer"
                  : "Hours are hidden from footer"}
              </Label>
            </div>
          )}
        />

        <SettingsField
          endpoint="/api/admin/settings/footer-contact"
          field="hoursText"
          label="Business Hours"
          description="Your café's operating hours (displayed in footer)"
          saveButtonInInput
          input={(value, onChange, isDirty, isSaving, onSave) => (
            <FormTextArea
              value={value as string}
              onChange={(e) => onChange(e.target.value)}
              rows={3}
              placeholder="Mon-Fri: 7am-6pm&#10;Sat-Sun: 8am-5pm"
              currentLength={(value as string)?.length ?? 0}
              showSaveButton
              isSaving={isSaving}
              isSaveDisabled={!isDirty}
              onSave={onSave}
            />
          )}
        />
      </SettingsSection>

    </div>
  );
}
