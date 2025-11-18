import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from "@react-email/components";

interface ShipmentConfirmationEmailProps {
  orderNumber: string;
  customerName: string;
  trackingNumber: string;
  carrier: string;
  estimatedDelivery: string;
  orderId: string;
  isRecurringOrder?: boolean;
  deliverySchedule?: string;
}

export default function ShipmentConfirmationEmail({
  orderNumber,
  customerName,
  trackingNumber,
  carrier,
  estimatedDelivery,
  orderId,
  isRecurringOrder = false,
  deliverySchedule,
}: ShipmentConfirmationEmailProps) {
  const trackingUrl = getTrackingUrl(carrier, trackingNumber);
  const orderUrl = `${process.env.NEXT_PUBLIC_APP_URL}/orders/${orderId}`;

  return (
    <Html>
      <Head />
      <Preview>
        {isRecurringOrder
          ? `Your ${deliverySchedule} subscription is on the way! - Order #${orderNumber}`
          : `Your order #${orderNumber} has shipped!`}
      </Preview>
      <Body style={main}>
        <Container style={container}>
          {isRecurringOrder ? (
            <>
              <Heading style={h1}>
                📦 Your Subscription Order Has Shipped!
              </Heading>
              <Section style={subscriptionBanner}>
                <Text style={subscriptionBannerText}>
                  ☕ {deliverySchedule} delivery
                </Text>
              </Section>
            </>
          ) : (
            <Heading style={h1}>📦 Your Order Has Shipped!</Heading>
          )}

          <Text style={text}>Hi {customerName},</Text>

          <Text style={text}>
            {isRecurringOrder
              ? `Great news! Your ${deliverySchedule?.toLowerCase()} subscription order `
              : "Great news! Your order "}
            <strong>#{orderNumber}</strong> is on its way.
          </Text>

          <Section style={trackingBox}>
            <Text style={trackingLabel}>Tracking Number</Text>
            <Text style={trackingNumberStyle}>{trackingNumber}</Text>
            <Text style={carrierText}>Carrier: {carrier}</Text>
            <Text style={estimatedText}>
              Estimated Delivery: {estimatedDelivery}
            </Text>
          </Section>

          {trackingUrl ? (
            <Section style={buttonContainer}>
              <Button style={button} href={trackingUrl}>
                Track Your Package
              </Button>
            </Section>
          ) : null}

          <Hr style={hr} />

          <Text style={text}>
            You can also view your order details anytime:
          </Text>

          <Section style={buttonContainer}>
            <Button style={buttonSecondary} href={orderUrl}>
              View Order Details
            </Button>
          </Section>

          <Text style={footer}>
            Thank you for your order!
            <br />
            <Link href={process.env.NEXT_PUBLIC_APP_URL} style={link}>
              Artisan Roast
            </Link>
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

function getTrackingUrl(
  carrier: string,
  trackingNumber: string
): string | null {
  const carriers: Record<string, string> = {
    USPS: `https://tools.usps.com/go/TrackConfirmAction?tLabels=${trackingNumber}`,
    UPS: `https://www.ups.com/track?tracknum=${trackingNumber}`,
    FedEx: `https://www.fedex.com/fedextrack/?tracknumbers=${trackingNumber}`,
    DHL: `https://www.dhl.com/en/express/tracking.html?AWB=${trackingNumber}`,
  };

  return carriers[carrier] || null;
}

// Styles
const main = {
  backgroundColor: "#f6f9fc",
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: "#ffffff",
  margin: "0 auto",
  padding: "20px 0 48px",
  marginBottom: "64px",
  maxWidth: "600px",
  width: "100%",
  boxSizing: "border-box" as const,
};

const h1 = {
  color: "#333",
  fontSize: "24px",
  fontWeight: "bold",
  margin: "40px 0",
  padding: "0",
  textAlign: "center" as const,
};

const subscriptionBanner = {
  backgroundColor: "#dcfce7",
  borderLeft: "4px solid #16a34a",
  padding: "12px 24px",
  margin: "16px 24px 24px 24px",
  borderRadius: "4px",
};

const subscriptionBannerText = {
  color: "#166534",
  fontSize: "16px",
  fontWeight: "600" as const,
  lineHeight: "24px",
  margin: "0",
  textAlign: "center" as const,
};

const text = {
  color: "#333",
  fontSize: "16px",
  lineHeight: "26px",
  margin: "16px 24px",
};

const trackingBox = {
  backgroundColor: "#f8f9fa",
  border: "1px solid #e9ecef",
  borderRadius: "8px",
  margin: "24px 24px",
  padding: "24px",
  textAlign: "center" as const,
  width: "auto",
  maxWidth: "100%",
  boxSizing: "border-box" as const,
};

const trackingLabel = {
  color: "#6c757d",
  fontSize: "12px",
  fontWeight: "600",
  textTransform: "uppercase" as const,
  letterSpacing: "0.5px",
  margin: "0 0 8px 0",
};

const trackingNumberStyle = {
  color: "#1a1a1a",
  fontSize: "24px",
  fontWeight: "bold",
  margin: "0 0 16px 0",
  fontFamily: "monospace",
};

const carrierText = {
  color: "#495057",
  fontSize: "14px",
  margin: "8px 0",
};

const estimatedText = {
  color: "#6c757d",
  fontSize: "14px",
  margin: "8px 0",
};

const buttonContainer = {
  textAlign: "center" as const,
  margin: "24px 0",
};

const button = {
  backgroundColor: "#8B4513",
  borderRadius: "5px",
  color: "#fff",
  fontSize: "16px",
  fontWeight: "bold",
  textDecoration: "none",
  textAlign: "center" as const,
  display: "inline-block",
  padding: "12px 24px",
};

const buttonSecondary = {
  backgroundColor: "#6c757d",
  borderRadius: "5px",
  color: "#fff",
  fontSize: "14px",
  fontWeight: "bold",
  textDecoration: "none",
  textAlign: "center" as const,
  display: "inline-block",
  padding: "10px 20px",
};

const hr = {
  borderColor: "#e6ebf1",
  margin: "32px 24px",
};

const link = {
  color: "#8B4513",
  textDecoration: "underline",
};

const footer = {
  color: "#8898aa",
  fontSize: "14px",
  lineHeight: "24px",
  textAlign: "center" as const,
  margin: "32px 0",
};
