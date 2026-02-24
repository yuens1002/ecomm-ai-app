import type { CarrierClient, CarrierTrackingResult } from "./types";

interface CachedToken {
  accessToken: string;
  expiresAt: number;
}

function isTokenResponse(data: unknown): data is { access_token: string; expires_in: number } {
  return (
    typeof data === "object" &&
    data !== null &&
    "access_token" in data &&
    "expires_in" in data &&
    typeof (data as Record<string, unknown>).access_token === "string" &&
    typeof (data as Record<string, unknown>).expires_in === "number"
  );
}

interface UpsStatusDetail {
  type?: string;
  description?: string;
  date?: string;
  time?: string;
}

interface UpsPackage {
  currentStatus?: UpsStatusDetail;
  deliveryDate?: Array<{ date?: string }>;
}

interface UpsTrackResponse {
  trackResponse?: {
    shipment?: Array<{
      package?: UpsPackage[];
    }>;
  };
}

function isUpsTrackResponse(data: unknown): data is UpsTrackResponse {
  return typeof data === "object" && data !== null && "trackResponse" in data;
}

function parseUpsDate(dateStr: string, timeStr?: string): Date | undefined {
  if (!dateStr || dateStr.length !== 8) return undefined;
  const year = dateStr.slice(0, 4);
  const month = dateStr.slice(4, 6);
  const day = dateStr.slice(6, 8);
  let iso = `${year}-${month}-${day}`;
  if (timeStr && timeStr.length >= 4) {
    const hours = timeStr.slice(0, 2);
    const minutes = timeStr.slice(2, 4);
    const seconds = timeStr.length >= 6 ? timeStr.slice(4, 6) : "00";
    iso += `T${hours}:${minutes}:${seconds}`;
  }
  const parsed = new Date(iso);
  return isNaN(parsed.getTime()) ? undefined : parsed;
}

export class UpsClient implements CarrierClient {
  private cachedToken: CachedToken | null = null;

  constructor(
    private clientId: string,
    private clientSecret: string
  ) {}

  private async getAccessToken(): Promise<string> {
    if (this.cachedToken && Date.now() < this.cachedToken.expiresAt) {
      return this.cachedToken.accessToken;
    }

    const credentials = Buffer.from(
      `${this.clientId}:${this.clientSecret}`
    ).toString("base64");

    const response = await fetch(
      "https://onlinetools.ups.com/security/v1/oauth/token",
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${credentials}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: "grant_type=client_credentials",
      }
    );

    if (!response.ok) {
      throw new Error(`UPS OAuth failed with status ${response.status}`);
    }

    const data: unknown = await response.json();
    if (!isTokenResponse(data)) {
      throw new Error("UPS OAuth returned unexpected response format");
    }

    // Buffer 60s before actual expiry to avoid edge-case token use
    this.cachedToken = {
      accessToken: data.access_token,
      expiresAt: Date.now() + (data.expires_in - 60) * 1000,
    };

    return this.cachedToken.accessToken;
  }

  async testConnection(): Promise<{ success: boolean; message: string }> {
    try {
      await this.getAccessToken();
      return { success: true, message: "UPS credentials are valid" };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unknown error";
      return { success: false, message: `UPS auth failed: ${message}` };
    }
  }

  async track(trackingNumber: string): Promise<CarrierTrackingResult> {
    try {
      const token = await this.getAccessToken();

      const response = await fetch(
        `https://onlinetools.ups.com/api/track/v1/details/${encodeURIComponent(trackingNumber)}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            transId: crypto.randomUUID(),
            transactionSrc: "artisan-roast",
          },
        }
      );

      if (!response.ok) {
        console.error(`UPS Track API returned status ${response.status}`);
        return { status: "error" };
      }

      const data: unknown = await response.json();
      if (!isUpsTrackResponse(data)) {
        return { status: "unknown" };
      }

      const pkg = data.trackResponse?.shipment?.[0]?.package?.[0];
      if (!pkg?.currentStatus) {
        return { status: "unknown" };
      }

      const statusType = pkg.currentStatus.type;

      if (statusType === "D") {
        return {
          status: "delivered",
          deliveredAt: parseUpsDate(
            pkg.currentStatus.date ?? "",
            pkg.currentStatus.time
          ),
          lastUpdate: pkg.currentStatus.description,
        };
      }

      if (
        statusType === "I" &&
        pkg.currentStatus.description?.toLowerCase().includes("out for delivery")
      ) {
        return {
          status: "out_for_delivery",
          lastUpdate: pkg.currentStatus.description,
        };
      }

      return {
        status: "in_transit",
        lastUpdate: pkg.currentStatus.description,
      };
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Unknown error";
      console.error(`UPS tracking failed: ${message}`);
      return { status: "error" };
    }
  }
}
