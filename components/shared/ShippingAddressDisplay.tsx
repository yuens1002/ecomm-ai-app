import { formatPhoneNumber, getCountryName } from "./record-utils";

interface ShippingAddressDisplayProps {
  recipientName?: string | null;
  phone?: string | null;
  street?: string | null;
  city?: string | null;
  state?: string | null;
  postalCode?: string | null;
  country?: string | null;
  showCountry?: boolean;
  /** When "full", renders spelled-out country name (e.g., "US" -> "United States"). Default: "code". */
  countryDisplayFormat?: "code" | "full";
  /** When true, renders "Store Pickup" in normal font (not italic). */
  normalPickupFont?: boolean;
  fallbackText?: string;
  mutedClassName?: string;
  /** When true (default), renders address/country/phone in muted style. */
  muteAddressLines?: boolean;
}

export function ShippingAddressDisplay({
  recipientName,
  phone,
  street,
  city,
  state,
  postalCode,
  country,
  showCountry,
  countryDisplayFormat = "code",
  normalPickupFont,
  fallbackText = "Store Pickup",
  mutedClassName = "text-muted-foreground",
  muteAddressLines,
}: ShippingAddressDisplayProps) {
  if (!street) {
    return (
      <span className={`${mutedClassName} ${normalPickupFont ? "" : "italic "}text-sm`}>
        {fallbackText}
      </span>
    );
  }

  const addressLineClass = muteAddressLines ? mutedClassName : undefined;
  const displayCountry =
    showCountry && country
      ? countryDisplayFormat === "full"
        ? getCountryName(country)
        : country
      : null;

  return (
    <div className="text-sm">
      {recipientName && <div>{recipientName}</div>}
      <div className={addressLineClass}>{street}</div>
      <div className={addressLineClass}>
        {city}, {state} {postalCode}
      </div>
      {displayCountry && (
        <div className={addressLineClass}>{displayCountry}</div>
      )}
      {phone && (
        <div className={addressLineClass}>
          {formatPhoneNumber(phone)}
        </div>
      )}
    </div>
  );
}
