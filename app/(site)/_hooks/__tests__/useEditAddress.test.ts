/**
 * Tests for useEditAddress hook — validates form logic, address selection,
 * and client-side validation. Network calls are mocked.
 */

import { renderHook, act } from "@testing-library/react";
import { useEditAddress } from "../useEditAddress";
import type { AddressEntity } from "../useEditAddress";

// Mock use-toast
const mockToast = jest.fn();
jest.mock("@/hooks/use-toast", () => ({
  useToast: () => ({ toast: mockToast }),
}));

// Mock fetch
const mockFetch = jest.fn();
global.fetch = mockFetch;

const mockEntity: AddressEntity = {
  id: "entity-1",
  recipientName: "John Doe",
  shippingStreet: "123 Main St",
  shippingCity: "San Francisco",
  shippingState: "CA",
  shippingPostalCode: "94102",
  shippingCountry: "US",
};

const defaultOptions = {
  getEndpointUrl: (id: string) => `/api/test/${id}/address`,
  successMessage: "Address updated.",
  onSuccess: jest.fn(),
};

describe("useEditAddress", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ addresses: [] }),
    });
  });

  describe("openDialog", () => {
    it("sets dialog open and populates form from entity", async () => {
      const { result } = renderHook(() => useEditAddress(defaultOptions));

      await act(async () => {
        await result.current.openDialog(mockEntity);
      });

      expect(result.current.dialogOpen).toBe(true);
      expect(result.current.addressForm).toEqual({
        recipientName: "John Doe",
        street: "123 Main St",
        city: "San Francisco",
        state: "CA",
        postalCode: "94102",
        country: "US",
      });
    });

    it("handles null address fields gracefully", async () => {
      const { result } = renderHook(() => useEditAddress(defaultOptions));

      await act(async () => {
        await result.current.openDialog({
          id: "entity-2",
          recipientName: null,
          shippingStreet: null,
          shippingCity: null,
          shippingState: null,
          shippingPostalCode: null,
          shippingCountry: null,
        });
      });

      expect(result.current.addressForm).toEqual({
        recipientName: "",
        street: "",
        city: "",
        state: "",
        postalCode: "",
        country: "",
      });
    });

    it("fetches saved addresses on open", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            addresses: [
              {
                id: "addr-1",
                street: "456 Oak",
                city: "Portland",
                state: "OR",
                postalCode: "97201",
                country: "US",
                isDefault: true,
              },
            ],
          }),
      });

      const { result } = renderHook(() => useEditAddress(defaultOptions));

      await act(async () => {
        await result.current.openDialog(mockEntity);
      });

      expect(mockFetch).toHaveBeenCalledWith("/api/user/addresses");
      expect(result.current.savedAddresses).toHaveLength(1);
      expect(result.current.savedAddresses[0].street).toBe("456 Oak");
    });
  });

  describe("handleSelect", () => {
    it("populates form from saved address, preserving recipientName", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            addresses: [
              {
                id: "addr-1",
                street: "789 Elm",
                city: "Seattle",
                state: "WA",
                postalCode: "98101",
                country: "US",
                isDefault: false,
              },
            ],
          }),
      });

      const { result } = renderHook(() => useEditAddress(defaultOptions));

      await act(async () => {
        await result.current.openDialog(mockEntity);
      });

      act(() => {
        result.current.handleSelect("addr-1");
      });

      expect(result.current.addressForm.recipientName).toBe("John Doe");
      expect(result.current.addressForm.street).toBe("789 Elm");
      expect(result.current.addressForm.city).toBe("Seattle");
      expect(result.current.addressForm.state).toBe("WA");
    });

    it("does nothing for unknown address ID", async () => {
      const { result } = renderHook(() => useEditAddress(defaultOptions));

      await act(async () => {
        await result.current.openDialog(mockEntity);
      });

      const formBefore = { ...result.current.addressForm };

      act(() => {
        result.current.handleSelect("nonexistent-id");
      });

      expect(result.current.addressForm).toEqual(formBefore);
    });
  });

  describe("handleSubmit (validation)", () => {
    it("sets form errors for empty fields and does not call API", async () => {
      const { result } = renderHook(() => useEditAddress(defaultOptions));

      await act(async () => {
        await result.current.openDialog({
          ...mockEntity,
          recipientName: null,
          shippingStreet: null,
          shippingCity: null,
          shippingState: null,
          shippingPostalCode: null,
          shippingCountry: null,
        });
      });

      // Reset fetch call count (openDialog calls fetch for addresses)
      mockFetch.mockClear();

      await act(async () => {
        await result.current.handleSubmit({
          preventDefault: jest.fn(),
        } as unknown as React.FormEvent);
      });

      // Should not have called the PATCH endpoint
      expect(mockFetch).not.toHaveBeenCalled();

      // Should have errors for all fields
      expect(result.current.formErrors.recipientName).toBeDefined();
      expect(result.current.formErrors.street).toBeDefined();
      expect(result.current.formErrors.city).toBeDefined();
      expect(result.current.formErrors.state).toBeDefined();
      expect(result.current.formErrors.postalCode).toBeDefined();
      expect(result.current.formErrors.country).toBeDefined();
    });

    it("validates whitespace-only fields as empty", async () => {
      const { result } = renderHook(() => useEditAddress(defaultOptions));

      await act(async () => {
        await result.current.openDialog(mockEntity);
      });

      act(() => {
        result.current.setAddressForm({
          recipientName: "  ",
          street: "  ",
          city: "  ",
          state: "  ",
          postalCode: "  ",
          country: "  ",
        });
      });

      mockFetch.mockClear();

      await act(async () => {
        await result.current.handleSubmit({
          preventDefault: jest.fn(),
        } as unknown as React.FormEvent);
      });

      expect(mockFetch).not.toHaveBeenCalled();
      expect(result.current.formErrors.recipientName).toBeDefined();
    });
  });

  describe("handleSubmit (API call)", () => {
    it("calls PATCH endpoint and triggers onSuccess on 200", async () => {
      const onSuccess = jest.fn();
      const { result } = renderHook(() =>
        useEditAddress({ ...defaultOptions, onSuccess })
      );

      // Open dialog (triggers address fetch)
      await act(async () => {
        await result.current.openDialog(mockEntity);
      });

      // Mock the PATCH call
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      });

      await act(async () => {
        await result.current.handleSubmit({
          preventDefault: jest.fn(),
        } as unknown as React.FormEvent);
      });

      expect(onSuccess).toHaveBeenCalledWith("entity-1", {
        recipientName: "John Doe",
        street: "123 Main St",
        city: "San Francisco",
        state: "CA",
        postalCode: "94102",
        country: "US",
      });
      expect(result.current.dialogOpen).toBe(false);
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({ title: "Address Updated" })
      );
    });

    it("shows error toast on API failure", async () => {
      const { result } = renderHook(() => useEditAddress(defaultOptions));

      await act(async () => {
        await result.current.openDialog(mockEntity);
      });

      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: () =>
          Promise.resolve({ error: "Only active subscriptions can be updated" }),
      });

      await act(async () => {
        await result.current.handleSubmit({
          preventDefault: jest.fn(),
        } as unknown as React.FormEvent);
      });

      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({ variant: "destructive" })
      );
      // Dialog should stay open on error
      expect(result.current.dialogOpen).toBe(true);
    });
  });
});
