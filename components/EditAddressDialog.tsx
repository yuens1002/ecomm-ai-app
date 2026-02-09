"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import type { AddressForm, SavedAddress } from "@/hooks/useEditAddress";

interface EditAddressDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  savedAddresses: SavedAddress[];
  addressForm: AddressForm;
  formLoading: boolean;
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
          {/* Saved Address Selector */}
          <div className="space-y-2">
            <Label htmlFor="address-selector">Load Address</Label>
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
          </div>

          {/* Form Fields */}
          <div className="space-y-2">
            <Label htmlFor="recipientName">Recipient Name</Label>
            <Input
              id="recipientName"
              value={addressForm.recipientName}
              onChange={(e) => onFieldChange("recipientName", e.target.value)}
              placeholder="John Doe"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="street">Street Address</Label>
            <Input
              id="street"
              value={addressForm.street}
              onChange={(e) => onFieldChange("street", e.target.value)}
              placeholder="123 Main St"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                value={addressForm.city}
                onChange={(e) => onFieldChange("city", e.target.value)}
                placeholder="San Francisco"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="state">State</Label>
              <Input
                id="state"
                value={addressForm.state}
                onChange={(e) => onFieldChange("state", e.target.value)}
                placeholder="CA"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="postalCode">Postal Code</Label>
              <Input
                id="postalCode"
                value={addressForm.postalCode}
                onChange={(e) => onFieldChange("postalCode", e.target.value)}
                placeholder="94102"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="country">Country</Label>
              <Input
                id="country"
                value={addressForm.country}
                onChange={(e) => onFieldChange("country", e.target.value)}
                placeholder="US"
                required
              />
            </div>
          </div>

          <DialogFooter>
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
              Save Address
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
