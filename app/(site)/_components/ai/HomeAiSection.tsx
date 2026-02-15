"use client";

import dynamic from "next/dynamic";
import { motion } from "motion/react";

const ChatBarista = dynamic(
  () => import("@/app/(site)/_components/ai/ChatBarista"),
  { ssr: false }
);
const VoiceBarista = dynamic(
  () => import("@/app/(site)/_components/ai/VoiceBarista"),
  { ssr: false }
);

const fadeInUp = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-60px" },
  transition: { duration: 0.5, ease: "easeOut" as const },
};

interface HomeAiSectionProps {
  showVoiceBarista: boolean;
  userEmail?: string;
  userName?: string;
  isAuthenticated: boolean;
}

export default function HomeAiSection({
  showVoiceBarista,
  userEmail,
  userName,
  isAuthenticated,
}: HomeAiSectionProps) {
  return (
    <motion.div {...fadeInUp}>
      {showVoiceBarista ? (
        <VoiceBarista userEmail={userEmail} />
      ) : (
        <ChatBarista userName={userName} isAuthenticated={isAuthenticated} />
      )}
    </motion.div>
  );
}
