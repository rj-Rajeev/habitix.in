import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Persona from "@/models/PersonaChat/Persona";

export async function GET() {
  await dbConnect();
  const personas = await Persona.find().sort({ createdAt: -1 });
  return NextResponse.json({ personas });
}

export async function POST(request: Request) {
  await dbConnect();
  try {
    const body = await request.json();
    const persona = await Persona.create(body);
    return NextResponse.json(persona, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to create persona" },
      { status: 400 }
    );
  }
}
