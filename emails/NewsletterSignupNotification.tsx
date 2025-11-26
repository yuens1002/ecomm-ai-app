import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
  Hr,
} from "@react-email/components";

interface NewsletterSignupNotificationProps {
  subscriberEmail: string;
  subscribedAt: string;
  totalSubscribers: number;
  storeName?: string;
}

export default function NewsletterSignupNotification({
  subscriberEmail,
  subscribedAt,
  totalSubscribers,
  storeName = "Artisan Roast",
}: NewsletterSignupNotificationProps) {
  return (
    <Html>
      <Head />
      <Preview>New newsletter subscriber: {subscriberEmail}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>New Newsletter Subscriber</Heading>
          <Text style={text}>
            A new subscriber has joined your newsletter mailing list.
          </Text>

          <Section style={detailsBox}>
            <Text style={detailLabel}>Email Address:</Text>
            <Text style={detailValue}>{subscriberEmail}</Text>

            <Text style={detailLabel}>Subscribed At:</Text>
            <Text style={detailValue}>{subscribedAt}</Text>

            <Text style={detailLabel}>Total Subscribers:</Text>
            <Text style={detailValue}>{totalSubscribers}</Text>
          </Section>

          <Hr style={hr} />

          <Text style={footer}>
            This is an automated notification from your {storeName} admin panel.
            You can manage notification settings in Admin → Settings.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

const main = {
  backgroundColor: "#f6f9fc",
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: "#ffffff",
  margin: "0 auto",
  padding: "40px 20px",
  marginBottom: "64px",
  maxWidth: "600px",
};

const h1 = {
  color: "#1a1a1a",
  fontSize: "24px",
  fontWeight: "600",
  lineHeight: "1.25",
  margin: "0 0 20px",
};

const text = {
  color: "#484848",
  fontSize: "16px",
  lineHeight: "1.5",
  margin: "0 0 20px",
};

const detailsBox = {
  backgroundColor: "#f8f9fa",
  borderRadius: "8px",
  padding: "24px",
  margin: "24px 0",
};

const detailLabel = {
  color: "#6b7280",
  fontSize: "13px",
  fontWeight: "600",
  textTransform: "uppercase" as const,
  letterSpacing: "0.5px",
  margin: "12px 0 4px",
};

const detailValue = {
  color: "#1a1a1a",
  fontSize: "16px",
  fontWeight: "500",
  margin: "0 0 12px",
};

const hr = {
  borderColor: "#e5e7eb",
  margin: "32px 0",
};

const footer = {
  color: "#6b7280",
  fontSize: "14px",
  lineHeight: "1.5",
  margin: "0",
};
