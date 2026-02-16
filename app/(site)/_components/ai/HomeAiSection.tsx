"use client";

import dynamic from "next/dynamic";

const ChatBarista = dynamic(
  () => import("@/app/(site)/_components/ai/ChatBarista"),
  { ssr: false }
);
const VoiceBarista = dynamic(
  () => import("@/app/(site)/_components/ai/VoiceBarista"),
  { ssr: false }
);

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
    <>
      {showVoiceBarista ? (
        <VoiceBarista userEmail={userEmail} />
      ) : (
        <ChatBarista userName={userName} isAuthenticated={isAuthenticated} />
      )}
    </>
  );
}
