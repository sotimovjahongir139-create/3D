"use client";

import { useState } from "react";
import Image from "next/image";
import { Image as ImageIcon } from "lucide-react";

type ModelThumbProps = {
  src: string | null;
  alt: string;
  size: number;
  rounded?: "full" | "lg";
};

export function ModelThumb({ src, alt, size, rounded = "lg" }: ModelThumbProps) {
  const [failed, setFailed] = useState(false);
  const shapeClass = rounded === "full" ? "rounded-full" : "rounded-lg";

  if (!src || failed) {
    return (
      <span
        className={`flex shrink-0 items-center justify-center bg-bg text-ink/30 ${shapeClass}`}
        style={{ width: size, height: size }}
      >
        <ImageIcon size={Math.round(size * 0.45)} strokeWidth={1.75} />
      </span>
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      width={size}
      height={size}
      className={`shrink-0 object-cover ${shapeClass}`}
      style={{ width: size, height: size }}
      onError={() => {
        console.error(`[ModelThumb] failed to load image for "${alt}": src=${src}`);
        setFailed(true);
      }}
    />
  );
}
