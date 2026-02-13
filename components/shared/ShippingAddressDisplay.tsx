import { formatPhoneNumber } from "./record-utils";

interface ShippingAddressDisplayProps {
  recipientName?: string | null;
  phone?: string | null;
  street?: string | null;
  city?: string | null;
  state?: string | null;
  postalCode?: string | null;
  country?: string | null;
  showCountry?: boolean;
  fallbackText?: string;
  mutedClassName?: string;
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
  fallbackText = "Store Pickup",
  mutedClassName = "text-muted-foreground",
  muteAddressLines,
}: ShippingAddressDisplayProps) {
  if (!street) {
    return (
      <span className={`${mutedClassName} italic text-sm`}>
        {fallbackText}
      </span>
    );
  }

  const addressLineClass = muteAddressLines ? mutedClassName : undefined;

  return (
    <div className="text-sm">
      {recipientName && <div className="font-medium">{recipientName}</div>}
      <div className={addressLineClass}>{street}</div>
      <div className={addressLineClass}>
        {city}, {state} {postalCode}
      </div>
      {(showCountry && country) || phone ? (
        <div className="text-xs text-muted-foreground">
          {showCountry && country ? country : ""}
          {showCountry && country && phone ? " · " : ""}
          {phone ? formatPhoneNumber(phone) : ""}
        </div>
      ) : null}
    </div>
  );
}
