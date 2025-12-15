"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { SettingsField } from "@/components/admin/SettingsField";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldTitle,
} from "@/components/ui/field";
import { Store } from "lucide-react";
import FileUpload from "@/components/app-components/FileUpload";

export default function BrandingSettingsSection() {
  return (
    <Card>
      <CardHeader className="pb-8">
        <Field orientation="vertical">
          <FieldContent>
            <FieldTitle className="text-base font-semibold flex items-center gap-2">
              <Store className="h-5 w-5" />
              Store Branding
            </FieldTitle>
            <FieldDescription>
              Customize your store name, tagline, and description displayed
              throughout the site
            </FieldDescription>
          </FieldContent>
        </Field>
      </CardHeader>
      <CardContent className="space-y-6">
        <SettingsField
          endpoint="/api/admin/settings/branding"
          field="storeName"
          label="Store Name"
          description="Your store name appears in the header, footer, emails, and metadata."
          defaultValue=""
        />

        <SettingsField
          endpoint="/api/admin/settings/branding"
          field="storeTagline"
          label="Store Tagline"
          description="A short tagline displayed in page metadata and hero sections."
          defaultValue=""
        />

        <SettingsField
          endpoint="/api/admin/settings/branding"
          field="storeDescription"
          label="Store Description"
          description="Detailed description for search engines and about pages (2-3 sentences)."
          input={(value, onChange) => (
            <Textarea
              value={value as string}
              onChange={(e) => onChange(e.target.value)}
              rows={3}
            />
          )}
          defaultValue=""
        />

        <SettingsField
          endpoint="/api/admin/settings/branding"
          field="storeLogoUrl"
          label="Store Logo"
          description="Upload your logo (SVG, PNG, or JPG). Recommended size: 32x32px for consistent display across header and footer."
          input={(value, onChange) => (
            <FileUpload
              linkId="store-logo"
              currentIconUrl={value as string}
              onUploadComplete={(url) => onChange(url)}
            />
          )}
          defaultValue=""
        />

        <SettingsField
          endpoint="/api/admin/settings/branding"
          field="storeFaviconUrl"
          label="Favicon"
          description="Upload your favicon (.ico, .png, or .svg). Recommended: 16x16px or 32x32px. Note: Favicon changes require a browser cache clear to see updates."
          input={(value, onChange) => (
            <FileUpload
              linkId="store-favicon"
              currentIconUrl={value as string}
              onUploadComplete={(url) => onChange(url)}
            />
          )}
          defaultValue=""
        />
      </CardContent>
    </Card>
  );
}
