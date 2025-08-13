import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Persona from "@/models/PersonaChat/Persona";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {

  const {id} = await params;
  await dbConnect();
  const persona = await Persona.findById(id);
  if (!persona) {
    return NextResponse.json({ error: "Persona not found" }, { status: 404 });
  }
  return NextResponse.json({ persona });
}
