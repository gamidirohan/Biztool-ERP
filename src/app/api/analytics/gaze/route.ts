import { NextResponse } from "next/server";

export type GazeSample = {
  x: number;
  y: number;
  t: number;
};

const sessionStore = new Map<string, GazeSample[]>();

function validateSamples(samples: unknown): samples is GazeSample[] {
  return (
    Array.isArray(samples) &&
    samples.every(
      (sample) =>
        typeof sample === "object" &&
        sample !== null &&
        typeof (sample as GazeSample).x === "number" &&
        typeof (sample as GazeSample).y === "number" &&
        typeof (sample as GazeSample).t === "number"
    )
  );
}

export async function POST(request: Request) {
  try {
    const { sessionId, samples } = await request.json();

    if (!sessionId || typeof sessionId !== "string") {
      return NextResponse.json({ error: "sessionId is required" }, { status: 400 });
    }

    if (!validateSamples(samples)) {
      return NextResponse.json({ error: "samples must be an array of {x,y,t}" }, { status: 400 });
    }

    const existing = sessionStore.get(sessionId) ?? [];
    existing.push(...samples);
    sessionStore.set(sessionId, existing);

    return NextResponse.json({ stored: existing.length });
  } catch {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const sessionId = url.searchParams.get("sessionId");

  if (!sessionId) {
    return NextResponse.json({ error: "sessionId query param required" }, { status: 400 });
  }

  const samples = sessionStore.get(sessionId);

  if (!samples || samples.length === 0) {
    return NextResponse.json({ error: "No samples for session" }, { status: 404 });
  }

  const header = "timestamp,x,y";
  const rows = samples.map((sample) => `${sample.t},${sample.x},${sample.y}`);
  const csv = [header, ...rows].join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}

export async function DELETE(request: Request) {
  const url = new URL(request.url);
  const sessionId = url.searchParams.get("sessionId");

  if (!sessionId) {
    return NextResponse.json({ error: "sessionId query param required" }, { status: 400 });
  }

  const removed = sessionStore.delete(sessionId);

  return NextResponse.json({ cleared: removed });
}
