import { NextResponse } from "next/server";

export async function OPTIONS() {
  return NextResponse.json({ error: "Persona chat API is unavailable." }, { status: 410 });
}

export async function POST() {
  return NextResponse.json({ error: "Persona chat API is unavailable." }, { status: 410 });
}
