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

interface DeliveryConfirmationEmailProps {
  orderNumber: string;
  customerName: string;
  orderId: string;
  deliveredAt: string;
  storeName?: string;
}

export default function DeliveryConfirmationEmail({
  orderNumber,
  customerName,
  orderId,
  deliveredAt,
  storeName = "Artisan Roast",
}: DeliveryConfirmationEmailProps) {
  const orderUrl = `${process.env.NEXT_PUBLIC_APP_URL}/orders/${orderId}`;

  return (
    <Html>
      <Head />
      <Preview>Your order #{orderNumber} has been delivered!</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>{"\u2705"} Your Order Has Been Delivered!</Heading>

          <Text style={text}>Hi {customerName},</Text>

          <Text style={text}>
            Great news! Your order <strong>#{orderNumber}</strong> has been
            delivered.
          </Text>

          <Section style={trackingBox}>
            <Text style={trackingLabel}>Delivered On</Text>
            <Text style={deliveredAtStyle}>{deliveredAt}</Text>
          </Section>

          <Section style={buttonContainer}>
            <Button style={button} href={orderUrl}>
              View Order Details
            </Button>
          </Section>

          <Hr style={hr} />

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

const deliveredAtStyle = {
  color: "#1a1a1a",
  fontSize: "20px",
  fontWeight: "bold",
  margin: "0",
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
