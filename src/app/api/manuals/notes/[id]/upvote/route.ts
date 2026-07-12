import { NextResponse } from "next/server";

type Params = { params: Promise<{ id: string }> };

/** Stub until ManualGuideNote is live on production. */
export async function POST(_request: Request, { params }: Params) {
  await params;
  return NextResponse.json(
    { error: "Community tips are temporarily unavailable while we finish a database upgrade." },
    { status: 503 },
  );
}
