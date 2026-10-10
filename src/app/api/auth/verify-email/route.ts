import { NextResponse } from "next/server";
import connectDb from "@/lib/db";
import { verifyEmailToken } from "@/modules/auth/services/verification.service";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const token = typeof body?.token === "string" ? body.token : "";
    await connectDb();
    const result = await verifyEmailToken(token);
    if (result === "verified") return NextResponse.json({ status: result });
    return NextResponse.json({ status: result }, { status: 400 });
  } catch {
    return NextResponse.json({ status: "error" }, { status: 500 });
  }
}
