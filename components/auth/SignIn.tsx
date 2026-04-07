import Image from "next/image";
import { ReactNode } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface SignInProps {
  title: string;
  subtitle: string;
  icon?: ReactNode;
  storeLogoUrl?: string;
  storeName: string;
  children: ReactNode;
}

export function SignIn({
  title,
  subtitle,
  icon,
  storeLogoUrl,
  storeName,
  children,
}: SignInProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-4">
          <div className="flex justify-center">
            {storeLogoUrl ? (
              <div className="h-16 w-auto">
                <Image
                  src={storeLogoUrl}
                  alt={storeName}
                  width={64}
                  height={64}
                  className="h-16 w-auto object-contain"
                  priority
                />
              </div>
            ) : (
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-sm font-semibold text-primary text-center px-2">
                  {storeName}
                </span>
              </div>
            )}
          </div>
          <div className="text-center">
            <CardTitle className="text-2xl font-bold">{title}</CardTitle>
            <CardDescription className="mt-2 flex items-center justify-center gap-2">
              {icon}
              <span>{subtitle}</span>
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>{children}</CardContent>
      </Card>
    </div>
  );
}
