"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Field, FieldDescription, FieldGroup } from "@/components/ui/field";
import { FormHeading } from "@/components/ui/app/FormHeading";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Store } from "lucide-react";
import { IconPicker } from "@/app/admin/_components/cms/fields/IconPicker";
import { SaveButton } from "@/app/admin/_components/forms/SaveButton";

interface ProductMenuSettings {
  icon: string;
  text: string;
}

export default function ProductMenuSettingsSection() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [settings, setSettings] = useState<ProductMenuSettings>({
    icon: "ShoppingBag",
    text: "Shop",
  });
  const [originalSettings, setOriginalSettings] = useState<ProductMenuSettings>(
    {
      icon: "ShoppingBag",
      text: "Shop",
    }
  );
  const [savingField, setSavingField] = useState<string | null>(null);

  const fetchSettings = useCallback(async () => {
    try {
      const response = await fetch("/api/admin/settings/product-menu");
      if (!response.ok)
        throw new Error("Failed to fetch product menu settings");

      const data = await response.json();
      setSettings(data);
      setOriginalSettings(data);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load product menu settings",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const handleSave = async (field: keyof ProductMenuSettings) => {
    setSavingField(field);
    try {
      const response = await fetch("/api/admin/settings/product-menu", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });

      if (!response.ok) throw new Error("Failed to save product menu settings");

      toast({
        title: "Success",
        description: "Product menu settings saved successfully",
      });

      setOriginalSettings(settings);
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to save settings",
        variant: "destructive",
      });
    } finally {
      setSavingField(null);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Store className="h-5 w-5 text-muted-foreground" />
          <h2 className="text-xl font-semibold">Product Menu</h2>
        </div>
        <p className="text-sm text-muted-foreground">
          Customize the icon and text for the product menu in your header/footer
          navigation
        </p>
      </CardHeader>
      <CardContent>
        <FieldGroup>
          <Field>
            <FormHeading
              htmlFor="product-menu-icon"
              label="Menu Icon"
              isDirty={settings.icon !== originalSettings.icon}
            />
            <div className="flex items-center gap-2">
              <IconPicker
                value={settings.icon}
                onValueChange={(value) =>
                  setSettings({ ...settings, icon: value })
                }
                placeholder="Pick an icon..."
                className="flex-1"
              />
              <SaveButton
                size="sm"
                onClick={() => handleSave("icon")}
                isSaving={savingField === "icon"}
                label="Save"
                savingLabel="Saving"
                className="shrink-0"
              />
            </div>
            <FieldDescription>
              Icon displayed next to the product menu text in navigation
            </FieldDescription>
          </Field>
        </FieldGroup>

        <FieldGroup>
          <Field>
            <FormHeading
              htmlFor="product-menu-text"
              label="Menu Text"
              isDirty={settings.text !== originalSettings.text}
            />
            <div className="flex items-center gap-2">
              <Input
                id="product-menu-text"
                type="text"
                value={settings.text}
                onChange={(e) =>
                  setSettings({ ...settings, text: e.target.value })
                }
                placeholder={originalSettings.text}
                maxLength={20}
                className={
                  settings.text !== originalSettings.text
                    ? "border-amber-500"
                    : ""
                }
              />
              <SaveButton
                size="sm"
                onClick={() => handleSave("text")}
                isSaving={savingField === "text"}
                label="Save"
                savingLabel="Saving"
                className="shrink-0"
              />
            </div>
            <FieldDescription>
              Text label for the product menu (max 20 characters)
            </FieldDescription>
          </Field>
        </FieldGroup>
      </CardContent>
    </Card>
  );
}
