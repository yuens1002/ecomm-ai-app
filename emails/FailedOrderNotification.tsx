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

interface FailedOrderNotificationProps {
  orderNumber: string;
  customerName: string;
  failureReason: string;
  orderId: string;
  storeName?: string;
  supportEmail?: string;
}

export default function FailedOrderNotification({
  orderNumber,
  customerName,
  failureReason,
  orderId,
  storeName = "Artisan Roast",
  supportEmail = "support@artisanroast.com",
}: FailedOrderNotificationProps) {
  const orderUrl = `${process.env.NEXT_PUBLIC_APP_URL}/orders/${orderId}`;

  return (
    <Html>
      <Head />
      <Preview>
        We&apos;re sorry - there was an issue with your order #{orderNumber}
      </Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>We&apos;re Sorry</Heading>

          <Section style={alertBanner}>
            <Text style={alertBannerText}>
              There was an issue with your order
            </Text>
          </Section>

          <Text style={text}>Hi {customerName},</Text>

          <Text style={text}>
            Unfortunately, we were unable to fulfill your order{" "}
            <strong>#{orderNumber}</strong>.
          </Text>

          <Section style={reasonBox}>
            <Text style={reasonLabel}>Reason</Text>
            <Text style={reasonText}>{failureReason}</Text>
          </Section>

          <Text style={text}>
            If you were charged for this order, a refund will be processed
            within 5-10 business days to your original payment method.
          </Text>

          <Section style={buttonContainer}>
            <Button style={button} href={orderUrl}>
              View Order Details
            </Button>
          </Section>

          <Hr style={hr} />

          <Text style={text}>
            We sincerely apologize for any inconvenience this may have caused.
            If you have any questions or would like to place a new order, please
            don&apos;t hesitate to reach out.
          </Text>

          <Section style={buttonContainer}>
            <Button style={buttonSecondary} href={`mailto:${supportEmail}`}>
              Contact Support
            </Button>
          </Section>

          <Text style={footer}>
            Thank you for your understanding.
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
  margin: "40px 0 16px 0",
  padding: "0",
  textAlign: "center" as const,
};

const alertBanner = {
  backgroundColor: "#fef2f2",
  borderLeft: "4px solid #dc2626",
  padding: "12px 24px",
  margin: "16px 24px 24px 24px",
  borderRadius: "4px",
};

const alertBannerText = {
  color: "#991b1b",
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

const reasonBox = {
  backgroundColor: "#fef2f2",
  border: "1px solid #fecaca",
  borderRadius: "8px",
  margin: "24px 24px",
  padding: "24px",
  textAlign: "center" as const,
  width: "auto",
  maxWidth: "100%",
  boxSizing: "border-box" as const,
};

const reasonLabel = {
  color: "#991b1b",
  fontSize: "12px",
  fontWeight: "600",
  textTransform: "uppercase" as const,
  letterSpacing: "0.5px",
  margin: "0 0 8px 0",
};

const reasonText = {
  color: "#7f1d1d",
  fontSize: "16px",
  fontWeight: "500",
  margin: "0",
  lineHeight: "24px",
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
