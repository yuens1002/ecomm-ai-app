import Image from "next/image";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface ThumbnailProps {
  src: string;
  alt: string;
  selected?: boolean;
  onClick?: () => void;
}

export function Thumbnail({
  src,
  alt,
  selected = false,
  onClick,
}: ThumbnailProps) {
  return (
    <Button
      onClick={onClick}
      className={cn(
        "group relative h-16 w-16 shrink-0 overflow-hidden rounded-sm",
        selected && "border pointer-events-none border-primary"
      )}
    >
      <Image
        src={src}
        alt={alt}
        fill
        className="object-cover transition-transform duration-200 ease-in group-hover:scale-115"
        sizes="64px"
      />
    </Button>
  );
}
