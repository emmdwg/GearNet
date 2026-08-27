"use client";

import { MessageUserButton } from "@/components/chat/MessageUserButton";
import type { ReactNode } from "react";

type ListingMessageButtonProps = {
  userId: string;
  username: string;
  listingId?: string;
  listingTitle?: string;
  sellerId?: string;
  className?: string;
  children?: ReactNode;
};

export function ListingMessageButton({
  userId,
  username,
  className,
  children,
}: ListingMessageButtonProps) {
  return (
    <MessageUserButton userId={userId} username={username} className={className}>
      {children}
    </MessageUserButton>
  );
}
