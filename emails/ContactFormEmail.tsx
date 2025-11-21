import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
  Tailwind,
} from "@react-email/components";
import * as React from "react";

interface ContactFormEmailProps {
  name: string;
  email: string;
  subject: string;
  message: string;
}

export const ContactFormEmail = ({
  name,
  email,
  subject,
  message,
}: ContactFormEmailProps) => {
  const previewText = `New Contact Form Submission: ${subject}`;

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Tailwind>
        <Body className="bg-white my-auto mx-auto font-sans">
          <Container className="border border-solid border-[#eaeaea] rounded my-[40px] mx-auto p-[20px] w-[465px]">
            <Heading className="text-black text-[24px] font-normal text-center p-0 my-[30px] mx-0">
              New Contact Form Submission
            </Heading>
            <Text className="text-black text-[14px] leading-[24px]">
              <strong>From:</strong> {name} ({email})
            </Text>
            <Text className="text-black text-[14px] leading-[24px]">
              <strong>Subject:</strong> {subject}
            </Text>
            <Hr className="border border-solid border-[#eaeaea] my-[26px] mx-0 w-full" />
            <Text className="text-black text-[14px] leading-[24px]">
              <strong>Message:</strong>
            </Text>
            <Section className="bg-[#f4f4f4] rounded p-[20px] mb-[20px]">
              <Text className="text-black text-[14px] leading-[24px] m-0 whitespace-pre-wrap">
                {message}
              </Text>
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};

export default ContactFormEmail;
