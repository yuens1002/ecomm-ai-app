import type { CarrierClient, CarrierTrackingResult } from "./types";

export class MockClient implements CarrierClient {
  async track(trackingNumber: string): Promise<CarrierTrackingResult> {
    // Simulate network delay
    await new Promise((r) => setTimeout(r, 100));

    if (trackingNumber.startsWith("TEST-DELIVERED-")) {
      return { status: "delivered", deliveredAt: new Date() };
    }
    if (trackingNumber.startsWith("TEST-OFD-")) {
      return { status: "out_for_delivery", lastUpdate: "Out for delivery" };
    }
    if (trackingNumber.startsWith("TEST-TRANSIT-")) {
      return { status: "in_transit", lastUpdate: "In transit" };
    }
    if (trackingNumber.startsWith("TEST-ERROR-")) {
      return { status: "error" };
    }
    return { status: "unknown" };
  }

  async testConnection(): Promise<{ success: boolean; message: string }> {
    return { success: true, message: "Mock carrier OK" };
  }
}
