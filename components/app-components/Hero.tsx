import Image from "next/image";

interface HeroProps {
  title: string;
  imageUrl?: string;
  imageAlt?: string;
  caption?: string;
  className?: string;
}

export function Hero({
  title,
  imageUrl,
  imageAlt,
  caption,
  className = "",
}: HeroProps) {
  return (
    <figure className={className}>
      <div className="relative h-64 w-full md:h-96 lg:h-128">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={imageAlt || title}
            fill
            className="object-cover"
            priority
          />
        ) : (
          <div className="absolute inset-0 bg-linear-to-br from-gray-800 to-gray-900" />
        )}
        <div className="absolute inset-0 bg-black/30" />
        <div className="absolute inset-0 flex items-center justify-center">
          <h1 className="text-5xl md:text-7xl font-bold text-white">{title}</h1>
        </div>
      </div>
      {caption && (
        <figcaption className="text-sm text-muted-foreground text-right mt-2 italic">
          {caption}
        </figcaption>
      )}
    </figure>
  );
}
