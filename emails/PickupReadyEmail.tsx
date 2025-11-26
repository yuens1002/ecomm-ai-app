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

interface PickupReadyEmailProps {
  orderNumber: string;
  customerName: string;
  storeAddress: string;
  storeHours: string;
  orderId: string;
  storeName?: string;
}

export default function PickupReadyEmail({
  orderNumber,
  customerName,
  storeAddress,
  storeHours,
  orderId,
  storeName = "Artisan Roast",
}: PickupReadyEmailProps) {
  const orderUrl = `${process.env.NEXT_PUBLIC_APP_URL}/orders/${orderId}`;

  return (
    <Html>
      <Head />
      <Preview>Your order #{orderNumber} is ready for pickup!</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>☕ Your Order is Ready!</Heading>

          <Text style={text}>Hi {customerName},</Text>

          <Text style={text}>
            Great news! Your order <strong>#{orderNumber}</strong> is ready for
            pickup.
          </Text>

          <Section style={pickupBox}>
            <Text style={pickupLabel}>Pickup Location</Text>
            <Text style={addressText}>{storeAddress}</Text>

            <Hr style={hrThin} />

            <Text style={hoursLabel}>Store Hours</Text>
            <Text style={hoursText}>{storeHours}</Text>
          </Section>

          <Section style={reminderBox}>
            <Text style={reminderText}>
              🔑 Please bring a valid ID and your order number when you come to
              pick up.
            </Text>
          </Section>

          <Section style={buttonContainer}>
            <Button style={button} href={orderUrl}>
              View Order Details
            </Button>
          </Section>

          <Hr style={hr} />

          <Text style={text}>
            We&apos;re excited to see you! If you have any questions, please
            don&apos;t hesitate to contact us.
          </Text>

          <Text style={footer}>
            Thank you for your order!
            <br />
            <Link href={process.env.NEXT_PUBLIC_APP_URL} style={link}>
              {storeName}
            </Link>
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

const text = {
  color: "#333",
  fontSize: "16px",
  lineHeight: "26px",
  margin: "16px 24px",
};

const pickupBox = {
  backgroundColor: "#fff8e1",
  border: "2px solid #ffc107",
  borderRadius: "8px",
  margin: "24px 24px",
  padding: "24px",
  textAlign: "center" as const,
  width: "auto",
  maxWidth: "100%",
  boxSizing: "border-box" as const,
};

const pickupLabel = {
  color: "#f57c00",
  fontSize: "12px",
  fontWeight: "600",
  textTransform: "uppercase" as const,
  letterSpacing: "0.5px",
  margin: "0 0 12px 0",
};

const addressText = {
  color: "#1a1a1a",
  fontSize: "18px",
  fontWeight: "bold",
  margin: "0 0 16px 0",
  lineHeight: "28px",
};

const hrThin = {
  borderColor: "#ffd54f",
  margin: "16px 0",
};

const hoursLabel = {
  color: "#f57c00",
  fontSize: "12px",
  fontWeight: "600",
  textTransform: "uppercase" as const,
  letterSpacing: "0.5px",
  margin: "16px 0 8px 0",
};

const hoursText = {
  color: "#495057",
  fontSize: "14px",
  margin: "0",
  lineHeight: "22px",
};

const reminderBox = {
  margin: "24px",
};

const reminderText = {
  backgroundColor: "#e3f2fd",
  color: "#1565c0",
  fontSize: "14px",
  padding: "12px 24px",
  margin: "0",
  borderRadius: "5px",
  borderLeft: "4px solid #1976d2",
  lineHeight: "22px",
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
