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

interface MerchantOrderNotificationProps {
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
}

export default function MerchantOrderNotification({
  orderId,
  orderNumber,
  customerName,
  customerEmail,
  items,
  totalInCents,
  deliveryMethod,
  shippingAddress,
  orderDate,
  isRecurringOrder = false,
}: MerchantOrderNotificationProps) {
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
          ? `Subscription Renewal Order #{orderNumber} - ${subscriptionSchedule}`
          : `New Order #{orderNumber} - Action Required`}
      </Preview>
      <Body style={main}>
        <Container style={container}>
          {isRecurringOrder ? (
            <>
              <Heading style={h1}>🔄 Subscription Renewal Order</Heading>
              <Section style={subscriptionBanner}>
                <Text style={subscriptionBannerText}>
                  {subscriptionSchedule} • Auto-renewal
                </Text>
              </Section>
            </>
          ) : (
            <Heading style={h1}>🎉 New Order Received!</Heading>
          )}

          <Text style={text}>
            {isRecurringOrder
              ? `A subscription has automatically renewed and requires fulfillment.`
              : `A new order has been placed and requires your attention.`}
          </Text>

          <Section style={alertSection}>
            <Text style={alertText}>
              <strong>Order Number:</strong> {orderNumber}
            </Text>
            <Text style={alertText}>
              <strong>Order Date:</strong> {orderDate}
            </Text>
            <Text style={alertText}>
              <strong>Total:</strong> {formatPrice(totalInCents)}
            </Text>
            <Text style={alertText}>
              <strong>Delivery Method:</strong>{" "}
              {deliveryMethod === "DELIVERY"
                ? "🚚 Shipping"
                : "🏪 Store Pickup"}
            </Text>
          </Section>

          <Heading as="h2" style={h2}>
            Customer Information
          </Heading>

          <Section style={infoSection}>
            <Text style={infoText}>
              <strong>Name:</strong> {customerName}
            </Text>
            <Text style={infoText}>
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
                Quantity: {item.quantity} × {formatPrice(item.priceInCents)}
              </Text>
            </Section>
          ))}

          <Hr style={hr} />

          {deliveryMethod === "DELIVERY" && shippingAddress ? (
            <>
              <Heading as="h2" style={h2}>
                Shipping Address
              </Heading>
              <Section style={addressSection}>
                <Text style={addressText}>{shippingAddress.recipientName}</Text>
                <Text style={addressText}>{shippingAddress.street}</Text>
                <Text style={addressText}>
                  {shippingAddress.city}, {shippingAddress.state}{" "}
                  {shippingAddress.postalCode}
                </Text>
                <Text style={addressText}>{shippingAddress.country}</Text>
              </Section>
            </>
          ) : (
            <>
              <Heading as="h2" style={h2}>
                Pickup Order
              </Heading>
              <Text style={text}>
                Customer will pick up this order at your store location. Please
                prepare the order and notify the customer when ready.
              </Text>
            </>
          )}

          <Hr style={hr} />

          <Section style={buttonSection}>
            <Link
              href={`${process.env.NEXT_PUBLIC_APP_URL}/admin/orders`}
              style={button}
            >
              Manage Order
            </Link>
          </Section>

          <Text style={footerText}>
            Log in to your admin dashboard to process this order.
          </Text>
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
  backgroundColor: "#dbeafe",
  borderLeft: "4px solid #3b82f6",
  padding: "12px 40px",
  marginTop: "16px",
  marginBottom: "24px",
};

const subscriptionBannerText = {
  color: "#1e40af",
  fontSize: "16px",
  fontWeight: "600" as const,
  lineHeight: "24px",
  margin: "0",
  textAlign: "center" as const,
};

const alertSection = {
  backgroundColor: "#fffbeb",
  borderLeft: "4px solid #f59e0b",
  padding: "16px 40px",
  marginTop: "24px",
  marginBottom: "24px",
};

const alertText = {
  color: "#92400e",
  fontSize: "14px",
  lineHeight: "24px",
  margin: "4px 0",
};

const infoSection = {
  padding: "0 40px",
  marginBottom: "16px",
};

const infoText = {
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
