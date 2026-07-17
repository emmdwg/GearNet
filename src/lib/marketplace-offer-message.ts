export function formatTradeOfferMessage(opts: {
  offerId: string;
  listingTitle: string;
  listingPrice: number;
  offerType?: string;
  amount?: number;
  tradeItems?: string;
  note?: string | null;
}) {
  const lines = [
    `[Trade Offer #${opts.offerId}]`,
    `Listing: ${opts.listingTitle} (listed $${opts.listingPrice})`,
  ];
  if (opts.offerType === "cash" && opts.amount != null) {
    lines.push(`Cash offer: $${opts.amount}`);
  } else if (opts.tradeItems) {
    lines.push(`Trade: ${opts.tradeItems}`);
  }
  if (opts.note?.trim()) lines.push(`Note: ${opts.note.trim()}`);
  return lines.join("\n");
}
