"use client";

import { useState } from "react";
import { Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  FieldGroup,
  FieldSet,
  Field,
  FieldDescription,
} from "@/components/ui/field";
import { FormHeading } from "@/components/ui/app/FormHeading";
import { FormInputField } from "@/components/ui/app/FormInputField";
import { InputGroupInput } from "@/components/ui/app/InputGroup";
import { DialogShell } from "@/components/app-components/DialogShell";
import { IconPicker } from "@/components/app-components/IconPicker";
import { productMenuSettingsSchema } from "../../types/menu";
import { useMenuBuilder } from "../MenuBuilderContext";
import { useProductMenu } from "../../ProductMenuProvider";

export function MenuSettingsDialog() {
  const { menuIconDraft, setMenuIconDraft, menuTitleDraft, setMenuTitleDraft } =
    useMenuBuilder();
  const { updateSettings } = useProductMenu();

  const [open, setOpen] = useState(false);
  const [icon, setIcon] = useState("");
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [textError, setTextError] = useState<string>();

  // Initialize from context when dialog opens
  const handleOpen = (isOpen: boolean) => {
    if (isOpen) {
      setIcon(menuIconDraft || "");
      setText(menuTitleDraft || "");
      setTextError(undefined);
    }
    setOpen(isOpen);
  };

  const validate = () => {
    const result = productMenuSettingsSchema.safeParse({
      icon: icon || undefined,
      text: text.trim(),
    });

    if (!result.success) {
      const textIssue = result.error.issues.find((i) => i.path[0] === "text");
      setTextError(textIssue?.message);
      return false;
    }

    setTextError(undefined);
    return true;
  };

  const handleSave = async () => {
    if (!validate()) return;

    setLoading(true);
    try {
      const result = await updateSettings({
        icon: icon || undefined,
        text: text.trim(),
      });

      if (result.ok) {
        // Update context draft state
        setMenuIconDraft(icon || "");
        setMenuTitleDraft(text.trim());
        setOpen(false);
      } else {
        setTextError(result.error || "Failed to save settings");
      }
    } catch (error) {
      console.error("Failed to save menu settings:", error);
      setTextError("Failed to save settings. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setIcon(menuIconDraft || "");
    setText(menuTitleDraft || "");
    setTextError(undefined);
    setOpen(false);
  };

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setOpen(true)}
        title="Menu settings"
      >
        <Settings className="h-4 w-4" />
      </Button>

      <DialogShell
        open={open}
        onOpenChange={handleOpen}
        title="Menu Settings"
        description="Configure the menu icon and text shown in the navigation."
        size="sm"
        onSave={handleSave}
        onCancel={handleCancel}
        isSaving={loading}
      >
        <FieldGroup>
          <FieldSet>
            <FieldGroup>
              <Field>
                <FormHeading htmlFor="menu-icon" label="Menu Icon" />
                <IconPicker
                  value={icon}
                  onValueChange={setIcon}
                  placeholder="Pick an icon or none..."
                  className="w-full"
                />
                <FieldDescription>
                  Optional icon shown next to the menu text
                </FieldDescription>
              </Field>

              <Field data-invalid={!!textError}>
                <FormHeading
                  htmlFor="menu-text"
                  label="Menu Text"
                  required
                  validationType={textError ? "error" : undefined}
                  errorMessage={textError}
                />
                <FormInputField maxLength={12} currentLength={text.length}>
                  <InputGroupInput
                    id="menu-text"
                    value={text}
                    onChange={(e) => {
                      setText(e.target.value);
                      if (textError) setTextError(undefined);
                    }}
                    placeholder="Shop"
                    disabled={loading}
                    maxLength={12}
                    aria-invalid={!!textError}
                  />
                </FormInputField>
                <FieldDescription>
                  Text shown next to the icon in the navigation menu
                </FieldDescription>
              </Field>
            </FieldGroup>
          </FieldSet>
        </FieldGroup>
      </DialogShell>
    </>
  );
}
