import { NextResponse } from "next/server";

function disabled() {
  return NextResponse.json({ error: "Persona API is unavailable." }, { status: 410 });
}

export async function GET() { return disabled(); }
export async function POST() { return disabled(); }
