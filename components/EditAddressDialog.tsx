"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field } from "@/components/ui/field";
import { FormHeading } from "@/components/ui/forms/FormHeading";
import type {
  AddressForm,
  AddressFormErrors,
  SavedAddress,
} from "@/hooks/useEditAddress";

interface EditAddressDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  savedAddresses: SavedAddress[];
  addressForm: AddressForm;
  formLoading: boolean;
  formErrors: AddressFormErrors;
  onAddressSelect: (value: string) => void;
  onFieldChange: (field: keyof AddressForm, value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
}

export function EditAddressDialog({
  open,
  onOpenChange,
  title,
  description,
  savedAddresses,
  addressForm,
  formLoading,
  formErrors,
  onAddressSelect,
  onFieldChange,
  onSubmit,
}: EditAddressDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-4">
          {/* Address Book Selector */}
          <Field>
            <FormHeading htmlFor="address-selector" label="Address Book" />
            <Select defaultValue="current" onValueChange={onAddressSelect}>
              <SelectTrigger id="address-selector">
                <SelectValue placeholder="Select an address" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="current">Current address</SelectItem>
                {savedAddresses.map((addr) => (
                  <SelectItem key={addr.id} value={addr.id}>
                    {addr.street}, {addr.city}, {addr.state} {addr.postalCode}
                    {addr.isDefault ? " (Default)" : ""}
                  </SelectItem>
                ))}
                <SelectItem value="custom">Custom address</SelectItem>
              </SelectContent>
            </Select>
          </Field>

          {/* Form Fields */}
          <Field>
            <FormHeading
              htmlFor="recipientName"
              label="Recipient Name"
              required
              validationType={formErrors.recipientName ? "error" : undefined}
              errorMessage={formErrors.recipientName}
            />
            <Input
              id="recipientName"
              value={addressForm.recipientName}
              onChange={(e) => onFieldChange("recipientName", e.target.value)}
              placeholder="John Doe"
            />
          </Field>

          <Field>
            <FormHeading
              htmlFor="street"
              label="Street Address"
              required
              validationType={formErrors.street ? "error" : undefined}
              errorMessage={formErrors.street}
            />
            <Input
              id="street"
              value={addressForm.street}
              onChange={(e) => onFieldChange("street", e.target.value)}
              placeholder="123 Main St"
            />
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field>
              <FormHeading
                htmlFor="city"
                label="City"
                required
                validationType={formErrors.city ? "error" : undefined}
                errorMessage={formErrors.city}
              />
              <Input
                id="city"
                value={addressForm.city}
                onChange={(e) => onFieldChange("city", e.target.value)}
                placeholder="San Francisco"
              />
            </Field>
            <Field>
              <FormHeading
                htmlFor="state"
                label="State"
                required
                validationType={formErrors.state ? "error" : undefined}
                errorMessage={formErrors.state}
              />
              <Input
                id="state"
                value={addressForm.state}
                onChange={(e) => onFieldChange("state", e.target.value)}
                placeholder="CA"
              />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field>
              <FormHeading
                htmlFor="postalCode"
                label="Postal Code"
                required
                validationType={formErrors.postalCode ? "error" : undefined}
                errorMessage={formErrors.postalCode}
              />
              <Input
                id="postalCode"
                value={addressForm.postalCode}
                onChange={(e) => onFieldChange("postalCode", e.target.value)}
                placeholder="94102"
              />
            </Field>
            <Field>
              <FormHeading
                htmlFor="country"
                label="Country"
                required
                validationType={formErrors.country ? "error" : undefined}
                errorMessage={formErrors.country}
              />
              <Input
                id="country"
                value={addressForm.country}
                onChange={(e) => onFieldChange("country", e.target.value)}
                placeholder="US"
              />
            </Field>
          </div>

          <DialogFooter className="justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={formLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={formLoading}>
              {formLoading && (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              )}
              Save
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
