import { Suspense } from "react";
import UnsubscribeClient from "./UnsubscribeClient";
import { Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function UnsubscribePage() {
  return (
    <Suspense fallback={<LoadingState />}>
      <UnsubscribeClient />
    </Suspense>
  );
}

function LoadingState() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-muted/30">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center pb-4">
          <div className="flex justify-center mb-4">
            <Loader2 className="h-16 w-16 animate-spin text-primary" />
          </div>
          <h1 className="text-2xl font-bold">Processing...</h1>
        </CardHeader>
        <CardContent className="text-center">
          <p className="text-muted-foreground">
            Please wait while we process your request...
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
