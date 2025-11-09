"use client";

type Props = {
  src?: string | null;
  alt?: string;
  size?: number; // px
  ring?: boolean;
  fallbackText?: string; // initials
};

export default function AvatarCircle({ src, alt, size = 40, ring = true, fallbackText }: Props) {
  const dim = { width: size, height: size } as const;
  const ringStyle = ring ? { boxShadow: `0 0 0 2px var(--bg)` } : {};
  return (
    <div
      className="overflow-hidden rounded-full bg-black/10 grid place-items-center"
      style={{ ...dim, border: '1px solid var(--border)', ...ringStyle }}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={alt ?? ''} style={{ ...dim, objectFit: 'cover', borderRadius: 9999 }} />
      ) : (
        <span className="text-xs opacity-70">{fallbackText ?? '?'}</span>
      )}
    </div>
  );
}

