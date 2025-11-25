import {
  Body,
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
import * as React from "react";

interface NewsletterWelcomeEmailProps {
  email: string;
  unsubscribeToken?: string;
}

export default function NewsletterWelcomeEmail({
  email,
  unsubscribeToken,
}: NewsletterWelcomeEmailProps) {
  const unsubscribeUrl = unsubscribeToken
    ? `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/newsletter/unsubscribe?token=${unsubscribeToken}`
    : "#";

  return (
    <Html>
      <Head />
      <Preview>Welcome to Artisan Roast Newsletter</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Welcome to Artisan Roast! ☕</Heading>

          <Text style={text}>
            Thank you for subscribing to our newsletter! We're excited to have
            you join our community of coffee enthusiasts.
          </Text>

          <Section style={highlightBox}>
            <Text style={highlightText}>You'll receive updates about:</Text>
            <ul style={list}>
              <li>New coffee arrivals and seasonal blends</li>
              <li>Exclusive subscriber discounts and promotions</li>
              <li>Brewing tips and coffee education</li>
              <li>Behind-the-scenes stories from our roasters</li>
            </ul>
          </Section>

          <Text style={text}>
            Your subscription is confirmed for: <strong>{email}</strong>
          </Text>

          <Hr style={hr} />

          <Text style={footer}>
            You can{" "}
            <Link href={unsubscribeUrl} style={link}>
              unsubscribe
            </Link>{" "}
            at any time if you no longer wish to receive these emails.
          </Text>

          <Text style={footer}>
            © {new Date().getFullYear()} Artisan Roast. All rights reserved.
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
  padding: "20px 0 48px",
  marginBottom: "64px",
  maxWidth: "600px",
};

const h1 = {
  color: "#1f2937",
  fontSize: "32px",
  fontWeight: "700",
  margin: "40px 0",
  padding: "0 48px",
  textAlign: "center" as const,
};

const text = {
  color: "#4b5563",
  fontSize: "16px",
  lineHeight: "26px",
  padding: "0 48px",
};

const highlightBox = {
  backgroundColor: "#fef3c7",
  borderRadius: "8px",
  margin: "24px 48px",
  padding: "24px",
};

const highlightText = {
  color: "#1f2937",
  fontSize: "16px",
  fontWeight: "600",
  margin: "0 0 12px 0",
};

const list = {
  color: "#4b5563",
  fontSize: "15px",
  lineHeight: "24px",
  margin: "0",
  paddingLeft: "20px",
};

const hr = {
  borderColor: "#e5e7eb",
  margin: "32px 48px",
};

const footer = {
  color: "#6b7280",
  fontSize: "14px",
  lineHeight: "24px",
  padding: "0 48px",
};

const link = {
  color: "#2563eb",
  textDecoration: "underline",
};
