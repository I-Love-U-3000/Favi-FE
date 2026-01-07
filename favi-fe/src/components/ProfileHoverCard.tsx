"use client";

import Link from "next/link";
import Image from "next/image";
import { ReactNode, useCallback, useEffect, useRef, useState } from "react";
import { useLocale } from "next-intl";
import { createPortal } from "react-dom";

type UserLite = {
  id: string | number;
  username: string;
  name?: string;
  avatarUrl?: string;
  bio?: string;
  followersCount?: number;
  followingCount?: number;
};

export default function ProfileHoverCard({
  user,
  locale,
  children,
  className = "",
}: {
  user: UserLite;
  locale?: string;
  children?: ReactNode;
  className?: string;
}) {
  const [hoveringTrigger, setHoveringTrigger] = useState(false);
  const [hoveringCard, setHoveringCard] = useState(false);
  const [coords, setCoords] = useState<{ top: number; left: number } | null>(null);
  const triggerRef = useRef<HTMLDivElement | null>(null);
  const currentLocale = useLocale();
  const href = `/${locale ?? currentLocale}/profile/${user.username}`; // supports id or username

  const computePosition = useCallback(() => {
    const el = triggerRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const gap = 12;
    const estWidth = 288; // w-72
    const estHeight = 200; // approx height of card
    let top = r.top;
    let left = r.left + r.width + gap; // default: to the right of trigger

    // If overflow right, place to the left
    if (left + estWidth > window.innerWidth - 8) {
      left = Math.max(8, r.left - estWidth - gap);
    }
    // If overflow bottom, shift up
    if (top + estHeight > window.innerHeight - 8) {
      top = Math.max(8, window.innerHeight - estHeight - 8);
    }
    setCoords({ top, left });
  }, []);

  useEffect(() => {
    if (!(hoveringTrigger || hoveringCard)) return;
    computePosition();
    const onScroll = () => computePosition();
    const onResize = () => computePosition();
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", onResize);
    };
  }, [hoveringTrigger, hoveringCard, computePosition]);

  return (
    <div
      ref={triggerRef}
      className={`relative inline-block ${className}`}
      onMouseEnter={() => setHoveringTrigger(true)}
      onMouseLeave={() => setHoveringTrigger(false)}
    >
      {children}
      {(hoveringTrigger || hoveringCard) && coords &&
        createPortal(
          <div
            className="w-72 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-lg p-3"
            style={{ position: "fixed", top: coords.top, left: coords.left, zIndex: 9999 }}
            onMouseEnter={() => setHoveringCard(true)}
            onMouseLeave={() => setHoveringCard(false)}
          >
            <div className="flex items-start gap-3">
              <Link href={href} prefetch={false} className="shrink-0">
                <Image
                  src={user.avatarUrl || "/avatar-default.svg"}
                  alt={user.name || user.username}
                  width={50}
                  height={50}
                  className="rounded-full object-cover"
                />
              </Link>
              <div className="min-w-0">
                <Link href={href} prefetch={false} className="block">
                  <div className="font-semibold truncate">
                    {user.name || user.username}
                  </div>
                  <div className="text-sm text-neutral-500 truncate">
                    @{user.username}
                  </div>
                </Link>
                {user.bio && (
                  <p className="mt-1 text-sm text-neutral-700 dark:text-neutral-300 line-clamp-3">
                    {user.bio}
                  </p>
                )}
                <div className="mt-2 flex gap-3 text-xs text-neutral-500">
                  <span>
                    <b className="text-neutral-900 dark:text-neutral-100">
                      {user.followersCount ?? 0}
                    </b>{" "}
                    Followers
                  </span>
                  <span>
                    <b className="text-neutral-900 dark:text-neutral-100">
                      {user.followingCount ?? 0}
                    </b>{" "}
                    Following
                  </span>
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
