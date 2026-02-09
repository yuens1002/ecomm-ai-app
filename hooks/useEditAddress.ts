"use client";

import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

export interface AddressForm {
  recipientName: string;
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export interface SavedAddress {
  id: string;
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  isDefault: boolean;
}

export interface AddressEntity {
  id: string;
  recipientName: string | null;
  shippingStreet: string | null;
  shippingCity: string | null;
  shippingState: string | null;
  shippingPostalCode: string | null;
  shippingCountry: string | null;
}

interface UseEditAddressOptions {
  getEndpointUrl: (entityId: string) => string;
  successMessage: string;
  onSuccess: (entityId: string, form: AddressForm) => void;
}

function entityToForm(entity: AddressEntity): AddressForm {
  return {
    recipientName: entity.recipientName || "",
    street: entity.shippingStreet || "",
    city: entity.shippingCity || "",
    state: entity.shippingState || "",
    postalCode: entity.shippingPostalCode || "",
    country: entity.shippingCountry || "",
  };
}

export type AddressFormErrors = Partial<Record<keyof AddressForm, string>>;

const FIELD_LABELS: Record<keyof AddressForm, string> = {
  recipientName: "Recipient name",
  street: "Street address",
  city: "City",
  state: "State",
  postalCode: "Postal code",
  country: "Country",
};

function validateForm(form: AddressForm): AddressFormErrors {
  const errors: AddressFormErrors = {};
  for (const key of Object.keys(form) as (keyof AddressForm)[]) {
    if (!form[key].trim()) {
      errors[key] = `${FIELD_LABELS[key]} is required`;
    }
  }
  return errors;
}

export function useEditAddress({
  getEndpointUrl,
  successMessage,
  onSuccess,
}: UseEditAddressOptions) {
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingEntity, setEditingEntity] = useState<AddressEntity | null>(
    null
  );
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([]);
  const [formLoading, setFormLoading] = useState(false);
  const [formErrors, setFormErrors] = useState<AddressFormErrors>({});
  const [addressForm, setAddressForm] = useState<AddressForm>({
    recipientName: "",
    street: "",
    city: "",
    state: "",
    postalCode: "",
    country: "",
  });

  const openDialog = async (entity: AddressEntity) => {
    setEditingEntity(entity);
    setAddressForm(entityToForm(entity));
    setFormErrors({});
    setDialogOpen(true);

    // Fetch saved addresses (non-blocking)
    try {
      const res = await fetch("/api/user/addresses");
      if (res.ok) {
        const data = await res.json();
        setSavedAddresses(data.addresses || []);
      }
    } catch {
      // Non-critical — selector just won't show saved addresses
    }
  };

  const handleSelect = (value: string) => {
    if (value === "current") {
      if (!editingEntity) return;
      setAddressForm(entityToForm(editingEntity));
      return;
    }
    if (value === "custom") {
      setAddressForm({
        recipientName: "",
        street: "",
        city: "",
        state: "",
        postalCode: "",
        country: "US",
      });
      return;
    }
    const addr = savedAddresses.find((a) => a.id === value);
    if (addr) {
      setAddressForm((prev) => ({
        recipientName: prev.recipientName, // keep current recipient
        street: addr.street,
        city: addr.city,
        state: addr.state,
        postalCode: addr.postalCode,
        country: addr.country,
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEntity) return;

    const errors = validateForm(addressForm);
    setFormErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setFormLoading(true);
    try {
      const res = await fetch(getEndpointUrl(editingEntity.id), {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(addressForm),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to update address");
      }

      onSuccess(editingEntity.id, addressForm);
      setDialogOpen(false);
      setEditingEntity(null);
      toast({
        title: "Address Updated",
        description: successMessage,
        variant: undefined,
        className: "!bg-foreground !text-background !border-foreground",
      });
    } catch (err: unknown) {
      toast({
        title: "Error",
        description:
          err instanceof Error ? err.message : "Failed to update address",
        variant: "destructive",
      });
    } finally {
      setFormLoading(false);
    }
  };

  return {
    dialogOpen,
    setDialogOpen,
    editingEntity,
    savedAddresses,
    addressForm,
    setAddressForm,
    formLoading,
    formErrors,
    setFormErrors,
    openDialog,
    handleSelect,
    handleSubmit,
  };
}
