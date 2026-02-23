/**
 * Get carrier tracking URL for a given carrier and tracking number.
 * Shared between order detail page and shipment status dialog.
 */
export function getTrackingUrl(
  carrier: string,
  trackingNumber: string
): string | null {
  const carriers: Record<string, string> = {
    USPS: `https://tools.usps.com/go/TrackConfirmAction?tLabels=${trackingNumber}`,
    UPS: `https://www.ups.com/track?tracknum=${trackingNumber}`,
    FedEx: `https://www.fedex.com/fedextrack/?tracknumbers=${trackingNumber}`,
    DHL: `https://www.dhl.com/en/express/tracking.html?AWB=${trackingNumber}`,
  };

  // TEST carrier (mock) has no tracking URL
  if (carrier === "TEST") return null;

  return carriers[carrier] || null;
}
