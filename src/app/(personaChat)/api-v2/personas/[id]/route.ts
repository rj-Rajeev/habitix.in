import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ error: "Persona API is unavailable." }, { status: 410 });
}
