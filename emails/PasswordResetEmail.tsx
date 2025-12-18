import * as React from "react";
import { Html } from "@react-email/html";
import { Head } from "@react-email/head";
import { Body } from "@react-email/body";
import { Container } from "@react-email/container";
import { Text } from "@react-email/text";
import { Link } from "@react-email/link";

interface PasswordResetEmailProps {
  resetUrl: string;
  storeName?: string;
  supportEmail?: string;
}

export default function PasswordResetEmail({
  resetUrl,
  storeName = "Artisan Roast",
  supportEmail,
}: PasswordResetEmailProps) {
  return (
    <Html>
      <Head />
      <Body style={body}>
        <Container style={container}>
          <Text style={heading}>Reset your password</Text>
          <Text style={paragraph}>
            We received a request to reset your {storeName} password. Click the
            button below to set a new one. If you didn&apos;t request this, you
            can safely ignore this email.
          </Text>
          <Container style={buttonWrapper}>
            <Link href={resetUrl} style={button}>
              Reset password
            </Link>
          </Container>
          <Text style={paragraph}>
            This link will expire soon for security. If it stops working, submit
            a new password reset request.
          </Text>
          {supportEmail && (
            <Text style={paragraph}>
              Need help? Contact us at{" "}
              <Link href={`mailto:${supportEmail}`}>{supportEmail}</Link>.
            </Text>
          )}
          <Text style={footer}>– {storeName} Team</Text>
        </Container>
      </Body>
    </Html>
  );
}

const body: React.CSSProperties = {
  backgroundColor: "#f5f5f5",
  fontFamily: "Helvetica, Arial, sans-serif",
  padding: "24px",
};

const container: React.CSSProperties = {
  backgroundColor: "#ffffff",
  borderRadius: "12px",
  padding: "24px",
  maxWidth: "520px",
  width: "100%",
  margin: "0 auto",
};

const heading: React.CSSProperties = {
  fontSize: "24px",
  fontWeight: 700,
  marginBottom: "16px",
  color: "#111827",
};

const paragraph: React.CSSProperties = {
  fontSize: "16px",
  lineHeight: "24px",
  color: "#374151",
  margin: "12px 0",
};

const buttonWrapper: React.CSSProperties = {
  textAlign: "center",
  margin: "24px 0",
};

const button: React.CSSProperties = {
  backgroundColor: "#111827",
  color: "#ffffff",
  padding: "12px 20px",
  borderRadius: "8px",
  textDecoration: "none",
  fontWeight: 600,
  display: "inline-block",
};

const footer: React.CSSProperties = {
  fontSize: "14px",
  lineHeight: "20px",
  color: "#6b7280",
  marginTop: "20px",
};
