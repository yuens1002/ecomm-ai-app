"use client";

import dynamic from "next/dynamic";

function AiSectionSkeleton() {
  return (
    <div className="relative overflow-hidden border-b">
      <div className="py-16 md:py-24">
        <div className="mx-auto max-w-screen-2xl px-4 md:px-8">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <div className="h-10 md:h-12 bg-muted rounded-lg w-3/4 mx-auto animate-pulse" />
            <div className="space-y-2">
              <div className="h-5 bg-muted rounded w-5/6 mx-auto animate-pulse" />
              <div className="h-5 bg-muted rounded w-2/3 mx-auto animate-pulse" />
            </div>
            <div className="flex justify-center">
              <div className="h-14 w-40 bg-muted rounded-md animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const ChatBarista = dynamic(
  () => import("@/app/(site)/_components/ai/ChatBarista"),
  { ssr: false, loading: AiSectionSkeleton }
);
const VoiceBarista = dynamic(
  () => import("@/app/(site)/_components/ai/VoiceBarista"),
  { ssr: false, loading: AiSectionSkeleton }
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
