import type { CarrierClient, CarrierTrackingResult } from "./types";

interface DhlEvent {
  statusCode?: string;
  status?: string;
  timestamp?: string;
  description?: string;
}

interface DhlShipment {
  status?: {
    statusCode?: string;
    status?: string;
    timestamp?: string;
    description?: string;
  };
  events?: DhlEvent[];
}

interface DhlTrackResponse {
  shipments?: DhlShipment[];
}

function isDhlTrackResponse(data: unknown): data is DhlTrackResponse {
  return typeof data === "object" && data !== null && "shipments" in data;
}

export class DhlClient implements CarrierClient {
  constructor(private apiKey: string) {}

  async testConnection(): Promise<{ success: boolean; message: string }> {
    try {
      // Use a known DHL test tracking number to verify the API key
      const response = await fetch(
        `https://api-eu.dhl.com/track/shipments?trackingNumber=00340434161094042557`,
        {
          headers: {
            "DHL-API-Key": this.apiKey,
            Accept: "application/json",
          },
        }
      );
      if (response.status === 401) {
        return { success: false, message: "DHL API key is invalid" };
      }
      if (!response.ok) {
        return { success: false, message: `DHL API returned status ${response.status}` };
      }
      return { success: true, message: "DHL credentials are valid" };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unknown error";
      return { success: false, message: `DHL test failed: ${message}` };
    }
  }

  async track(trackingNumber: string): Promise<CarrierTrackingResult> {
    try {
      const response = await fetch(
        `https://api-eu.dhl.com/track/shipments?trackingNumber=${encodeURIComponent(trackingNumber)}`,
        {
          headers: {
            "DHL-API-Key": this.apiKey,
            Accept: "application/json",
          },
        }
      );

      if (!response.ok) {
        console.error(`DHL API returned status ${response.status}`);
        return { status: "error" };
      }

      const data: unknown = await response.json();
      if (!isDhlTrackResponse(data)) {
        return { status: "unknown" };
      }

      const shipment = data.shipments?.[0];
      if (!shipment?.status) {
        return { status: "unknown" };
      }

      const statusCode = shipment.status.statusCode?.toLowerCase();

      if (statusCode === "delivered") {
        const deliveredAt = shipment.status.timestamp
          ? new Date(shipment.status.timestamp)
          : undefined;

        return {
          status: "delivered",
          deliveredAt:
            deliveredAt && !isNaN(deliveredAt.getTime())
              ? deliveredAt
              : undefined,
          lastUpdate: shipment.status.description ?? shipment.status.status,
        };
      }

      if (
        statusCode === "transit" &&
        shipment.status.description?.toLowerCase().includes("out for delivery")
      ) {
        return {
          status: "out_for_delivery",
          lastUpdate: shipment.status.description,
        };
      }

      return {
        status: "in_transit",
        lastUpdate: shipment.status.description ?? shipment.status.status,
      };
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Unknown error";
      console.error(`DHL tracking failed: ${message}`);
      return { status: "error" };
    }
  }
}
