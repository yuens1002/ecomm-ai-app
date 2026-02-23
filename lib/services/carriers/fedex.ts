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

interface FedExEvent {
  eventType?: string;
  eventDescription?: string;
  date?: string;
}

interface FedExTrackResult {
  latestStatusDetail?: {
    code?: string;
    description?: string;
    derivedCode?: string;
  };
  dateAndTimes?: Array<{
    type?: string;
    dateTime?: string;
  }>;
  scanEvents?: FedExEvent[];
}

interface FedExTrackResponse {
  output?: {
    completeTrackResults?: Array<{
      trackResults?: FedExTrackResult[];
    }>;
  };
}

function isFedExTrackResponse(data: unknown): data is FedExTrackResponse {
  return typeof data === "object" && data !== null && "output" in data;
}

export class FedExClient implements CarrierClient {
  private cachedToken: CachedToken | null = null;

  constructor(
    private apiKey: string,
    private secretKey: string
  ) {}

  private async getAccessToken(): Promise<string> {
    if (this.cachedToken && Date.now() < this.cachedToken.expiresAt) {
      return this.cachedToken.accessToken;
    }

    const body = new URLSearchParams({
      grant_type: "client_credentials",
      client_id: this.apiKey,
      client_secret: this.secretKey,
    });

    const response = await fetch("https://apis.fedex.com/oauth/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: body.toString(),
    });

    if (!response.ok) {
      throw new Error(`FedEx OAuth failed with status ${response.status}`);
    }

    const data: unknown = await response.json();
    if (!isTokenResponse(data)) {
      throw new Error("FedEx OAuth returned unexpected response format");
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
      return { success: true, message: "FedEx credentials are valid" };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unknown error";
      return { success: false, message: `FedEx auth failed: ${message}` };
    }
  }

  async track(trackingNumber: string): Promise<CarrierTrackingResult> {
    try {
      const token = await this.getAccessToken();

      const response = await fetch(
        "https://apis.fedex.com/track/v1/trackingnumbers",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            trackingInfo: [
              {
                trackingNumberInfo: {
                  trackingNumber,
                },
              },
            ],
          }),
        }
      );

      if (!response.ok) {
        console.error(`FedEx Track API returned status ${response.status}`);
        return { status: "error" };
      }

      const data: unknown = await response.json();
      if (!isFedExTrackResponse(data)) {
        return { status: "unknown" };
      }

      const trackResult =
        data.output?.completeTrackResults?.[0]?.trackResults?.[0];
      if (!trackResult?.latestStatusDetail) {
        return { status: "unknown" };
      }

      const statusCode =
        trackResult.latestStatusDetail.derivedCode ??
        trackResult.latestStatusDetail.code;

      if (statusCode === "DL") {
        const deliveryEntry = trackResult.dateAndTimes?.find(
          (d) => d.type === "ACTUAL_DELIVERY"
        );
        const deliveredAt = deliveryEntry?.dateTime
          ? new Date(deliveryEntry.dateTime)
          : undefined;

        return {
          status: "delivered",
          deliveredAt:
            deliveredAt && !isNaN(deliveredAt.getTime())
              ? deliveredAt
              : undefined,
          lastUpdate: trackResult.latestStatusDetail.description,
        };
      }

      if (statusCode === "OD") {
        return {
          status: "out_for_delivery",
          lastUpdate: trackResult.latestStatusDetail.description,
        };
      }

      return {
        status: "in_transit",
        lastUpdate: trackResult.latestStatusDetail.description,
      };
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Unknown error";
      console.error(`FedEx tracking failed: ${message}`);
      return { status: "error" };
    }
  }
}
