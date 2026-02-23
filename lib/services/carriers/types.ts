export interface CarrierTrackingResult {
  status: "in_transit" | "out_for_delivery" | "delivered" | "error" | "unknown";
  deliveredAt?: Date;
  lastUpdate?: string;
}

export interface CarrierClient {
  track(trackingNumber: string): Promise<CarrierTrackingResult>;
  testConnection(): Promise<{ success: boolean; message: string }>;
}
