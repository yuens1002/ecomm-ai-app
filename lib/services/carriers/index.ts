import type { CarrierClient } from "./types";
import { UspsClient } from "./usps";
import { UpsClient } from "./ups";
import { FedExClient } from "./fedex";
import { DhlClient } from "./dhl";
import { MockClient } from "./mock";

export type { CarrierClient, CarrierTrackingResult } from "./types";

export function getCarrierClient(
  carrier: string,
  apiKeys: Record<string, string>
): CarrierClient | null {
  switch (carrier) {
    case "USPS": {
      const userId = apiKeys.carrier_usps_user_id;
      if (!userId) return null;
      return new UspsClient(userId);
    }
    case "UPS": {
      const clientId = apiKeys.carrier_ups_client_id;
      const clientSecret = apiKeys.carrier_ups_client_secret;
      if (!clientId || !clientSecret) return null;
      return new UpsClient(clientId, clientSecret);
    }
    case "FedEx": {
      const apiKey = apiKeys.carrier_fedex_api_key;
      const secretKey = apiKeys.carrier_fedex_secret_key;
      if (!apiKey || !secretKey) return null;
      return new FedExClient(apiKey, secretKey);
    }
    case "DHL": {
      const apiKey = apiKeys.carrier_dhl_api_key;
      if (!apiKey) return null;
      return new DhlClient(apiKey);
    }
    case "TEST":
      return new MockClient();
    default:
      return null;
  }
}
