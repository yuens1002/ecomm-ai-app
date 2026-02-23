import type { CarrierClient, CarrierTrackingResult } from "./types";

interface UspsTrackEvent {
  eventDescription: string;
  eventDate: string;
  eventTime: string;
}

function parseTrackEvents(xml: string): UspsTrackEvent[] {
  const events: UspsTrackEvent[] = [];

  const tagPatterns = [
    /<TrackSummary>([\s\S]*?)<\/TrackSummary>/g,
    /<TrackDetail>([\s\S]*?)<\/TrackDetail>/g,
  ];

  for (const pattern of tagPatterns) {
    let match = pattern.exec(xml);
    while (match) {
      const block = match[1];
      const desc = /<Event>(.*?)<\/Event>/.exec(block)?.[1] ?? "";
      const date = /<EventDate>(.*?)<\/EventDate>/.exec(block)?.[1] ?? "";
      const time = /<EventTime>(.*?)<\/EventTime>/.exec(block)?.[1] ?? "";
      events.push({
        eventDescription: desc,
        eventDate: date,
        eventTime: time,
      });
      match = pattern.exec(xml);
    }
  }

  return events;
}

function parseDeliveryDate(date: string, time: string): Date | undefined {
  if (!date) return undefined;
  const combined = time ? `${date} ${time}` : date;
  const parsed = new Date(combined);
  return isNaN(parsed.getTime()) ? undefined : parsed;
}

export class UspsClient implements CarrierClient {
  constructor(private userId: string) {}

  async testConnection(): Promise<{ success: boolean; message: string }> {
    try {
      // Use a dummy tracking request to verify the userId is valid
      const xmlRequest = `<TrackRequest USERID="${this.userId}"><TrackID ID="0000000000000"></TrackID></TrackRequest>`;
      const url = `https://secure.shippingapis.com/ShippingAPI.dll?API=TrackV2&XML=${encodeURIComponent(xmlRequest)}`;
      const response = await fetch(url);
      if (!response.ok) {
        return { success: false, message: `USPS API returned status ${response.status}` };
      }
      const xml = await response.text();
      // Auth errors return an <Error> with "Authorization" in description
      const authError = /<Error>[\s\S]*?<Description>(.*?)<\/Description>/.exec(xml);
      if (authError && authError[1].toLowerCase().includes("authorization")) {
        return { success: false, message: `USPS auth failed: ${authError[1]}` };
      }
      return { success: true, message: "USPS credentials are valid" };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unknown error";
      return { success: false, message: `USPS test failed: ${message}` };
    }
  }

  async track(trackingNumber: string): Promise<CarrierTrackingResult> {
    const xmlRequest = `<TrackRequest USERID="${this.userId}"><TrackID ID="${trackingNumber}"></TrackID></TrackRequest>`;
    const url = `https://secure.shippingapis.com/ShippingAPI.dll?API=TrackV2&XML=${encodeURIComponent(xmlRequest)}`;

    try {
      const response = await fetch(url);
      if (!response.ok) {
        console.error(`USPS API returned status ${response.status}`);
        return { status: "error" };
      }

      const xml = await response.text();

      const errorMatch = /<Error>[\s\S]*?<Description>(.*?)<\/Description>/.exec(
        xml
      );
      if (errorMatch) {
        console.error(`USPS API error: ${errorMatch[1]}`);
        return { status: "error" };
      }

      const events = parseTrackEvents(xml);
      if (events.length === 0) {
        return { status: "unknown" };
      }

      const latestEvent = events[0];
      const desc = latestEvent.eventDescription.toLowerCase();

      if (desc.includes("out for delivery")) {
        return {
          status: "out_for_delivery",
          lastUpdate: latestEvent.eventDescription,
        };
      }

      if (desc.includes("delivered")) {
        return {
          status: "delivered",
          deliveredAt: parseDeliveryDate(
            latestEvent.eventDate,
            latestEvent.eventTime
          ),
          lastUpdate: latestEvent.eventDescription,
        };
      }

      return {
        status: "in_transit",
        lastUpdate: latestEvent.eventDescription,
      };
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Unknown error";
      console.error(`USPS tracking failed: ${message}`);
      return { status: "error" };
    }
  }
}
