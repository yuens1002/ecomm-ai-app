import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Section,
  Text,
  Hr,
} from "@react-email/components";

interface OrderConfirmationEmailProps {
  orderId: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  items: Array<{
    productName: string;
    variantName: string;
    quantity: number;
    priceInCents: number;
    purchaseType: string;
    deliverySchedule: string | null;
  }>;
  subtotalInCents: number;
  shippingInCents: number;
  totalInCents: number;
  deliveryMethod: "DELIVERY" | "PICKUP";
  shippingAddress?: {
    recipientName: string;
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  orderDate: string;
  isRecurringOrder?: boolean;
  storeName?: string;
}

export default function OrderConfirmationEmail({
  orderId,
  orderNumber,
  customerName,
  customerEmail,
  items,
  subtotalInCents,
  shippingInCents,
  totalInCents,
  deliveryMethod,
  shippingAddress,
  orderDate,
  isRecurringOrder = false,
  storeName = "Artisan Roast",
}: OrderConfirmationEmailProps) {
  const formatPrice = (cents: number) => {
    return `$${(cents / 100).toFixed(2)}`;
  };

  // Get delivery schedule from first subscription item
  const subscriptionSchedule = items.find(
    (item) => item.purchaseType === "SUBSCRIPTION" && item.deliverySchedule
  )?.deliverySchedule;

  return (
    <Html>
      <Head />
      <Preview>
        {isRecurringOrder
          ? `Your ${subscriptionSchedule} subscription is on the way! - Order #${orderNumber}`
          : `Order #${orderNumber} confirmed - ${storeName}`}
      </Preview>
      <Body style={main}>
        <Container style={container}>
          {isRecurringOrder ? (
            <>
              <Heading style={h1}>
                Your Subscription Order is Being Prepared! 📦
              </Heading>
              <Section style={subscriptionBanner}>
                <Text style={subscriptionBannerText}>
                  ☕ <strong>{subscriptionSchedule}</strong> delivery
                </Text>
              </Section>
            </>
          ) : (
            <Heading style={h1}>Thank you for your order!</Heading>
          )}

          <Text style={text}>Hi {customerName},</Text>

          <Text style={text}>
            {isRecurringOrder
              ? `Great news! Your ${subscriptionSchedule?.toLowerCase()} subscription order has been processed and will be shipped soon. Here are the details:`
              : "We've received your order and will process it shortly. Here are the details:"}
          </Text>

          <Section style={orderInfoSection}>
            <Text style={orderInfoText}>
              <strong>Order Number:</strong> {orderNumber}
            </Text>
            <Text style={orderInfoText}>
              <strong>Order Date:</strong> {orderDate}
            </Text>
            <Text style={orderInfoText}>
              <strong>Email:</strong> {customerEmail}
            </Text>
          </Section>

          <Heading as="h2" style={h2}>
            Order Items
          </Heading>

          {items.map((item, index) => (
            <Section key={index} style={itemSection}>
              <Text style={itemText}>
                <strong>{item.productName}</strong> - {item.variantName}
                {item.purchaseType === "SUBSCRIPTION" &&
                  item.deliverySchedule && (
                    <span> • Subscription - {item.deliverySchedule}</span>
                  )}
                {item.purchaseType === "ONE_TIME" && <span> • One-time</span>}
              </Text>
              <Text style={itemText}>
                Quantity: {item.quantity} × {formatPrice(item.priceInCents)} ={" "}
                {formatPrice(item.quantity * item.priceInCents)}
              </Text>
            </Section>
          ))}

          <Hr style={hr} />

          <Section style={totalsSection}>
            <Text style={totalText}>
              <strong>Subtotal:</strong> {formatPrice(subtotalInCents)}
            </Text>
            {deliveryMethod === "DELIVERY" && (
              <Text style={totalText}>
                <strong>Shipping:</strong> {formatPrice(shippingInCents)}
              </Text>
            )}
            <Text style={totalTextFinal}>
              <strong>Total:</strong> {formatPrice(totalInCents)}
            </Text>
          </Section>

          <Hr style={hr} />

          <Heading as="h2" style={h2}>
            {deliveryMethod === "DELIVERY"
              ? "Shipping Address"
              : "Pickup Location"}
          </Heading>

          {deliveryMethod === "DELIVERY" && shippingAddress ? (
            <Section style={addressSection}>
              <Text style={addressText}>{shippingAddress.recipientName}</Text>
              <Text style={addressText}>{shippingAddress.street}</Text>
              <Text style={addressText}>
                {shippingAddress.city}, {shippingAddress.state}{" "}
                {shippingAddress.postalCode}
              </Text>
              <Text style={addressText}>{shippingAddress.country}</Text>
            </Section>
          ) : (
            <Section style={addressSection}>
              <Text style={addressText}>
                <strong>{storeName}</strong>
              </Text>
              <Text style={addressText}>123 Coffee Street</Text>
              <Text style={addressText}>San Francisco, CA 94102</Text>
              <Text style={addressText}>
                We&apos;ll send you an email when your order is ready for
                pickup!
              </Text>
            </Section>
          )}

          <Hr style={hr} />

          <Text style={text}>
            You can track your order status at any time by visiting your order
            history.
          </Text>

          <Section style={buttonSection}>
            <Link
              href={`${process.env.NEXT_PUBLIC_APP_URL}/orders/${orderId}`}
              style={button}
            >
              View Order Details
            </Link>
          </Section>

          <Text style={footerText}>
            If you have any questions, please contact us at
            support@artisan-roast.com
          </Text>

          <Text style={footerText}>Thank you for choosing {storeName}!</Text>
        </Container>
      </Body>
    </Html>
  );
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
};

const h1 = {
  color: "#333",
  fontSize: "28px",
  fontWeight: "bold",
  margin: "40px 0",
  padding: "0 40px",
};

const h2 = {
  color: "#333",
  fontSize: "20px",
  fontWeight: "bold",
  margin: "32px 0 16px",
  padding: "0 40px",
};

const text = {
  color: "#333",
  fontSize: "16px",
  lineHeight: "26px",
  padding: "0 40px",
};

const subscriptionBanner = {
  backgroundColor: "#dcfce7",
  borderLeft: "4px solid #16a34a",
  padding: "12px 40px",
  marginTop: "16px",
  marginBottom: "24px",
};

const subscriptionBannerText = {
  color: "#166534",
  fontSize: "16px",
  fontWeight: "600" as const,
  lineHeight: "24px",
  margin: "0",
  textAlign: "center" as const,
};

const orderInfoSection = {
  padding: "0 40px",
  marginTop: "24px",
  marginBottom: "24px",
};

const orderInfoText = {
  color: "#333",
  fontSize: "14px",
  lineHeight: "24px",
  margin: "4px 0",
};

const itemSection = {
  padding: "0 40px",
  marginBottom: "16px",
};

const itemText = {
  color: "#333",
  fontSize: "14px",
  lineHeight: "24px",
  margin: "4px 0",
};

const hr = {
  borderColor: "#e6ebf1",
  margin: "32px 40px",
};

const totalsSection = {
  padding: "0 40px",
};

const totalText = {
  color: "#333",
  fontSize: "16px",
  lineHeight: "28px",
  margin: "4px 0",
};

const totalTextFinal = {
  color: "#333",
  fontSize: "18px",
  fontWeight: "bold",
  lineHeight: "32px",
  margin: "8px 0 0",
};

const addressSection = {
  padding: "0 40px",
};

const addressText = {
  color: "#333",
  fontSize: "14px",
  lineHeight: "24px",
  margin: "4px 0",
};

const buttonSection = {
  padding: "0 40px",
  marginTop: "32px",
  marginBottom: "32px",
};

const button = {
  backgroundColor: "#8B4513",
  borderRadius: "5px",
  color: "#fff",
  fontSize: "16px",
  fontWeight: "bold",
  textDecoration: "none",
  textAlign: "center" as const,
  display: "block",
  width: "200px",
  padding: "12px 0",
};

const footerText = {
  color: "#8898aa",
  fontSize: "12px",
  lineHeight: "16px",
  padding: "0 40px",
  marginTop: "16px",
};
